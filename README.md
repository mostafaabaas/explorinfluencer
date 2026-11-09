# explorinfluencer

Public **free-teaser** creator explorer for [influUGC](https://www.influugc.com) —
the standalone, Render-hostable build for **explorinfluencer.com**.

Visitors search influUGC's creator database (country, platform, min followers,
name/category keywords) and see creator cards with platforms + follower counts.
**Contact details are always masked server-side**: this service proxies the
collector API through an allowlist mapping, so raw phone / email / WhatsApp
values never reach the browser. Full contacts are for subscribers on influUGC.

## Stack

- Zero-dependency Node (`node:http` only) — no build step, `npm install` is a no-op.
- `npm start` → `node server.js`, listens on `process.env.PORT`.
- `GET /healthz` → `200 {"ok":true}`.
- `GET /api/countries` → country list + counts from the collector's `/api/stats`.
- `GET /api/search?country=&platform=&minFollowers=&q=&limit=&offset=` → masked,
  allowlisted creator cards. Collector responses are cached in memory for ~60s.
  The directory lists **only creators who have contact data** (phone / email /
  WhatsApp present) — the filter applies before counting, sorting and
  pagination, and the full per-country collector total is not exposed here.
- `GET /api/avatar?c=<country>&id=<rowId>` → the creator's profile photo,
  derived server-side from their platform profile URLs and proxied: the
  browser never sees a handle or an upstream URL. Priority instagram →
  tiktok → youtube → facebook → twitch; any failure is a 404 and the UI
  falls back to the initial-letter avatar.
- Per-platform handles/profile URLs join the payload **only** when the
  server-side `HANDLE_MODE` constant is `"visible"` (owner decision;
  shipped `"hidden"`: platforms carry `hasAccount` booleans and the
  accounts section renders blurred placeholders, exactly like contacts).

## Configuration

| Env var | Default |
|---|---|
| `PORT` | `3000` (Render sets this automatically) |
| `COLLECTOR_API_URL` | `https://influugc-collector-production.up.railway.app` |
| `AVATAR_UPSTREAM` | `https://unavatar.io` (avatar resolver base; server-side only) |

## Deploy on Render

A `render.yaml` blueprint is included (free web service, health check on
`/healthz`). Manual setup equivalent: build command `npm install`, start
command `npm start`, then attach the custom domain `explorinfluencer.com`
(+ `www`) and point DNS at the Render target.

## Design

v2-directory (Nov 2026): ExplorInfluencer's own identity — clean light theme,
violet `#6c4cf1` accent — on the influugc.com layout system (fixed 252px
sidebar + top bar, chips, creator cards). Arabic-first RTL UI with an EN
toggle. All public data (country, category, per-platform followers) is fully
visible; the contact block (phone / email / WhatsApp / profile links) renders
as blurred placeholder rows — the server sends per-type existence booleans
only, so no real contact or link value ever reaches the browser. v3-photos
adds the creators' real profile photos to the cards (server-proxied, see
`/api/avatar` above) and a payload-driven «الحسابات» section in the profile
modal. Served HTML
carries `<meta name="ei-build" content="v3-photos">`. Footer:
«explorinfluencer.com — منصة مستقلة لاكتشاف الكريتورز» plus the influUGC
network line with a booking CTA (`utm_source=explorinfluencer`).
