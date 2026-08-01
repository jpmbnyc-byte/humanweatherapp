import { useEffect, useState } from "react";
import { motion } from "motion/react";
import {
  ACCENT_STYLES,
  PRESET_CARS,
  type PresetCar,
} from "@/data/preset-cars";
import {
  resolveScenarioDiagnostic,
  scenarioCardLabel,
} from "@/data/scenarios";
import type { LivePresetResult } from "@/gemini/live-preset";
import {
  curatedImageForPreset,
  type PresetImageResult,
} from "@/gemini/preset-image";
import { computeUnit, formatUsd } from "@/engine/compute";

interface Props {
  selectedId: string;
  liveById: Record<string, LivePresetResult | undefined>;
  imageById: Record<string, PresetImageResult | undefined>;
  loadingId: string | null;
  onSelect: (preset: PresetCar) => void;
  onRefresh: (preset: PresetCar) => void;
}

export function PresetCarPicker({
  selectedId,
  liveById,
  imageById,
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
            Three cars. Three different findings.
          </h2>
        </div>
        <p className="max-w-sm text-[0.875rem] leading-snug text-[var(--tc-ink-muted)] sm:text-right">
          RO markup, double pack, warranty miss — tap a profile and the portal
          output fills. Our VINs, never yours.
        </p>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-3">
        {PRESET_CARS.map((preset, i) => {
          const live = liveById[preset.id];
          const vehicle = live?.vehicle;
          const selected = selectedId === preset.id;
          const accent = ACCENT_STYLES[preset.accent];
          const loading = loadingId === preset.id;
          const image = imageById[preset.id] ?? curatedImageForPreset(preset);

          let primaryLabel = scenarioCardLabel(preset);
          let primaryAmount: number | null = null;
          if (live && vehicle) {
            const result = computeUnit(vehicle.lines, live.economics);
            const diag = resolveScenarioDiagnostic(
              preset,
              vehicle,
              live.economics,
              result,
            );
            primaryLabel = diag.primaryLabel;
            primaryAmount = diag.primaryCents;
          }

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
              <div className="relative h-28 overflow-hidden bg-[var(--tc-paper-deep)]">
                <PresetThumb
                  src={image.src}
                  alt={`${preset.label} sample`}
                  wash={accent.wash}
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 px-3 pb-2.5">
                  <p className="text-[0.625rem] font-semibold uppercase tracking-[0.12em] text-white/85">
                    {preset.channelLabel}
                  </p>
                  <p className="font-display text-xl leading-tight text-white">
                    {preset.label}
                  </p>
                </div>
                {image.source === "gemini" ? (
                  <span className="absolute right-2 top-2 rounded bg-black/45 px-1.5 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wide text-white/90">
                    Gemini
                  </span>
                ) : null}
              </div>

              <div className="space-y-2 px-4 py-3">
                <p className="text-[0.9rem] font-medium leading-snug text-[var(--tc-ink)]">
                  {vehicle
                    ? `${vehicle.year} ${vehicle.make} ${vehicle.model}`
                    : "Loading…"}
                </p>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.72rem] text-[var(--tc-ink-muted)]">
                  <span className="font-semibold text-[var(--tc-ink)]">
                    {primaryLabel}
                  </span>
                  {primaryAmount != null ? (
                    <span className="font-semibold tabular-nums text-[var(--tc-delta)]">
                      {formatUsd(primaryAmount)}
                    </span>
                  ) : null}
                  {live?.source === "live" ? (
                    <span className="font-semibold text-[var(--tc-accent)]">
                      Live
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

function PresetThumb({
  src,
  alt,
  wash,
}: {
  src: string;
  alt: string;
  wash: string;
}) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setFailed(false);
    setLoaded(false);
  }, [src]);

  return (
    <>
      <div
        className="absolute inset-0"
        style={{ background: wash }}
        aria-hidden
      />
      {!failed ? (
        <img
          src={src}
          alt={alt}
          width={900}
          height={600}
          loading="eager"
          decoding="async"
          fetchPriority="high"
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${
            loaded ? "opacity-100" : "opacity-0"
          }`}
        />
      ) : null}
    </>
  );
}
