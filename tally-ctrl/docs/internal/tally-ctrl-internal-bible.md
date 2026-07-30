# TALLY CTRL — INTERNAL BIBLE
### Complete Offering, Positioning & Operating Doctrine

**Version:** 1.0 · 29 July 2026
**Owner:** JP Bobo · governance@tallyctrl.com
**Classification:** Internal. Not client-facing. Contains unresolved risks, uncalibrated coefficients, and pricing not yet published.

**Companion documents (detail lives there, not here):**
- `tally-ctrl-positioning-and-rolling-model.md` v1.1 — copy, cadence, intake mechanics
- `variance-pool-estimator-spec.md` v1.0 — coefficient model, formulas, display copy
- `vin-engine-schema.md` v1.0 — delivery product schema, detection taxonomy

---

# PART I — THESIS

## 1.1 What this business actually is

Read across all three companion documents at once and the shape changes.

**The Diagnostic is not the product. It is customer acquisition for the portal.**

A $30,390 Diagnostic is a one-time engagement. One of them clears the December 2026 target, which is why it has absorbed all the attention so far. But a business that sells one-time forensic engagements to a finite pool of Northeast dealer groups runs out of market in roughly 36 months and never compounds.

The compounding asset is the **Governance Program** — the VIN Engine portal, running continuously, priced annually, renewing. The Diagnostic exists to prove the finding is real so the client will install the control that prevents it recurring. That is the sale.

**Corollary that should change near-term behaviour:** the Governance Program currently has no price. It is the only tier in the confirmed ladder marked "quoted." That is the single largest commercial gap in the offering — the recurring tier that constitutes the actual business is undefined, while the one-time wedge is specified to the dollar.

## 1.2 The one-sentence definition

> Tally CTRL finds the gap between what a used vehicle actually cost to acquire and recondition and what the DMS says it cost, recovers what is collectible, corrects what is misstated, and installs the controls that keep both durable.

## 1.3 Strategic sequence

| Horizon | Objective | Success measure |
|---|---|---|
| **0–6 months** | One Diagnostic close | $30,390 booked. December target cleared. |
| **6–18 months** | Convert Diagnostics to Governance | ≥2 recurring accounts. Coefficients at n≥5. |
| **18–36 months** | The Ledger becomes the moat | Dataset no competitor can assemble retroactively |

---

# PART II — SCOPE (UNRESOLVED — READ FIRST)

## 2.1 The contradiction

The Estimator models **new + used**. The VIN Engine delivers **used only**.

That gap is a promise the delivery product cannot keep. Of the reference case's $3,152,626:

| Component | Vehicle class | Delivered by VIN Engine? |
|---|---|---|
| A1 Unclaimed OEM incentives — $194,400 | New | **No** |
| A2 Floorplan assistance — $121,500 | New | **No** |
| A3 Floorplan interest — $307,726 | Both | Used portion only (~$169,250) |
| B1 Recon misallocation — $1,247,400 | Used | Yes |
| B2 ACV posting variance — $990,000 | Used | Yes |
| C1 ASC 606 incentive timing — $291,600 | New | **No** |

**$745,776 — 24% of the modelled pool — sits outside what the delivery product addresses.**

Sell the $3.15M and deliver against the used side only, and the first Diagnostic underdelivers against its own headline by a quarter. That is a client relationship ending in month two.

## 2.2 Recommended resolution: commit to used-only

Three options exist. Only one is credible in the near term.

| Option | Assessment |
|---|---|
| Build a new-car module | 6+ months. Different data, different detections, different OEM claim mechanics. Not before revenue. |
| Sell blended, deliver used | Not viable. Structural underdelivery. |
| **Scope everything to used** | **Recommended.** |

### The arithmetic argues for it

Used-only, from existing coefficients, reference case (4,950 used units/year):

| Line | Amount |
|---|---|
| A3 floorplan interest, used portion | $169,250 |
| B1 recon misallocation | $1,247,400 |
| B2 ACV posting variance | $990,000 |
| **Subtotal, calibrated** | **$2,406,650** |
| Warranty capture, CPO reimbursement, arbitration | **Uncalibrated — n=0** |

**$2,406,650 ÷ 4,950 used units = $486 per used unit.**

Against $350 per blended unit. **The used-only story is stronger, not weaker** — a higher per-unit number, a tighter narrative, and one operational domain instead of two.

### What must change if this is adopted

1. Estimator drops `new_units_month`; inputs become used volume only
2. Coefficients A1, A2, C1 retire; A3 recalculates on used inventory only
3. Warranty capture, CPO reimbursement, and arbitration need coefficients — **currently n=0, pure estimate**
4. Headline moves from "$3.171M identified" to "$486 per used unit" — a defensible per-unit figure rather than a group total dependent on assumed mix
5. Category claim narrows: *used vehicle* acquisition cost assurance

### Retire or re-derive the $91.3M

Run-rate EBITDA improvement is roughly $624K/year on the blended model and lower on used-only. Even at 8× that is ~$5.0M. Eight times the full pool is $25.4M. **No path reaches $91.3M.**

It must have a basis — the group's total enterprise value, a multi-year cumulative, something. Until that basis is documented, the figure does not appear in any collateral. It is aimed at the buyer least tolerant of a number he cannot reconstruct, and "how did you get there?" is the first question a dealer principal asks.

**Replacement for the Direct register:** run-rate EBITDA improvement, no multiple attached. Let him apply his own — he knows his franchise's blue sky number precisely, and he will trust arithmetic he performed himself.

---

# PART III — POSITIONING

## 3.1 Category claim

> **Acquisition cost assurance for multi-rooftop dealer groups.**
> *(Pending §7.2 — "assurance" may require replacement.)*

Single-line descriptor everywhere. Never varied. Category ownership comes from repetition.

**Permanently retired:** "sales operations platform," "variance intelligence," "ACV variance platform," and any construction where the noun is *platform*, *intelligence*, *insights*, or *analytics*.

## 3.2 The DMS wedge — canonical, verbatim, everywhere

> CDK, Reynolds, and Tekion are systems of record. They record what you enter, and they record it accurately. What they don't do — what they were never built to do — is form an opinion about whether the number you entered is the right number. Reconditioning cost gets coded to the wrong unit. Transport and PDI land in the wrong period. Internal RO markup inflates cost basis on units that were never retailed. The DMS reports all of it faithfully. Tally CTRL is the layer of assurance that sits over the system of record and asks whether the number is true before it reaches your financial statements — and before you price inventory off it.

Never attack the incumbent. Attacking CDK invites a defence of a contract they signed. Orthogonal positioning makes "we already have Tekion" a non-objection.

## 3.3 Two buyers, two registers

| | **Controller / CFO** | **Dealer Principal** |
|---|---|---|
| Role | Champion | Economic buyer |
| Emotional driver | Being right, and being able to show why | The multiple on exit |
| Register | Institutional — memo from a peer who has done the close | Direct — operator to operator |
| Vocabulary | exposure, materiality, period, basis, schedule, defensible, ASC 606 | EBITDA, run-rate, blue sky, per-store, exit |
| Length | Complete sentences, medium paragraphs | Four sentences is a full email |
| Proof | $486/used unit, recoverable vs. corrected split | Run-rate EBITDA improvement |
| Banned | exclamation points, urgency, "excited," "game-changing" | technical accounting, hedging, any paragraph over three lines |

**Cardone register** is a sub-mode of Direct, authorized at **stage 9 only**, to the principal only, scarcity-based never price-based.

Cardone is native to dealership showrooms and reads as familiar in the front of the house. The controller is the single most Cardone-resistant buyer in the building. Same campaign, two voices, never crossed.

## 3.4 Objection frames — agree, then reframe

**"We already have Tekion."**
> Agreed — and you should. Those systems record the number accurately. My question is narrower: who checks whether the number they're recording is the right number, before it hits the financial statement and before you price inventory off it?

**"Our CPA firm handles this."**
> Agreed, and they'll catch anything material at year-end. This is about the eleven months in between, where recon cost sits in the wrong period and every pricing and trade decision is made off a distorted basis.

**"$30,000 is a lot."**
> Agreed, it's real money. It's also under 1% of what we identified at a comparable group. The fee is fixed before we start — if we find less, you've bought certainty at a known price.

**"We just did an inventory audit."**
> Agreed, and an audit confirms the inventory exists. This is about what it cost. Different question, and the second one is where the gross is hiding.

**"Send me something."**
> A buying signal, not a stall. Send the Snapshot scope in the same reply and propose two specific times in the same sentence. Never send material and wait.

---

# PART IV — THE OFFERING

## 4.1 The ladder

| # | Product | Price | Function | Status |
|---|---|---|---|---|
| 0 | **Variance Pool Estimator** | Free | Demand signal, list build | Spec complete, unbuilt |
| 0b | **VIN Preview** (link teaser) | Free | Mechanism proof, stage-6 payload | Designed, unbuilt |
| 1 | **CTRL Snapshot** | **$1,500 fixed** | Paid qualification | ✅ Confirmed |
| 2 | **CTRL Diagnostic** | **$30,390 fixed** | The finding. One-time. | ✅ Confirmed |
| 3 | **Governance Program** | **UNPRICED** | The VIN Engine, recurring | ⚠ **Gap** |

**Foundation / Control / Command** are service levels *within the Governance Program only*. They are not funnel stages. The prior overlap was a source of confusion in v1.0 collateral.

## 4.2 Pricing doctrine

1. **Fixed fee always.** Never per-rooftop in writing.
2. **Publish the Diagnostic anchor.** An unpublished price makes every conversation start from zero and makes the Snapshot look like a big decision instead of a small one.
3. **Never discount.** Stalled on price → add scope. Subtracting price destroys the ratio argument, which is the strongest asset in the offer.
4. **Founding cohort — 3 positions** — is the only urgency device. Costs no margin.
5. **Never compute the fee from the pool.** Display both; let the ratio fall out as an observation. Deriving fee from pool reintroduces size-scaled pricing through the back door.

## 4.3 Governance Program — proposed anchors

**⚠ PROPOSAL ONLY. Requires JP confirmation before use.**

Against a reference-scale group recovering ~$400–600K annually in collectible cash and correcting $2M+ of gross accuracy, an annual fee at 10–25% of recoverable is defensible:

| Level | Proposed annual | Scope |
|---|---|---|
| **Foundation** | $36,000 | Portal access, monthly close support, findings queue. Up to 5 rooftops. |
| **Control** | $72,000 | Above + quarterly on-site review, recovery filing support, CPA-ready schedules. 6–14 rooftops. |
| **Command** | $144,000 | Above + named analyst, custom detections, board-level reporting. 15+ rooftops. |

Diagnostic fee credits against year one. That is the conversion mechanism — it makes the Diagnostic a deposit rather than a sunk cost, and it is the reason a client says yes to the recurring tier.

---

# PART V — THE ECONOMIC MODEL

## 5.1 Three buckets, never one number

| Bucket | Contents | Collectible? |
|---|---|---|
| **Recoverable cash** | Unclaimed warranty reimbursement, CPO reimbursement, auction arbitration, floorplan curtailment overpayment | **Yes**, subject to lookback windows |
| **Gross accuracy correction** | Internal RO markup, recon to wrong unit, recon post-sale, pack errors, ACV overallowance | **No** — cost incurred either way; per-unit gross becomes true |
| **Period exposure** | Cost incurred in one period, posted in another | **No** — materiality and restatement risk, quantified |

**Language discipline, absolute:** the total is *identified*, never *recovered*. Only bucket one is collectible. Saying "recovered" about the full pool writes a promise the Diagnostic cannot keep and is the fastest way to lose a client in month two.

## 5.2 Why the split is the product

Any lead-gen shop can quote a large blended number. A controller who watches you separate recoverable cash from a timing exposure concludes you have actually done the work. **The distinction is the credibility.** It is also the single most-likely-to-be-lost discipline under sales pressure, because the blended number is bigger.

## 5.3 Coefficient status — honest inventory

| Coefficient set | n | Confidence |
|---|---|---|
| Recon misallocation, ACV variance, floorplan curtailment | 1 | Fitted to one engagement. Reproduces $350/deal to 0.6%. Hypothesis, not benchmark. |
| Warranty capture, CPO reimbursement, arbitration | **0** | **Pure estimate.** No engagement has measured these. |

The second row is the largest analytical risk in the business. Warranty capture is asserted as the biggest recoverable line in used operations, and there is no data behind that claim yet. **The first Diagnostic must measure it explicitly**, whatever else it does.

At n=1 the model is a hypothesis. At n=5 a benchmark. At n=15 a dataset nobody can assemble retroactively — the Ledger goal expressed as a table.

## 5.4 The calibration loop — the actual moat

Every completed Diagnostic writes actuals back to `estimator_calibration`. Coefficients recompute as volume-weighted means. Every Estimator run — converted or not — logs inputs, building a market dataset of dealer volumes, franchise mix, floorplan terms, and recon spend.

Delivery work improves the sales tool. That loop is the only genuinely defensible thing here. Positioning can be copied in an afternoon; the dataset cannot be assembled retroactively at any price.

---

# PART VI — DELIVERY

## 6.1 What each tier produces

**Snapshot — $1,500, 5 business days, no site visit.**
Desk review of 90 days, one rooftop. Written finding: three-bucket quantification, top five findings by amount, one process recommendation. Analyst runs the pipeline offline; deliverable is a PDF. **Recommendation: no portal provisioning at this tier** — the account overhead exceeds the fee.

**Diagnostic — $30,390 fixed.**
Group-level quantification across all rooftops. Deliverable: exposure schedule, ASC 606 position memo distinguishing prior-period error from change in estimate, recovery plan with lookback expiry dates, control gap assessment. Portal access begins here.

> **⚠ Reconcile: positioning set says 30 days. Recent copy says 90 days. One number before either reaches a prospect.**

**Governance Program — annual.**
The VIN Engine running continuously. Monthly submission, real-time detection, period close support, recovery filing, board reporting.

## 6.2 The VIN Engine — architectural essentials

Full schema in the companion document. Three things that matter at doctrine level:

**Everything hangs off two columns.** `cost_line.posted_amount_cents` (what hit the GL) versus `cost_line.cost_basis_cents` (true cost after internal markup is stripped). Every gross-accuracy finding is that difference. Store-level recon economics — internal labor rate vs. actual cost rate, parts markup, pack — are therefore the highest-value onboarding capture, and they vary rooftop to rooftop inside a single group. That variance is itself a finding.

**Period exposure is structural, not detected.** `period_id != incurred_period_id`. Posted here, belongs there. No rule required.

**`recoverable_until` is what makes this a product rather than a report.** A warranty claim with 22 days left behaves differently from one with 300. Findings sort on it ascending, so expiring cash is always the top row.

## 6.3 Portal — 5 tabs

| Tab | Function | Primary user |
|---|---|---|
| **Index** | Groupwide CTRL Index leaderboard, three-bucket totals, cutoff status | CFO, Corporate Controller |
| **Submit** | Upload, validation, per-store completeness, cutoff countdown | Store Office Manager |
| **VIN Ledger** | Sold VIN log, per-unit cost waterfall, assurance score | Both |
| **Findings** | Work queue sorted by expiry, recovery actions, realized vs. identified | Controller, Tally analyst |
| **Close** | Period lock, GAAP classification queue, CPA-ready schedules, sign-off | Corporate Controller |

**Non-negotiable access rule:** `store_user` cannot see the group leaderboard. A ranking visible to the ranked is a political problem inside a dealer group, and the store sitting last will get the tool killed. The Index is a corporate view.

---

# PART VII — GO TO MARKET

## 7.1 Two lanes

| | **Core** | **Soft** |
|---|---|---|
| Geography | NJ, NY, PA, CT, MA, DE, MD | Everywhere else, 8+ rooftops |
| Cadence | 12 stages, 80 days | 6 stages, 55 days |
| Channels | Email, LinkedIn, phone, physical | Email, LinkedIn |
| Intake | 3 / 2 weeks | 2 / 2 weeks |
| Annual | 78 | 52 |

**WIP cap: 24 active accounts, both lanes combined.** Breach → core wave ships, soft wave delays. Never the reverse, never by weakening the research gate.

**Promotion rule:** any soft-lane reply promotes to core immediately, entering at stage 5 with the physical Ledger send. Cast wide cheaply, concentrate hard on responders — the one place Cardone's instinct and the ABM thesis agree.

Geography was never a delivery constraint. The Snapshot is desk review; the Diagnostic deliverable is a schedule and a memo. Proximity buys referral density and affordable mail — precisely what the soft lane forgoes.

## 7.2 Cadence doctrine

**Every touch delivers something new — a fact, an asset, or a number. No touch asks whether they saw the last one.** Twelve "circling back" emails is harassment. Twelve deliveries of distinct value is a case being built.

**No account exits on non-response.** Only explicit opt-out, a stated no from the economic buyer, or a close. Non-response lengthens the interval. Quarterly-forever is a legitimate end state.

**Research gate blocks stage 1.** No verified fact plus source URL, no entry. This is the reason stage 1 gets read and it is the last thing to weaken — especially in soft markets where there is no referral credibility to fall back on.

## 7.3 Free tools — division of labour

| | Estimator | VIN Preview |
|---|---|---|
| Answers | *How much?* | *How?* |
| Level | Group, annual | One unit |
| Mode | **Asserts** a modelled number | **Demonstrates** a mechanism |
| Register | Controller + Principal | Controller only |
| Stage | 1 — entry CTA | 6 — proof, no ask |

The Preview is the stronger controller instrument. For someone whose profession is verifying that numbers are what they claim, watching arithmetic happen beats being told a total.

**Design constraint that governs the Preview:** a controller will not upload a DMS export to an unknown vendor. Sensitive data is the VINs; revealing data is the recon economics. **Your sample VINs, their rates.** All of the aha, none of the exposure.

## 7.4 Infrastructure doctrine

**Never send outbound from `tallyctrl.com`.** Client deliverables, invoices, and `governance@` live there. Cold outbound carries irreducible complaint risk and must be isolated onto a disposable domain.

**One sending domain, not three.** At ~9 emails/day, spreading across three domains means each sends 3/day — too little for providers to build a reputation profile on, and warmup traffic permanently outnumbers real traffic. Concentrate.

**Domain must resolve to a credible entity.** Controllers verify — it is the defining trait of the persona. `tally-assurance.com` works. `variance-ledger.io` signals tech startup. `ctrl-audit.net` is actively dangerous (see §8.2).

**Tracking off entirely.** Open pixels and rewritten links suppress deliverability and are visible to corporate mail gateways. Plain text delivers better *and* reads like a person wrote it. Deliverability best practice and the institutional register point the same direction — rare, and worth taking.

**AI identity:** agent drafts + JP reads full body + JP sends = authorship, no disclosure. Agent replies autonomously = disclosure required. The load-bearing rule is *no batch-approve* — one-click approval across a wave silently converts drafting into conversational mode and the obligation attaches whether the config says so or not.

---

# PART VIII — UNIT ECONOMICS

## 8.1 Cost to acquire

| Line | Annual |
|---|---|
| Sending domain + 2 mailboxes | ~$190 |
| Contact sourcing stack (staff pages, Hunter free, phone) | $0 |
| Physical touch, governed by tier | $3,000–3,500 |
| **Hard-dollar total** | **~$3,700** |

At 2–6 Diagnostic closes per year: **CAC of roughly $600–1,850 in cash** against $30,390 revenue.

Cash CAC is not the constraint. **JP's hours are the constraint**, and no line item captures them. The WIP cap of 24 exists because of that, not because of budget.

## 8.2 Client value

| | One-time | Recurring |
|---|---|---|
| Diagnostic | $30,390 | — |
| Governance (proposed Control) | — | $72,000/yr |
| **3-year value** | | **~$246,000** |

This is the argument for Part I. A pipeline of Diagnostics is a job. A book of Governance accounts is a business, and the Diagnostic is how you buy one.

## 8.3 Target reconciliation

**$20,000 net profit by December 2026.** One Diagnostic close at $30,390 clears it with room, against ~$3,700 of annual hard cost.

The rolling intake model is not required to hit the number. It exists so that missing on the founding 10 does not end the campaign.

---

# PART IX — RISK REGISTER

| # | Risk | Severity | Status |
|---|---|---|---|
| 1 | **Scope contradiction** — Estimator models new+used, VIN Engine delivers used only. 24% of the modelled pool undeliverable. | **Critical** | Open. §2.2 recommends used-only. |
| 2 | **"Assurance" and "audit" are terms of art**, professionally restricted in many states for non-CPA firms. The buyer is the person who knows exactly where the line sits. | **Critical** | Open. Needs counsel. "Verification" or "recovery" carries equal weight with no exposure. One decision also resolves `ctrl-audit.net` and "forensic, audit-grade." |
| 3 | **$91.3M cannot be reconstructed** from any modelling path. | **High** | Open. Document the basis or retire the figure. |
| 4 | **Governance Program unpriced** — the recurring tier that constitutes the business has no number. | **High** | Open. §4.3 proposes anchors. |
| 5 | **Warranty / CPO / arbitration coefficients at n=0** — the largest asserted recoverable line has no data behind it. | **High** | Open. First Diagnostic must measure explicitly. |
| 6 | **Lookback windows** — factory claim and lender adjustment periods expire. Some of bucket one may already be uncollectible. | Medium | Partially handled: `recoverable_until` exists in schema, absent from Estimator. |
| 7 | **30-day vs 90-day Diagnostic** inconsistency across documents. | Medium | Open. Trivial to fix, embarrassing if a prospect catches it. |
| 8 | **Single-operator concentration.** Every layer depends on one person. | Medium | Structural. WIP cap is the mitigation. |
| 9 | **Ledger Vol. 2 gated on print approval** with no decision date. | Low | Mitigated — quarterly tail decoupled onto a digital brief. |
| 10 | **Sending domain sprawl** — three domains, two ESPs, one fallback, ~9 emails/day. | Low | Consolidate to one domain, one provider. |

---

# PART X — NEXT 90 DAYS

Ordered by dependency, not appeal.

**Weeks 1–2 — resolve, don't build.**
Risks 1, 2, 3, 7. Every one is a decision, not a project, and all four contaminate anything built on top of them. Scope call, counsel call on terminology, document or retire $91.3M, pick a Diagnostic duration.

**Weeks 2–3 — ship the cheap proof.**
VIN Preview. A day of work, no dependencies, no print gate, and it is the strongest controller-register asset in the arsenal. Stage-6 payload for the founding wave.

**Weeks 3–4 — infrastructure hygiene.**
Consolidate to one sending domain. Retire `ctrl-audit.net`. Tracking off. Quarterly Variance Brief template — the founding 10 reach day 80 and the tail needs a payload.

**Weeks 4–8 — build the Estimator against the resolved scope.**
Not before week 4. Building it on unresolved scope means rebuilding it.

**Weeks 6–12 — price the Governance Program and build the ladder into the Diagnostic proposal.**
Diagnostic fee credits against Governance year one. That single mechanism converts a one-time engagement into a book of business, and it needs to be in the proposal before the first Diagnostic closes — not bolted on afterward.

---

## Amendment protocol

This document supersedes conflicting statements in any companion document. When a companion document is revised, the change is reflected here or it does not carry. Version and date every change. Decisions move from Part IX to the relevant Part when resolved — the risk register shrinks as the business hardens.
