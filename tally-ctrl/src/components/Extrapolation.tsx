import { motion } from "motion/react";
import { formatUsd } from "@/engine/compute";

interface Props {
  unitMarkupCents: number;
  sampleUnitCount: number;
  extrapolatedCents: number;
}

export function Extrapolation({
  unitMarkupCents,
  sampleUnitCount,
  extrapolatedCents,
}: Props) {
  return (
    <section aria-labelledby="beat-extrapolate" className="scroll-mt-24">
      <p className="tc-eyebrow">Beat 3 — Extrapolation</p>
      <h2
        id="beat-extrapolate"
        className="tc-display text-[2rem] md:text-[2.5rem]"
      >
        One unit. Then the sample.
      </h2>

      <motion.blockquote
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="mt-10 max-w-3xl border-l-2 border-[var(--tc-accent)] pl-6"
      >
        <p className="font-display text-[1.65rem] leading-[1.25] text-[var(--tc-ink)] md:text-[2rem]">
          This unit carries{" "}
          <span className="text-[var(--tc-delta)]">
            {formatUsd(unitMarkupCents)}
          </span>{" "}
          of markup in its cost basis. Across the{" "}
          <span className="tabular-nums">{sampleUnitCount}</span>-unit sample
          at your rates, that&apos;s{" "}
          <span className="text-[var(--tc-delta)]">
            {formatUsd(extrapolatedCents)}
          </span>{" "}
          of overstated used inventory cost and understated front gross.
        </p>
      </motion.blockquote>
    </section>
  );
}
