"use strict";
/* explorinfluencer v2-directory frontend — talks ONLY to this
   service's /api/* proxy. Contact data never exists in the browser:
   the server sends per-type existence booleans, and the contact
   block below renders static placeholder shapes behind a CSS blur.
   There is nothing real in the page to un-blur. */

const I18N = {
  ar: {
    brandSub: "دليل اكتشاف الكريتورز",
    navExplore: "استكشاف الكريتورز", navPlans: "الباقات", navHow: "كيف يعمل",
    sideCtaTitle: "بيانات التواصل الكاملة",
    sideCtaText: "أرقام الهاتف والبريد وروابط حسابات الكريتورز — للمشتركين فقط.",
    subscribeNow: "اشترك الآن", sideFoot: "explorinfluencer.com",
    login: "تسجيل الدخول", signup: "إنشاء حساب",
    heroTitle: "اكتشف كريتورز الوطن العربي",
    heroSub: "ابحث في قاعدة بيانات حية للكريتورز — كل البيانات العامة ظاهرة: الدولة والفئة وعدد المتابعين على كل منصة. بيانات التواصل تظهر مموّهة، وتُفتح للمشتركين.",
    statCreators: "كريتور", statCountries: "دولة", statContact: "لديهم بيانات تواصل",
    smartTitle: "بحث ذكي",
    smartHint: "اكتب بجملة واحدة: دولة، منصة، فئة، أو حد متابعين — مثال: «تيك توك مصر فوق 100 ألف».",
    smartPh: "مثال: انستجرام السعودية طبخ فوق 50 ألف", smartBtn: "ابحث",
    filtersBtn: "الفلاتر", clearAll: "مسح الكل", fpCategory: "الفئة",
    fCountry: "الدولة", fPlatform: "المنصة", allPlatforms: "كل المنصات",
    fMin: "الحد الأدنى للمتابعين", anyCount: "الكل",
    fSort: "الترتيب", sortFeatured: "الأبرز", sortFollowers: "الأعلى متابعين", sortNewest: "الأحدث",
    fView: "العرض", qPh: "ابحث باسم كريتور أو فئة…",
    moreBtn: "عرض المزيد",
    howTitle: "كيف يعمل؟",
    step1T: "ابحث وفلتر", step1D: "حسب الدولة والفئة والمنصة وعدد المتابعين.",
    step2T: "راجع البيانات العامة", step2D: "المتابعون على كل منصة ظاهرون بالكامل للجميع.",
    step3T: "اشترك وافتح التواصل", step3D: "الهاتف والبريد والروابط تُكشف للمشتركين فقط.",
    cmpVisitorT: "الزائر يشاهد",
    cmpV1: "الاسم والدولة والفئة", cmpV2: "عدد المتابعين على كل منصة",
    cmpV3: "بحث وفلترة كاملة", cmpV4: "بيانات التواصل مموّهة",
    cmpProT: "المشترك يشاهد",
    cmpP1: "كل ما يشاهده الزائر", cmpP2: "رقم الهاتف والواتساب كاملًا",
    cmpP3: "البريد الإلكتروني وروابط الحسابات", cmpP4: "كشف التواصل بعدّاد شهري عبر منصة influUGC",
    plansTitle: "الباقات",
    planFreeT: "المجانية", planFreePrice: "مجانًا",
    planFree1: "تصفح وبحث في الدليل كاملًا", planFree2: "كل البيانات العامة ظاهرة",
    planFree3: "بيانات التواصل مموّهة", planFreeBtn: "ابدأ الاستكشاف",
    planProTag: "للمحترفين", planProPrice: "يُحدَّد من لوحة التحكم",
    planPro1: "فتح أرقام الهاتف والواتساب", planPro2: "فتح البريد الإلكتروني وروابط الحسابات",
    planPro3: "عدّاد كشوفات شهري عبر منصة influUGC", planProBtn: "اشترك عبر influUGC",
    footMain: "explorinfluencer.com — منصة مستقلة لاكتشاف الكريتورز",
    footSub: "جزء من شبكة", bookCta: "احجز استشارة مجانية",
    loading: "جارٍ البحث…",
    followers: "متابع", totalFollowers: "إجمالي المتابعين", platformsCount: "منصات",
    contactTitle: "بيانات التواصل", cPhone: "الهاتف", cEmail: "البريد", cWhatsapp: "واتساب", cLinks: "روابط الحسابات",
    unlock: "اشترك لفتح بيانات التواصل",
    noContact: "لا توجد بيانات تواصل متاحة لهذا الكريتور",
    viewProfile: "عرض الملف", allCats: "الكل",
    resultLine: (shown, count, country, total) =>
      `عرض <b>${shown}</b> من <b>${count}</b> نتيجة مطابقة في ${country} · إجمالي القاعدة في ${country}: <b>${total}</b>`,
    noResults: "لا توجد نتائج مطابقة — جرّب تخفيف الفلاتر.",
    error: "حدثت مشكلة في الاتصال بقاعدة البيانات — حاول مرة أخرى بعد قليل.",
    langBtn: "EN",
  },
  en: {
    brandSub: "Creator Discovery Directory",
    navExplore: "Explore Creators", navPlans: "Plans", navHow: "How it works",
    sideCtaTitle: "Full contact details",
    sideCtaText: "Creators' phone numbers, emails and profile links — subscribers only.",
    subscribeNow: "Subscribe now", sideFoot: "explorinfluencer.com",
    login: "Log in", signup: "Sign up",
    heroTitle: "Discover Arab-World Creators",
    heroSub: "Search a live creator database — all public data is visible: country, category and follower counts on every platform. Contact details are shown blurred and unlocked for subscribers.",
    statCreators: "creators", statCountries: "countries", statContact: "with contact data",
    smartTitle: "Smart search",
    smartHint: "Type one sentence: a country, platform, category or follower floor — e.g. “TikTok Egypt over 100K”.",
    smartPh: "e.g. Instagram Saudi cooking over 50K", smartBtn: "Search",
    filtersBtn: "Filters", clearAll: "Clear all", fpCategory: "Category",
    fCountry: "Country", fPlatform: "Platform", allPlatforms: "All platforms",
    fMin: "Min. followers", anyCount: "Any",
    fSort: "Sort", sortFeatured: "Featured", sortFollowers: "Most followers", sortNewest: "Newest",
    fView: "View", qPh: "Search by creator name or category…",
    moreBtn: "Show more",
    howTitle: "How it works",
    step1T: "Search & filter", step1D: "By country, category, platform and follower count.",
    step2T: "Review public data", step2D: "Per-platform followers are fully visible to everyone.",
    step3T: "Subscribe & unlock", step3D: "Phone, email and links are revealed to subscribers only.",
    cmpVisitorT: "Visitors see",
    cmpV1: "Name, country and category", cmpV2: "Follower count on every platform",
    cmpV3: "Full search & filtering", cmpV4: "Contact details blurred",
    cmpProT: "Subscribers see",
    cmpP1: "Everything visitors see", cmpP2: "Full phone & WhatsApp numbers",
    cmpP3: "Email address & profile links", cmpP4: "Contact reveals with a monthly counter via influUGC",
    plansTitle: "Plans",
    planFreeT: "Free", planFreePrice: "Free",
    planFree1: "Browse & search the full directory", planFree2: "All public data visible",
    planFree3: "Contact details blurred", planFreeBtn: "Start exploring",
    planProTag: "For professionals", planProPrice: "Set from the admin panel",
    planPro1: "Unlock phone & WhatsApp numbers", planPro2: "Unlock email & profile links",
    planPro3: "Monthly reveal counter via the influUGC platform", planProBtn: "Subscribe via influUGC",
    footMain: "explorinfluencer.com — an independent creator-discovery platform",
    footSub: "Part of the", bookCta: "Book a Free Consultation",
    loading: "Searching…",
    followers: "followers", totalFollowers: "total followers", platformsCount: "platforms",
    contactTitle: "Contact details", cPhone: "Phone", cEmail: "Email", cWhatsapp: "WhatsApp", cLinks: "Profile links",
    unlock: "Subscribe to unlock contact details",
    noContact: "No contact data available for this creator",
    viewProfile: "View profile", allCats: "All",
    resultLine: (shown, count, country, total) =>
      `Showing <b>${shown}</b> of <b>${count}</b> matching creators in ${country} · database total in ${country}: <b>${total}</b>`,
    noResults: "No matching results — try loosening the filters.",
    error: "Could not reach the database — please try again shortly.",
    langBtn: "عربي",
  },
};

/* platform brand icons (inline SVG, currentColor) */
const ICONS = {
  ig: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.3" cy="6.7" r="1.2" fill="currentColor" stroke="none"/></svg>',
  tt: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M16.6 3c.4 2.3 1.9 3.9 4.4 4.1v3c-1.7 0-3.2-.5-4.4-1.4v6.6c0 3.4-2.5 5.7-5.7 5.7a5.4 5.4 0 0 1-5.4-5.4c0-3.2 2.7-5.6 6-5.2v3.1c-1.5-.4-3 .6-3 2.1 0 1.3 1 2.3 2.3 2.3 1.5 0 2.6-1.1 2.6-2.8V3h3z"/></svg>',
  fb: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M13.5 22v-8h2.7l.4-3.2h-3.1V8.7c0-.9.3-1.6 1.7-1.6h1.5V4.2c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4v2.7H7.8V14h2.7v8h3z"/></svg>',
  snap: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3c2.9 0 4.7 2.2 4.7 5.1 0 .8-.1 1.5-.2 2.1l1.9 1.3c.3.2.3.6 0 .9l-1.6 1.1c.3.9 1 1.7 2 2.1.3.1.3.5 0 .7-.6.4-1.3.6-2 .7-.2.5-.5 1.1-.9 1.5-.2.2-.5.2-.8.1-.8-.3-1.6-.5-2.1-.5s-1.3.2-2.1.5c-.3.1-.6.1-.8-.1-.4-.4-.7-1-.9-1.5-.7-.1-1.4-.3-2-.7-.3-.2-.3-.6 0-.7 1-.4 1.7-1.2 2-2.1l-1.6-1.1c-.3-.3-.3-.7 0-.9l1.9-1.3c-.1-.6-.2-1.3-.2-2.1C7.3 5.2 9.1 3 12 3z"/></svg>',
  yt: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.5 2.5 0 0 0 2.4 7.2 26 26 0 0 0 2 12a26 26 0 0 0 .4 4.8 2.5 2.5 0 0 0 1.8 1.8c1.6.4 7.8.4 7.8.4s6.2 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8A26 26 0 0 0 22 12a26 26 0 0 0-.4-4.8zM10 15.2V8.8L15.5 12z"/></svg>',
  kick: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M4 3h4v6.5L12.6 3H18l-5.6 7.4L18.5 21h-5.4l-4-6.6L8 16.6V21H4z"/></svg>',
  twitch: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M4.3 2 2.5 6.4v15.1h5.6V24h3l2.5-2.5h4l5-5V2H4.3zm16.2 13.4-3 3H12l-2.4 2.4V18H5.4V4h15.1v11.4zM17 8h-2v5.4h2V8zm-5.4 0h-2v5.4h2V8z"/></svg>',
};
const PLAT_COLOR = { ig: "#d62976", tt: "#111111", fb: "#1877f2", snap: "#b89b00", yt: "#ff0000", kick: "#2f9e06", twitch: "#9146ff" };
/* blurred placeholder shapes — static strings, never real values */
const MASK = { phone: "01•• ••• ••••", whatsapp: "01•• ••• ••••", email: "••••••@••••.com", links: "••••.•••/••••••" };

let lang = "ar";
let offset = 0;
let lastCount = 0;
let lastShown = 0;
let countries = [];
let marqueeData = [];
const LIMIT = 24;
const state = { country: "مصر", platform: "", min: "0", q: "", category: "", sort: "featured", view: "grid" };
const favs = new Set();
const byId = new Map();

const $ = (id) => document.getElementById(id);
const t = () => I18N[lang];

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}
function fmtFol(n) {
  n = Number(n) || 0;
  if (n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(1).replace(/\.0$/, "") + "K";
  return String(n);
}
function fmtNum(n) { return Number(n || 0).toLocaleString("en-US"); }

/* ---------------- cards ---------------- */

function contactHtml(c) {
  if (!c.hasContact) {
    return `<div class="contact"><div class="contact-none">${t().noContact}</div></div>`;
  }
  const rows = [];
  if (c.contact.phone) rows.push(`<div class="crow"><span class="ck">📞 ${t().cPhone}</span><span class="cv">${MASK.phone}</span></div>`);
  if (c.contact.whatsapp) rows.push(`<div class="crow"><span class="ck">💬 ${t().cWhatsapp}</span><span class="cv">${MASK.whatsapp}</span></div>`);
  if (c.contact.email) rows.push(`<div class="crow"><span class="ck">✉ ${t().cEmail}</span><span class="cv">${MASK.email}</span></div>`);
  if (c.platforms.length) rows.push(`<div class="crow"><span class="ck">🔗 ${t().cLinks}</span><span class="cv">${MASK.links}</span></div>`);
  return `<div class="contact">
    <div class="contact-title">🔒 ${t().contactTitle}</div>
    ${rows.join("")}
    <button type="button" class="btn primary sm unlock-btn" data-unlock>🔒 ${t().unlock}</button>
  </div>`;
}

function cardHtml(c) {
  byId.set(c.id, c);
  const initial = esc((c.name || "؟").trim().charAt(0) || "؟");
  const top = c.platforms.reduce((a, p) => (p.followers > (a?.followers || -1) ? p : a), null);
  const badge = top
    ? `<span class="top-plat-badge" style="background:${PLAT_COLOR[top.key] || "#6c4cf1"}">${esc(top.label)}</span>`
    : "";
  const chips = c.platforms
    .map((p) => `<span class="plat-chip pc-${p.key}">${ICONS[p.key] || ""}<b>${fmtFol(p.followers)}</b></span>`)
    .join("");
  return `<article class="ccard">
    <div class="ccard-head">
      <div class="avatar">${initial}</div>
      <div style="min-width:0">
        <div class="ccard-name">${esc(c.name)} ${badge}</div>
        <div class="ccard-loc">${esc(c.country)}</div>
        ${c.category ? `<div class="chips" style="margin-top:4px"><span class="chip">${esc(c.category)}</span></div>` : ""}
      </div>
    </div>
    <div class="stats-row">
      <div class="stat-cell"><div class="v">${fmtFol(c.totalFollowers)}</div><div class="k">${t().totalFollowers}</div></div>
      <div class="stat-cell"><div class="v">${c.platforms.length}</div><div class="k">${t().platformsCount}</div></div>
    </div>
    <div class="plat-chips">${chips || '<span class="chip">—</span>'}</div>
    ${contactHtml(c)}
    <div class="ccard-actions">
      <button type="button" class="btn ghost sm" data-profile="${esc(c.id)}">${t().viewProfile}</button>
      <button type="button" class="btn ghost sm fav-btn ${favs.has(c.id) ? "faved" : ""}" data-fav="${esc(c.id)}" aria-label="favorite">${favs.has(c.id) ? "♥" : "♡"}</button>
    </div>
  </article>`;
}

/* ---------------- search ---------------- */

function activeFilterCount() {
  let n = 0;
  if (state.q) n++;
  if (state.category) n++;
  if (state.platform) n++;
  if (state.min !== "0") n++;
  if (state.sort !== "featured") n++;
  if (state.country !== "مصر") n++;
  return n;
}
function syncFilterUi() {
  const n = activeFilterCount();
  const badge = $("activeFilterCount");
  badge.textContent = n;
  badge.classList.toggle("hidden", n === 0);
  $("clearFilters").classList.toggle("hidden", n === 0);
}

function renderCatChips(categories) {
  const wrap = $("catChips");
  const all = [{ name: "", count: null }, ...(categories || []).slice(0, 12)];
  wrap.innerHTML = all
    .map((c) => {
      const label = c.name === "" ? t().allCats : `${esc(c.name)}${c.count ? ` (${fmtNum(c.count)})` : ""}`;
      const val = c.name === "" ? "" : esc(c.name);
      return `<button type="button" class="chip ${state.category === c.name ? "on" : ""}" data-cat="${val}">${label}</button>`;
    })
    .join("");
  wrap.querySelectorAll("[data-cat]").forEach((b) =>
    b.addEventListener("click", () => {
      state.category = b.dataset.cat;
      renderCatChips(categories);
      syncFilterUi();
      runSearch(false);
    })
  );
}

async function runSearch(append) {
  const status = $("status");
  const grid = $("grid");
  if (!append) {
    offset = 0;
    lastShown = 0;
    grid.innerHTML = "";
    status.textContent = t().loading;
  }
  const params = new URLSearchParams({
    country: state.country,
    platform: state.platform,
    minFollowers: state.min,
    q: state.q,
    category: state.category,
    sort: state.sort,
    limit: String(LIMIT),
    offset: String(offset),
  });
  try {
    const r = await fetch(`/api/search?${params}`);
    if (!r.ok) throw new Error("bad status");
    const data = await r.json();
    lastCount = data.count;
    if (!append) renderCatChips(data.categories);
    grid.insertAdjacentHTML("beforeend", data.results.map(cardHtml).join(""));
    offset += data.results.length;
    lastShown = offset;
    status.innerHTML = data.count === 0
      ? t().noResults
      : t().resultLine(Math.min(lastShown, data.count), data.count, esc(data.country), fmtNum(data.total));
    $("moreBtn").classList.toggle("hidden", offset >= data.count);
  } catch (e) {
    status.textContent = t().error;
    $("moreBtn").classList.add("hidden");
  }
  syncFilterUi();
}

/* ---------------- stats / countries / marquee ---------------- */

function renderTopCountries() {
  const wrap = $("topCountries");
  wrap.innerHTML = countries
    .slice(0, 5)
    .map((c) => `<button type="button" class="chip ${state.country === c.name ? "on" : ""}" data-country="${esc(c.name)}">${esc(c.name)} · ${fmtNum(c.count)}</button>`)
    .join("");
  wrap.querySelectorAll("[data-country]").forEach((b) =>
    b.addEventListener("click", () => {
      state.country = b.dataset.country;
      $("fCountry").value = state.country;
      state.category = "";
      renderTopCountries();
      document.getElementById("explore").scrollIntoView({ behavior: "smooth" });
      runSearch(false);
    })
  );
}

async function initStats() {
  try {
    const r = await fetch("/api/countries");
    const data = await r.json();
    countries = data.countries || [];
    $("statTotal").textContent = fmtNum(data.total);
    $("statCountries").textContent = fmtNum(data.countryCount);
    $("statContact").textContent = fmtNum(data.withContact);
    $("fCountry").innerHTML = countries
      .map((c) => `<option value="${esc(c.name)}" ${c.name === state.country ? "selected" : ""}>${esc(c.name)} (${fmtNum(c.count)})</option>`)
      .join("");
    renderTopCountries();
  } catch (e) {
    $("fCountry").innerHTML = `<option value="مصر" selected>مصر</option>`;
  }
}

function renderMarquee() {
  const track = $("marqueeTrack");
  if (!marqueeData.length) { track.closest(".marquee-sec").classList.add("hidden"); return; }
  const tile = (c) => {
    const top = c.platforms.reduce((a, p) => (p.followers > (a?.followers || -1) ? p : a), null);
    return `<div class="mq-tile"><div class="mq-ava">${esc((c.name || "؟").trim().charAt(0) || "؟")}</div><div class="mq-name">${esc(c.name)}</div><div class="mq-sub">${top ? `${esc(top.label)} · ${fmtFol(top.followers)}` : esc(c.country)}</div></div>`;
  };
  const html = marqueeData.map(tile).join("");
  track.innerHTML = html + html; // duplicated for the loop
}

async function initMarquee() {
  try {
    const picks = [];
    const seen = new Set();
    const jobs = ["السعودية", "مصر"].map((country) =>
      fetch(`/api/search?country=${encodeURIComponent(country)}&sort=followers&limit=12`)
        .then((r) => r.json())
        .catch(() => null)
    );
    for (const d of await Promise.all(jobs)) {
      if (!d) continue;
      for (const c of d.results || []) {
        if (!seen.has(c.id)) { seen.add(c.id); picks.push(c); }
      }
    }
    picks.sort((a, b) => b.totalFollowers - a.totalFollowers);
    marqueeData = picks.slice(0, 14);
    renderMarquee();
  } catch (e) { /* marquee is decorative */ }
}

/* ---------------- smart search ---------------- */

const PLAT_ALIASES = [
  ["tt", ["tiktok", "تيك توك", "تيكتوك", "تيك"]],
  ["ig", ["instagram", "انستجرام", "انستغرام", "انستا"]],
  ["yt", ["youtube", "يوتيوب"]],
  ["snap", ["snapchat", "سناب شات", "سناب"]],
  ["fb", ["facebook", "فيسبوك", "فيس بوك", "فيس"]],
  ["kick", ["kick", "كيك"]],
  ["twitch", ["twitch", "تويتش"]],
];
function arDigits(s) {
  return s.replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d));
}
function parseSmart(raw) {
  let s = " " + arDigits(raw.toLowerCase()) + " ";
  const found = [];
  // country
  for (const c of countries) {
    if (c.name && s.includes(c.name)) {
      state.country = c.name;
      $("fCountry").value = c.name;
      found.push({ k: "country", label: c.name });
      s = s.replace(c.name, " ");
      break;
    }
  }
  // platform
  for (const [key, aliases] of PLAT_ALIASES) {
    if (aliases.some((a) => s.includes(a))) {
      state.platform = key;
      $("fPlatform").value = key;
      found.push({ k: "platform", label: key });
      break;
    }
  }
  // followers: 100 ألف / 50k / 1 مليون / 2m
  const m = s.match(/(\d+(?:\.\d+)?)\s*(ألف|آلاف|الاف|k|مليون|m)\b/i);
  if (m) {
    let v = parseFloat(m[1]);
    v *= /ألف|آلاف|الاف|k/i.test(m[2]) ? 1e3 : 1e6;
    v = Math.round(v);
    state.min = String(v);
    // snap to the closest select option if exact, else keep value via min select fallback
    const sel = $("fMin");
    if (![...sel.options].some((o) => o.value === String(v))) {
      const opt = document.createElement("option");
      opt.value = String(v);
      opt.textContent = "+" + fmtFol(v);
      sel.appendChild(opt);
    }
    sel.value = String(v);
    found.push({ k: "min", label: "+" + fmtFol(v) });
    s = s.replace(m[0], " ");
  }
  const rest = s.replace(/فوق|أكثر من|اكثر من|اكتر من|\+|>/g, " ").replace(/\s+/g, " ").trim();
  state.q = rest;
  $("qInput").value = rest;
  if (rest) found.push({ k: "q", label: rest });
  return found;
}
function renderSmartChips(found) {
  const wrap = $("smartChips");
  wrap.innerHTML = found
    .map((f) => `<span class="chip on">${esc(f.label)}</span>`)
    .join("");
}

/* ---------------- modal ---------------- */

function openProfile(id) {
  const c = byId.get(id);
  if (!c) return;
  $("modalBody").innerHTML = cardHtml(c);
  $("modalBack").classList.remove("hidden");
  document.body.style.overflow = "hidden";
}
function closeProfile() {
  $("modalBack").classList.add("hidden");
  document.body.style.overflow = "";
}

/* ---------------- language ---------------- */

function applyLang() {
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const v = t()[el.dataset.i18n];
    if (typeof v === "string") el.textContent = v;
  });
  document.querySelectorAll("[data-i18n-ph]").forEach((el) => {
    const v = t()[el.dataset.i18nPh];
    if (typeof v === "string") el.placeholder = v;
  });
  $("langToggle").textContent = t().langBtn;
}

/* ---------------- events ---------------- */

let qTimer = null;
$("qInput").addEventListener("input", () => {
  clearTimeout(qTimer);
  qTimer = setTimeout(() => { state.q = $("qInput").value.trim(); runSearch(false); }, 300);
});
$("fCountry").addEventListener("change", () => {
  state.country = $("fCountry").value;
  state.category = "";
  renderTopCountries();
  runSearch(false);
});
$("fPlatform").addEventListener("change", () => { state.platform = $("fPlatform").value; runSearch(false); });
$("fMin").addEventListener("change", () => { state.min = $("fMin").value; runSearch(false); });
$("fSort").addEventListener("change", () => { state.sort = $("fSort").value; runSearch(false); });
$("filtersToggle").addEventListener("click", () => {
  const panel = $("filterPanel");
  const open = panel.classList.toggle("hidden") === false;
  $("filtersToggle").setAttribute("aria-expanded", String(open));
});
$("clearFilters").addEventListener("click", () => {
  state.platform = ""; state.min = "0"; state.q = ""; state.category = "";
  state.sort = "featured"; state.country = "مصر";
  $("fPlatform").value = ""; $("fMin").value = "0"; $("qInput").value = "";
  $("fSort").value = "featured"; $("fCountry").value = "مصر";
  renderTopCountries();
  runSearch(false);
});
$("viewGrid").addEventListener("click", () => {
  state.view = "grid";
  $("grid").classList.remove("list");
  $("viewGrid").classList.add("active"); $("viewList").classList.remove("active");
});
$("viewList").addEventListener("click", () => {
  state.view = "list";
  $("grid").classList.add("list");
  $("viewList").classList.add("active"); $("viewGrid").classList.remove("active");
});
$("moreBtn").addEventListener("click", () => runSearch(true));
$("smartForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const found = parseSmart($("smartQ").value);
  renderSmartChips(found);
  renderTopCountries();
  document.getElementById("explore").scrollIntoView({ behavior: "smooth" });
  runSearch(false);
});
$("langToggle").addEventListener("click", () => {
  lang = lang === "ar" ? "en" : "ar";
  applyLang();
  renderTopCountries();
  renderMarquee();
  runSearch(false);
});
document.addEventListener("click", (e) => {
  const prof = e.target.closest("[data-profile]");
  if (prof) { openProfile(prof.dataset.profile); return; }
  const fav = e.target.closest("[data-fav]");
  if (fav) {
    const id = fav.dataset.fav;
    if (favs.has(id)) { favs.delete(id); fav.classList.remove("faved"); fav.textContent = "♡"; }
    else { favs.add(id); fav.classList.add("faved"); fav.textContent = "♥"; }
    return;
  }
  if (e.target.closest("[data-unlock]")) {
    closeProfile();
    document.getElementById("plans").scrollIntoView({ behavior: "smooth" });
  }
});
$("modalClose").addEventListener("click", closeProfile);
$("modalBack").addEventListener("click", (e) => { if (e.target === $("modalBack")) closeProfile(); });

(async () => {
  applyLang();
  await initStats();
  runSearch(false);
  initMarquee();
})();
