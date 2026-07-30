import { useEffect, useState } from "react";
import { animate, motion, useMotionValue, useTransform } from "motion/react";
import { formatUsd } from "@/engine/compute";
import type { SampleVehicle, UnitComputeResult } from "@/schema/types";

interface Props {
  vehicle: SampleVehicle;
  result: UnitComputeResult;
  sampleUnitCount: number;
  extrapolatedCents: number;
  /** Bumps when the visitor picks another unit — restarts the auto demo. */
  demoKey: string;
}

type Phase = "posted" | "stripping" | "revealed";

function AnimatedDollars({
  cents,
  className,
  duration = 0.9,
}: {
  cents: number;
  className?: string;
  duration?: number;
}) {
  const mv = useMotionValue(cents);
  const display = useTransform(mv, (v) => formatUsd(Math.round(v)));
  const [text, setText] = useState(formatUsd(cents));

  useEffect(() => {
    const controls = animate(mv, cents, {
      duration,
      ease: [0.22, 1, 0.36, 1],
    });
    const unsub = display.on("change", setText);
    return () => {
      controls.stop();
      unsub();
    };
  }, [cents, display, duration, mv]);

  return <span className={className}>{text}</span>;
}

/**
 * Automatic value beat: DMS posted → strip → true cost → sample dollars.
 * Runs on load and every time demoKey changes — no click required.
 */
export function ValueReveal({
  vehicle,
  result,
  sampleUnitCount,
  extrapolatedCents,
  demoKey,
}: Props) {
  const [phase, setPhase] = useState<Phase>("posted");

  useEffect(() => {
    setPhase("posted");
    const t1 = window.setTimeout(() => setPhase("stripping"), 900);
    const t2 = window.setTimeout(() => setPhase("revealed"), 2200);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [demoKey]);

  const showTrue = phase !== "posted";
  const showDelta = phase === "revealed";

  const displayTrue = showTrue ? result.trueCostCents : result.postedTotalCents;
  const displayMarkup = showDelta ? result.internalRoMarkupCents : 0;
  const displaySample = showDelta ? extrapolatedCents : 0;

  return (
    <section aria-labelledby="value-reveal" className="scroll-mt-24">
      <p className="tc-eyebrow">The strip — automatic</p>
      <h2
        id="value-reveal"
        className="tc-display text-[2rem] md:text-[2.75rem]"
      >
        DMS posted cost is not true cost.
      </h2>
      <p className="tc-support">
        Watch {vehicle.year} {vehicle.make} {vehicle.model} strip internal RO
        markup out of inventory. Same math the portal runs on every sold VIN —
        running now on a sample unit, not a DMS upload.
      </p>

      <div className="mt-10 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <motion.div
          key={`board-${demoKey}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="relative overflow-hidden rounded-2xl border border-[var(--tc-line)] bg-white/60 px-6 py-7 backdrop-blur-sm sm:px-8"
        >
          <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-[var(--tc-ink-muted)]">
            {phase === "posted" && "Reading DMS cost basis…"}
            {phase === "stripping" && "Stripping internal RO markup…"}
            {phase === "revealed" && "INTERNAL_RO_MARKUP identified"}
          </p>

          <div className="mt-8 grid gap-8 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--tc-posted)]">
                As posted
              </p>
              <p className="mt-2 font-display text-4xl tabular-nums text-[var(--tc-posted)] md:text-5xl">
                <AnimatedDollars cents={result.postedTotalCents} />
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--tc-true)]">
                True cost
              </p>
              <p
                className={`mt-2 font-display text-4xl tabular-nums md:text-5xl ${
                  showTrue ? "text-[var(--tc-true)]" : "text-[var(--tc-posted)]"
                }`}
              >
                <AnimatedDollars cents={displayTrue} duration={1.05} />
              </p>
            </div>
          </div>

          <motion.div
            animate={{
              opacity: showDelta ? 1 : 0.35,
              y: showDelta ? 0 : 6,
            }}
            transition={{ duration: 0.45 }}
            className="mt-10 border-t border-[var(--tc-line)] pt-6"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--tc-delta)]">
              Markup sitting in cost basis
            </p>
            <p className="mt-2 font-display text-5xl tabular-nums text-[var(--tc-delta)] md:text-6xl">
              <AnimatedDollars cents={displayMarkup} duration={0.95} />
            </p>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-[var(--tc-ink-muted)]">
              Your DMS recorded the posted number as inventory cost. Front gross
              on this unit was understated by the delta until the strip ran.
            </p>
          </motion.div>

          {/* Progress rail — signals the auto demo is alive */}
          <div
            className="absolute inset-x-0 bottom-0 h-1 bg-[var(--tc-paper-deep)]"
            aria-hidden
          >
            <motion.div
              key={`rail-${demoKey}`}
              className="h-full bg-[var(--tc-accent)]"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 2.2, ease: "linear" }}
            />
          </div>
        </motion.div>

        <motion.aside
          key={`sample-${demoKey}`}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="flex flex-col justify-between rounded-2xl border border-[var(--tc-accent)]/25 bg-[var(--tc-accent-deep)] px-6 py-7 text-[var(--tc-paper)] sm:px-8"
        >
          <div>
            <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-[var(--tc-paper)]/70">
              At your sample volume
            </p>
            <p className="mt-3 font-display text-[1.85rem] leading-tight md:text-[2.15rem]">
              Across {sampleUnitCount} units at these rates
            </p>
            <p className="mt-6 font-display text-5xl tabular-nums md:text-6xl">
              <AnimatedDollars cents={displaySample} duration={1.1} />
            </p>
            <p className="mt-4 text-[0.95rem] leading-relaxed text-[var(--tc-paper)]/75">
              Overstated used inventory cost — and understated front gross —
              identified on the sample. Recoverable cash is a separate bucket;
              this line is gross accuracy.
            </p>
          </div>
          <p className="mt-8 text-[0.75rem] leading-snug text-[var(--tc-paper)]/55">
            Pick another sample unit above to re-run the strip. Rates below are
            optional — the demo already used store-typical economics.
          </p>
        </motion.aside>
      </div>
    </section>
  );
}
