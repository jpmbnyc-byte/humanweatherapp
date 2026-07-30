# Internal knowledge base

**Classification: INTERNAL — not client-facing.**

These documents inform product structure, coefficients, cadence, and doctrine.
They must not be imported into UI copy modules, shipped in client bundles,
linked from public routes, or paraphrased into prospect-facing surfaces.

Publishable client strings live only in `src/config/positioning.ts`.
Estimator coefficients live in `src/config/estimator-coefficients.ts`
(used-only scope per internal bible §2.2).

| Document | Role |
| --- | --- |
| `vin-engine-schema.md` | Delivery product schema |
| `variance-pool-estimator-spec.md` | Estimator formulas (blended ancestor; product implements used-only) |
| `tally-ctrl-positioning-and-rolling-model.md` | Positioning + outreach |
| `tally-ctrl-internal-bible.md` | Operating doctrine, risks, unresolved items |

Unresolved items (Governance pricing, $91.3M basis, n=0 warranty coefficients,
"assurance" counsel check, Diagnostic day-count) stay here until JP confirms —
never on a client route.
