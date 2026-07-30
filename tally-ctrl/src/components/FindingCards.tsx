import { motion } from "motion/react";
import type { PreviewFindingCard } from "@/schema/types";
import { formatUsd } from "@/engine/compute";

interface Props {
  cards: PreviewFindingCard[];
}

export function FindingCards({ cards }: Props) {
  return (
    <section aria-labelledby="findings-tease" className="scroll-mt-24">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--tc-accent)]">
        What the portal automates
      </p>
      <h2
        id="findings-tease"
        className="font-display mt-2 text-3xl leading-tight md:text-4xl"
      >
        Markup is the largest line — not the only one.
      </h2>
      <p className="mt-3 max-w-2xl text-[var(--tc-ink-muted)]">
        The preview shows the mechanism. The portal runs the full finding set
        across every sold VIN each period.
      </p>

      <div className="mt-8 grid gap-5 md:grid-cols-2">
        {cards.map((card, i) => (
          <motion.article
            key={card.code}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08, duration: 0.4 }}
            className="border-t border-[var(--tc-line)] pt-4"
          >
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-[var(--tc-ink-muted)]">
              {card.bucket.replaceAll("_", " ")} · {card.code}
            </p>
            <h3 className="mt-2 font-display text-2xl">{card.label}</h3>
            <p className="mt-2 text-sm leading-relaxed text-[var(--tc-ink-muted)]">
              {card.blurb}
            </p>
            {typeof card.amountCents === "number" ? (
              <p className="mt-3 font-semibold tabular-nums text-[var(--tc-delta)]">
                {formatUsd(card.amountCents)} on this unit
              </p>
            ) : null}
          </motion.article>
        ))}
      </div>
    </section>
  );
}
