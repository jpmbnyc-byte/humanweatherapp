import { Link } from "react-router-dom";
import { SiteChrome } from "@/components/layout/SiteChrome";
import {
  DMS_WEDGE,
  SITE_H1,
  SITE_SUBHEAD,
  TIER,
} from "@/config/positioning";

export function LandingPage() {
  return (
    <SiteChrome active="home">
      <section className="mt-14 max-w-3xl">
        <h1 className="font-display text-4xl leading-tight md:text-5xl">
          {SITE_H1}
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-[var(--tc-ink-muted)]">
          {SITE_SUBHEAD}
        </p>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Link
            to="/estimate"
            className="inline-flex items-center justify-center rounded-md bg-[var(--tc-accent-deep)] px-6 py-3 text-sm font-semibold text-[var(--tc-paper)] transition hover:bg-[var(--tc-accent)]"
          >
            Estimate your variance pool — 90 seconds
          </Link>
          <Link
            to="/p/demo-faulkner"
            className="inline-flex items-center justify-center rounded-md border border-[var(--tc-line)] bg-white/60 px-6 py-3 text-sm font-semibold text-[var(--tc-ink)] transition hover:border-[var(--tc-accent)]"
          >
            See how the strip works
          </Link>
        </div>
      </section>

      <section className="mt-20 max-w-3xl border-t border-[var(--tc-line)] pt-10">
        <p className="text-sm leading-relaxed text-[var(--tc-ink-muted)]">
          {DMS_WEDGE}
        </p>
      </section>

      <section className="mt-16 grid gap-8 border-t border-[var(--tc-line)] pt-10 sm:grid-cols-3">
        <div>
          <p className="tc-label">{TIER.estimator.name}</p>
          <p className="font-display text-2xl">{TIER.estimator.priceLabel}</p>
          <p className="mt-2 text-sm text-[var(--tc-ink-muted)]">
            How much — group annual modelled exposure, three buckets.
          </p>
        </div>
        <div>
          <p className="tc-label">VIN Preview</p>
          <p className="font-display text-2xl">Free</p>
          <p className="mt-2 text-sm text-[var(--tc-ink-muted)]">
            How — one unit waterfall on sample VINs at your rates.
          </p>
        </div>
        <div>
          <p className="tc-label">{TIER.snapshot.name}</p>
          <p className="font-display text-2xl">{TIER.snapshot.priceLabel}</p>
          <p className="mt-2 text-sm text-[var(--tc-ink-muted)]">
            {TIER.snapshot.delivery}. Desk review of 90 days, one rooftop.
          </p>
        </div>
      </section>
    </SiteChrome>
  );
}
