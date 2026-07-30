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
        <h1 className="font-display text-[2.75rem] leading-[1.08] md:text-5xl">
          {SITE_H1}
        </h1>
        <p className="mt-6 text-[1.1rem] leading-relaxed text-[var(--tc-ink-muted)]">
          {SITE_SUBHEAD}
        </p>

        <div className="mt-12 flex flex-col gap-3 sm:flex-row">
          <Link
            to="/estimate"
            className="inline-flex items-center justify-center rounded-md bg-[var(--tc-accent-deep)] px-6 py-3.5 text-sm font-semibold text-[var(--tc-paper)] transition hover:bg-[var(--tc-accent)]"
          >
            Estimate your variance pool — 90 seconds
          </Link>
          <Link
            to="/p/demo-faulkner"
            className="inline-flex items-center justify-center rounded-md border border-[var(--tc-line)] bg-white/60 px-6 py-3.5 text-sm font-semibold text-[var(--tc-ink)] transition hover:border-[var(--tc-accent)]"
          >
            Open preview portal
          </Link>
        </div>
      </section>

      <section className="mt-24 max-w-3xl border-t border-[var(--tc-line)] pt-12">
        <p className="text-[1.05rem] leading-[1.7] text-[var(--tc-ink-muted)]">
          {DMS_WEDGE}
        </p>
      </section>

      <section className="mt-20 grid gap-10 border-t border-[var(--tc-line)] pt-12 sm:grid-cols-3">
        <div>
          <p className="tc-label">{TIER.estimator.name}</p>
          <p className="font-display mt-3 text-2xl leading-tight">
            {TIER.estimator.priceLabel}
          </p>
          <p className="mt-3 text-[0.95rem] leading-relaxed text-[var(--tc-ink-muted)]">
            How much — group annual modelled exposure, three buckets.
          </p>
        </div>
        <div>
          <p className="tc-label">Preview portal</p>
          <p className="font-display mt-3 text-2xl leading-tight">Free</p>
          <p className="mt-3 text-[0.95rem] leading-relaxed text-[var(--tc-ink-muted)]">
            How — deal-console strip on sample VINs; output runs on load.
          </p>
        </div>
        <div>
          <p className="tc-label">{TIER.snapshot.name}</p>
          <p className="font-display mt-3 text-2xl leading-tight">
            {TIER.snapshot.priceLabel}
          </p>
          <p className="mt-3 text-[0.95rem] leading-relaxed text-[var(--tc-ink-muted)]">
            {TIER.snapshot.delivery}. Desk review of 90 days, one rooftop.
          </p>
        </div>
      </section>
    </SiteChrome>
  );
}
