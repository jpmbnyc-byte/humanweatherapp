-- Tally CTRL — VIN Engine Schema v1.0 (production)
-- Dialect: SQLite. Portable to Postgres with minimal change.
-- Source of truth: vin-engine-schema.md §§1–9
-- Preview extension: preview_token (Stage-6 teaser; not part of the live portal)

PRAGMA foreign_keys = ON;

-- ═══════════════════════════════════════════════════════════
-- 1. Organization
-- ═══════════════════════════════════════════════════════════

CREATE TABLE dealer_group (
  id                          INTEGER PRIMARY KEY,
  name                        TEXT NOT NULL,
  slug                        TEXT NOT NULL UNIQUE,
  engagement_tier             TEXT CHECK (engagement_tier IN ('snapshot','diagnostic','governance')),
  materiality_basis           TEXT NOT NULL DEFAULT 'per_unit_gross',
  materiality_cents           INTEGER NOT NULL DEFAULT 25000,
  aggregate_materiality_cents INTEGER,
  calc_version                TEXT NOT NULL,
  created_at                  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE store (
  id                        INTEGER PRIMARY KEY,
  group_id                  INTEGER NOT NULL REFERENCES dealer_group(id),
  name                      TEXT NOT NULL,
  store_code                TEXT NOT NULL,
  dms_platform              TEXT CHECK (dms_platform IN
                              ('cdk','reynolds','tekion','dealertrack','automate','other')),
  dms_company_id            TEXT,
  franchise                 TEXT,
  internal_labor_rate_cents INTEGER,
  labor_cost_rate_cents     INTEGER,
  parts_markup_pct          REAL DEFAULT 0.0,
  sublet_markup_pct         REAL DEFAULT 0.0,
  pack_amount_cents         INTEGER DEFAULT 0,
  floorplan_rate_bps        INTEGER,
  curtailment_days          INTEGER DEFAULT 90,
  active                    INTEGER NOT NULL DEFAULT 1,
  UNIQUE (group_id, store_code)
);

-- ═══════════════════════════════════════════════════════════
-- 2. Period and cutoff
-- ═══════════════════════════════════════════════════════════

CREATE TABLE period (
  id                    INTEGER PRIMARY KEY,
  group_id              INTEGER NOT NULL REFERENCES dealer_group(id),
  year                  INTEGER NOT NULL,
  month                 INTEGER NOT NULL,
  accounting_close_date TEXT NOT NULL,
  submission_opens_at   TEXT NOT NULL,
  submission_cutoff_at  TEXT NOT NULL,
  grace_until_at        TEXT,
  status                TEXT NOT NULL DEFAULT 'open' CHECK (status IN
                          ('open','cutoff_pending','locked','reconciled','published')),
  locked_at TEXT, locked_by TEXT,
  reconciled_at TEXT, published_at TEXT,
  UNIQUE (group_id, year, month)
);

CREATE TABLE store_period_status (
  id                INTEGER PRIMARY KEY,
  period_id         INTEGER NOT NULL REFERENCES period(id),
  store_id          INTEGER NOT NULL REFERENCES store(id),
  expected_units    INTEGER,
  submitted_units   INTEGER NOT NULL DEFAULT 0,
  first_submission_at TEXT,
  last_submission_at  TEXT,
  submitted_on_time INTEGER,
  completeness_pct  REAL,
  signed_off_at TEXT, signed_off_by TEXT,
  UNIQUE (period_id, store_id)
);

-- ═══════════════════════════════════════════════════════════
-- 3. Submission
-- ═══════════════════════════════════════════════════════════

CREATE TABLE submission_batch (
  id              INTEGER PRIMARY KEY,
  group_id        INTEGER NOT NULL REFERENCES dealer_group(id),
  store_id        INTEGER REFERENCES store(id),
  period_id       INTEGER NOT NULL REFERENCES period(id),
  source          TEXT NOT NULL CHECK (source IN
                    ('csv_upload','dms_export','sftp','api','manual_entry')),
  filename        TEXT,
  file_hash       TEXT,
  row_count       INTEGER,
  accepted_count  INTEGER DEFAULT 0,
  rejected_count  INTEGER DEFAULT 0,
  warned_count    INTEGER DEFAULT 0,
  status          TEXT NOT NULL DEFAULT 'received' CHECK (status IN
                    ('received','validating','partial','accepted','rejected','superseded')),
  is_late         INTEGER NOT NULL DEFAULT 0,
  submitted_by    TEXT,
  submitted_at    TEXT NOT NULL DEFAULT (datetime('now')),
  processed_at    TEXT,
  UNIQUE (group_id, file_hash)
);

CREATE TABLE submission_row_error (
  id          INTEGER PRIMARY KEY,
  batch_id    INTEGER NOT NULL REFERENCES submission_batch(id),
  row_number  INTEGER,
  vin         TEXT,
  column_name TEXT,
  severity    TEXT NOT NULL CHECK (severity IN ('reject','warn')),
  code        TEXT NOT NULL,
  message     TEXT NOT NULL,
  raw_value   TEXT
);

-- ═══════════════════════════════════════════════════════════
-- 4. Vehicle, sale, cost lines
-- ═══════════════════════════════════════════════════════════

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
  in_factory_warranty   INTEGER,
  warranty_expires_at   TEXT,
  UNIQUE (group_id, vin, stock_number)
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
  dms_total_cost_cents    INTEGER NOT NULL,
  dms_front_gross_cents   INTEGER,
  true_cost_cents         INTEGER,
  true_front_gross_cents  INTEGER,
  cost_variance_cents     INTEGER,
  days_in_inventory       INTEGER,
  days_to_frontline       INTEGER,
  floorplan_carry_cents   INTEGER,
  assurance_score         REAL,
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
  posted_amount_cents INTEGER NOT NULL,
  cost_basis_cents    INTEGER,
  posted_at           TEXT NOT NULL,
  incurred_at         TEXT,
  period_id           INTEGER REFERENCES period(id),
  incurred_period_id  INTEGER REFERENCES period(id),
  is_internal         INTEGER NOT NULL DEFAULT 0,
  warranty_eligible   INTEGER,
  warranty_claimed    INTEGER,
  gaap_treatment      TEXT,
  created_at          TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_cost_vehicle ON cost_line(vehicle_id);

-- ═══════════════════════════════════════════════════════════
-- 5. Findings
-- ═══════════════════════════════════════════════════════════

CREATE TABLE finding_type (
  code              TEXT PRIMARY KEY,
  label             TEXT NOT NULL,
  bucket            TEXT NOT NULL CHECK (bucket IN
                      ('recoverable_cash','gross_accuracy','period_exposure')),
  default_gaap      TEXT,
  lookback_days     INTEGER,
  index_component   TEXT,
  active            INTEGER DEFAULT 1
);

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
  confidence          REAL,
  is_material         INTEGER,
  gaap_treatment      TEXT,
  recoverable_until   TEXT,
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
  reference             TEXT,
  amount_cents          INTEGER,
  submitted_at          TEXT,
  settled_at            TEXT,
  settled_amount_cents  INTEGER,
  status                TEXT
);

-- ═══════════════════════════════════════════════════════════
-- 6. Group index
-- ═══════════════════════════════════════════════════════════

CREATE TABLE index_weight (
  group_id    INTEGER REFERENCES dealer_group(id),
  component   TEXT NOT NULL,
  weight      REAL NOT NULL,
  PRIMARY KEY (group_id, component)
);

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
  ctrl_index                  REAL,
  rank_in_group               INTEGER,
  percentile_vs_prior         REAL,
  variance_per_unit_cents     INTEGER,
  recoverable_cents           INTEGER,
  gross_accuracy_cents        INTEGER,
  period_exposure_cents       INTEGER,
  computed_at                 TEXT,
  UNIQUE (period_id, store_id)
);

-- ═══════════════════════════════════════════════════════════
-- 9. Access control
-- ═══════════════════════════════════════════════════════════

CREATE TABLE portal_user (
  id            INTEGER PRIMARY KEY,
  group_id      INTEGER NOT NULL REFERENCES dealer_group(id),
  store_id      INTEGER REFERENCES store(id),
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

-- Finding taxonomy seed
INSERT INTO finding_type (code, label, bucket, lookback_days, index_component) VALUES
  ('WARRANTY_UNCLAIMED',    'Unclaimed warranty reimbursement',     'recoverable_cash', 365, 'warranty_capture'),
  ('CPO_REIMB_UNCLAIMED',   'Unclaimed CPO certification credit',   'recoverable_cash', 180, 'cpo_capture'),
  ('ARBITRATION_UNPURSUED', 'Unpursued auction arbitration',        'recoverable_cash',  30, NULL),
  ('FLOORPLAN_CURTAIL',     'Floorplan curtailment overpayment',    'recoverable_cash',  90, NULL),
  ('INTERNAL_RO_MARKUP',    'Internal RO markup in cost basis',     'gross_accuracy',   NULL, 'cost_accuracy'),
  ('RECON_WRONG_UNIT',      'Recon posted to wrong unit',           'gross_accuracy',   NULL, 'cost_accuracy'),
  ('RECON_POST_SALE',       'Recon posted after sale close',        'gross_accuracy',   NULL, 'recon_timeliness'),
  ('PACK_DOUBLE',           'Pack applied more than once',          'gross_accuracy',   NULL, 'cost_accuracy'),
  ('PACK_MISSING',          'Pack missing on retail sale',          'gross_accuracy',   NULL, 'cost_accuracy'),
  ('ACV_OVERALLOWANCE',     'ACV overallowance beyond materiality', 'gross_accuracy',   NULL, 'acv_discipline'),
  ('TRANSPORT_UNALLOCATED', 'Transport unallocated',                'gross_accuracy',   NULL, 'cost_accuracy'),
  ('WHOLESALE_LOSS_MISPOSTED','Wholesale loss misposted',           'gross_accuracy',   NULL, 'cost_accuracy'),
  ('COST_WRONG_PERIOD',     'Cost posted to wrong period',          'period_exposure',  NULL, NULL),
  ('LATE_ARRIVAL_ADJ',      'Late-arriving cost after lock',        'period_exposure',  NULL, 'submission_compliance');

-- ═══════════════════════════════════════════════════════════
-- Preview extension (Stage-6 teaser — not a portal tab)
-- ═══════════════════════════════════════════════════════════

CREATE TABLE preview_token (
  token                   TEXT PRIMARY KEY,
  prospect_name           TEXT NOT NULL,
  franchise               TEXT,
  sample_vehicle_key      TEXT,
  default_labor_rate_cents INTEGER,
  default_cost_rate_cents  INTEGER,
  default_parts_markup_pct REAL,
  default_pack_cents       INTEGER,
  sample_unit_count        INTEGER NOT NULL DEFAULT 200,
  created_at               TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at               TEXT NOT NULL,
  first_opened_at          TEXT,
  last_opened_at           TEXT,
  open_count               INTEGER NOT NULL DEFAULT 0,
  email_captured           TEXT,
  gemini_seed_json         TEXT,
  active                   INTEGER NOT NULL DEFAULT 1
);
CREATE INDEX idx_preview_expires ON preview_token(expires_at);
