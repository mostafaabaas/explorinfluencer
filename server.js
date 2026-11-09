"use strict";
/*
 * explorinfluencer — public FREE-TEASER creator explorer for influUGC.
 *
 * Zero-dependency Node service (node:http only) so the Render free deploy
 * has nothing to build and nothing to break.
 *
 * PRIVACY CONTRACT (the whole point of this service):
 * The collector API returns full contact data (phone / email / whatsapp)
 * and social profile links. This server is a PROXY + FILTER: it maps
 * every collector row through an explicit ALLOWLIST before anything
 * reaches the browser. Contact values AND profile-link values are never
 * copied into a response — the UI only ever receives per-type existence
 * booleans and renders blurred placeholder rows from them (v2-directory:
 * the blur is visual; there is nothing real in the payload to un-blur).
 * Do not add passthrough fields here without thinking about this
 * paragraph.
 *
 * v3-photos additions, same contract:
 * - Creator photos are derived server-side from the profile URLs and
 *   PROXIED through /api/avatar?c=<country>&id=<rowId>: the browser
 *   never sees a handle or an upstream avatar URL.
 * - Per-platform handles are extracted server-side in toCard. Whether
 *   they (and the profile URLs) enter the payload is governed by the
 *   HANDLE_MODE switch below — an explicit OWNER decision. While it is
 *   "hidden", platforms[] carries only hasAccount booleans and the
 *   contract above holds in full.
 * - Directory scope (owner order, Nov 9): /api/search lists ONLY
 *   creators who have contact data (hasContact) — no-contact rows
 *   never become cards, and counts are computed after that filter.
 */
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const PORT = process.env.PORT || 3000;

/* Owner decision (Nov 9): usernames stay blurred exactly like phone /
 * email — reveal is subscribers-only. Hence "hidden" ships.
 * "hidden"  — platforms[] carries hasAccount booleans only; no handle
 *             and no profile URL ever reaches the browser.
 * "visible" — platforms[] also carries each platform's handle + profile
 *             URL (only if the owner ever reverses the ruling). */
const HANDLE_MODE = "hidden";

const AVATAR_UPSTREAM = process.env.AVATAR_UPSTREAM || "https://unavatar.io";
const AVATAR_TIMEOUT_MS = 6_000;
const AVATAR_CACHE_CAP = 300;

const COLLECTOR =
  process.env.COLLECTOR_API_URL ||
  "https://influugc-collector-production.up.railway.app";
const PUBLIC_DIR = path.join(__dirname, "public");
const CACHE_TTL_MS = 60_000;
const PAGE_SIZE = 200;
const MAX_PAGES = 12; // per country scan cap: 12 x 200 = 2,400 rows
const FETCH_TIMEOUT_MS = 15_000;

/* ------------------------------------------------------------------ */
/* small helpers                                                       */
/* ------------------------------------------------------------------ */

function cleanStr(v) {
  if (v === null || v === undefined) return "";
  const s = String(v).trim();
  if (!s || s === "None" || s === "null" || s === "undefined") return "";
  return s;
}

function cleanNum(v) {
  const n = parseInt(cleanStr(v).replace(/[^0-9]/g, ""), 10);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

async function fetchJson(url) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), FETCH_TIMEOUT_MS);
  try {
    const r = await fetch(url, { signal: ctl.signal, headers: { accept: "application/json" } });
    if (!r.ok) throw new Error(`collector HTTP ${r.status}`);
    return await r.json();
  } finally {
    clearTimeout(t);
  }
}

function sendJson(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
  });
  res.end(body);
}

/* ------------------------------------------------------------------ */
/* collector access + 60s in-memory cache                              */
/* ------------------------------------------------------------------ */

const cache = new Map(); // key -> { at, data }
function cacheGet(key) {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.data;
  return null;
}
function cacheSet(key, data) {
  cache.set(key, { at: Date.now(), data });
}

/** Country list + totals from /api/stats (the «غير مؤكدة» bucket is an
 *  internal country-evidence holding state, not a public filter).
 *  Aggregates only — no per-creator data leaves through here. */
async function getCountries() {
  const cached = cacheGet("countries");
  if (cached) return cached;
  const stats = await fetchJson(`${COLLECTOR}/api/stats`);
  const countries = (stats.byCountry || [])
    .filter((c) => c.country && c.country !== "غير مؤكدة" && c.count > 0)
    .map((c) => ({ name: c.country, count: c.count }));
  const out = {
    total: stats.total || 0,
    withContact: stats.withContact || 0,
    countryCount: countries.length,
    countries,
  };
  cacheSet("countries", out);
  return out;
}

/** Raw rows for one country (cached). Pages are fetched in parallel
 *  batches; scanning stops at the cap or when the collector runs out. */
async function getCountryRows(country) {
  const key = `rows:${country}`;
  const cached = cacheGet(key);
  if (cached) return cached;
  let rows = [];
  let total = 0;
  let exhausted = false;
  for (let start = 0; start < MAX_PAGES; start += 4) {
    const batch = [];
    for (let i = start; i < Math.min(start + 4, MAX_PAGES); i++) {
      const url =
        `${COLLECTOR}/api/creators?country=${encodeURIComponent(country)}` +
        `&limit=${PAGE_SIZE}&offset=${i * PAGE_SIZE}`;
      batch.push(fetchJson(url));
    }
    const pages = await Promise.all(batch);
    for (const p of pages) {
      if (typeof p.total === "number") total = p.total;
      const arr = Array.isArray(p.creators) ? p.creators : [];
      rows = rows.concat(arr);
      if (arr.length < PAGE_SIZE) exhausted = true;
    }
    if (exhausted) break;
  }
  const out = { rows, total, scanned: rows.length, exhausted };
  cacheSet(key, out);
  return out;
}

/* ------------------------------------------------------------------ */
/* the allowlist mapping — the ONLY way collector data leaves here     */
/* ------------------------------------------------------------------ */

const PLATFORMS = [
  { key: "ig", label: "Instagram", urlField: "igUrl", folField: "igFollowers" },
  { key: "tt", label: "TikTok", urlField: "ttUrl", folField: "ttFollowers" },
  { key: "fb", label: "Facebook", urlField: "fbUrl", folField: "fbFollowers" },
  { key: "snap", label: "Snapchat", urlField: "snapUrl", folField: "snapFollowers" },
  { key: "yt", label: "YouTube", urlField: "ytUrl", folField: "ytFollowers" },
  { key: "kick", label: "Kick", urlField: "kickUrl", folField: "kickFollowers" },
  { key: "twitch", label: "Twitch", urlField: "twitchUrl", folField: "twitchFollowers" },
];

/* Path segments that are site sections, not usernames (seen in the
 * data: instagram.com/.tv is the IGTV landing path, not a handle). */
const RESERVED_SEG = new Set([
  "p", "reel", "reels", "explore", "stories", "tv", ".tv",
  "watch", "groups", "pages", "events", "profile.php", "channel",
  "c", "user", "add", "results", "about", "help", "login", "share",
]);

/** Extract a platform handle from a profile URL — server-side only.
 *  Returns "" when the URL has no derivable handle (vanity /c/ paths,
 *  facebook profile.php?id= forms, section paths, junk). */
function extractHandle(key, rawUrl) {
  const u = cleanStr(rawUrl);
  if (!u) return "";
  let parsed;
  try {
    parsed = new URL(/^https?:\/\//i.test(u) ? u : `https://${u}`);
  } catch {
    return "";
  }
  const host = parsed.hostname.replace(/^(www\.|m\.)/, "").toLowerCase();
  const seg = parsed.pathname
    .split("/")
    .map((s) => {
      try { return decodeURIComponent(s); } catch { return s; }
    })
    .filter(Boolean);
  if (!seg.length) return "";
  const bare = (h) => h.replace(/^@+/, "").trim();
  const sane = (h) => (h && !h.startsWith(".") && !RESERVED_SEG.has(h.toLowerCase()) ? h : "");
  switch (key) {
    case "ig":
      return host.includes("instagram.com") ? sane(bare(seg[0])) : "";
    case "tt":
      return host.includes("tiktok.com") ? sane(bare(seg[0])) : "";
    case "yt": {
      if (!host.includes("youtube.com")) return "";
      if (seg[0].startsWith("@")) return bare(seg[0]); // @handle form
      if (seg[0] === "channel" && seg[1]) return seg[1].trim(); // UC… id form
      return ""; // /c/<name> vanity — no reliable avatar route
    }
    case "fb":
      // profile.php?id=… carries no username — no avatar route.
      return host.includes("facebook.com") ? sane(bare(seg[0])) : "";
    case "snap":
      return host.includes("snapchat.com") && seg[0] === "add" && seg[1]
        ? sane(bare(seg[1]))
        : "";
    case "kick":
      return host.includes("kick.com") ? sane(bare(seg[0])) : "";
    case "twitch":
      return host.includes("twitch.tv") ? sane(bare(seg[0])) : "";
    default:
      return "";
  }
}

/** All derivable handles of a row, keyed by platform key. */
function rowHandles(r) {
  const handles = {};
  for (const p of PLATFORMS) {
    const url = cleanStr(r[p.urlField]);
    if (!url) continue;
    const h = extractHandle(p.key, url);
    if (h) handles[p.key] = h;
  }
  return handles;
}

/* Avatar source priority (snap/kick have no reliable public avatar
 * route and are skipped). Service names are the upstream's routes. */
const AVATAR_PRIORITY = [
  { key: "ig", service: "instagram" },
  { key: "tt", service: "tiktok" },
  { key: "yt", service: "youtube" },
  { key: "fb", service: "facebook" },
  { key: "twitch", service: "twitch" },
];
function avatarSourceFor(handles) {
  for (const { key, service } of AVATAR_PRIORITY) {
    if (handles[key]) return { service, handle: handles[key] };
  }
  return null;
}

function toCard(r) {
  const platforms = [];
  const handles = {};
  let maxFollowers = 0;
  let totalFollowers = 0;
  for (const p of PLATFORMS) {
    const url = cleanStr(r[p.urlField]);
    const followers = cleanNum(r[p.folField]);
    if (!url && followers === 0) continue;
    // The profile URL is used ONLY to know the platform exists — and,
    // server-side, to derive the handle. Link values are contact data
    // in this product: they enter a response ONLY when the owner has
    // flipped HANDLE_MODE to "visible" (see the switch up top). In
    // "hidden" mode the entry carries an existence boolean only.
    const handle = url ? extractHandle(p.key, url) : "";
    if (handle) handles[p.key] = handle;
    const entry = { key: p.key, label: p.label, followers };
    if (HANDLE_MODE === "visible") {
      if (handle) entry.handle = handle;
      if (url) entry.url = url;
    } else {
      entry.hasAccount = true;
    }
    platforms.push(entry);
    if (followers > maxFollowers) maxFollowers = followers;
    totalFollowers += followers;
  }
  // Existence only, per type — the values themselves never leave
  // this process. The UI renders blurred placeholder rows from these
  // booleans; there is nothing real in the payload to un-blur.
  const contact = {
    phone: Boolean(cleanStr(r.phone)),
    email: Boolean(cleanStr(r.email)),
    whatsapp: Boolean(cleanStr(r.whatsapp)),
  };
  const hasContact = contact.phone || contact.email || contact.whatsapp;
  const ts = Date.parse(cleanStr(r.createdAt));
  const country = cleanStr(r.country);
  const id = cleanStr(r.id);
  // Photo is proxied by row id only — the path carries no handle and
  // no upstream URL (see /api/avatar). null when no handle is
  // derivable; the client then keeps the initial-letter avatar.
  const avatar = avatarSourceFor(handles)
    ? `/api/avatar?c=${encodeURIComponent(country)}&id=${encodeURIComponent(id)}`
    : null;
  return {
    id,
    name: cleanStr(r.name) || "—",
    country,
    category: cleanStr(r.category),
    platforms,
    maxFollowers,
    totalFollowers,
    hasContact,
    contact,
    avatar,
    // internal sort key for «الأحدث» — stripped before the response
    createdTs: Number.isFinite(ts) ? ts : 0,
  };
}

/* ------------------------------------------------------------------ */
/* API routes                                                          */
/* ------------------------------------------------------------------ */

async function handleCountries(res) {
  try {
    sendJson(res, 200, await getCountries());
  } catch (e) {
    sendJson(res, 502, { error: "collector_unavailable" });
  }
}

/* ------------------------------------------------------------------ */
/* avatar proxy — the browser asks by country + row id ONLY. The      */
/* handle is derived here, server-side, and the upstream URL is never */
/* exposed. Any failure is a plain 404 (initial-letter fallback).     */
/* ------------------------------------------------------------------ */

const avatarCache = new Map(); // "service/handle" -> { contentType, buffer }
function avatarCacheSet(key, val) {
  if (avatarCache.size >= AVATAR_CACHE_CAP) {
    avatarCache.delete(avatarCache.keys().next().value); // evict oldest
  }
  avatarCache.set(key, val);
}

async function handleAvatar(res, params) {
  const fail = () => {
    res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    res.end("not found");
  };
  const country = cleanStr(params.get("c"));
  const id = cleanStr(params.get("id"));
  if (!country || !id) return fail();
  let data;
  try {
    data = await getCountryRows(country); // warmed by the search that made the cards
  } catch {
    return fail();
  }
  const row = data.rows.find((r) => cleanStr(r.id) === id);
  if (!row) return fail();
  const src = avatarSourceFor(rowHandles(row));
  if (!src) return fail();

  const ck = `${src.service}/${src.handle}`;
  const hit = avatarCache.get(ck);
  if (hit) {
    res.writeHead(200, {
      "content-type": hit.contentType,
      "cache-control": "public, max-age=86400",
      "x-content-type-options": "nosniff",
    });
    return res.end(hit.buffer);
  }
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), AVATAR_TIMEOUT_MS);
  try {
    const up = await fetch(
      `${AVATAR_UPSTREAM}/${src.service}/${encodeURIComponent(src.handle)}`,
      { signal: ctl.signal, redirect: "follow" }
    );
    if (!up.ok) return fail();
    const ct = up.headers.get("content-type") || "";
    if (!ct.startsWith("image/")) return fail();
    const buffer = Buffer.from(await up.arrayBuffer());
    if (!buffer.length) return fail();
    avatarCacheSet(ck, { contentType: ct, buffer });
    res.writeHead(200, {
      "content-type": ct,
      "cache-control": "public, max-age=86400",
      "x-content-type-options": "nosniff",
    });
    return res.end(buffer);
  } catch {
    return fail();
  } finally {
    clearTimeout(t);
  }
}

async function handleSearch(res, params) {
  const country = cleanStr(params.get("country")) || "مصر";
  const q = cleanStr(params.get("q")).toLowerCase();
  const platform = cleanStr(params.get("platform"));
  const category = cleanStr(params.get("category")).toLowerCase();
  const sort = cleanStr(params.get("sort")) || "featured";
  let minFollowers = parseInt(params.get("minFollowers") || "0", 10);
  if (!Number.isFinite(minFollowers) || minFollowers < 0) minFollowers = 0;
  let limit = parseInt(params.get("limit") || "24", 10);
  if (!Number.isFinite(limit)) limit = 24;
  limit = Math.min(Math.max(limit, 1), 60);
  let offset = parseInt(params.get("offset") || "0", 10);
  if (!Number.isFinite(offset) || offset < 0) offset = 0;

  let data;
  try {
    data = await getCountryRows(country);
  } catch (e) {
    return sendJson(res, 502, { error: "collector_unavailable" });
  }

  // Directory scope (owner order, Nov 9): ONLY creators who have
  // contact data are listed. The filter runs before categories,
  // counting, sorting and pagination, so every number the UI shows
  // describes the contact-having population actually browsable.
  const cards = [];
  for (const r of data.rows) {
    const card = toCard(r);
    if (card.hasContact) cards.push(card);
  }

  // Real categories present in the listed rows (drives the الفئة
  // filter — every option offered genuinely exists in the data).
  const catCounts = new Map();
  for (const c of cards) {
    if (c.category) catCounts.set(c.category, (catCounts.get(c.category) || 0) + 1);
  }
  const categories = [...catCounts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  const matched = [];
  for (const card of cards) {
    if (platform) {
      const p = card.platforms.find((x) => x.key === platform);
      if (!p) continue;
      if (minFollowers && p.followers < minFollowers) continue;
    } else if (minFollowers && card.maxFollowers < minFollowers) {
      continue;
    }
    if (category && !card.category.toLowerCase().includes(category)) continue;
    if (q) {
      const hay = `${card.name} ${card.category}`.toLowerCase();
      if (!hay.includes(q)) continue;
    }
    matched.push(card);
  }
  if (sort === "followers") {
    matched.sort(
      (a, b) => b.totalFollowers - a.totalFollowers || b.maxFollowers - a.maxFollowers
    );
  } else if (sort === "newest") {
    matched.sort(
      (a, b) => b.createdTs - a.createdTs || Number(b.id || 0) - Number(a.id || 0)
    );
  } else {
    matched.sort(
      (a, b) => b.maxFollowers - a.maxFollowers || b.totalFollowers - a.totalFollowers
    );
  }
  const page = matched.slice(offset, offset + limit).map((c) => {
    const { createdTs, ...pub } = c;
    return pub;
  });
  sendJson(res, 200, {
    country,
    // NOTE: the country's FULL collector total is deliberately NOT
    // part of this response — the directory lists only the
    // contact-having population, and no UI figure may present the
    // full total as the browsable directory size. (Global totals,
    // incl. withContact, live on /api/countries for the hero stats.)
    scanned: data.scanned, // rows this teaser scan covered
    count: matched.length, // contact-having rows matching the filters
    categories,
    results: page,
  });
}

/* ------------------------------------------------------------------ */
/* static files                                                        */
/* ------------------------------------------------------------------ */

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".json": "application/json; charset=utf-8",
};

function serveStatic(req, res, urlPath) {
  let rel = urlPath === "/" ? "/index.html" : urlPath;
  let filePath;
  try {
    filePath = path.join(PUBLIC_DIR, decodeURIComponent(rel));
  } catch {
    res.writeHead(400); return res.end("bad request");
  }
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403); return res.end("forbidden");
  }
  fs.readFile(filePath, (err, buf) => {
    if (err) {
      res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
      return res.end("not found");
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      "content-type": MIME[ext] || "application/octet-stream",
      "cache-control": ext === ".html" ? "no-cache" : "public, max-age=86400",
      "x-content-type-options": "nosniff",
    });
    res.end(buf);
  });
}

/* ------------------------------------------------------------------ */

const server = http.createServer((req, res) => {
  const u = new URL(req.url, "http://localhost");
  if (u.pathname === "/healthz") return sendJson(res, 200, { ok: true });
  if (u.pathname === "/api/countries") return void handleCountries(res);
  if (u.pathname === "/api/search") return void handleSearch(res, u.searchParams);
  if (u.pathname === "/api/avatar") return void handleAvatar(res, u.searchParams);
  if (u.pathname.startsWith("/api/")) return sendJson(res, 404, { error: "not_found" });
  if (req.method !== "GET") {
    res.writeHead(405); return res.end("method not allowed");
  }
  serveStatic(req, res, u.pathname);
});

server.listen(PORT, () => {
  console.log(`explorinfluencer listening on :${PORT} (collector: ${COLLECTOR})`);
});
