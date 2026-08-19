import React, { useState, useEffect, useRef } from "react";
import { PATHWAYS, WEATHER_STATES } from "../data/somatic";
import { WeatherState, Pathway } from "../types";
import { Hand, Trash2 } from "lucide-react";
import { useFormingOptional } from "../lib/forming/FormingContext";
import { getChannelPrefs, setChannelPrefs } from "../lib/harness/channels";
import FormingDustLayer from "./FormingDustLayer";
import SketchLivePreview from "./SketchLivePreview";
import SomaticBodyFigure from "./SomaticBodyFigure";
import { countSomaticZones, SOMATIC_ZONE_BANDS } from "../lib/somaticZones";

interface SomaticGridProps {
  onStateChange: (state: WeatherState, activeCoordinates: [number, number][]) => void;
  currentTheme: "day" | "night";
  onContinueToBreath?: () => void;
}

export default function SomaticGrid({
  onStateChange,
  currentTheme,
  onContinueToBreath,
}: SomaticGridProps) {
  const [grid, setGrid] = useState<boolean[][]>(
    Array(8)
      .fill(null)
      .map(() => Array(8).fill(false)),
  );
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawMode, setDrawMode] = useState<boolean>(true); // true to draw, false to erase
  const [hapticsEnabled, setHapticsEnabled] = useState(true);
  const [hapticsSupported, setHapticsSupported] = useState(true);
  const gridRef = useRef<HTMLDivElement>(null);
  const lastCellRef = useRef<string | null>(null);
  const cellEnterRef = useRef<number>(Date.now());
  const forming = useFormingOptional();

  useEffect(() => {
    setHapticsSupported(
      typeof navigator !== "undefined" && typeof navigator.vibrate === "function",
    );
    void getChannelPrefs().then((prefs) => setHapticsEnabled(prefs.hapticEnabled));
  }, []);

  const pulseHaptic = (kind: "touch" | "clear" = "touch") => {
    if (!hapticsEnabled || !hapticsSupported) return;
    navigator.vibrate(kind === "clear" ? [10, 28, 10] : 9);
  };

  const toggleHaptics = () => {
    const next = !hapticsEnabled;
    setHapticsEnabled(next);
    void setChannelPrefs({ hapticEnabled: next });
    if (next && hapticsSupported) navigator.vibrate(14);
  };

  const touchForming = (r: number, c: number, dwellMs = 24) => {
    if (!forming) return;
    const nx = (c + 0.5) / 8;
    const ny = (r + 0.5) / 8;
    forming.registerTouch(nx, ny, dwellMs);
  };

  // Classify state based on active grid cells
  useEffect(() => {
    const activeCoords: [number, number][] = [];
    grid.forEach((row, rIdx) => {
      row.forEach((active, cIdx) => {
        if (active) {
          activeCoords.push([rIdx, cIdx]);
        }
      });
    });

    const count = activeCoords.length;

    if (count === 0) {
      const stillnessState = WEATHER_STATES.find((s) => s.id === "autonomic_stillness")!;
      onStateChange(stillnessState, activeCoords);
      return;
    }

    // Compute metrics
    let sumRow = 0;
    activeCoords.forEach(([r]) => {
      sumRow += r;
    });
    const avgRow = sumRow / count; // 0 to 7. Lower = closer to head (top), higher = pelvis (bottom)

    // Compute neighbors for coherence calculation
    let neighborsCount = 0;
    const isNeighbor = (c1: [number, number], c2: [number, number]) => {
      const dr = Math.abs(c1[0] - c2[0]);
      const dc = Math.abs(c1[1] - c2[1]);
      return dr <= 1 && dc <= 1 && !(dr === 0 && dc === 0);
    };

    activeCoords.forEach((c1) => {
      const hasNeighbor = activeCoords.some((c2) => isNeighbor(c1, c2));
      if (hasNeighbor) {
        neighborsCount++;
      }
    });

    const coherenceRatio = neighborsCount / count; // 0 to 1

    const zoneCounts = countSomaticZones(activeCoords);
    const headRatio = zoneCounts.head / count;
    const upperBodyRatio = (zoneCounts.head + zoneCounts.chest) / count;
    const pelvisRatio = zoneCounts.pelvis / count;
    const rows = activeCoords.map(([r]) => r);
    const rowSpread = rows.length > 0 ? Math.max(...rows) - Math.min(...rows) : 0;

    let detectedStateId = "vaporous_resonance_drift"; // default equilibrium

    if (count >= 2 && count <= 12 && headRatio >= 0.7) {
      detectedStateId = "frontal_tension_headache";
    } else if (count >= 3 && count <= 14 && headRatio >= 0.55 && coherenceRatio < 0.45) {
      detectedStateId = "sleep_debt_drift";
    } else if (
      count >= 4 &&
      count <= 18 &&
      upperBodyRatio >= 0.55 &&
      avgRow <= 3.8 &&
      coherenceRatio >= 0.2 &&
      coherenceRatio < 0.55
    ) {
      detectedStateId = "cognitive_morning_fog";
    } else if (count >= 8 && count <= 20 && rowSpread >= 3 && avgRow >= 2 && avgRow <= 5.2) {
      detectedStateId = "barometric_rainy_grey";
    } else if (count >= 20) {
      // Very high load
      detectedStateId = "sympathetic_heat_dome";
    } else if (coherenceRatio < 0.4 && count >= 3) {
      // Fragmented, scattered
      detectedStateId = "scattered_atmospheric_drift";
    } else if (upperBodyRatio >= 0.65 && count >= 3) {
      // Marks gather in the explicit Head + Chest bands.
      detectedStateId = "sympathetic_heat_dome";
    } else if (pelvisRatio >= 0.55 && count >= 3) {
      // Marks gather in the explicit Pelvis band.
      detectedStateId = "dewpoint_restorative_slumber";
    } else if (coherenceRatio >= 0.7 && count >= 5) {
      // Coherent cluster
      detectedStateId = "high_resonant_thermal_coherence";
    } else {
      // Stable moderate state
      detectedStateId = "vaporous_resonance_drift";
    }

    const state = WEATHER_STATES.find((s) => s.id === detectedStateId) || WEATHER_STATES[4];
    onStateChange(state, activeCoords);
  }, [grid, onStateChange]);

  const toggleCell = (r: number, c: number, overrideVal?: boolean) => {
    setGrid((prev) => {
      const next = prev.map((row) => [...row]);
      next[r][c] = overrideVal !== undefined ? overrideVal : !next[r][c];
      return next;
    });
  };

  const handleMouseDown = (r: number, c: number, e: React.MouseEvent) => {
    e.preventDefault();
    cellEnterRef.current = Date.now();
    const targetVal = !grid[r][c];
    setDrawMode(targetVal);
    setIsDrawing(true);
    toggleCell(r, c, targetVal);
    pulseHaptic();
    touchForming(r, c);
    lastCellRef.current = `${r},${c}`;
  };

  const handleMouseEnterCell = (r: number, c: number) => {
    if (!isDrawing) return;
    const cellKey = `${r},${c}`;
    if (lastCellRef.current === cellKey) return;
    toggleCell(r, c, drawMode);
    pulseHaptic();
    touchForming(r, c, Date.now() - cellEnterRef.current);
    cellEnterRef.current = Date.now();
    lastCellRef.current = cellKey;
  };

  const handleGlobalMouseUp = () => {
    setIsDrawing(false);
    lastCellRef.current = null;
  };

  useEffect(() => {
    window.addEventListener("mouseup", handleGlobalMouseUp);
    return () => {
      window.removeEventListener("mouseup", handleGlobalMouseUp);
    };
  }, []);

  // Handle Touch Events for seamless mobile drawing
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!gridRef.current) return;
    const touch = e.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    if (!element) return;
    const cellCoords = element.getAttribute("data-cell");
    if (cellCoords) {
      const [r, c] = cellCoords.split(",").map(Number);
      const cellKey = `${r},${c}`;
      if (lastCellRef.current !== cellKey) {
        toggleCell(r, c, drawMode);
        pulseHaptic();
        touchForming(r, c, Date.now() - cellEnterRef.current);
        cellEnterRef.current = Date.now();
        lastCellRef.current = cellKey;
      }
    }
  };

  const handleTouchStart = (r: number, c: number, e: React.TouchEvent) => {
    cellEnterRef.current = Date.now();
    const targetVal = !grid[r][c];
    setDrawMode(targetVal);
    setIsDrawing(true);
    toggleCell(r, c, targetVal);
    pulseHaptic();
    touchForming(r, c);
    lastCellRef.current = `${r},${c}`;
  };

  const loadPathway = (pathway: Pathway) => {
    if (forming && !["capturing", "mounting", "stillness"].includes(forming.stage)) {
      forming.abortForming();
      pathway.cells.forEach(([r, c], index) => {
        forming.registerTouch((c + 0.5) / 8, (r + 0.5) / 8, 40 + index * 6);
      });
    }
    const nextGrid = Array(8)
      .fill(null)
      .map(() => Array(8).fill(false));
    pathway.cells.forEach(([r, c]) => {
      if (r >= 0 && r < 8 && c >= 0 && c < 8) {
        nextGrid[r][c] = true;
      }
    });
    setGrid(nextGrid);
    pulseHaptic();
  };

  const clearGrid = () => {
    setGrid(
      Array(8)
        .fill(null)
        .map(() => Array(8).fill(false)),
    );
    pulseHaptic("clear");
  };

  const activeCount = grid.flat().filter(Boolean).length;

  return (
    <div className="flex flex-col items-center w-full max-w-2xl mx-auto" id="somatic-field">
      {/* Title & Stats */}
      <div className="w-full flex items-start justify-between gap-4 mb-4">
        <div className="flex flex-col">
          <span className="hw-eyebrow mb-2">Somatic field mapping</span>
          <span className="font-serif text-2xl md:text-3xl leading-tight">
            {activeCount === 0
              ? "Where do you notice yourself?"
              : activeCount === 1
                ? "One place noticed."
                : `${activeCount} places noticed.`}
          </span>
        </div>

        {/* Reset Button */}
        {activeCount > 0 && (
          <button
            type="button"
            id="clear-grid-btn"
            onClick={() => {
              clearGrid();
              if (forming && !["capturing", "mounting", "stillness"].includes(forming.stage)) {
                forming.abortForming();
              }
            }}
            className="hw-pressable flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono rounded-full border border-red-500/30 text-red-400 bg-red-500/5 hover:bg-red-500/10 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear Map
          </button>
        )}
      </div>

      {/* Gentle instruction intro */}
      <div
        className={`w-full rounded-2xl border p-5 md:p-6 mb-5 ${
          currentTheme === "night"
            ? "border-white/10 bg-white/[0.035] text-[#f3efe8]"
            : "border-stone-200 bg-white/65 text-[#3b352f]"
        }`}
      >
        <p className="font-serif text-lg md:text-xl leading-relaxed">
          Touch anywhere that asks for your attention. Drag across several places if the feeling
          spreads. There is no correct shape to make.
        </p>
        <p className="font-sans text-sm md:text-base leading-relaxed opacity-65 mt-3">
          The top of the field follows the head and chest. The lower field follows the belly, core,
          and pelvis. The figure is a body compass: mark both where you feel sensation and where
          movement feels available. Your marks help shape the breathing rhythm offered next.
        </p>

        <div className="flex items-center justify-between gap-4 border-t border-current/10 mt-5 pt-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <Hand className="w-4 h-4 text-accent shrink-0" aria-hidden />
            <div className="min-w-0">
              <span className="font-sans text-sm font-medium block">Touch feedback</span>
              <span className="font-sans text-xs opacity-55 block">
                {hapticsSupported
                  ? "A soft pulse as each place is marked."
                  : "Not available on this device."}
              </span>
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={hapticsEnabled && hapticsSupported}
            disabled={!hapticsSupported}
            onClick={toggleHaptics}
            className={`hw-pressable shrink-0 rounded-full border px-4 py-2 font-mono text-[11px] uppercase tracking-wider transition-colors ${
              hapticsEnabled && hapticsSupported
                ? "border-accent/50 bg-accent/10 text-accent"
                : "border-current/15 opacity-45"
            } ${hapticsSupported ? "cursor-pointer" : "cursor-not-allowed"}`}
          >
            Haptics {hapticsEnabled && hapticsSupported ? "on" : "off"}
          </button>
        </div>
      </div>

      {/* Interactive 8x8 Grid */}
      <div className="w-full grid grid-cols-[auto_1fr] gap-3 md:gap-4 items-stretch">
        <div
          className="grid grid-rows-4 py-3 md:py-4 font-mono text-[9px] md:text-[10px] uppercase tracking-[0.14em] opacity-55 text-right"
          aria-hidden
        >
          {SOMATIC_ZONE_BANDS.map((zone) => (
            <span key={zone.id} className="flex items-center justify-end">
              {zone.label}
            </span>
          ))}
        </div>
        <div
          ref={gridRef}
          onTouchMove={handleTouchMove}
          onTouchEnd={() => setIsDrawing(false)}
          className={`grid grid-cols-8 gap-1.5 md:gap-2 p-3 md:p-4 rounded-3xl border backdrop-blur-md transition-all duration-300 w-full aspect-square relative overflow-hidden ${
            currentTheme === "night"
              ? "bg-[#1e1c18]/90 border-white/[0.09]"
              : "bg-white/90 border-stone-200/80 shadow-sm shadow-stone-900/5"
          }`}
          style={{
            touchAction: "pan-y",
            boxShadow:
              currentTheme === "night"
                ? "0 18px 45px -18px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255,255,255,0.04)"
                : "0 18px 45px -18px rgba(103, 78, 36, 0.18)",
          }}
        >
          <SomaticBodyFigure currentTheme={currentTheme} />
          <FormingDustLayer />
          {grid.map((row, rIdx) =>
            row.map((active, cIdx) => {
              const cellKey = `${rIdx},${cIdx}`;
              return (
                <div
                  key={cellKey}
                  data-cell={cellKey}
                  onMouseDown={(e) => handleMouseDown(rIdx, cIdx, e)}
                  onMouseEnter={() => handleMouseEnterCell(rIdx, cIdx)}
                  onTouchStart={(e) => handleTouchStart(rIdx, cIdx, e)}
                  className="relative z-10 aspect-square rounded-md cursor-crosshair select-none overflow-hidden transition-all duration-300"
                  style={{
                    touchAction: "pan-y",
                    backgroundColor: active
                      ? currentTheme === "night"
                        ? "#d4b05a"
                        : "#b8956b"
                      : currentTheme === "night"
                        ? "rgba(255,255,255,0.012)"
                        : "rgba(196, 160, 68, 0.028)",
                    border: active
                      ? currentTheme === "night"
                        ? "1px solid #d4b05a"
                        : "1px solid #b8956b"
                      : currentTheme === "night"
                        ? "1px solid rgba(255,255,255,0.05)"
                        : "1px solid rgba(196, 160, 68, 0.12)",
                    boxShadow: active
                      ? currentTheme === "night"
                        ? "0 0 14px rgba(196,160,68,0.8), inset 0 0 4px rgba(255,255,255,0.4)"
                        : "0 0 14px rgba(184,149,107,0.6), inset 0 0 4px rgba(255,255,255,0.5)"
                      : "none",
                  }}
                >
                  {/* Subtle internal particle animation for active cells */}
                  {active && (
                    <div
                      className="absolute inset-0 bg-white/20 blur-[1px] hw-cell-pulse"
                      style={{ animationDuration: `${2 + ((rIdx * 8 + cIdx) % 5) * 0.4}s` }}
                    />
                  )}
                </div>
              );
            }),
          )}
        </div>
      </div>

      <SketchLivePreview
        currentTheme={currentTheme}
        onContinueToBreath={onContinueToBreath}
      />

      {/* Guide Pathways Entry points */}
      <div className="w-full mt-6">
        <span className="hw-eyebrow block mb-2.5">Or load a guide pathway</span>
        <div className="flex flex-wrap gap-1.5 justify-center">
          {PATHWAYS.map((path) => (
            <button
              type="button"
              id={`pathway-btn-${path.id}`}
              key={path.id}
              onClick={() => loadPathway(path)}
              className={`hw-pressable px-3 py-1.5 rounded-full text-xs font-mono transition-all duration-200 border cursor-pointer ${
                currentTheme === "night"
                  ? "bg-[#d4b05a]/5 border-white/[0.08] text-[#f3efe8]/70 hover:text-white hover:bg-[#d4b05a]/10"
                  : "bg-white/60 border-[#d4b05a]/25 text-[#8a6f2e] hover:bg-white hover:border-[#d4b05a]/40 shadow-sm"
              }`}
              title={path.description}
            >
              {path.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
