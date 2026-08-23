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
- [x] Deploy to Vercel.

### Do not do

- track map;
- animations;
- polished design;
- telemetry;
- PWA refinement.

### Phase 0 verification note — 23 Aug 2026

- [x] Restored the environment-gated raw diagnostic page at `/diagnostics`; it is hidden with a 404 when `OPENF1_DIAGNOSTICS_ENABLED` is false.
- [x] The screen exposes session key, lap, driver count, source timestamp, received time, data age, requests/minute, auth refreshes, last provider error, and per-endpoint metrics.

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

### Production verification findings — 23 Aug 2026

- [x] `GET /api/openf1/live` returned HTTP 200 from Vercel and a composed Netherlands Qualifying state (session key `11349`, 22 drivers, lap 25, race-control events).
- [x] Server-side auth remains private; automated coverage verifies one bearer token is reused across provider requests and refreshed once after a 401.
- [x] Source timestamps, received timestamps, data age, request rate, endpoint status, latency, payload bytes, record count, validation failures, and auth refreshes are available in the protected diagnostics view and structured Vercel logs.
- [x] Observed a real `429` for `laps`; the stream degraded independently while timing remained available. This validates the fallback path and should inform Phase 7 backoff work.
- [ ] A 10-minute observation during an active session is still required to validate live latency, update frequency, and rate-limit behaviour under sustained race conditions. The 23 Aug production request occurred after the session and correctly reported `stale`/`ended` data.

---

# PHASE 2 — 24–25 AUG — DATA LAYER HARDENING

## Goal

Convert live spike into maintainable provider layer.

### Tasks

- [x] Zod schemas.
- [x] provider response mappers.
- [x] typed provider errors.
- [x] LiveRaceState composer.
- [x] event deduplication.
- [x] last valid state retention.
- [x] stale calculation.
- [x] configurable polling intervals.
- [x] rate budget instrumentation.

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

### Polling implementation note — 22 Aug 2026

- [x] Applied per-stream refresh windows in `createLiveStateLoader` with cached data and cached stream health.
- [x] Position and intervals refresh every 6s; race control every 10s; laps every 15s; stints every 30s; session and drivers every 30s.
- [x] A `/radar` refresh still occurs every 6s, but only streams whose window has elapsed call OpenF1. Last valid stream data remains available between refreshes and after endpoint failures.
- [x] Added fake-clock integration coverage for stream-specific polling and fallback retention.

---

# PHASE 3 — 26–27 AUG — RACE RADAR TIMING

## Goal

Build the actual primary interface.

### Components

- [x] LiveHeader.
- [x] ConnectionBadge.
- [x] DataAge.
- [x] Leaderboard.
- [x] LeaderboardRow.
- [x] TyreBadge.
- [x] RaceStatus.
- [x] EventFeed.

### Acceptance

On iPhone portrait:

- [x] lap visible;
- [x] status visible;
- [x] top timing readable;
- [ ] favourite driver can be located quickly — deferred to Phase 4 because favourite-driver selection is not implemented yet;
- [x] reconnect does not blank page.

### Phase 3 implementation notes — 22 Aug 2026

- [x] Added `/radar` as the primary server-rendered Race Radar screen.
- [x] Added a thin client refresh shell backed by `/api/openf1/live`; it keeps the last valid `LiveRaceState` visible during provider errors, reconnecting, stale data, and offline mode.
- [x] Extended the domain session model with provider-mapped start/end timestamps and derived race status. The current provider does not expose total race laps, pit state, or retirement in the configured payload set, so the UI renders explicit unavailable markers rather than fabricating values.
- [x] Added component render tests plus existing composer/provider integration coverage. Validation passed: `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`.

### Phase 3 risks / next action

- OpenF1 live session status and total-lap availability should be verified during the next real-session rehearsal. If exposed, map them into the existing domain rather than changing the UI boundary.
- Pit/retired flags remain intentionally nullable until a supported provider stream is added; this is acceptable for the “where available” requirement.
- Next phase: Focus Driver, without adding track map or telemetry to the timing screen.

### UI/UX refinement — 22 Aug 2026

- [x] Added the project visual direction from `design_test` to the live shell: technical HUD treatment, 4px rhythm, high-contrast surfaces, team-accent timing rows, circular tyre chips, tabular timing hierarchy, and mobile bottom navigation.
- [x] Replaced the diagnostics-first root page with a product entry screen linking directly to `/radar`.
- [x] Kept Map, Weekend, Focus, and Settings visibly represented but non-functional until their planned phases; no static driver or track data was introduced.
- [x] Added accessible focus states, inline SVG navigation icons, reduced-motion support, and render coverage for the new shell.

### UI/UX redesign pass — 23 Aug 2026

- [x] Reworked the driver focus sheet toward the supplied `design_test/new_design.png` reference: hero treatment, team accent, and driver number without external photos or logos.
- [x] Kept the team colour as the primary visual identity in the hero, timing rows, tyre chips, and focus state.
- [x] Removed the previously downloaded official F1 media assets and the unused lookup module after product clarification.
- [x] Verified with `npm test`, `npm run typecheck`, and `npm run lint`.

### UI/UX redesign risks / next action

- The current local asset set covers the Ferrari / Charles Leclerc focus state shown in the reference. Extend the same catalog for the remaining 2026 drivers and teams before the Focus/Weekend phases are closed.
- Official F1 media assets are used according to the requested source; review Formula 1 usage terms before any public/commercial distribution.

### UI/UX redesign pass 2 — 23 Aug 2026

- [x] Added a desktop RaceLab rail matching the supplied composition while preserving the mobile bottom navigation and one-hand flow.
- [x] Added the visual hierarchy for section labels, disabled future areas, active Race Radar state, technical grid background, and sharper card treatment.
- [x] Removed all pilot/car imagery from the focus design; team colours, driver number, and data remain the only visual identity cues.
- [x] Verified with `npm test` (48 tests), `npm run typecheck`, `npm run lint`, and `npm run build`.

### UI/UX redesign pass 2 risks / next action

- The desktop rail currently keeps future sections visibly disabled until their planned functionality is implemented; this preserves the reference navigation without inventing later-phase data.

### UI/UX polish pass — 23 Aug 2026

- [x] Added explicit visual variants for live, delayed/retrying, offline/cached, and initial loading states in the existing Radar shell.
- [x] Refined the existing Event Feed into a timeline treatment and strengthened the Map panel surface while keeping both data flows unchanged.
- [x] Added small-screen layout adjustments for timing columns and retained touch targets/focus states.
- [x] Kept unimplemented Weekend, Settings, and Outdoor Mode sections out of scope as requested.
- [x] Verified with `npm test` (48 tests), `npm run typecheck`, `npm run lint`, and `npm run build`.

---

# PHASE 4 — 28 AUG — FOCUS DRIVER

## Goal

Personalise the live experience.

### Tasks

- [x] choose favourite driver from the row focus sheet.
- [x] localStorage persistence without an account.
- [x] favourite row state.
- [x] DriverFocusSheet bottom-sheet detail view.
- [x] gap ahead/behind derived from the composed timing state.
- [x] last lap and best lap when lap duration data is available.
- [x] tyre/stint.
- [x] focus state selectors.

No account.

### Phase 4 implementation notes — 23 Aug 2026

- [x] Favourite driver state is stored under `racelab:favourite-driver` in browser localStorage; clearing the favourite removes the key and no server/account state was introduced.
- [x] Leaderboard rows are accessible buttons. Tapping one opens `DriverFocusSheet`; the selected favourite gets a subtle accent highlight and star marker.
- [x] Focus metrics are selected from `LiveRaceState.timing`, including derived adjacent-car gaps. Missing values render as `—`.
- [x] Lap duration is mapped when OpenF1 provides `lap_duration` or a start/end interval; best lap is derived from the already-loaded lap stream without adding a provider call.
- [x] Added selector and radar component coverage. Validation passed: `npm run lint`, `npm run typecheck`, `npm test` (18 tests), and `npm run build`.
- [x] Deployed the verified production build to Vercel after publishing the Phase 4 commit.

---

# PHASE 5 — 29–30 AUG — TRACK MAP SPIKE

## Goal

Validate map from real/historical location data.

### Technical research

- [x] inspect location coordinate system.
- [x] retrieve one complete historical session sample.
- [x] derive circuit path.
- [x] normalise x/y.
- [x] rotate/scale.
- [x] render Monza SVG path.
- [x] render driver dots.
- [x] interpolation prototype.

### Location query rule

Store:

`lastLocationTimestamp`

Only fetch delta.

### Performance

- [x] location state isolated.
- [x] map updates do not rerender leaderboard.
- [x] map can be disabled completely.

### Gate

If map jeopardises reliability:

ship timing first.

### Phase 5 implementation findings — 23 Aug 2026

- [x] OpenF1 `location` is now validated with Zod, mapped into `LiveLocationSample`, and exposed through a separate server-only location service and route. It is intentionally not added to `LiveRaceState`, keeping timing composition unchanged.
- [x] Live map bootstrap requests only a recent 15-second window. Subsequent requests use `date>` with a `lastLocationTimestamp` cursor persisted in sessionStorage per session; remounting the map does not request full session history again.
- [x] A complete public 2025 Monza lap (session `9912`, driver `1`, lap `1`) was preprocessed into a simplified normalized SVG path. The static path and captured coordinate bounds are stored locally and are not rebuilt during live use.
- [x] `TrackMap` uses SVG with local marker interpolation over 900ms. Favourite markers receive a ring, selected markers receive a label, and marker selection supports keyboard activation.
- [x] Map polling is isolated inside `TrackMapPanel`, runs only while the Map view is mounted and the document is visible, and stops when the user switches away. Location errors render map-local unavailable/stale states without changing timing state.
- [x] Added location schema, mapper, cursor-service, normalization, freshness, merge-bound, static-render, and map-marker tests. Validation passed: `npm run lint`, `npm run typecheck`, `npm test` (28 tests), and `npm run build`.
- [x] Race-day hardening for the 23 Aug Dutch GP: the live loader now selects the scheduled `Race` session from the latest meeting timeline instead of assuming `session_key=latest` is the race. Track geometry is selected by circuit for Monza and Zandvoort; unsupported circuits keep the map disabled so timing cannot be paired with incorrect geometry. Validation now passes with the full test suite.
- [x] Added a locally calibrated Zandvoort SVG geometry from the live Dutch GP session `11353`, with circuit-specific coordinate bounds passed to the isolated location loader and a regression test for the Zandvoort renderer.
- [x] Phase 5 closure after the Dutch GP live test: OpenF1 `(0,0)` location placeholders are filtered server-side and defensively excluded during marker merging; geometry bounds remain fixed for the active circuit instead of expanding during polling. This keeps live markers aligned with the preprocessed path. Informational race-control messages now preserve a green race state rather than displaying an incorrect unavailable status. Validation passed: `npm run lint`, `npm run typecheck`, `npm test` (33 tests), and `npm run build`.

### Rendering decision

SVG remains the chosen MVP renderer. The map has one static path and at most one marker per live driver; no profiling evidence justifies Canvas. Canvas can be reconsidered only if marker count or post-Monza telemetry creates a measured rendering bottleneck.

### Remaining risks

- OpenF1 location coordinates are approximate and provider-specific; the static bounds were calibrated from captured Monza and Zandvoort samples and should be rechecked against future live sessions. Unsupported or materially changed coordinate systems keep the map disabled.
- The recent-window bootstrap is intentionally bounded for live use; a future historical replay/map mode would need a separate explicitly paginated loader.

---

# PHASE 6 — 31 AUG — PWA FOUNDATION

## Goal

Make Race Radar installable and reopen reliably.

### Tasks

- [x] manifest.
- [x] app icons.
- [x] standalone.
- [x] iPhone installation procedure documented (HTTPS Safari smoke test).
- [x] service worker.
- [x] app shell cache.
- [x] static track cache.
- [x] preferences cache.

### Important rule

Do not cache live API responses as if they were current.

Last-known live state has an explicit timestamp.

### Phase 6 implementation findings — 23 Aug 2026

- [x] Added `manifest.webmanifest`, standalone display metadata, theme/background colours, portrait orientation, and PNG install icons for Safari/iPhone.
- [x] Added a small maintained-by-the-platform service worker. It precaches the app shell, icons, and Monza geometry; caches same-origin static bundles; and deliberately bypasses all OpenF1 API requests.
- [x] Added a timestamped local last-known live state envelope. On startup it is labelled `CACHED` with its age until a fresh live response arrives. Existing favourite-driver localStorage remains unchanged and therefore works offline.
- [x] Changed `/radar` to a data-free client shell so the installed route can be cached safely. Live timing is fetched only from the client with `cache: "no-store"`; cached navigation HTML cannot contain an old race state.
- [x] Documented the HTTPS Safari `Add to Home Screen` smoke test. A physical device pass remains an external release-validation step, not a code dependency.

### Phase 6 verification — 23 Aug 2026

- [x] `npm run lint`
- [x] `npm run typecheck`
- [x] `npm test` — 38 tests passing
- [x] `npm run build` — `/radar` is statically generated as the offline-safe shell
- [x] `node --check public/sw.js` and manifest/icon existence validation

---

# PHASE 7 — 1 SEP — NETWORK RESILIENCE

## Goal

Optimise for the real circuit failure mode.

### Tasks

- [x] online/offline listener.
- [x] retry/backoff.
- [x] last known state.
- [x] Low Data Mode.
- [x] pause map fetch in Low Data.
- [x] reduce polling in Low Data.
- [x] visibility/background behaviour.
- [x] stale UI.
- [x] manual retry.

### Phase 7 implementation findings — 23 Aug 2026

- [x] Core polling now uses one in-flight request at a time, 6s normal / 18s Low Data cadence, and capped exponential retry delays of 3s, 6s, 12s, 24s, then 30s.
- [x] Online/offline and visibility transitions suspend background network work. Returning online or foreground starts a core timing refresh immediately; map refresh is intentionally delayed by one second so core timing has priority.
- [x] Failed responses never clear the last valid race state. The header shows `OFFLINE`, `RETRYING`, and an increasing data age; the notice provides a manual retry control.
- [x] Low Data Mode is persisted locally, pauses all live location requests and marker animation, and reduces core polling while preserving the composite timing response (positions, intervals, race-control, tyre/stint fields).

### Tests

DevTools:

- Fast 3G;
- Slow 3G;
- offline 15 s;
- offline 60 s;
- packet-like intermittent failures.

### Phase 7 verification — 23 Aug 2026

- [x] Simulated slow request: polling controller permits only one in-flight request, including manual retry/foreground events.
- [x] Simulated temporary and 60-second offline/background intervals: no scheduled request runs until resume, then core timing refreshes immediately.
- [x] Simulated intermittent provider failures: last valid state callback is never cleared; retry schedule backs off then resets after success.
- [x] Low Data map rendering test verifies the map is visibly paused while core timing remains active.
- [x] `npm run lint`, `npm run typecheck`, `npm test` (45 tests), and `npm run build` passed.

### Live provider compatibility follow-up — 23 Aug 2026

- [x] OpenF1 interval payloads accept numeric/null gaps and documented lapped-driver labels such as `+1 LAP`/`+N LAPS`.
- [x] Lapped labels remain visible in the leaderboard and driver focus UI; numeric-only calculations skip nonnumeric labels safely.
- [x] Added the OpenF1 `pit` stream with validated records, session-level historical counting per driver, and `PITS 0…n` display in Radar rows and Driver Focus. Counts remain available for drivers whose current position is missing after retirement, as long as the provider returned the session pit history.
- [x] Validation: `npm run lint`, `npm run typecheck`, `npm test` (48 tests), and `npm run build`.

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
- [x] Configure OpenF1 live credentials in the deployment environment.
- [x] Deploy live diagnostics page to Vercel: https://racelab-dusky.vercel.app
- [x] Push the local source to `testxbusiness/racelab`.
- [x] Test on Zandvoort.

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
- Credentialed smoke testing confirmed sessions, drivers, position, laps, and race control return 200; intervals returns 404 with the documented empty-result body for the current qualifying session. The client now passes 404 through to Zod empty-result handling instead of treating it as an infrastructure failure.
- Credentialed production smoke testing exposed the real laps shape (`date_start`/`date_end`, nullable); the lap schema now accepts that provider shape while keeping the required identity and lap-number fields strict.
- Final production verification at `https://racelab-dusky.vercel.app` returned `ok:true` for session `11349` with 22 drivers, 1184 position records, 0 intervals (valid empty result), 377 laps, 118 race-control events, `requestCount=6`, and a source timestamp. The page rendered the live header for 2026 Zandvoort qualifying.

## Remaining risks

- Intervals are unavailable for the verified qualifying snapshot; the UI intentionally shows unavailable interval values while retaining the other live streams. Re-test during a race session where interval records are present.
- The public repository `https://github.com/testxbusiness/racelab` was initially empty. The GitHub connector rejected content writes with `403 Resource not accessible by integration`, but CLI authentication later succeeded and the source was pushed.
- GitHub CLI authentication and push are now complete: commit `4f73c72` is on `main` in `testxbusiness/racelab`.
- Vercel production deployment is READY at `https://racelab-dusky.vercel.app` and has returned authenticated, validated live data after the OpenF1 secrets were configured.
- Telemetry, PWA refinement, and all post-Monza features remain intentionally untouched; Phase 5 Track Map is now an isolated secondary SVG view.

---

# 23. Phase 2 implementation findings — 22 August 2026

## Completed tasks

- All live endpoint payloads used by the application, including stints, are validated with Zod before mapping.
- `lib/openf1/mappers.ts` removes provider-specific names and fields at the domain boundary; React consumes only `LiveRaceState`.
- `ProviderError` supplies consistent authentication, HTTP, validation, empty-session, and network error categories.
- `LiveRaceState` composes position, intervals, laps, stints, and deduplicated race-control events per driver/session.
- The in-memory server-side loader retains individual last-valid streams when a later request fails; the affected stream is marked `fallback` rather than blanking timing.
- Freshness states use initial thresholds of ≤8 s live, ≤20 s delayed, and >20 s stale.
- Polling intervals are centralised in `lib/openf1/polling.ts`; rate budget instrumentation records per-endpoint request count, status, latency and provider content-length headers.
- Unit/integration-style coverage verifies schemas, auth cache, budget warning, composition, freshness, deduplication, and partial endpoint failure retention.
- Final local verification: `npm run lint`, `npm run typecheck`, `npm test` (11 tests across 4 files), and `npm run build` pass. A source audit confirms the App Router UI does not reference OpenF1 snake_case payload fields.

## Technical decisions

- The current diagnostic endpoint performs an immediate composed snapshot. The central polling configuration is intentionally not turned into a client polling loop until the Race Radar UI phase, keeping OpenF1 credentials server-only.
- Empty OpenF1 interval responses continue to be valid domain input, not provider failures.
- Last-valid data is process-local for this Phase 2 serverless implementation. It survives warm invocations but is not a persistent cache.

## Remaining risks and next action

- Validate rate-limit thresholds against the actual OpenF1 subscription limit and set `OPENF1_RATE_LIMIT_PER_MINUTE` when known; the current 60/minute default is conservative instrumentation only.
- Re-test stints and intervals during an active race session, where both streams are expected to contain useful timing/tyre data.
- Next recommended action: begin Phase 3 Race Radar timing UI using `LiveRaceState`, without introducing Track Map work.
