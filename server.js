"use strict";
/*
 * explorinfluencer — public FREE-TEASER creator explorer for influUGC.
 *
 * Zero-dependency Node service (node:http only) so the Render free deploy
 * has nothing to build and nothing to break.
 *
 * PRIVACY CONTRACT (the whole point of this service):
 * The collector API returns full contact data (phone / email / whatsapp).
 * This server is a PROXY + FILTER: it maps every collector row through an
 * explicit ALLOWLIST before anything reaches the browser. Contact fields
 * are never copied into a response — the UI only ever receives a boolean
 * (hasContact) and renders a masked placeholder. Do not add passthrough
 * fields here without thinking about this paragraph.
 */
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const PORT = process.env.PORT || 3000;
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
 *  internal country-evidence holding state, not a public filter). */
async function getCountries() {
  const cached = cacheGet("countries");
  if (cached) return cached;
  const stats = await fetchJson(`${COLLECTOR}/api/stats`);
  const countries = (stats.byCountry || [])
    .filter((c) => c.country && c.country !== "غير مؤكدة" && c.count > 0)
    .map((c) => ({ name: c.country, count: c.count }));
  const out = { total: stats.total || 0, countries };
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

const CONTACT_MASK = "01•• ••• •••";

function toCard(r) {
  const platforms = [];
  let maxFollowers = 0;
  let totalFollowers = 0;
  for (const p of PLATFORMS) {
    const url = cleanStr(r[p.urlField]);
    const followers = cleanNum(r[p.folField]);
    if (!url && followers === 0) continue;
    platforms.push({
      key: p.key,
      label: p.label,
      // social profile links are public by nature; only http(s) passes
      url: /^https?:\/\//i.test(url) ? url : "",
      followers,
    });
    if (followers > maxFollowers) maxFollowers = followers;
    totalFollowers += followers;
  }
  // Existence only — the values themselves never leave this process.
  const hasContact = Boolean(
    cleanStr(r.phone) || cleanStr(r.email) || cleanStr(r.whatsapp)
  );
  return {
    id: cleanStr(r.id),
    name: cleanStr(r.name) || "—",
    country: cleanStr(r.country),
    category: cleanStr(r.category),
    platforms,
    maxFollowers,
    totalFollowers,
    hasContact,
    contactMasked: hasContact ? CONTACT_MASK : null,
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

async function handleSearch(res, params) {
  const country = cleanStr(params.get("country")) || "مصر";
  const q = cleanStr(params.get("q")).toLowerCase();
  const platform = cleanStr(params.get("platform"));
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

  const matched = [];
  for (const r of data.rows) {
    const card = toCard(r);
    if (platform) {
      const p = card.platforms.find((x) => x.key === platform);
      if (!p) continue;
      if (minFollowers && p.followers < minFollowers) continue;
    } else if (minFollowers && card.maxFollowers < minFollowers) {
      continue;
    }
    if (q) {
      const hay = `${card.name} ${card.category}`.toLowerCase();
      if (!hay.includes(q)) continue;
    }
    matched.push(card);
  }
  matched.sort(
    (a, b) => b.maxFollowers - a.maxFollowers || b.totalFollowers - a.totalFollowers
  );
  sendJson(res, 200, {
    country,
    total: data.total, // collector's full count for this country
    scanned: data.scanned, // rows this teaser scan covered
    count: matched.length,
    results: matched.slice(offset, offset + limit),
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
  if (u.pathname.startsWith("/api/")) return sendJson(res, 404, { error: "not_found" });
  if (req.method !== "GET") {
    res.writeHead(405); return res.end("method not allowed");
  }
  serveStatic(req, res, u.pathname);
});

server.listen(PORT, () => {
  console.log(`explorinfluencer listening on :${PORT} (collector: ${COLLECTOR})`);
});
