import { useState, type FormEvent } from "react";
import { formatUsd } from "@/engine/compute";
import {
  CONTACT_EMAIL,
  PREVIEW_PRIMARY_CTA,
  PREVIEW_SECONDARY_CTA,
  TIER,
} from "@/config/positioning";

interface Props {
  extrapolatedCents: number;
  prospectName: string;
}

export function PreviewCta({ extrapolatedCents, prospectName }: Props) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setSent(true);
  }

  return (
    <section
      aria-labelledby="preview-cta"
      className="scroll-mt-24 border-t border-[var(--tc-line)] pt-14"
    >
      <h2
        id="preview-cta"
        className="tc-display text-[2rem] md:text-[2.5rem]"
      >
        Same strip. Your next 90 days.
      </h2>
      <p className="tc-support">
        A {TIER.snapshot.name} ({TIER.snapshot.priceLabel}) examines one
        rooftop&apos;s actual cost data — still no DMS dump to a stranger. Or
        have these sample figures ({formatUsd(extrapolatedCents)} at your rates)
        sent to someone at {prospectName}.
      </p>

      <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
        <a
          href={`mailto:${CONTACT_EMAIL}?subject=CTRL%20Snapshot%20request`}
          className="inline-flex items-center justify-center rounded-md bg-[var(--tc-accent-deep)] px-6 py-3.5 text-sm font-semibold text-[var(--tc-paper)] transition hover:bg-[var(--tc-accent)]"
        >
          {PREVIEW_PRIMARY_CTA}
        </a>
      </div>

      <form onSubmit={onSubmit} className="mt-12 max-w-md">
        <p className="tc-label mb-2">{PREVIEW_SECONDARY_CTA}</p>
        {sent ? (
          <p className="text-sm leading-relaxed text-[var(--tc-accent)]">
            Noted — we&apos;ll send the sample figures to {email}.
          </p>
        ) : (
          <div className="flex gap-3">
            <input
              type="email"
              required
              placeholder="controller@dealergroup.com"
              className="tc-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-label="Email for figures"
            />
            <button
              type="submit"
              className="shrink-0 rounded-md border border-[var(--tc-line)] bg-white/70 px-5 text-sm font-semibold text-[var(--tc-ink)] transition hover:border-[var(--tc-accent)]"
            >
              Send
            </button>
          </div>
        )}
      </form>
    </section>
  );
}
