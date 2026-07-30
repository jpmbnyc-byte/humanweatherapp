import { motion } from "motion/react";
import {
  ACCENT_STYLES,
  PRESET_CARS,
  type PresetCar,
} from "@/data/preset-cars";
import type { LivePresetResult } from "@/gemini/live-preset";
import { formatUsd } from "@/engine/compute";
import { computeUnit } from "@/engine/compute";

interface Props {
  selectedId: string;
  liveById: Record<string, LivePresetResult | undefined>;
  loadingId: string | null;
  onSelect: (preset: PresetCar) => void;
  onRefresh: (preset: PresetCar) => void;
}

export function PresetCarPicker({
  selectedId,
  liveById,
  loadingId,
  onSelect,
  onRefresh,
}: Props) {
  return (
    <section aria-labelledby="preset-cars" className="scroll-mt-24">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="tc-eyebrow">Select VIN deal profile</p>
          <h2
            id="preset-cars"
            className="tc-display text-[1.65rem] md:text-[1.9rem]"
          >
            Three boringly typical cars.
          </h2>
        </div>
        <p className="max-w-sm text-[0.875rem] leading-snug text-[var(--tc-ink-muted)] sm:text-right">
          Tap a profile — live portal output fills below. Our VINs, never yours.
        </p>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-3">
        {PRESET_CARS.map((preset, i) => {
          const live = liveById[preset.id];
          const vehicle = live?.vehicle;
          const selected = selectedId === preset.id;
          const accent = ACCENT_STYLES[preset.accent];
          const loading = loadingId === preset.id;
          const markup =
            live && vehicle
              ? computeUnit(vehicle.lines, live.economics).internalRoMarkupCents
              : null;

          return (
            <motion.button
              key={preset.id}
              type="button"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.35 }}
              onClick={() => onSelect(preset)}
              aria-pressed={selected}
              className="group text-left transition"
              style={{
                borderRadius: "0.85rem",
                border: selected
                  ? `2px solid ${accent.ink}`
                  : "1px solid var(--tc-line)",
                boxShadow: selected ? `0 0 0 3px ${accent.ring}` : "none",
                background: "rgba(255,255,255,0.55)",
                overflow: "hidden",
              }}
            >
              <div
                className="relative h-16 overflow-hidden px-4 pt-3"
                style={{ background: accent.wash }}
              >
                <CarSilhouette accent={preset.accent} />
                <p
                  className="relative z-[1] text-[0.625rem] font-semibold uppercase tracking-[0.12em]"
                  style={{ color: accent.ink }}
                >
                  {preset.channelLabel}
                </p>
                <p
                  className="relative z-[1] font-display text-xl leading-tight"
                  style={{ color: accent.ink }}
                >
                  {preset.label}
                </p>
              </div>

              <div className="space-y-2 px-4 py-3">
                <p className="text-[0.9rem] font-medium leading-snug text-[var(--tc-ink)]">
                  {vehicle
                    ? `${vehicle.year} ${vehicle.make} ${vehicle.model}`
                    : "Loading…"}
                </p>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.72rem] text-[var(--tc-ink-muted)]">
                  {markup != null ? (
                    <span className="font-semibold tabular-nums text-[var(--tc-delta)]">
                      ~{formatUsd(markup)} markup
                    </span>
                  ) : null}
                  {live?.source === "live" ? (
                    <span className="font-semibold text-[var(--tc-accent)]">
                      Live · Gemini
                    </span>
                  ) : null}
                  {selected ? (
                    <button
                      type="button"
                      className="font-semibold text-[var(--tc-accent)] disabled:opacity-50"
                      disabled={loading}
                      onClick={(e) => {
                        e.stopPropagation();
                        onRefresh(preset);
                      }}
                    >
                      {loading ? "Refreshing…" : "Refresh"}
                    </button>
                  ) : null}
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </section>
  );
}

function CarSilhouette({ accent }: { accent: PresetCar["accent"] }) {
  const ink =
    accent === "sage" ? "#0f3d2c" : accent === "slate" ? "#243041" : "#5c3a22";
  return (
    <svg
      aria-hidden
      viewBox="0 0 240 90"
      className="pointer-events-none absolute -right-2 bottom-0 h-[5.5rem] w-auto opacity-35"
    >
      <path
        fill={ink}
        d="M28 62c4-18 18-28 38-32 22-4 48-6 72-4 18 2 34 8 46 18l18 4c8 2 14 8 14 14v8H28v-8z"
      />
      <circle cx="68" cy="70" r="12" fill={ink} opacity="0.85" />
      <circle cx="178" cy="70" r="12" fill={ink} opacity="0.85" />
      <circle cx="68" cy="70" r="5" fill="#f3f0e8" opacity="0.5" />
      <circle cx="178" cy="70" r="5" fill="#f3f0e8" opacity="0.5" />
      <path
        fill="#f3f0e8"
        opacity="0.35"
        d="M70 36c16-3 40-4 62-2 12 1 24 5 34 12H78c-4-4-6-8-8-10z"
      />
    </svg>
  );
}
