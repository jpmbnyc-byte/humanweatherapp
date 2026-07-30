# Tally CTRL — VIN Engine Schema v1.0

**Scope:** Used vehicle cost assurance. Client-facing portal for multi-rooftop dealer groups.
**Dialect:** SQLite (per stack). Portable to Postgres with minimal change.
**Owner:** JP Bobo

---

## 0. Design decisions before the tables

**Used-only changes the leakage mix.** The Estimator model covered new + used, and its two largest recoverable-cash lines — unclaimed OEM incentives and floorplan assistance — are new-vehicle items. On the used side they don't exist. What replaces them:

| Estimator bucket | New-car version | **Used-car version** |
|---|---|---|
| Recoverable cash | Unclaimed OEM incentives, floorplan assistance | **Unclaimed warranty reimbursement on in-warranty recon**, unclaimed CPO certification reimbursement, unpursued auction arbitration credits, floorplan curtailment overpayment |
| Gross accuracy | — | **Internal RO markup**, recon posted to wrong unit, recon posted post-sale, pack errors, ACV overallowance |
| Period exposure | ASC 606 incentive timing | Cost incurred in one period posted in the next; late-arriving recon |

**The single biggest recoverable-cash line in used ops is warranty capture.** Reconditioning performed on a unit still under factory warranty, billed to used inventory instead of submitted as a warranty claim. It is real cash, it is common, and it expires. The schema treats it as a first-class detection.

**The core mechanism is `posted_amount_cents` vs `cost_basis_cents`.** Every cost line carries both: what hit the GL, and what it actually cost after internal markup is stripped. Every gross-accuracy finding falls out of the difference. This is the one design choice everything else depends on.

**Materiality is configurable per group, not global.** GAAP materiality is a judgment, and it's the judgment the client is buying. Hard-coding a threshold gives that away.

---

## 1. Organization

```sql
CREATE TABLE dealer_group (
  id                      INTEGER PRIMARY KEY,
  name                    TEXT NOT NULL,
  slug                    TEXT NOT NULL UNIQUE,
  engagement_tier         TEXT CHECK (engagement_tier IN ('snapshot','diagnostic','governance')),
  -- materiality is the client's judgment, held as config
  materiality_basis       TEXT NOT NULL DEFAULT 'per_unit_gross',
  materiality_cents       INTEGER NOT NULL DEFAULT 25000,   -- $250/unit
  aggregate_materiality_cents INTEGER,                      -- period-level rollup threshold
  calc_version            TEXT NOT NULL,
  created_at              TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE store (
  id                      INTEGER PRIMARY KEY,
  group_id                INTEGER NOT NULL REFERENCES dealer_group(id),
  name                    TEXT NOT NULL,
  store_code              TEXT NOT NULL,        -- the group's own company number
  dms_platform            TEXT CHECK (dms_platform IN
                            ('cdk','reynolds','tekion','dealertrack','automate','other')),
  dms_company_id          TEXT,
  franchise               TEXT,
  -- recon economics: the markup-strip parameters
  internal_labor_rate_cents INTEGER,            -- what recon labor is BILLED at
  labor_cost_rate_cents     INTEGER,            -- what it actually COSTS
  parts_markup_pct          REAL DEFAULT 0.0,   -- e.g. 0.40 = parts billed at cost × 1.40
  sublet_markup_pct         REAL DEFAULT 0.0,
  pack_amount_cents         INTEGER DEFAULT 0,
  floorplan_rate_bps        INTEGER,            -- 750 = 7.50%
  curtailment_days          INTEGER DEFAULT 90,
  active                    INTEGER NOT NULL DEFAULT 1,
  UNIQUE (group_id, store_code)
);
```

`internal_labor_rate_cents` vs `labor_cost_rate_cents` is the internal-RO-markup detector. Capture it at onboarding per rooftop — it varies by store even inside one group, and that variance is itself a finding.

---

## 2. Period and cutoff

```sql
CREATE TABLE period (
  id                      INTEGER PRIMARY KEY,
  group_id                INTEGER NOT NULL REFERENCES dealer_group(id),
  year                    INTEGER NOT NULL,
  month                   INTEGER NOT NULL,
  accounting_close_date   TEXT NOT NULL,   -- when the group's DMS closes the month
  submission_opens_at     TEXT NOT NULL,
  submission_cutoff_at    TEXT NOT NULL,   -- hard stop for on-time data
  grace_until_at          TEXT,            -- late window: accepted, flagged, reclassified
  status                  TEXT NOT NULL DEFAULT 'open' CHECK (status IN
                            ('open','cutoff_pending','locked','reconciled','published')),
  locked_at TEXT, locked_by TEXT,
  reconciled_at TEXT, published_at TEXT,
  UNIQUE (group_id, year, month)
);

CREATE TABLE store_period_status (
  id                      INTEGER PRIMARY KEY,
  period_id               INTEGER NOT NULL REFERENCES period(id),
  store_id                INTEGER NOT NULL REFERENCES store(id),
  expected_units          INTEGER,          -- from prior-period run rate
  submitted_units         INTEGER NOT NULL DEFAULT 0,
  first_submission_at     TEXT,
  last_submission_at      TEXT,
  submitted_on_time       INTEGER,
  completeness_pct        REAL,
  signed_off_at TEXT, signed_off_by TEXT,
  UNIQUE (period_id, store_id)
);
```

### Status lifecycle

```
open              submission_opens_at reached; accepting freely
  ↓               T-72h before cutoff
cutoff_pending    countdown visible in portal; nag to incomplete stores
  ↓               submission_cutoff_at
locked            on-time window closed. Late rows still accepted but
                  flagged is_late and routed through GAAP classification
  ↓               analyst review complete
reconciled        findings finalized, index computed
  ↓               client sign-off
published         immutable. Amendments create a next-period adjustment.
```

**The GAAP hook.** A cost line arriving after `locked` is not simply "late data" — it has to be classified. The engine evaluates each late line and assigns `gaap_treatment`:

| Condition | Treatment |
|---|---|
| Cost existed and was knowable before close; omitted in error | `prior_period_error` — restatement candidate |
| Cost estimate revised on new information | `change_in_estimate` — prospective, current period |
| Amount below `materiality_cents` | `immaterial_reclass` — tracked, not restated |

This is the distinction the client is paying for. Making it a computed field rather than a footnote is the product.

---

## 3. Submission

```sql
CREATE TABLE submission_batch (
  id                INTEGER PRIMARY KEY,
  group_id          INTEGER NOT NULL REFERENCES dealer_group(id),
  store_id          INTEGER REFERENCES store(id),
  period_id         INTEGER NOT NULL REFERENCES period(id),
  source            TEXT NOT NULL CHECK (source IN
                      ('csv_upload','dms_export','sftp','api','manual_entry')),
  filename          TEXT,
  file_hash         TEXT,          -- SHA-256; idempotency key
  row_count         INTEGER,
  accepted_count    INTEGER DEFAULT 0,
  rejected_count    INTEGER DEFAULT 0,
  warned_count      INTEGER DEFAULT 0,
  status            TEXT NOT NULL DEFAULT 'received' CHECK (status IN
                      ('received','validating','partial','accepted','rejected','superseded')),
  is_late           INTEGER NOT NULL DEFAULT 0,
  submitted_by      TEXT,
  submitted_at      TEXT NOT NULL DEFAULT (datetime('now')),
  processed_at      TEXT,
  UNIQUE (group_id, file_hash)      -- re-uploading the same file is a no-op
);

CREATE TABLE submission_row_error (
  id            INTEGER PRIMARY KEY,
  batch_id      INTEGER NOT NULL REFERENCES submission_batch(id),
  row_number    INTEGER,
  vin           TEXT,
  column_name   TEXT,
  severity      TEXT NOT NULL CHECK (severity IN ('reject','warn')),
  code          TEXT NOT NULL,
  message       TEXT NOT NULL,
  raw_value     TEXT
);
```

### Live protocol

Three intake paths, one pipeline:

| Path | Use | Latency |
|---|---|---|
| **CSV upload** | Office manager, ad hoc | Immediate, synchronous validation |
| **SFTP drop** | Scheduled DMS export, nightly | Polled every 15 min |
| **API POST** | Integrated groups | Immediate, returns batch id |

**Validation is two-tier and this matters operationally.** `reject` rows never enter the ledger — bad VIN check digit, missing sale date, unparseable amount. `warn` rows enter but are scored down — missing recon detail, ACV absent, mileage out of range. A store that fixes rejects but ignores warnings still shows in the index, which is the point.

**Idempotency:** `UNIQUE (group_id, file_hash)`. Re-uploading the same export — which office managers do constantly — is silently a no-op rather than a duplicate.

**Corrections:** never mutate. A corrected batch supersedes the prior one (`status='superseded'`), and both remain in the audit trail.

**Required columns (minimum viable submission):**

```
vin, stock_number, store_code, sold_date, sale_price,
acquisition_cost, acquisition_channel, dms_total_cost
```

**Strongly recommended (absence generates warnings, not rejects):**

```
acquired_date, trade_acv, trade_allowance, recon_total, recon_ro_numbers,
transport_cost, pack_applied, is_cpo, mileage_in, mileage_out,
frontline_ready_date, gl_post_date
```

---

## 4. Vehicle, sale, cost lines

```sql
CREATE TABLE vehicle (
  id                    INTEGER PRIMARY KEY,
  group_id              INTEGER NOT NULL REFERENCES dealer_group(id),
  store_id              INTEGER NOT NULL REFERENCES store(id),
  vin                   TEXT NOT NULL,
  stock_number          TEXT,
  year INTEGER, make TEXT, model TEXT, trim TEXT,
  mileage_in INTEGER, mileage_out INTEGER,
  acquisition_channel   TEXT CHECK (acquisition_channel IN
                          ('trade','auction','street_purchase','lease_return',
                           'dealer_trade','fleet','other')),
  acquired_at           TEXT,
  frontline_ready_at    TEXT,
  is_cpo                INTEGER NOT NULL DEFAULT 0,
  cpo_certified_at      TEXT,
  in_factory_warranty   INTEGER,          -- drives warranty-capture detection
  warranty_expires_at   TEXT,
  UNIQUE (group_id, vin, stock_number)    -- same VIN can recur on buyback
);
CREATE INDEX idx_vehicle_vin ON vehicle(group_id, vin);

CREATE TABLE sale (
  id                      INTEGER PRIMARY KEY,
  vehicle_id              INTEGER NOT NULL REFERENCES vehicle(id),
  period_id               INTEGER NOT NULL REFERENCES period(id),
  batch_id                INTEGER REFERENCES submission_batch(id),
  deal_number             TEXT,
  sold_at                 TEXT NOT NULL,
  delivered_at            TEXT,
  gl_posted_at            TEXT,
  channel                 TEXT CHECK (channel IN
                            ('retail','wholesale','auction','dealer_trade','internal')),
  sale_price_cents        INTEGER NOT NULL,
  trade_allowance_cents   INTEGER DEFAULT 0,
  trade_acv_cents         INTEGER DEFAULT 0,
  -- as reported by the DMS
  dms_total_cost_cents    INTEGER NOT NULL,
  dms_front_gross_cents   INTEGER,
  -- computed by the engine
  true_cost_cents         INTEGER,
  true_front_gross_cents  INTEGER,
  cost_variance_cents     INTEGER,
  days_in_inventory       INTEGER,
  days_to_frontline       INTEGER,
  floorplan_carry_cents   INTEGER,
  assurance_score         REAL,           -- 0-100, per unit
  calc_version            TEXT,
  calculated_at           TEXT
);
CREATE INDEX idx_sale_period ON sale(period_id);

CREATE TABLE cost_line (
  id                  INTEGER PRIMARY KEY,
  vehicle_id          INTEGER NOT NULL REFERENCES vehicle(id),
  batch_id            INTEGER REFERENCES submission_batch(id),
  category            TEXT NOT NULL CHECK (category IN (
                        'acquisition','transport_in','recon_parts','recon_labor',
                        'recon_sublet','certification','detail','pack',
                        'floorplan_interest','title_fees','auction_fee',
                        'arbitration_credit','warranty_credit','other')),
  description         TEXT,
  ro_number           TEXT,
  gl_account          TEXT,
  posted_amount_cents INTEGER NOT NULL,   -- what hit the GL
  cost_basis_cents    INTEGER,            -- true cost after markup strip
  posted_at           TEXT NOT NULL,      -- GL posting date
  incurred_at         TEXT,               -- when the work happened
  period_id           INTEGER REFERENCES period(id),   -- period it was posted to
  incurred_period_id  INTEGER REFERENCES period(id),   -- period it belongs to
  is_internal         INTEGER NOT NULL DEFAULT 0,
  warranty_eligible   INTEGER,
  warranty_claimed    INTEGER,
  gaap_treatment      TEXT,
  created_at          TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_cost_vehicle ON cost_line(vehicle_id);
```

`period_id != incurred_period_id` **is** the period-exposure finding. It doesn't need to be detected separately; it's structural.

---

## 5. Findings

```sql
CREATE TABLE finding_type (
  code              TEXT PRIMARY KEY,
  label             TEXT NOT NULL,
  bucket            TEXT NOT NULL CHECK (bucket IN
                      ('recoverable_cash','gross_accuracy','period_exposure')),
  default_gaap      TEXT,
  lookback_days     INTEGER,       -- NULL = no expiry
  index_component   TEXT,          -- which score this degrades
  active            INTEGER DEFAULT 1
);
```

### Seed taxonomy

| Code | Bucket | Detection | Lookback |
|---|---|---|---|
| `WARRANTY_UNCLAIMED` | recoverable_cash | `warranty_eligible=1 AND warranty_claimed=0` on a unit `in_factory_warranty=1` | ~365d, OEM-specific |
| `CPO_REIMB_UNCLAIMED` | recoverable_cash | `is_cpo=1` with no `certification` credit line | ~180d |
| `ARBITRATION_UNPURSUED` | recoverable_cash | auction-sourced unit, recon > 2× store median within 14d of acquisition, no `arbitration_credit` | ~30d |
| `FLOORPLAN_CURTAIL` | recoverable_cash | `days_in_inventory > curtailment_days` with no interest adjustment | ~90d |
| `INTERNAL_RO_MARKUP` | gross_accuracy | `posted_amount_cents > cost_basis_cents` on internal recon | — |
| `RECON_WRONG_UNIT` | gross_accuracy | RO number appears against >1 stock number | — |
| `RECON_POST_SALE` | gross_accuracy | `cost_line.posted_at > sale.gl_posted_at` | — |
| `PACK_DOUBLE` | gross_accuracy | >1 `pack` line, or pack ≠ `store.pack_amount_cents` | — |
| `PACK_MISSING` | gross_accuracy | retail sale, no pack line, store pack > 0 | — |
| `ACV_OVERALLOWANCE` | gross_accuracy | `trade_allowance − trade_acv > materiality` | — |
| `TRANSPORT_UNALLOCATED` | gross_accuracy | non-local acquisition, no transport line | — |
| `WHOLESALE_LOSS_MISPOSTED` | gross_accuracy | wholesale channel, loss not to designated GL | — |
| `COST_WRONG_PERIOD` | period_exposure | `period_id != incurred_period_id` | — |
| `LATE_ARRIVAL_ADJ` | period_exposure | cost line on a `locked` period | — |

```sql
CREATE TABLE finding (
  id                  INTEGER PRIMARY KEY,
  group_id            INTEGER NOT NULL REFERENCES dealer_group(id),
  store_id            INTEGER NOT NULL REFERENCES store(id),
  vehicle_id          INTEGER REFERENCES vehicle(id),
  sale_id             INTEGER REFERENCES sale(id),
  cost_line_id        INTEGER REFERENCES cost_line(id),
  period_id           INTEGER NOT NULL REFERENCES period(id),
  type_code           TEXT NOT NULL REFERENCES finding_type(code),
  amount_cents        INTEGER NOT NULL,
  confidence          REAL,             -- 0-1 from the rule
  is_material         INTEGER,          -- vs group materiality
  gaap_treatment      TEXT,
  recoverable_until   TEXT,             -- lookback expiry; drives urgency
  status              TEXT NOT NULL DEFAULT 'open' CHECK (status IN
                        ('open','under_review','confirmed','disputed',
                         'actioned','recovered','waived','expired')),
  detected_at         TEXT NOT NULL DEFAULT (datetime('now')),
  resolved_at TEXT, resolved_by TEXT, note TEXT
);
CREATE INDEX idx_finding_open ON finding(group_id, status, recoverable_until);

CREATE TABLE recovery_action (
  id                    INTEGER PRIMARY KEY,
  finding_id            INTEGER NOT NULL REFERENCES finding(id),
  action_type           TEXT CHECK (action_type IN
                          ('warranty_claim','cpo_claim','arbitration',
                           'lender_adjustment','journal_entry','process_change')),
  reference             TEXT,           -- claim no. / JE no.
  amount_cents          INTEGER,
  submitted_at          TEXT,
  settled_at            TEXT,
  settled_amount_cents  INTEGER,
  status                TEXT
);
```

`recoverable_until` is the field that turns findings into urgency. A `WARRANTY_UNCLAIMED` finding with 22 days left is a different object than one with 300, and the portal should sort on it.

---

## 6. Group index

```sql
CREATE TABLE index_weight (
  group_id    INTEGER REFERENCES dealer_group(id),
  component   TEXT NOT NULL,
  weight      REAL NOT NULL,
  PRIMARY KEY (group_id, component)
);
-- defaults
-- cost_accuracy 0.30 | recon_timeliness 0.20 | warranty_capture 0.20
-- cpo_capture 0.10   | acv_discipline 0.10   | submission_compliance 0.10

CREATE TABLE store_index_snapshot (
  id                          INTEGER PRIMARY KEY,
  period_id                   INTEGER NOT NULL REFERENCES period(id),
  store_id                    INTEGER NOT NULL REFERENCES store(id),
  units_sold                  INTEGER,
  cost_accuracy_score         REAL,
  recon_timeliness_score      REAL,
  warranty_capture_score      REAL,
  cpo_capture_score           REAL,
  acv_discipline_score        REAL,
  submission_compliance_score REAL,
  ctrl_index                  REAL,      -- weighted composite, 0-100
  rank_in_group               INTEGER,
  percentile_vs_prior         REAL,
  variance_per_unit_cents     INTEGER,
  recoverable_cents           INTEGER,
  gross_accuracy_cents        INTEGER,
  period_exposure_cents       INTEGER,
  computed_at                 TEXT,
  UNIQUE (period_id, store_id)
);
```

### Component definitions

| Component | Formula |
|---|---|
| `cost_accuracy` | % of units with `ABS(cost_variance) < materiality_cents` |
| `recon_timeliness` | % of recon lines with `posted_at <= sale.gl_posted_at` |
| `warranty_capture` | claimed ÷ eligible, on in-warranty units |
| `cpo_capture` | CPO units with reimbursement ÷ total CPO units |
| `acv_discipline` | % of trades where `allowance − acv <= materiality` |
| `submission_compliance` | on-time × completeness |

**CTRL Index** = Σ(component × weight), 0–100.

**Normalize before ranking.** A 40-unit satellite store and a 300-unit flagship are not comparable on raw dollars. Rank on index and on variance-per-unit; show gross dollars separately so the CFO can still see where the money is.

---

## 7. Calculation pipeline

Runs on every accepted batch, and nightly across the open period.

```
1  INGEST      rows → vehicle, sale, cost_line
2  STRIP       cost_basis_cents = markup removed:
                 recon_parts  → posted / (1 + parts_markup_pct)
                 recon_labor  → posted × (labor_cost_rate / internal_labor_rate)
                 recon_sublet → posted / (1 + sublet_markup_pct)
                 all others   → posted
3  COMPUTE     true_cost   = Σ cost_basis WHERE category NOT IN
                             ('arbitration_credit','warranty_credit')
                             − Σ credits
               cost_variance = dms_total_cost − true_cost
               true_front_gross = sale_price − true_cost
               floorplan_carry  = acquisition × (rate_bps/10000) × days_in_inv/365
4  DETECT      run finding rules → finding rows
5  CLASSIFY    is_material vs group threshold; gaap_treatment; recoverable_until
6  SCORE       per-unit assurance_score
7  ROLL UP     store_index_snapshot, rank within group
```

### Per-unit assurance score

Start at 100, deduct:

| Condition | Deduction |
|---|---|
| Material cost variance present | −30 |
| Warranty-eligible recon unclaimed | −25 |
| Recon posted after sale close | −20 |
| ACV overallowance beyond materiality | −15 |
| Pack error | −10 |
| Submitted with warnings / incomplete | −10 |

Floor at 0. This is the "quality of sold transactions" measure — it makes an individual deal inspectable, not just the aggregate.

---

## 8. Portal — 5 tabs

### 1 · INDEX
Groupwide macro. CTRL Index leaderboard across rooftops, current period status banner with cutoff countdown, three-bucket totals (recoverable / gross accuracy / period exposure), 12-month index trend, biggest movers. Landing tab for the CFO and Corporate Controller.

### 2 · SUBMIT
Drag-drop CSV, SFTP status, batch history. Live validation results with reject/warn split at row level. Per-store completeness grid for the open period. Cutoff countdown, prominent. Landing tab for the store Office Manager.

### 3 · VIN LEDGER
The log of uploaded sold VINs. Searchable and filterable by store, period, channel, score, variance. Per-row: VIN, stock, sold date, DMS cost, true cost, variance, assurance score. Row expands to the full cost-line waterfall showing exactly where posted and true diverge. Exportable.

### 4 · FINDINGS
The work queue. Grouped by bucket, sorted by `recoverable_until` ascending so expiring cash surfaces first. Status workflow, recovery actions, claim references, settled amounts. Shows realized recovery against identified — the number that justifies renewal.

### 5 · CLOSE
Period cutoff management. Per-store sign-off, prior-period-error vs change-in-estimate classification queue, exportable schedules (the deliverable the controller hands their CPA), lock and publish. Immutable once published.

**Deliberately excluded to hold at five:** settings and store configuration (modal off Index), user management (account menu), notification preferences (account menu), the Estimator (public site, pre-sale). Reporting and export live inside Ledger and Close rather than as a sixth tab.

---

## 9. Access control

```sql
CREATE TABLE portal_user (
  id            INTEGER PRIMARY KEY,
  group_id      INTEGER NOT NULL REFERENCES dealer_group(id),
  store_id      INTEGER REFERENCES store(id),   -- NULL = group-wide
  email         TEXT NOT NULL UNIQUE,
  display_name  TEXT,
  role          TEXT NOT NULL CHECK (role IN
                  ('group_admin','group_read','store_user','tally_analyst')),
  last_seen_at  TEXT,
  active        INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE audit_log (
  id          INTEGER PRIMARY KEY,
  group_id    INTEGER NOT NULL,
  actor       TEXT NOT NULL,
  action      TEXT NOT NULL,
  entity      TEXT NOT NULL,
  entity_id   INTEGER,
  before_json TEXT,
  after_json  TEXT,
  at          TEXT NOT NULL DEFAULT (datetime('now'))
);
```

| Role | Sees |
|---|---|
| `group_admin` | Everything, all stores. Signs off periods. CFO / Corporate Controller. |
| `group_read` | All stores, read-only. Dealer Principal. |
| `store_user` | Own store only. Cannot see the group leaderboard. Office Manager. |
| `tally_analyst` | All groups. Confirms findings, sets GAAP treatment. |

**Store users must not see cross-store rankings.** A leaderboard visible to the ranked is a political problem inside a dealer group, and it will get the tool banned by whichever store sits last. The Index is a corporate view.

`audit_log` is not optional. The client's own auditors will ask who changed what.

---

## 10. Open questions before build

1. **Materiality default.** $250/unit is a placeholder. Real groups set this against total used gross, not per unit — confirm the basis with the first client rather than guessing.
2. **Warranty eligibility determination.** Detecting that recon *was* eligible requires in-service date and OEM warranty terms per VIN. Decode from VIN plus a warranty terms table, or require it on submission? Decode is better UX and more build.
3. **DMS export formats.** CDK, Reynolds, and Tekion each export differently, and column mapping per platform is real work. Recommend starting with one platform for the founding client rather than building three mappers up front.
4. **Does the Snapshot use this?** At $1,500 for a 90-day single-rooftop desk review, running it through the portal may be over-build. Snapshot may be better served by the analyst running the pipeline offline and delivering a PDF, with portal access starting at Diagnostic.
5. **Ledger write-back.** Anonymized findings from this engine should feed `estimator_calibration` from the Estimator spec. That closes the loop: delivery work improves the sales tool. Define the anonymization rule before the first client, not after.
