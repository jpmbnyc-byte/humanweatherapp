import { useState, type FormEvent } from "react";
import { formatUsd } from "@/engine/compute";

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
    // Value-first capture — secondary CTA after the reveal. No persistence in teaser.
    setSent(true);
  }

  return (
    <section
      aria-labelledby="preview-cta"
      className="scroll-mt-24 border-t border-[var(--tc-line)] pt-12"
    >
      <h2 id="preview-cta" className="font-display text-3xl md:text-4xl">
        Run the same strip on your next 90 days.
      </h2>
      <p className="mt-3 max-w-2xl text-[var(--tc-ink-muted)]">
        Primary ask: a diagnostic against real sold VINs — still no DMS dump to
        a stranger. Secondary: we&apos;ll email these figures (
        {formatUsd(extrapolatedCents)} at your rates on the sample) to someone
        at {prospectName}.
      </p>

      <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
        <a
          href="mailto:jp@tallyctrl.com?subject=Tally%20CTRL%20diagnostic%20-%2090%20days"
          className="inline-flex items-center justify-center rounded-md bg-[var(--tc-accent-deep)] px-6 py-3 text-sm font-semibold text-[var(--tc-paper)] transition hover:bg-[var(--tc-accent)]"
        >
          Talk through a 90-day diagnostic
        </a>
      </div>

      <form onSubmit={onSubmit} className="mt-10 max-w-md">
        <p className="tc-label">Send me these figures</p>
        {sent ? (
          <p className="text-sm text-[var(--tc-accent)]">
            Noted — we&apos;ll send the sample figures to {email}.
          </p>
        ) : (
          <div className="flex gap-2">
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
              className="shrink-0 rounded-md border border-[var(--tc-line)] bg-white/70 px-4 text-sm font-semibold text-[var(--tc-ink)] transition hover:border-[var(--tc-accent)]"
            >
              Send
            </button>
          </div>
        )}
      </form>
    </section>
  );
}
