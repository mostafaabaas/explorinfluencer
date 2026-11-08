"use strict";
/* explorinfluencer frontend — talks ONLY to this service's /api/* proxy.
   Contact data never exists in the browser: the server sends a boolean
   (hasContact) and a masked placeholder string. */

const I18N = {
  ar: {
    brandSub: "مستكشف المؤثرين من influUGC",
    bookCta: "احجز استشارة مجانية",
    heroTitle: "ابحث في قاعدة بيانات المؤثرين",
    heroSubA: "أكثر من",
    heroSubB: "كريتور في مصر والخليج والوطن العربي — فلتر حسب الدولة والمنصة وعدد المتابعين.",
    teaserNote: "النسخة المجانية للاستكشاف: بيانات التواصل الكاملة (رقم الهاتف / الإيميل / واتساب) متاحة للمشتركين على منصة influUGC.",
    fCountry: "الدولة",
    fPlatform: "المنصة",
    allPlatforms: "كل المنصات",
    fMin: "الحد الأدنى للمتابعين",
    anyCount: "الكل",
    fQ: "بحث بالاسم أو التصنيف",
    qPh: "مثال: طبخ، جيمينج، أو اسم كريتور",
    searchBtn: "ابحث",
    moreBtn: "عرض المزيد",
    networkLine: "explorinfluencer جزء من شبكة influUGC — وكالة التسويق وصناعة المحتوى (القاهرة، مصر).",
    loading: "جارٍ البحث…",
    results: (n) => `نتيجة`,
    resultCount: (n, country) => `وجدنا <b>${n}</b> كريتور مطابق في ${country}`,
    noResults: "لا توجد نتائج مطابقة — جرّب تخفيف الفلاتر.",
    error: "حدثت مشكلة في الاتصال بقاعدة البيانات — حاول مرة أخرى بعد قليل.",
    followers: "متابع",
    contactLocked: "بيانات التواصل للمشتركين",
    langBtn: "EN",
  },
  en: {
    brandSub: "Creator Explorer by influUGC",
    bookCta: "Book a Free Consultation",
    heroTitle: "Search the Creator Database",
    heroSubA: "More than",
    heroSubB: "creators across Egypt, the Gulf and the Arab world — filter by country, platform and followers.",
    teaserNote: "Free teaser: full contact details (phone / email / WhatsApp) are available to subscribers on the influUGC platform.",
    fCountry: "Country",
    fPlatform: "Platform",
    allPlatforms: "All platforms",
    fMin: "Min. followers",
    anyCount: "Any",
    fQ: "Search by name or category",
    qPh: "e.g. cooking, gaming, or a creator name",
    searchBtn: "Search",
    moreBtn: "Show more",
    networkLine: "explorinfluencer is part of the influUGC network — marketing & content production agency (Cairo, Egypt).",
    loading: "Searching…",
    results: (n) => `results`,
    resultCount: (n, country) => `Found <b>${n}</b> matching creators in ${country}`,
    noResults: "No matching results — try loosening the filters.",
    error: "Could not reach the database — please try again shortly.",
    followers: "followers",
    contactLocked: "Contacts for subscribers",
    langBtn: "عربي",
  },
};

let lang = "ar";
let offset = 0;
let lastCount = 0;
const LIMIT = 24;

const $ = (id) => document.getElementById(id);
const t = () => I18N[lang];

function fmtFol(n) {
  if (n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(1).replace(/\.0$/, "") + "K";
  return String(n);
}

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

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

function cardHtml(c) {
  const initial = esc((c.name || "؟").trim().charAt(0) || "؟");
  const plats = c.platforms
    .map((p) => {
      const label = p.url
        ? `<a href="${esc(p.url)}" target="_blank" rel="noopener noreferrer">${esc(p.label)} ↗</a>`
        : `<span>${esc(p.label)}</span>`;
      return `<div class="plat">${label}<span class="fol">${fmtFol(p.followers)} ${t().followers}</span></div>`;
    })
    .join("");
  const contact = c.hasContact
    ? `<div class="contact"><span class="mask" dir="ltr">${esc(c.contactMasked)}</span><br><span class="lock">🔒 ${t().contactLocked}</span></div>`
    : "";
  return `<article class="card">
    <div class="card-head">
      <div class="avatar">${initial}</div>
      <div>
        <div class="card-name">${esc(c.name)}</div>
        <div class="chips">
          ${c.category ? `<span class="chip cat">${esc(c.category)}</span>` : ""}
          ${c.country ? `<span class="chip">${esc(c.country)}</span>` : ""}
        </div>
      </div>
    </div>
    <div class="plats">${plats || `<div class="plat"><span>—</span></div>`}</div>
    ${contact}
  </article>`;
}

async function runSearch(append) {
  const status = $("status");
  const grid = $("grid");
  if (!append) {
    offset = 0;
    grid.innerHTML = "";
    status.textContent = t().loading;
  }
  const params = new URLSearchParams({
    country: $("fCountry").value || "مصر",
    platform: $("fPlatform").value,
    minFollowers: $("fMin").value,
    q: $("fQ").value.trim(),
    limit: String(LIMIT),
    offset: String(offset),
  });
  try {
    const r = await fetch(`/api/search?${params}`);
    if (!r.ok) throw new Error("bad status");
    const data = await r.json();
    lastCount = data.count;
    const html = data.results.map(cardHtml).join("");
    grid.insertAdjacentHTML("beforeend", html);
    offset += data.results.length;
    status.innerHTML =
      data.count === 0 ? t().noResults : t().resultCount(data.count, esc(data.country));
    $("moreBtn").classList.toggle("hidden", offset >= data.count);
  } catch (e) {
    status.textContent = t().error;
    $("moreBtn").classList.add("hidden");
  }
}

async function initCountries() {
  const sel = $("fCountry");
  try {
    const r = await fetch("/api/countries");
    const data = await r.json();
    $("statTotal").textContent = Number(data.total || 0).toLocaleString("en-US");
    sel.innerHTML = data.countries
      .map(
        (c) =>
          `<option value="${esc(c.name)}" ${c.name === "مصر" ? "selected" : ""}>${esc(c.name)} (${Number(c.count).toLocaleString("en-US")})</option>`
      )
      .join("");
  } catch (e) {
    sel.innerHTML = `<option value="مصر" selected>مصر</option>`;
  }
}

$("filters").addEventListener("submit", (e) => {
  e.preventDefault();
  runSearch(false);
});
$("moreBtn").addEventListener("click", () => runSearch(true));
$("langToggle").addEventListener("click", () => {
  lang = lang === "ar" ? "en" : "ar";
  applyLang();
  if (lastCount || $("grid").children.length) runSearch(false);
});

(async () => {
  applyLang();
  await initCountries();
  runSearch(false);
})();
