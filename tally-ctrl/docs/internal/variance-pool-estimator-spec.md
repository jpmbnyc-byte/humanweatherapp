# Variance Pool Estimator — Logic Spec v1.0

**Owner:** JP Bobo · Tally CTRL
**Purpose:** Free, self-serve entry point to the funnel. Derives a defensible variance estimate from observable dealer inputs and separates recoverable cash from accounting corrections.
**Status:** Coefficients calibrated to n=1 (the reference engagement). See §7.

---

## 1. Design principles

1. **Three outputs, never one.** A single blended number over-promises cash and under-delivers at invoice time. Separating recoverable cash from gross-accuracy correction from period exposure is what makes this read as practitioner work rather than a lead-gen calculator.
2. **Leakage is derived, never entered.** The user supplies observable operating facts. The tool computes the per-deal figure and shows its basis. A calculator that asks for brand mix demonstrates domain knowledge before a word of copy is read.
3. **Fee is fixed and displayed. The ratio falls out.** Never compute the fee from the pool — that reintroduces size-scaled pricing through the back door.
4. **Under 90 seconds.** Four required inputs. Everything else pre-filled and editable.
5. **Institutional register.** No exclamation points, no "unlock," no urgency. It reads like a schedule, because that is what the buyer trusts.

---

## 2. Inputs

### Required (4)

| Field | Type | Validation | Notes |
|---|---|---|---|
| `rooftops` | integer | 1–100 | |
| `new_units_month` | integer | 0–5,000 | Group total, all rooftops |
| `used_units_month` | integer | 0–5,000 | Group total, all rooftops |
| `brand_tier` | select | see §3.1 | Primary franchise group. Multi-select in v2. |

Asking new and used separately is load-bearing: OEM incentive leakage attaches almost entirely to new, and recon/ACV leakage almost entirely to used. A single "total deliveries" field destroys the decomposition.

### Advanced (3) — pre-filled, editable, collapsed by default

| Field | Default | Range | Notes |
|---|---|---|---|
| `avg_unit_cost` | $32,000 | $10k–$150k | Blended new + used inventory cost |
| `floorplan_rate` | 7.5% | 3%–15% | Update the default quarterly against prevailing SOFR + spread |
| `days_in_inventory` | 65 | 15–180 | Blended |
| `recon_per_used_unit` | $1,400 | $0–$8,000 | |

Collapsing these matters. A controller who can answer them will open the panel and be impressed that you asked; one who can't still gets a result.

### Derived

```
total_units_year  = (new_units_month + used_units_month) × 12
new_units_year    = new_units_month × 12
used_units_year   = used_units_month × 12
```

---

## 3. Coefficients

**These are calibration parameters, not constants.** Store them in config, not in code. §7 covers the update loop.

### 3.1 Brand program intensity — `program_per_new_unit`

Average total OEM program dollars per new unit (stair-step, regional bonus, dealer cash, delivery allowance).

| Tier | Brands | Default |
|---|---|---|
| **Heavy stair-step** | CDJR, Nissan, Mitsubishi | $1,800 |
| **Moderate** | Ford, GM, Hyundai, Kia, VW | $1,200 |
| **Light** | Toyota, Honda, Subaru, Mazda | $700 |
| **Luxury** | BMW, Mercedes-Benz, Audi, Lexus, Volvo | $1,400 |
| **Mixed / multiple** | Default when unsure | $1,200 |

The tiering is the domain-knowledge signal. Stair-step program structures differ sharply by manufacturer, and a controller reading "Heavy stair-step: CDJR, Nissan" recognises immediately that this wasn't written by a marketer.

### 3.2 Leakage rates

| Coefficient | Default | Applies to | What it represents |
|---|---|---|---|
| `unclaimed_incentive_rate` | 4.0% | Bucket A | Program dollars earned on delivery, never claimed on the factory schedule |
| `fpa_per_new_unit` | $250 | Bucket A | Floorplan assistance allowance per new unit |
| `unclaimed_fpa_rate` | 12.0% | Bucket A | Share of floorplan assistance never credited |
| `curtailment_error_rate` | 8.0% | Bucket A | Share of floorplan interest overpaid via curtailment timing |
| `recon_misallocation_rate` | 18.0% | Bucket B | Share of recon spend posted to the wrong unit, period, or department |
| `acv_variance_per_used_unit` | $200 | Bucket B | Average trade ACV posting variance |
| `asc606_timing_rate` | 6.0% | Bucket C | Share of incentive revenue recognised in the wrong period |

---

## 4. Formulas

### Bucket A — Recoverable Cash

> Dollars the group never received, or paid out and shouldn't have. Genuinely collectible, subject to lender and factory lookback windows.

```
A1_unclaimed_incentives =
    new_units_year × program_per_new_unit × unclaimed_incentive_rate

A2_unclaimed_floorplan_assistance =
    new_units_year × fpa_per_new_unit × unclaimed_fpa_rate

A3_overpaid_floorplan_interest =
    total_units_year × avg_unit_cost × floorplan_rate
    × (days_in_inventory / 365)
    × curtailment_error_rate

BUCKET_A = A1 + A2 + A3
```

### Bucket B — Gross Accuracy Correction

> The cost was incurred either way. Total group profit does not change. What changes is that per-unit gross becomes correct — which is why pricing, trade, and desking decisions stop being made off a distorted basis.

```
B1_recon_misallocation =
    used_units_year × recon_per_used_unit × recon_misallocation_rate

B2_acv_posting_variance =
    used_units_year × acv_variance_per_used_unit

BUCKET_B = B1 + B2
```

### Bucket C — Period Exposure

> Revenue recognised in the wrong period. Zero cash effect. This is materiality and restatement risk, quantified.

```
C1_asc606_timing =
    new_units_year × program_per_new_unit × asc606_timing_rate

BUCKET_C = C1
```

### Totals

```
TOTAL_IDENTIFIED   = BUCKET_A + BUCKET_B + BUCKET_C
LEAKAGE_PER_DEAL   = TOTAL_IDENTIFIED / total_units_year
RECOVERABLE_PER_DEAL = BUCKET_A / total_units_year
RUN_RATE_EBITDA    = BUCKET_A          # annual, once controls are installed
FEE                = 30390             # FIXED. Never derived.
FEE_RATIO_TOTAL    = FEE / TOTAL_IDENTIFIED
FEE_RATIO_CASH     = FEE / BUCKET_A
```

---

## 5. Reference case reconciliation

Inputs: 10 rooftops · 750 deliveries/month (45% new / 55% used) · Moderate brand tier · all advanced defaults.

| Line | Calculation | Result |
|---|---|---|
| A1 | 4,050 × $1,200 × 4% | $194,400 |
| A2 | 4,050 × $250 × 12% | $121,500 |
| A3 | 9,000 × $32,000 × 7.5% × (65/365) × 8% | $307,726 |
| **Bucket A** | | **$623,626** |
| B1 | 4,950 × $1,400 × 18% | $1,247,400 |
| B2 | 4,950 × $200 | $990,000 |
| **Bucket B** | | **$2,237,400** |
| C1 | 4,050 × $1,200 × 6% | $291,600 |
| **Bucket C** | | **$291,600** |
| **Total identified** | | **$3,152,626** |

Against the reference engagement's $3.171M — **within 0.6%.**

Per-deal decomposition:

| | Per deal | Share |
|---|---|---|
| Recoverable cash | **$69** | 20% |
| Gross accuracy correction | **$249** | 71% |
| Period exposure | **$32** | 9% |
| **Total** | **$350** | 100% |

The $350/deal figure survives the decomposition exactly. That is the strongest evidence the model is structurally right rather than fitted — the blended number was never wrong, it was just undifferentiated.

**Fee ratios:** 0.96% of total identified · 4.9% of recoverable cash. Both are strong. Pick one and use it consistently.

---

## 6. Output display

### Layout

Three cards, equal weight, left to right. Do not visually privilege the largest number — Bucket B is the biggest and the least collectible, and leading with it is the failure mode this whole redesign exists to prevent.

---

**CARD 1 — RECOVERABLE CASH**
### `$623,626`
> Unclaimed factory incentives, uncredited floorplan assistance, and overpaid interest from curtailment timing. These are dollars your group earned and did not receive, or paid and should not have. Subject to factory and lender lookback windows.

---

**CARD 2 — GROSS ACCURACY CORRECTION**
### `$2,237,400`
> Reconditioning and trade ACV posted to the wrong unit, period, or department. This does not change total group profit — the cost was incurred either way. It changes whether your per-unit gross is true, and every pricing, trade, and desking decision made off it.

---

**CARD 3 — PERIOD EXPOSURE**
### `$291,600`
> Incentive revenue recognised outside the period it was earned. No cash effect. This is materiality and restatement exposure under ASC 606, quantified rather than discovered at year-end.

---

### Summary strip, below the cards

> **Total variance identified: $3,152,626** — approximately **$350 per delivery** across 9,000 annual units.
>
> A CTRL Diagnostic is **$30,390, fixed** — under 1% of the variance identified, and roughly 5% of the recoverable cash. The fee is fixed before we begin. If we find less, you have bought certainty at a known price.

### Basis disclosure — always visible, never a tooltip

> **How this was calculated.** Estimates are derived from your reported unit volume, franchise mix, floorplan terms, and reconditioning spend, applied against leakage rates observed in completed Tally CTRL engagements. This is a modelled estimate, not a finding. A CTRL Snapshot examines 90 days of your actual cost data.

Showing the basis is not a disclaimer — it is the credibility mechanism. The buyer's profession is verifying that numbers are what they claim to be.

### Direct-register block — only if `rooftops >= 10`

> **For the owner's side of the desk:** recovering the cash is one-time. Closing the leak is recurring. At $69 per delivery across 9,000 annual units, installed controls add roughly **$624,000 to annual run-rate EBITDA** — and run-rate EBITDA is what carries a blue sky multiple. Recoveries do not; any buyer's quality-of-earnings review strips a one-time claw-back out.

**Do not display a multiple.** Blue sky multiples vary by franchise from roughly 3x to 8x+, and a dealer principal knows his own brand's number precisely. Give him the run-rate figure and let him apply his own multiple — he will, and he will trust the result because he did the arithmetic.

### CTA

Primary: **Request a CTRL Snapshot — $1,500, five business days, no site visit**
Secondary: **Have these figures sent to me** (email capture — this is the actual lead mechanism)

---

## 7. What must NOT be displayed

| Never show | Why |
|---|---|
| A single blended "you're losing $X" headline | The entire reason for the rebuild |
| The word "recovered" for Buckets B or C | Only Bucket A is collectible. Use "identified" for the total. |
| A computed fee | Reintroduces size-scaled pricing |
| Any blue sky or EBITDA multiple | Brand-specific; quoting a blanket range signals you have not transacted |
| Per-rooftop anything | Violates the standing pricing rule |
| "Audit," "audit-grade," "forensic" | See §9 |

---

## 8. Calibration loop — this is the moat

Every coefficient in §3 is currently fitted to **one** engagement. That is honest to state internally and must not be stated as more than it is externally.

**On completion of each Diagnostic, write actuals back:**

```
estimator_calibration
  engagement_id · completed_at · rooftops · new_units_year · used_units_year
  brand_tier · actual_A1 · actual_A2 · actual_A3
  actual_B1 · actual_B2 · actual_C1 · notes
```

Recompute each coefficient as a volume-weighted mean across completed engagements. Version the coefficient set and stamp every Estimator run with the version that produced it.

At n=1 the model is a hypothesis. At n=5 it is a benchmark. At n=15 it is a dataset nobody else can assemble retroactively — which is precisely the Ledger-as-proprietary-asset goal, expressed as a table rather than an aspiration.

**Also log every Estimator run**, converted or not. Reported volumes, brand mix, floorplan terms, and recon spend across dozens of dealer groups is a market dataset with standalone value, and it is the raw material for Ledger Vol. 2 and every subsequent edition.

---

## 9. Open issues — resolve before launch

**1. The $91.3M enterprise value figure cannot be reconstructed from this model.**
Run-rate EBITDA improvement is ~$624K/year. Even at 8x that is $5.0M. Eight times the full $3.171M is $25.4M. Neither approaches $91.3M — so the figure must rest on some other basis (the group's total enterprise value? a multi-year cumulative?). It needs a documented derivation or it should be retired. This is the number aimed at the buyer least likely to tolerate one he cannot reconstruct himself, and a dealer principal who asks "how'd you get there?" and receives a fuzzy answer is gone.

**2. "Audit" and "assurance" are terms of art.**
Both are professionally restricted in many states for non-CPA firms, and the buyer is specifically the person who knows where the line is. If Tally CTRL is not operating as a licensed CPA practice, confirm with counsel whether "assurance" survives. **"Acquisition cost verification"** or **"recovery"** carries equivalent weight with none of the exposure. One decision resolves this, the `ctrl-audit.net` sending domain, and the "forensic, audit-grade" language together.

**3. Diagnostic duration: 30 days or 90 days?**
The positioning set says 30; recent copy says 90. Reconcile before either reaches a prospect.

**4. Lookback windows constrain Bucket A and should eventually be modelled.**
Factory incentive claim windows and lender interest adjustment windows both expire. A 4% unclaimed rate across a full year overstates what is *still* collectible if part of it aged out. v2 should apply a recoverability haircut to A1 and A3 based on claim age. Flagging now so the first Diagnostic doesn't discover it in front of a client.
