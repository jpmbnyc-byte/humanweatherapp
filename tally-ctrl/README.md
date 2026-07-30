# Tally CTRL

Acquisition cost assurance for multi-rooftop dealer groups.

Separate product surface (`tally-ctrl`) beside Human Weather in this repository.

## Public surfaces

| Route | Product | Function |
| --- | --- | --- |
| `/` | Landing | Category claim + DMS wedge + ladder |
| `/estimate` | Variance Pool Estimator | How much — used-only, three buckets |
| `/p/{token}` | VIN Preview | How — sample VINs, their economics |

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

## Develop

```bash
cd tally-ctrl
npm install
npm run dev      # http://localhost:5174
npm test
npm run build
```

Demo preview token: `/p/demo-faulkner`
