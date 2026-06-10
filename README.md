# NotiGuide — Admin Dashboard

The dashboard where store staff run the floor. Tickets stream in live; staff call the next customer, mark them served, or dispatch a physical pager — all from one queue board. Around it sit the management surfaces: organizations, stores, service types, admin accounts, device fleets, and an analytics view charting how the queues actually behave.

The whole UI ships in English and Vietnamese — not as an afterthought translation, but with copy written natively for each language — and respects light and dark themes throughout.

## Techstack

<p>
  <a href="https://nextjs.org/"><img alt="nextjs" src="https://img.shields.io/badge/-Next.js%2016-000000?logo=nextdotjs&logoColor=white"/></a>
  <a href="https://react.dev/"><img alt="react" src="https://img.shields.io/badge/-React%2019-61DAFB?logo=react&logoColor=black"/></a>
  <a href="https://www.typescriptlang.org/"><img alt="typescript" src="https://img.shields.io/badge/-TypeScript-3178C6?logo=typescript&logoColor=white"/></a>
  <a href="https://tailwindcss.com/"><img alt="tailwindcss" src="https://img.shields.io/badge/-Tailwind%20CSS%204-06B6D4?logo=tailwindcss&logoColor=white"/></a>
  <a href="https://ui.shadcn.com/"><img alt="shadcn-ui" src="https://img.shields.io/badge/-shadcn%2Fui-000000?logo=shadcnui&logoColor=white"/></a>
  <a href="https://biomejs.dev/"><img alt="biome" src="https://img.shields.io/badge/-Biome-60A5FA?logo=biome&logoColor=white"/></a>
  <a href="https://vitest.dev/"><img alt="vitest" src="https://img.shields.io/badge/-Vitest-6E9F18?logo=vitest&logoColor=white"/></a>
  <a href="https://yarnpkg.com/"><img alt="yarn" src="https://img.shields.io/badge/-Yarn%204-2C8EBB?logo=yarn&logoColor=white"/></a>
</p>

## The NotiGuide System

NotiGuide is an end-to-end queue management and notification system for stores — customers join a virtual queue from their phone, staff run the floor from a dashboard, and calls reach people through web push or dedicated RF pagers. This repository is that dashboard.

| Repository | Role |
|------------|------|
| [notiguide](https://github.com/Thomas-Hoang-04/notiguide) | Workspace superproject — system docs and submodule index |
| [notiguide-be](https://github.com/Thomas-Hoang-04/notiguide-be) | Reactive Kotlin/Spring Boot API — queue engine, auth, analytics, device orchestration |
| **notiguide-admin** (this repo) | Next.js dashboard for store staff — live queue control, dispatch, analytics |
| [notiguide-client](https://github.com/Thomas-Hoang-04/notiguide-client) | Next.js customer app — join queues, track position, receive web push |
| [notiguide-transmitter](https://github.com/Thomas-Hoang-04/notiguide-transmitter) | ESP32-C3 hub bridging MQTT dispatches to RF pager calls |
| [notiguide-receiver (`esp32`)](https://github.com/Thomas-Hoang-04/notiguide-receiver/tree/esp32) | ESP32-C3 pager — dual-radio (2.4 GHz nRF24 or 433 MHz OOK) |
| [notiguide-receiver (`esp8266`)](https://github.com/Thomas-Hoang-04/notiguide-receiver/tree/esp8266) | ESP8266 pager on the 433 MHz link |

## Features

- **Live queue board** — waiting and serving tickets update in real time over SSE; call, serve, and cancel without a refresh.
- **Pager dispatch** — pick a paired receiver right from the queue board and the call goes out over RF.
- **Analytics** — queue KPIs charted with Recharts, with date-range picking and skeleton loading states.
- **Fleet management** — enroll pager devices with one-time tokens and manage per-store rosters.
- **Org & store administration** — organizations, stores, custom public slugs, service types, admin accounts, and join requests.
- **Bilingual UI** — full English and Vietnamese coverage via next-intl, plus light/dark themes.

## Technical Highlights

- **Next.js 16 App Router with React 19** and the React Compiler enabled — no manual memoization.
- **shadcn/ui on Base UI primitives**, styled with Tailwind CSS 4; complex styles live in dedicated CSS files, not mile-long class strings.
- **Zustand stores** keep server state and UI state separated and testable.
- **Locale routing in middleware** — `src/proxy.ts` (Next.js middleware) drives next-intl's en/vi routing, while the `lib/` API layer talks to the backend with cookie-based auth and automatic token refresh.
- **Native-quality Vietnamese.** The `vi.json` catalog is written by hand to read like Vietnamese, not like translated English — structural parity with `en.json` is enforced, phrasing is not.
- **Vitest + Biome** — fast unit tests, single-tool lint and format.

## Architecture

```mermaid
flowchart LR
    subgraph Browser["Browser"]
        RT["App Router pages<br/>en · vi locales"]
        FT["features/*<br/>queue · analytics · device · store · …"]
        UI["components/*<br/>shadcn/ui on Base UI"]
        ZS["zustand stores"]
        I18N["next-intl<br/>messages/en · vi"]
    end

    subgraph Server["Next.js server"]
        PX["proxy.ts<br/>next-intl locale middleware"]
    end

    RT --> FT
    FT --> UI
    FT --> ZS
    RT --> I18N
    PX -.->|"en · vi routing"| RT
    ZS -->|"REST · lib/api"| BE["NotiGuide backend"]
    BE -.->|"SSE · queue events"| ZS
```

## Screenshots

> 📷 *Live queue board with active tickets and dispatch controls — coming soon*
<!-- PHOTO: queue management page, tickets in waiting/serving columns -->

> 📷 *Analytics view with KPI charts — coming soon*
<!-- PHOTO: analytics page, charts with date range picker -->

> 📷 *Device fleet management — coming soon*
<!-- PHOTO: devices page with enrolled pagers and enrollment token dialog -->

## Getting Started

You need a recent Node.js LTS with Corepack (the repo pins Yarn 4) and a running [NotiGuide backend](https://github.com/Thomas-Hoang-04/notiguide-be). The backend URL defaults to `http://localhost:8080`; override it with `NEXT_PUBLIC_API_URL` in `.env.local`.

```bash
yarn install
yarn dev          # http://localhost:3000
yarn build        # production build
yarn lint         # biome check
yarn test         # vitest run
```

## Project Structure

```
src/
├── app/          — App Router routes and layouts
├── features/     — domain UI: queue, analytics, device, store, …
├── components/   — shared shadcn/ui components
├── store/        — zustand stores
├── hooks/ lib/   — shared hooks and utilities
├── i18n/ messages/ — next-intl setup + en/vi catalogs
├── styles/       — global and per-feature CSS
├── types/        — shared TypeScript types
└── proxy.ts      — Next.js middleware (next-intl locale routing)
```

---

_**Created by Minh Hai Hoang. June 2026**_
