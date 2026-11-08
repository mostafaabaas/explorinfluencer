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

influUGC family look: black background, neon lime `#C8FF00` accent, Arabic-first
RTL UI with an EN toggle. Footer carries the influUGC network line with a
booking CTA (`utm_source=explorinfluencer`) and the client WhatsApp line.
