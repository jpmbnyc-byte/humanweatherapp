import { useEffect, useState } from "react";
import { animate, motion, useMotionValue, useTransform } from "motion/react";
import { formatUsd } from "@/engine/compute";
import type { SampleVehicle, UnitComputeResult } from "@/schema/types";

interface Props {
  vehicle: SampleVehicle;
  result: UnitComputeResult;
}

function AnimatedDollars({ cents, className }: { cents: number; className?: string }) {
  const mv = useMotionValue(cents);
  const display = useTransform(mv, (v) => formatUsd(Math.round(v)));
  const [text, setText] = useState(formatUsd(cents));

  useEffect(() => {
    const controls = animate(mv, cents, { duration: 0.85, ease: [0.22, 1, 0.36, 1] });
    const unsub = display.on("change", setText);
    return () => {
      controls.stop();
      unsub();
    };
  }, [cents, display, mv]);

  return <span className={className}>{text}</span>;
}

const WATERFALL_ORDER = [
  "acquisition",
  "transport_in",
  "recon_parts",
  "recon_labor",
  "recon_sublet",
  "detail",
  "pack",
] as const;

export function CostWaterfall({ vehicle, result }: Props) {
  const ordered = WATERFALL_ORDER.map((cat) =>
    result.lines.find((l) => l.category === cat),
  ).filter(Boolean);

  return (
    <section aria-labelledby="beat-waterfall" className="scroll-mt-24">
      <p className="tc-eyebrow">Beat 2 — One unit waterfall</p>
      <h2 id="beat-waterfall" className="tc-display text-[2rem] md:text-[2.5rem]">
        Posted cost collapses to true cost.
      </h2>
      <p className="tc-support">
        {vehicle.year} {vehicle.make} {vehicle.model} {vehicle.trim} · stock{" "}
        {vehicle.stockNumber} · sample VIN {vehicle.sampleVin.slice(0, 8)}…
        — a boringly typical three-year-old unit. Watch parts divide by markup
        and labor scale to cost rate.
      </p>

      <div className="mt-10 overflow-hidden rounded-2xl border border-[var(--tc-line)] bg-white/55 backdrop-blur-sm">
        <div className="grid grid-cols-[1fr_auto_auto] gap-x-4 border-b border-[var(--tc-line)] px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--tc-ink-muted)] sm:px-6">
          <span>As posted to the GL</span>
          <span className="text-right">Posted</span>
          <span className="text-right">True cost</span>
        </div>

        <ul className="divide-y divide-[var(--tc-line)]/70">
          {ordered.map((line, i) => {
            if (!line) return null;
            const isMarkup =
              line.category === "recon_parts" ||
              line.category === "recon_labor" ||
              line.category === "recon_sublet";

            return (
              <motion.li
                key={line.category + line.description}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.6 }}
                transition={{ delay: i * 0.06, duration: 0.4 }}
                className="grid grid-cols-[1fr_auto_auto] items-baseline gap-x-4 px-4 py-3.5 sm:px-6"
              >
                <div>
                  <p className="font-medium text-[var(--tc-ink)]">
                    {line.description}
                  </p>
                  <p className="text-xs text-[var(--tc-ink-muted)]">
                    {line.category.replaceAll("_", " ")}
                    {isMarkup ? " · markup strip" : null}
                  </p>
                </div>
                <AnimatedDollars
                  cents={line.postedAmountCents}
                  className="min-w-[5.5rem] text-right font-medium tabular-nums text-[var(--tc-posted)]"
                />
                <AnimatedDollars
                  cents={line.costBasisCents}
                  className={`min-w-[5.5rem] text-right font-semibold tabular-nums ${
                    isMarkup && line.markupCents > 0
                      ? "text-[var(--tc-true)]"
                      : "text-[var(--tc-ink)]"
                  }`}
                />
              </motion.li>
            );
          })}
        </ul>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.45, duration: 0.5 }}
          className="grid grid-cols-[1fr_auto_auto] gap-x-4 border-t border-[var(--tc-ink)]/15 bg-[var(--tc-paper-deep)]/60 px-4 py-4 sm:px-6"
        >
          <p className="font-semibold">Unit total</p>
          <AnimatedDollars
            cents={result.postedTotalCents}
            className="min-w-[5.5rem] text-right font-semibold tabular-nums"
          />
          <AnimatedDollars
            cents={result.trueCostCents}
            className="min-w-[5.5rem] text-right font-semibold tabular-nums text-[var(--tc-true)]"
          />
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.55, duration: 0.55 }}
        className="mt-6 flex flex-wrap items-end justify-between gap-4 border-l-4 border-[var(--tc-delta)] bg-white/40 py-4 pl-5 pr-4"
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--tc-delta)]">
            The delta — INTERNAL_RO_MARKUP
          </p>
          <p className="mt-1 max-w-xl text-sm text-[var(--tc-ink-muted)]">
            Your DMS reported the first number as inventory cost. True cost is
            what actually left the building.
          </p>
        </div>
        <p className="font-display text-4xl tabular-nums text-[var(--tc-delta)] md:text-5xl">
          <AnimatedDollars cents={result.internalRoMarkupCents} />
        </p>
      </motion.div>
    </section>
  );
}
