# Tally CTRL

Used vehicle cost assurance — production VIN engine schema and Stage-6 **VIN Preview**.

This app lives beside Human Weather in the same repository but is a separate product surface (`tally-ctrl`).

## What ships here

| Layer | Status |
| --- | --- |
| Production SQLite schema (`src/schema/vin-engine.sql`) | Full §1–§9 from the VIN Engine Schema |
| TypeScript types + §7 strip/compute | Client-safe, unit-tested |
| Stage-6 VIN Preview (`/p/{token}`) | Four inputs → waterfall → extrapolation → CTA |
| Franchise seeding | Curated library + optional Gemini structured protocol |
| Portal tabs (Index / Submit / Ledger / Findings / Close) | Out of scope for this preview |

## Preview contract

**Your sample VINs, their economics.** Controllers never upload a DMS export. They type labor rate, cost rate, parts markup, and pack — then watch `INTERNAL_RO_MARKUP` resolve on a boringly typical used unit.

Tokenized links:

```
/p/{token}
```

Tokens buy personalization, open attribution, 21-day expiry, and franchise-aware sample seeding.

## Franchise seeding (Gemini protocol)

1. Resolve franchise from the preview token (gate-3 data).
2. Match a curated mid-market sample (Honda → Accord, Toyota → Camry, …).
3. If `VITE_GEMINI_API_KEY` is set and the franchise is unknown or needs rate calibration, call Gemini with a strict JSON schema (`responseMimeType: application/json`) to propose year/make/model + plausible default economics. Results are validated with Zod and never invent dramatic outliers.

Offline / no key → curated library only. The engine never depends on the model at runtime for math.

## Develop

```bash
cd tally-ctrl
npm install
npm run dev      # http://localhost:5174
npm test
npm run build
```

Demo token: open `/p/demo-faulkner` (or `/` redirects there).

## Estimator vs Preview

| | Estimator | VIN Preview |
| --- | --- | --- |
| Answers | How much? | How? |
| Level | Group, annual | One unit |
| Mode | Asserts a modeled number | Demonstrates the mechanism |
| Stage | 1 (entry) | 6 (proof) |
