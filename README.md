# RaceLab

RaceLab is a Phase 0/1 proof for a server-rendered OpenF1 live diagnostic page.

## Local setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Set `OPENF1_USERNAME` and `OPENF1_PASSWORD` in `.env.local` for authenticated live access. Credentials are server-only and must not use `NEXT_PUBLIC_*` variables.

## Verification

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

The page at `/` and JSON endpoint at `/api/openf1/live` integrate sessions, drivers, position, intervals, and race control through Zod-validated provider data.

## iPhone PWA smoke test

Run the production app over HTTPS (for example with a deployed preview), open it in Safari on iPhone, then use **Share → Add to Home Screen**. Launching the new icon should open RaceLab without Safari chrome in portrait standalone mode. Open DevTools or the browser network inspector during a test and confirm that `/api/openf1/*` requests are never served from a cache. To test the shell and preferences, load RaceLab once, choose a favourite driver, go offline, and reopen the cached app; the preference should remain and any last-known timing must show `CACHED` with its age.
