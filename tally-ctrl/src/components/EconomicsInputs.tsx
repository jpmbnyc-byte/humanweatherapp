import type { ReconEconomics } from "@/schema/types";

interface Props {
  value: ReconEconomics;
  onChange: (next: ReconEconomics) => void;
}

function dollarsFromCents(cents: number): string {
  return (cents / 100).toFixed(cents % 100 === 0 ? 0 : 2);
}

function parseDollars(raw: string): number {
  const n = Number.parseFloat(raw.replace(/[^0-9.-]/g, ""));
  if (Number.isNaN(n) || n < 0) return 0;
  return Math.round(n * 100);
}

function parsePct(raw: string): number {
  const n = Number.parseFloat(raw.replace(/[^0-9.-]/g, ""));
  if (Number.isNaN(n) || n < 0) return 0;
  return n > 2 ? n / 100 : n; // allow 40 or 0.40
}

export function EconomicsInputs({ value, onChange }: Props) {
  return (
    <section aria-labelledby="beat-inputs" className="scroll-mt-24">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--tc-accent)]">
        Beat 1 — Your economics
      </p>
      <h2
        id="beat-inputs"
        className="font-display mt-2 text-3xl leading-tight text-[var(--tc-ink)] md:text-4xl"
      >
        Four numbers. Not your VINs.
      </h2>
      <p className="mt-3 max-w-2xl text-[var(--tc-ink-muted)]">
        Internal labor rate, what that labor actually costs, parts markup, and
        pack. Controllers type these without a second thought — and they drive
        the largest gross-accuracy finding in the engine.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <label>
          <span className="tc-label">Internal labor rate</span>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--tc-ink-muted)]">
              $
            </span>
            <input
              className="tc-input pl-7"
              inputMode="decimal"
              aria-label="Internal labor rate dollars per hour"
              value={dollarsFromCents(value.internalLaborRateCents)}
              onChange={(e) =>
                onChange({
                  ...value,
                  internalLaborRateCents: parseDollars(e.target.value),
                })
              }
            />
          </div>
          <span className="mt-1 block text-xs text-[var(--tc-ink-muted)]">
            $/hr billed on internal ROs
          </span>
        </label>

        <label>
          <span className="tc-label">Labor cost rate</span>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--tc-ink-muted)]">
              $
            </span>
            <input
              className="tc-input pl-7"
              inputMode="decimal"
              aria-label="Labor cost rate dollars per hour"
              value={dollarsFromCents(value.laborCostRateCents)}
              onChange={(e) =>
                onChange({
                  ...value,
                  laborCostRateCents: parseDollars(e.target.value),
                })
              }
            />
          </div>
          <span className="mt-1 block text-xs text-[var(--tc-ink-muted)]">
            $/hr actual technician cost
          </span>
        </label>

        <label>
          <span className="tc-label">Parts markup</span>
          <div className="relative">
            <input
              className="tc-input pr-8"
              inputMode="decimal"
              aria-label="Parts markup percent"
              value={Math.round(value.partsMarkupPct * 100)}
              onChange={(e) =>
                onChange({
                  ...value,
                  partsMarkupPct: parsePct(e.target.value),
                })
              }
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--tc-ink-muted)]">
              %
            </span>
          </div>
          <span className="mt-1 block text-xs text-[var(--tc-ink-muted)]">
            Billed at cost × (1 + markup)
          </span>
        </label>

        <label>
          <span className="tc-label">Pack</span>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--tc-ink-muted)]">
              $
            </span>
            <input
              className="tc-input pl-7"
              inputMode="decimal"
              aria-label="Pack amount dollars"
              value={dollarsFromCents(value.packAmountCents)}
              onChange={(e) =>
                onChange({
                  ...value,
                  packAmountCents: parseDollars(e.target.value),
                })
              }
            />
          </div>
          <span className="mt-1 block text-xs text-[var(--tc-ink-muted)]">
            Flat pack in inventory cost
          </span>
        </label>
      </div>
    </section>
  );
}
