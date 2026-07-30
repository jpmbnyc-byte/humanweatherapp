import { useState } from "react";
import type { ReconEconomics } from "@/schema/types";
import { formatUsd } from "@/engine/compute";

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
  const [open, setOpen] = useState(false);

  const summary = `${formatUsd(value.internalLaborRateCents)}/hr internal · ${formatUsd(value.laborCostRateCents)}/hr cost · ${Math.round(value.partsMarkupPct * 100)}% parts · ${formatUsd(value.packAmountCents)} pack`;

  return (
    <section aria-labelledby="beat-inputs" className="scroll-mt-24">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="tc-eyebrow">Optional — your rates</p>
          <h2
            id="beat-inputs"
            className="tc-display text-[1.75rem] md:text-[2.15rem]"
          >
            Already running on store-typical economics.
          </h2>
          <p className="tc-support">
            The strip above used these four numbers automatically. Open only if
            you want to watch the delta move at your shop&apos;s rates.
          </p>
        </div>
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="shrink-0 self-start rounded-md border border-[var(--tc-line)] bg-white/70 px-4 py-2.5 text-sm font-semibold text-[var(--tc-ink)] transition hover:border-[var(--tc-accent)] sm:self-auto"
        >
          {open ? "Hide rates" : "Tweak rates"}
        </button>
      </div>

      <p className="mt-5 text-[0.875rem] leading-snug text-[var(--tc-ink-muted)]">
        {summary}
      </p>

      {open ? (
        <div className="mt-8 grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
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
      ) : null}
    </section>
  );
}
