# RaceLab — Implementation Plan

**Versione:** 0.2  
**Data:** 22 agosto 2026  
**Target:** GP d'Italia — Monza, 6 settembre 2026  
**Strategia:** technical risk first, Live MVP first  
**Documenti sorgente:** `PRD.md`, `DESIGN.md`

---

## 1. Principio di esecuzione

L'obiettivo non è completare RaceLab.

L'obiettivo è avere **Race Radar affidabile a Monza**.

Ogni attività deve rispondere a una domanda:

> aumenta la probabilità che il 6 settembre l'app sia utile in pista?

Se no, viene rimandata.

---

# 2. Milestone principale

## M-MONZA

Entro domenica 6 settembre:

- PWA installabile;
- Live timing;
- intervals/gaps;
- tyre state;
- race-control state;
- favourite driver;
- data-age;
- track map;
- low-data mode;
- outdoor mode;
- resilient reconnect.

---

# 3. Test anticipato

## GP d'Olanda — 23 agosto 2026

È il primo gate tecnico.

Non deve esserci design completo.

Serve una pagina grezza che dimostri:

```text
OpenF1 Live Auth
      ↓
position
intervals
race_control
      ↓
server
      ↓
iPhone
```

### Success criteria

- token server-side funziona;
- token renewal strategy chiara;
- dati arrivano durante la gara;
- data age misurabile;
- position/interval schemas verificati;
- rate-limit behaviour osservato;
- logs disponibili.

Se questo fallisce, fermare il lavoro UI e risolvere il live provider.

---

# 4. Stack

## Core

- Next.js App Router
- React
- TypeScript strict
- Tailwind CSS
- shadcn/ui
- Zod
- TanStack Query
- lightweight state store only if necessary

## Visual

- SVG for Track Map MVP
- Framer Motion / Motion for small UI transitions
- ECharts only for post-Monza telemetry/analytics

## PWA

- manifest
- service worker using a maintained Next.js-compatible solution
- IndexedDB for last-known live state if required
- localStorage for preferences

## Testing

- Vitest
- React Testing Library
- Playwright

## Hosting

- Vercel for Next.js app / Live V1
- persistent live gateway evaluated only post-Monza

---

# 5. Repository

```text
racelab/
├─ app/
│  ├─ page.tsx
│  ├─ radar/
│  ├─ weekend/
│  ├─ focus/
│  ├─ settings/
│  └─ api/
│     └─ openf1/
│
├─ components/
│  ├─ radar/
│  ├─ timing/
│  ├─ track/
│  ├─ events/
│  └─ ui/
│
├─ features/
│  ├─ live/
│  ├─ weekend/
│  ├─ focus/
│  ├─ preferences/
│  └─ connectivity/
│
├─ lib/
│  ├─ f1/
│  │  ├─ domain/
│  │  ├─ providers/
│  │  │  └─ openf1/
│  │  ├─ schemas/
│  │  ├─ mappers/
│  │  └─ selectors/
│  ├─ cache/
│  ├─ network/
│  └─ pwa/
│
├─ tests/
├─ PRD.md
├─ DESIGN.md
└─ IMPLEMENTATION_PLAN.md
```

---

# 6. Mandatory architecture rules

## AR-01 — No raw provider payload in UI

```text
OpenF1
→ Zod
→ mapper
→ domain
→ UI
```

## AR-02 — Auth server only

Never expose:

- OpenF1 username;
- password;
- access token;
- refresh/auth secrets.

No `NEXT_PUBLIC_*` for provider credentials.

## AR-03 — Live state is composed

Do not pretend `/position` is the leaderboard.

Compose:

```text
position + intervals + laps + stints + pit + race_control
```

## AR-04 — Partial failure

Each data category may fail independently.

Timing survives map failure.

## AR-05 — Location is delta-based

Never refetch the entire session location history.

Track:

```ts
lastLocationTimestamp
```

and request only newer samples.

## AR-06 — Live data is timestamped

Every cached state carries:

- receivedAt;
- sourceTimestamp where available;
- age.

## AR-07 — Implementation plan is living

At end of every coding session:

- mark done;
- record decisions;
- update risks;
- set next action.

---

# 7. OpenF1 client architecture

## Historical client

Unauthenticated.

## Live client

Authenticated server-side.

Responsibilities:

- obtain token;
- cache token;
- renew before expiry;
- avoid login storm;
- handle 401;
- retry once after re-auth;
- expose typed errors.

Concept:

```ts
class OpenF1LiveClient {
  getAccessToken()
  authenticatedFetch()
}
```

---

# 8. Domain models

Minimum before UI:

```ts
type Meeting
type Session
type Driver

type DriverPosition
type DriverInterval
type Lap
type Stint
type PitStop
type RaceControlEvent
type WeatherState
type TrackLocationSample

type LiveDriverTiming
type LiveRaceState
type LiveConnectionStatus
```

---

# PHASE 0 — 22 AUG — LIVE PROOF SETUP

## Goal

Essere pronti a interrogare OpenF1 Live prima della gara di Zandvoort.

### Tasks

- [x] Create repository: https://github.com/testxbusiness/racelab
- [x] Bootstrap Next.js + TypeScript strict.
- [x] Add Tailwind.
- [x] Add Zod.
- [x] Add lint/typecheck/test.
- [x] Add environment schema.
- [x] Add `PRD.md`.
- [x] Add `DESIGN.md`.
- [x] Add `IMPLEMENTATION_PLAN.md`.
- [x] Add OpenF1 historical client.
- [x] Add OpenF1 live auth client.
- [x] Add token cache.
- [x] Add server route for live test.
- [x] Add raw diagnostics screen protected by environment flag.
- [ ] Deploy to Vercel.

### Do not do

- track map;
- animations;
- polished design;
- telemetry;
- PWA refinement.

---

# PHASE 1 — 23 AUG — ZANDVOORT LIVE PROOF

## Goal

Validate the hardest dependency on real F1 live data.

### Integrate

- [x] sessions/latest
- [x] drivers
- [x] position
- [x] intervals
- [x] race_control

### Diagnostic screen

Show:

```text
LIVE SESSION
session key
lap if available
driver count
last source timestamp
received at
data age
request count/min
last provider error
```

The implementation also reads `laps` minimally so the “lap if available” field is populated without starting the later data-hardening phase.

Leaderboard may be ugly.

### Logging

Capture:

- endpoint latency;
- status code;
- payload size;
- record count;
- validation errors;
- source timestamps;
- request frequency;
- auth refreshes.

### Post-race task

Record actual findings inside `IMPLEMENTATION_PLAN.md`.

---

# PHASE 2 — 24–25 AUG — DATA LAYER HARDENING

## Goal

Convert live spike into maintainable provider layer.

### Tasks

- [ ] Zod schemas.
- [ ] provider response mappers.
- [ ] typed provider errors.
- [ ] LiveRaceState composer.
- [ ] event deduplication.
- [ ] last valid state retention.
- [ ] stale calculation.
- [ ] configurable polling intervals.
- [ ] rate budget instrumentation.

### Polling initial budget

Starting target:

```text
position       6s
intervals      6s
race_control  10s
laps          15s
stints        30s
weather       60s
```

Location is not yet active.

Adjust after measured behaviour.

---

# PHASE 3 — 26–27 AUG — RACE RADAR TIMING

## Goal

Build the actual primary interface.

### Components

- [ ] LiveHeader.
- [ ] ConnectionBadge.
- [ ] DataAge.
- [ ] Leaderboard.
- [ ] LeaderboardRow.
- [ ] TyreBadge.
- [ ] RaceStatus.
- [ ] EventFeed.

### Acceptance

On iPhone portrait:

- lap visible;
- status visible;
- top timing readable;
- favourite driver can be located quickly;
- reconnect does not blank page.

---

# PHASE 4 — 28 AUG — FOCUS DRIVER

## Goal

Personalise the live experience.

### Tasks

- [ ] choose favourite driver.
- [ ] localStorage persistence.
- [ ] favourite row state.
- [ ] DriverFocusSheet.
- [ ] gap ahead/behind.
- [ ] last lap.
- [ ] tyre/stint.
- [ ] focus state selectors.

No account.

---

# PHASE 5 — 29–30 AUG — TRACK MAP SPIKE

## Goal

Validate map from real/historical location data.

### Technical research

- [ ] inspect location coordinate system.
- [ ] retrieve one complete historical session sample.
- [ ] derive circuit path.
- [ ] normalise x/y.
- [ ] rotate/scale.
- [ ] render Monza SVG path.
- [ ] render driver dots.
- [ ] interpolation prototype.

### Location query rule

Store:

`lastLocationTimestamp`

Only fetch delta.

### Performance

- [ ] location state isolated.
- [ ] map updates do not rerender leaderboard.
- [ ] map can be disabled completely.

### Gate

If map jeopardises reliability:

ship timing first.

---

# PHASE 6 — 31 AUG — PWA FOUNDATION

## Goal

Make Race Radar installable and reopen reliably.

### Tasks

- [ ] manifest.
- [ ] app icons.
- [ ] standalone.
- [ ] install test on iPhone.
- [ ] service worker.
- [ ] app shell cache.
- [ ] static track cache.
- [ ] preferences cache.

### Important rule

Do not cache live API responses as if they were current.

Last-known live state has an explicit timestamp.

---

# PHASE 7 — 1 SEP — NETWORK RESILIENCE

## Goal

Optimise for the real circuit failure mode.

### Tasks

- [ ] online/offline listener.
- [ ] retry/backoff.
- [ ] last known state.
- [ ] Low Data Mode.
- [ ] pause map fetch in Low Data.
- [ ] reduce polling in Low Data.
- [ ] visibility/background behaviour.
- [ ] stale UI.
- [ ] manual retry.

### Tests

DevTools:

- Fast 3G;
- Slow 3G;
- offline 15 s;
- offline 60 s;
- packet-like intermittent failures.

---

# PHASE 8 — 2 SEP — OUTDOOR + POWER

## Goal

Test conditions software simulators do not reproduce well.

### Outdoor test

Physically test phone outside.

Check:

- readability;
- contrast;
- touch targets;
- reflections;
- text hierarchy.

### Power test

Run Race Radar for a prolonged period.

Measure qualitatively:

- battery drain;
- device heat;
- data consumption.

### Adjust

- polling;
- animations;
- map;
- background behaviour.

---

# PHASE 9 — 3 SEP — PRE-MONZA FREEZE PREP

## Goal

No new major features.

### Checklist

- [ ] provider health diagnostics.
- [ ] static session resolution.
- [ ] Monza weekend detection.
- [ ] app install test.
- [ ] offline shell.
- [ ] clean logs.
- [ ] graceful error screen.
- [ ] rollback deployment available.
- [ ] cache warm-up behaviour verified.

Feature freeze starts after readiness review.

---

# PHASE 10 — 4 SEP — MONZA FP1 / FP2 LIVE TEST

## Goal

First full Race Radar test on the target meeting.

### Test

- auth;
- session resolver;
- leaderboard;
- intervals;
- race-control;
- favourite;
- map;
- data age;
- PWA;
- connection recovery.

### Capture issues

Use severity:

- P0 — blocks live use;
- P1 — serious;
- P2 — polish.

Only P0/P1 must be fixed before qualifying.

---

# PHASE 11 — 5 SEP — FP3 / QUALIFYING VALIDATION

## Goal

Second production rehearsal.

### Rule

No new functionality.

Fix only:

- correctness;
- reliability;
- severe usability;
- rate issues;
- auth;
- map bugs;
- PWA issues.

End of day:

**hard feature freeze.**

---

# PHASE 12 — 6 SEP — RACE DAY

## Pre-event checklist

- [ ] latest stable deploy active.
- [ ] OpenF1 credentials valid.
- [ ] auth test successful.
- [ ] app installed.
- [ ] static cache warmed.
- [ ] favourite driver set.
- [ ] Low Data Mode tested.
- [ ] Outdoor Mode tested.
- [ ] power bank ready.
- [ ] debug diagnostics reachable if needed.

## During race

No deploy unless critical.

Prefer degraded working app over risky hotfix.

---

# 9. Live polling architecture

## Request groups

### Core

Always active during live:

- position;
- intervals;
- race_control.

### Medium

- laps;
- stints;
- pit.

### Low

- weather.

### Heavy

- location.

Heavy group is active only if map is visible and Low Data Mode is off.

---

# 10. Rate-limit budget

Implement an internal counter.

Track:

```ts
requestsLast60Seconds
```

Warnings:

- 70% budget;
- 85% budget;
- near limit.

Back off non-core endpoints first.

Priority:

```text
intervals
position
race_control
laps
stints
weather
location
```

Actual limits must be configured from the active OpenF1 plan, not hardcoded throughout the app.

---

# 11. Location pipeline

## Static track shape

Use historical/session points to derive a Monza path.

Possible procedure:

1. collect clean location samples;
2. select representative lap;
3. remove extreme outliers;
4. normalise;
5. simplify path;
6. store generated geometry.

Do not rebuild track shape on every live load.

## Live markers

Only current/new points are loaded.

State per driver:

```ts
{
  previous,
  target,
  lastUpdate
}
```

UI interpolates between them.

---

# 12. PWA cache architecture

## Service worker

Cache:

- app shell;
- icons;
- static assets;
- track outline;
- optional driver metadata.

## Live state cache

Separate store:

```ts
{
  state,
  savedAt,
  sourceTimestamp
}
```

On app reopen:

show last state immediately but mark it:

```text
CACHED
2m 13s old
```

then refresh.

---

# 13. Failure matrix

| Failure | Behaviour |
|---|---|
| auth fails | keep cached state, show provider unavailable |
| intervals fail | show position, gap as unavailable |
| position fails | retain last valid ranking with stale mark |
| location fails | freeze/hide map |
| race_control fails | timing continues |
| network offline | cached state + offline label |
| rate limit | suspend non-core calls, backoff |
| malformed payload | discard stream update, keep last valid state |

---

# 14. Testing

## Unit

- schemas;
- mappers;
- LiveRaceState composer;
- stale logic;
- tyre mapping;
- gap formatting;
- polling budget;
- token refresh.

## Integration

Fixture-based:

- OpenF1 endpoint composition;
- missing field handling;
- partial endpoint failure;
- reconnect;
- stale state.

## E2E

- open Radar;
- set favourite;
- simulated live update;
- offline;
- reconnect;
- Low Data;
- Outdoor Mode settings;
- map missing.

---

# 15. Live fixture recorder

Create a development recorder as soon as live data is available.

Purpose:

record short sequences from Zandvoort/Monza and replay them locally.

This allows development when no session is live.

Store sanitized provider payloads or transformed domain events.

---

# 16. Observability

Development diagnostics:

```text
provider status
auth expiry
request count
last endpoint response
response latency
payload size
validation errors
data age
polling mode
online/offline
```

A hidden `/debug` page is recommended.

---

# 17. Security

- secrets server-side;
- env validation;
- no arbitrary proxy URLs;
- validate query parameters;
- provider payload validation;
- rate-limit own public API if app URL becomes discoverable;
- no sensitive logs.

---

# 18. Post-Monza roadmap

Only after M-MONZA is complete.

## Phase A

- Strategy view.
- Weather view.
- Better historical weekend pages.

## Phase B

- Race Replay.
- Event snapshots.
- Replay map.

## Phase C

- Driver Compare.
- Car telemetry.
- Lap delta.
- ECharts.

## Phase D

- Live Gateway with MQTT/WebSocket if justified.

## Phase E

- Quiz.
- Facts.
- Achievements.
- Broader season hub.

---

# 19. Definition of done

Every task must satisfy where applicable:

- typecheck passes;
- tests pass;
- mobile verified;
- loading state;
- error state;
- stale state for live data;
- provider data validated;
- request volume reviewed;
- no secret exposure;
- plan updated.

---

# 20. Decision log

| Date | Decision | Motivation |
|---|---|---|
| 2026-08-22 | Monza is the product deadline | Forces scope discipline |
| 2026-08-22 | Race Radar is the MVP | Directly solves at-circuit problem |
| 2026-08-22 | Zandvoort is the first live proof | Validate biggest technical risk immediately |
| 2026-08-22 | OpenF1 is the only MVP provider | Reduce integration complexity |
| 2026-08-22 | OpenF1 live auth remains server-side | Security and provider abstraction |
| 2026-08-22 | REST polling first | Lower complexity and faster validation |
| 2026-08-22 | SVG map first | Avoid premature optimisation |
| 2026-08-22 | Location queries are incremental | Control bandwidth and payload size |
| 2026-08-22 | Low Data Mode is P0 | Circuit connectivity is a core risk |
| 2026-08-22 | Replay/telemetry are post-Monza | Protect live sprint |

---

# 21. Current next actions

## Immediate

- [x] Bootstrap Next.js App Router with strict TypeScript, Tailwind, Zod, Vitest, and ESLint.
- [x] Configure server-only environment parsing.
- [x] Add unauthenticated historical client.
- [x] Implement OpenF1 OAuth token exchange, token cache, refresh-before-expiry, login de-duplication, and one retry after 401.
- [x] Implement authenticated sessions, drivers, position, intervals, and race-control access.
- [x] Validate provider payloads with Zod before they enter the provider result.
- [x] Add `/api/openf1/live` and a server-rendered diagnostic page at `/`.
- [ ] Configure OpenF1 live credentials in the deployment environment.
- [x] Deploy live diagnostics page to Vercel: https://racelab-dusky.vercel.app
- [ ] Push the local source to `testxbusiness/racelab`.
- [ ] Test on Zandvoort.

## Stop condition

Do not start Track Map until the live provider proof has succeeded.

---

# 22. Phase 0/1 implementation findings — 22 August 2026

## Completed evidence

- `npm run lint`, `npm run typecheck`, `npm test` (5 tests, including server-side token caching and lap/empty-result schemas), and `npm run build` pass.
- A read-only request to OpenF1 returned the current Zandvoort 2026 qualifying session (`session_key=11349`) on 22 August 2026.
- No `NEXT_PUBLIC_*` variables are used; credentials and bearer tokens are read only in server-only modules.

## Findings and decisions

- REST polling is used for the proof. One diagnostic refresh requests latest session, drivers, position, intervals, and race control.
- Position is composed with the latest interval record by driver number; the UI does not treat position as a complete leaderboard.
- Invalid provider payloads are discarded with a safe diagnostic error. Raw provider errors and credentials are not exposed.
- Request count is tracked in-process for the last 60 seconds; shared telemetry is still needed if the app scales across instances.
- A live endpoint inspection showed that OpenF1 can return `{"detail":"No results found."}` for a valid endpoint with no records; the provider maps this response to an empty validated collection. The same inspection exposed the public three-requests-per-second limit, so diagnostic calls are paced rather than fired concurrently.

## Remaining risks

- Live OAuth has not been exercised end-to-end here because `OPENF1_USERNAME` and `OPENF1_PASSWORD` are not configured. Credentialed smoke testing is still required during the Zandvoort live window.
- Vercel is not deployed: the CLI reports `Logged out`, and no deployment token is available. Deployment also requires the two OpenF1 secrets and `OPENF1_DIAGNOSTICS_ENABLED=true` as server environment variables.
- The public repository `https://github.com/testxbusiness/racelab` was initially empty. The GitHub connector rejected content writes with `403 Resource not accessible by integration`, but CLI authentication later succeeded and the source was pushed.
- GitHub CLI authentication and push are now complete: commit `4f73c72` is on `main` in `testxbusiness/racelab`.
- Vercel production deployment is READY at `https://racelab-dusky.vercel.app`; the initial runtime correctly reported diagnostics disabled until `OPENF1_DIAGNOSTICS_ENABLED=true` was added. A redeploy is still required after adding that environment variable, and real live data still requires the two OpenF1 secrets.
- Track Map, telemetry, PWA refinement, and all post-Monza features remain intentionally untouched.
