import { useEffect, useState } from "react";
import { animate, motion, useMotionValue, useTransform } from "motion/react";
import { Link } from "react-router-dom";
import { formatUsd } from "@/engine/compute";
import {
  CONTACT_EMAIL,
  PREVIEW_PRIMARY_CTA,
  TIER,
} from "@/config/positioning";
import type { SampleVehicle, UnitComputeResult } from "@/schema/types";

interface Props {
  vehicle: SampleVehicle;
  result: UnitComputeResult;
  sampleUnitCount: number;
  extrapolatedCents: number;
  prospectName: string;
  demoKey: string;
}

function AnimatedDollars({
  cents,
  className,
  duration = 0.85,
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

type Phase = "reading" | "computing" | "ready";

/**
 * Deal-console style live output — mirrors the ai.studio preview portal punch:
 * pick a unit → net identified dollars + layer stack + action plan fill automatically.
 */
export function PortalOutput({
  vehicle,
  result,
  sampleUnitCount,
  extrapolatedCents,
  prospectName,
  demoKey,
}: Props) {
  const [phase, setPhase] = useState<Phase>("reading");

  useEffect(() => {
    setPhase("reading");
    const t1 = window.setTimeout(() => setPhase("computing"), 650);
    const t2 = window.setTimeout(() => setPhase("ready"), 1600);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [demoKey]);

  const ready = phase === "ready";
  const showUnit = phase !== "reading";
  const unitCents = showUnit ? result.internalRoMarkupCents : 0;
  const sampleCents = ready ? extrapolatedCents : 0;

  const layers = [
    {
      code: "INTERNAL_RO_MARKUP",
      label: "Internal RO markup",
      detail: "Parts ÷ markup · labor × cost rate",
      amountCents: result.internalRoMarkupCents,
      tone: "delta" as const,
    },
    {
      code: "PACK_INTEGRITY",
      label: "Pack integrity",
      detail: `Schedule pack ${formatUsd(result.lines.find((l) => l.category === "pack")?.postedAmountCents ?? 0)} posted`,
      amountLabel: "Checked",
      tone: "muted" as const,
    },
    {
      code: "WARRANTY_UNCLAIMED",
      label: "Unclaimed warranty",
      detail: "Surfaced when VIN is in-warranty — portal finding",
      amountLabel: "Portal",
      tone: "muted" as const,
    },
    {
      code: "RECON_POST_SALE",
      label: "Recon after sale close",
      detail: "Period / GAAP classification — portal finding",
      amountLabel: "Portal",
      tone: "muted" as const,
    },
  ];

  const actionPlan = ready
    ? `Strip ${formatUsd(result.internalRoMarkupCents)} of INTERNAL_RO_MARKUP out of this unit's cost basis before pricing or trade decisions. Across the ${sampleUnitCount}-unit sample at these rates that is ${formatUsd(extrapolatedCents)} of overstated used inventory cost — identified, not recovered. Run a ${TIER.snapshot.name} on ${prospectName}'s next 90 days to quantify the same strip on live cost data.`
    : "Reading DMS cost lines…";

  return (
    <section aria-labelledby="portal-output" className="scroll-mt-24">
      <p className="tc-eyebrow">Live portal output</p>
      <h2
        id="portal-output"
        className="tc-display text-[2rem] md:text-[2.6rem]"
      >
        Variance diagnostic — automatic.
      </h2>
      <p className="tc-support">
        Same punch as the deal console: select a sample VIN and the output engine
        fills. No DMS upload. Math runs on this device.
      </p>

      <div className="mt-10 grid gap-5 lg:grid-cols-[1fr_1.05fr]">
        {/* Status / unit strip */}
        <motion.div
          key={`status-${demoKey}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-[var(--tc-line)] bg-white/55 px-6 py-6 backdrop-blur-sm sm:px-7"
        >
          <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-[var(--tc-ink-muted)]">
            {phase === "reading" && "Reading DMS cost basis…"}
            {phase === "computing" && "Stripping internal RO markup…"}
            {phase === "ready" && "Strip complete · finding ready"}
          </p>
          <p className="mt-4 font-display text-[1.65rem] leading-tight">
            {vehicle.year} {vehicle.make} {vehicle.model} {vehicle.trim}
          </p>
          <p className="mt-2 text-sm text-[var(--tc-ink-muted)]">
            Stock {vehicle.stockNumber} · sample VIN{" "}
            {vehicle.sampleVin.slice(0, 11)}… · {vehicle.mileage.toLocaleString()}{" "}
            mi
          </p>

          <div className="mt-8 grid grid-cols-2 gap-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--tc-posted)]">
                As posted
              </p>
              <p className="mt-2 font-display text-3xl tabular-nums text-[var(--tc-posted)]">
                <AnimatedDollars cents={result.postedTotalCents} />
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--tc-true)]">
                True cost
              </p>
              <p className="mt-2 font-display text-3xl tabular-nums text-[var(--tc-true)]">
                <AnimatedDollars
                  cents={
                    showUnit ? result.trueCostCents : result.postedTotalCents
                  }
                />
              </p>
            </div>
          </div>

          <div
            className="mt-8 h-1 overflow-hidden rounded-full bg-[var(--tc-paper-deep)]"
            aria-hidden
          >
            <motion.div
              key={`rail-${demoKey}`}
              className="h-full bg-[var(--tc-accent)]"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 1.6, ease: "linear" }}
            />
          </div>
        </motion.div>

        {/* Output engine — dark punch panel like ai.studio console */}
        <motion.aside
          key={`engine-${demoKey}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.45 }}
          className="flex flex-col rounded-2xl bg-[var(--tc-accent-deep)] px-6 py-6 text-[var(--tc-paper)] sm:px-7"
        >
          <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-[var(--tc-paper)]/65">
            Net identified — this unit
          </p>
          <p className="mt-3 font-display text-5xl tabular-nums text-[#f0c9a8] md:text-6xl">
            <AnimatedDollars cents={unitCents} duration={0.95} />
          </p>
          <p className="mt-3 text-[0.9rem] leading-relaxed text-[var(--tc-paper)]/70">
            INTERNAL_RO_MARKUP sitting in inventory cost basis. Front gross on
            this unit was understated by the delta until the strip ran.
          </p>

          <div className="mt-7 border-t border-white/15 pt-6">
            <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-[var(--tc-paper)]/65">
              At your sample volume · {sampleUnitCount} units
            </p>
            <p className="mt-2 font-display text-4xl tabular-nums md:text-5xl">
              <AnimatedDollars cents={sampleCents} duration={1.05} />
            </p>
          </div>

          <div className="mt-7 border-t border-white/15 pt-5">
            <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-[var(--tc-paper)]/65">
              Finding stack
            </p>
            <ul className="mt-4 space-y-3">
              {layers.map((layer, i) => (
                <motion.li
                  key={layer.code}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{
                    opacity: ready || (showUnit && i === 0) ? 1 : 0.35,
                    x: 0,
                  }}
                  transition={{ delay: 0.15 + i * 0.08 }}
                  className="flex items-baseline justify-between gap-4 text-sm"
                >
                  <div className="min-w-0">
                    <p className="font-medium">{layer.label}</p>
                    <p className="text-[0.75rem] text-[var(--tc-paper)]/50">
                      {layer.code} · {layer.detail}
                    </p>
                  </div>
                  <p
                    className={`shrink-0 tabular-nums ${
                      layer.tone === "delta"
                        ? "font-semibold text-[#f0c9a8]"
                        : "text-[var(--tc-paper)]/55"
                    }`}
                  >
                    {"amountCents" in layer && typeof layer.amountCents === "number"
                      ? showUnit
                        ? formatUsd(layer.amountCents)
                        : "—"
                      : layer.amountLabel}
                  </p>
                </motion.li>
              ))}
            </ul>
          </div>

          <div className="mt-7 rounded-xl border border-[#f0c9a8]/35 bg-black/20 px-4 py-4">
            <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-[#f0c9a8]">
              Action plan
            </p>
            <p className="mt-2 text-[0.92rem] leading-relaxed text-[var(--tc-paper)]/85">
              {actionPlan}
            </p>
          </div>

          <a
            href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(
              `CTRL Snapshot — ${prospectName}`,
            )}`}
            className="mt-6 inline-flex items-center justify-center rounded-md bg-[#c4a574] px-5 py-3.5 text-sm font-semibold text-[var(--tc-accent-deep)] transition hover:bg-[#d4b88a]"
          >
            {PREVIEW_PRIMARY_CTA}
          </a>
          <p className="mt-3 text-center text-[0.75rem] text-[var(--tc-paper)]/45">
            Or{" "}
            <Link to="/estimate" className="underline underline-offset-2">
              estimate the group pool
            </Link>{" "}
            in 90 seconds.
          </p>
        </motion.aside>
      </div>
    </section>
  );
}
