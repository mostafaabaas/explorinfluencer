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

## Configuration

| Env var | Default |
|---|---|
| `PORT` | `3000` (Render sets this automatically) |
| `COLLECTOR_API_URL` | `https://influugc-collector-production.up.railway.app` |

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
only, so no real contact or link value ever reaches the browser. Served HTML
carries `<meta name="ei-build" content="v2-directory">`. Footer:
«explorinfluencer.com — منصة مستقلة لاكتشاف الكريتورز» plus the influUGC
network line with a booking CTA (`utm_source=explorinfluencer`).
