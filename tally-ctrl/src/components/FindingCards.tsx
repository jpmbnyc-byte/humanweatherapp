import { motion } from "motion/react";
import type { PreviewFindingCard } from "@/schema/types";
import { formatUsd } from "@/engine/compute";

interface Props {
  cards: PreviewFindingCard[];
}

export function FindingCards({ cards }: Props) {
  return (
    <section aria-labelledby="findings-tease" className="scroll-mt-24">
      <p className="tc-eyebrow">What runs without you</p>
      <h2 id="findings-tease" className="tc-display text-[2rem] md:text-[2.5rem]">
        Markup is the largest line — not the only one.
      </h2>
      <p className="tc-support">
        You just watched one finding auto-strip. The portal runs the full set
        across every sold VIN each period — still without a DMS dump to a stranger.
      </p>

      <div className="mt-10 grid gap-x-8 gap-y-10 md:grid-cols-2">
        {cards.map((card, i) => (
          <motion.article
            key={card.code}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08, duration: 0.4 }}
            className="border-t border-[var(--tc-line)] pt-5"
          >
            <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-[var(--tc-ink-muted)]">
              {card.bucket.replaceAll("_", " ")} · {card.code}
            </p>
            <h3 className="font-display mt-3 text-[1.65rem] leading-tight">
              {card.label}
            </h3>
            <p className="mt-3 text-[0.98rem] leading-relaxed text-[var(--tc-ink-muted)]">
              {card.blurb}
            </p>
            {typeof card.amountCents === "number" ? (
              <p className="mt-4 font-semibold tabular-nums text-[var(--tc-delta)]">
                {formatUsd(card.amountCents)} on this unit
              </p>
            ) : null}
          </motion.article>
        ))}
      </div>
    </section>
  );
}
