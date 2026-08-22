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
