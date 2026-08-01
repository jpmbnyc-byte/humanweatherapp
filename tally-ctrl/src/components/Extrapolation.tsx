import { motion } from "motion/react";
import { formatUsd } from "@/engine/compute";
import type { FindingTypeCode } from "@/schema/types";

interface Props {
  unitAmountCents: number;
  primaryLabel: string;
  primaryCode: FindingTypeCode;
  sampleUnitCount: number;
  extrapolatedCents: number;
}

/** Compact restatement — scenario-aware primary finding × sample volume */
export function Extrapolation({
  unitAmountCents,
  primaryLabel,
  primaryCode,
  sampleUnitCount,
  extrapolatedCents,
}: Props) {
  return (
    <section aria-labelledby="beat-extrapolate" className="scroll-mt-24">
      <p className="tc-eyebrow">Why this matters</p>
      <h2
        id="beat-extrapolate"
        className="tc-display text-[2rem] md:text-[2.5rem]"
      >
        One finding on one unit. Then the sample.
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
            {formatUsd(unitAmountCents)}
          </span>{" "}
          of {primaryLabel.toLowerCase()}{" "}
          <span className="text-[0.85em] text-[var(--tc-ink-muted)]">
            ({primaryCode})
          </span>
          . Across the <span className="tabular-nums">{sampleUnitCount}</span>
          -unit sample at the same pattern, that&apos;s{" "}
          <span className="text-[var(--tc-delta)]">
            {formatUsd(extrapolatedCents)}
          </span>{" "}
          identified — before anyone uploads a DMS file.
        </p>
      </motion.blockquote>
    </section>
  );
}
