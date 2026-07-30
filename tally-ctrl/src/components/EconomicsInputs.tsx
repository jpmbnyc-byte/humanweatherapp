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
      <p className="tc-eyebrow">Beat 1 — Your economics</p>
      <h2 id="beat-inputs" className="tc-display text-[2rem] md:text-[2.5rem]">
        Four numbers. Not your VINs.
      </h2>
      <p className="tc-support">
        Internal labor rate, what that labor actually costs, parts markup, and
        pack. Controllers type these without a second thought — and they drive
        the largest gross-accuracy finding in the engine.
      </p>

      <div className="mt-10 grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
        <label className="tc-field">
          <span className="tc-label">Internal labor rate</span>
          <div className="tc-input-shell">
            <span className="tc-input-affix tc-input-affix-left" aria-hidden>
              $
            </span>
            <input
              className="tc-input tc-input-has-prefix"
              inputMode="decimal"
              autoComplete="off"
              spellCheck={false}
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
          <span className="tc-field-hint">$/hr billed on internal ROs</span>
        </label>

        <label className="tc-field">
          <span className="tc-label">Labor cost rate</span>
          <div className="tc-input-shell">
            <span className="tc-input-affix tc-input-affix-left" aria-hidden>
              $
            </span>
            <input
              className="tc-input tc-input-has-prefix"
              inputMode="decimal"
              autoComplete="off"
              spellCheck={false}
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
          <span className="tc-field-hint">$/hr actual technician cost</span>
        </label>

        <label className="tc-field">
          <span className="tc-label">Parts markup</span>
          <div className="tc-input-shell">
            <input
              className="tc-input tc-input-has-suffix"
              inputMode="decimal"
              autoComplete="off"
              spellCheck={false}
              aria-label="Parts markup percent"
              value={Math.round(value.partsMarkupPct * 100)}
              onChange={(e) =>
                onChange({
                  ...value,
                  partsMarkupPct: parsePct(e.target.value),
                })
              }
            />
            <span className="tc-input-affix tc-input-affix-right" aria-hidden>
              %
            </span>
          </div>
          <span className="tc-field-hint">Billed at cost × (1 + markup)</span>
        </label>

        <label className="tc-field">
          <span className="tc-label">Pack</span>
          <div className="tc-input-shell">
            <span className="tc-input-affix tc-input-affix-left" aria-hidden>
              $
            </span>
            <input
              className="tc-input tc-input-has-prefix"
              inputMode="decimal"
              autoComplete="off"
              spellCheck={false}
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
          <span className="tc-field-hint">Flat pack in inventory cost</span>
        </label>
      </div>
    </section>
  );
}
