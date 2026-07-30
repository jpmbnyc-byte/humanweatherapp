/**
 * Publishable client-facing copy only.
 * Do not import internal bible / risk register / unpriced tiers here.
 */

export const CATEGORY_CLAIM =
  "Acquisition cost assurance for multi-rooftop dealer groups.";

export const SITE_H1 = "Your DMS records the cost. It doesn't check it.";

export const SITE_SUBHEAD =
  "Tally CTRL finds the gap between what a used vehicle actually cost to acquire and recondition and what your DMS says it cost — then closes it and installs the controls that keep it closed.";

/** Canonical DMS wedge — reuse verbatim on public surfaces. */
export const DMS_WEDGE =
  "CDK, Reynolds, and Tekion are systems of record. They record what you enter, and they record it accurately. What they don't do — what they were never built to do — is form an opinion about whether the number you entered is the right number. Reconditioning cost gets coded to the wrong unit. Transport and PDI land in the wrong period. Internal RO markup inflates cost basis on units that were never retailed. The DMS reports all of it faithfully. Tally CTRL is the layer of assurance that sits over the system of record and asks whether the number is true before it reaches your financial statements — and before you price inventory off it.";

export const CONTACT_EMAIL = "governance@tallyctrl.com";

/** Confirmed publishable tier anchors (July 2026). */
export const TIER = {
  estimator: { name: "Variance Pool Estimator", priceLabel: "Free" },
  snapshot: {
    name: "CTRL Snapshot",
    priceCents: 150_000,
    priceLabel: "$1,500 fixed",
    delivery: "5 business days, no site visit",
  },
  diagnostic: {
    name: "CTRL Diagnostic",
    priceCents: 3_039_000,
    priceLabel: "$30,390 fixed",
  },
} as const;

export const ESTIMATOR_PRIMARY_CTA = `Request a ${TIER.snapshot.name} — ${TIER.snapshot.priceLabel}, ${TIER.snapshot.delivery}`;
export const ESTIMATOR_SECONDARY_CTA = "Have these figures sent to me";

export const PREVIEW_PRIMARY_CTA = `Request a ${TIER.snapshot.name}`;
export const PREVIEW_SECONDARY_CTA = "Send me these figures";

export const BUCKET_COPY = {
  recoverable_cash: {
    title: "Recoverable cash",
    blurb:
      "Dollars earned and not received, or paid and should not have been — subject to factory and lender lookback windows.",
  },
  gross_accuracy: {
    title: "Gross accuracy correction",
    blurb:
      "Cost was incurred either way. Total group profit does not change. Per-unit gross becomes true — and pricing, trade, and desking stop running off a distorted basis.",
  },
  period_exposure: {
    title: "Period exposure",
    blurb:
      "Cost incurred in one period, posted in another. No cash effect. Materiality and restatement risk, quantified.",
  },
} as const;

/** Retired nouns — keep out of UI. */
export const RETIRED_LANGUAGE = [
  "platform",
  "intelligence",
  "insights",
  "analytics",
  "unlock",
  "game-changing",
] as const;
