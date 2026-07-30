# Tally CTRL

Acquisition cost assurance for multi-rooftop dealer groups.

Separate product surface (`tally-ctrl`) beside Human Weather in this repository.

## Public surfaces

| Route | Product | Function |
| --- | --- | --- |
| `/` | Landing | Category claim + DMS wedge + ladder |
| `/estimate` | Variance Pool Estimator | How much — used-only, three buckets |
| `/p/{token}` | Preview portal | How — sample VINs, deal-console strip |

Portal tabs (Index / Submit / Ledger / Findings / Close) are delivery-product
scope and are not part of this free-tool surface.

## Product ladder (publishable)

| Tier | Price |
| --- | --- |
| Variance Pool Estimator | Free |
| VIN Preview | Free (tokenized) |
| CTRL Snapshot | $1,500 fixed |
| CTRL Diagnostic | $30,390 fixed |
| Governance Program | Quoted — not published here |

## Used-only Estimator

Implements bible §2.2 scope: used volume only. New-car lines (OEM incentives,
FPA, ASC 606 incentive timing) are retired. Period exposure is disclosed as
requiring actual close calendars (Snapshot/Diagnostic), not invented from
volume coefficients. Warranty/CPO/arbitration stay out of the model until
calibration rows exist.

Coefficients: `src/config/estimator-coefficients.ts` (version-stamped).
Publishable copy: `src/config/positioning.ts`.

## Internal docs

`docs/internal/` is **not client-facing**. Do not import into UI bundles or
paraphrase unresolved risks, unpriced Governance anchors, or n=0 claims onto
public routes.

## VIN Preview presets

Three illustrative sample units (trade sedan, auction sedan, lease-return CUV).
Curated figures load instantly; with `VITE_GEMINI_API_KEY` set on Render, Gemini
refreshes acquisition / recon / store rates to current mid-market levels.
The strip math always runs client-side.

## Deploy (Render)

Static site service **`tally-ctrl-preview`** in root [`render.yaml`](../render.yaml).

Custom domain: **`preview.tallyctrl.com`**

Step-by-step: [`docs/DEPLOY_RENDER.md`](docs/DEPLOY_RENDER.md)

## Develop

```bash
cd tally-ctrl
npm install
npm run dev      # http://localhost:5174
npm test
npm run build
```

Demo preview token: `/p/demo-faulkner`
