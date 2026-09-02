import React from "react";
import {
  SOMATIC_FIGURE_GEOMETRY,
  SOMATIC_FIGURE_POINTS,
  SomaticFigurePreference,
} from "../lib/somaticFigure";

type Props = { currentTheme: "day" | "night"; preference: SomaticFigurePreference };

/** The approved static manuscript figure. Touch geometry is figure-specific. */
export default function SomaticBodyFigure({ currentTheme, preference }: Props) {
  const standard = preference.standard === "man" ? "man" : "woman";
  const points = SOMATIC_FIGURE_POINTS[standard];
  const geometry = SOMATIC_FIGURE_GEOMETRY[standard];
  return (
    <div className="pointer-events-none absolute inset-0 z-0 select-none" aria-hidden="true">
      <svg
        className="absolute inset-0 h-full w-full text-[#806f57]"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        fill="none"
        style={{ opacity: currentTheme === "night" ? 0.16 : 0.2 }}
      >
        <rect x="18" y="10.5" width="70" height="67" rx="0.4" stroke="currentColor" strokeWidth="0.22" />
        <circle cx={geometry.axisX} cy={geometry.guideCenterY} r={geometry.guideRadius} stroke="currentColor" strokeWidth="0.22" />
        <line x1={geometry.axisX} y1="4" x2={geometry.axisX} y2="95" stroke="currentColor" strokeWidth="0.18" />
        <line x1="18" y1={geometry.guideCenterY} x2="88" y2={geometry.guideCenterY} stroke="currentColor" strokeWidth="0.14" strokeDasharray="1.2 1.5" />
      </svg>
      <img
        src={`/somatic/${standard === "man" ? "male" : "female"}-manuscript.svg`}
        alt=""
        className="h-full w-full object-contain"
        style={{
          opacity: currentTheme === "night" ? 0.64 : 0.94,
          mixBlendMode: currentTheme === "night" ? "screen" : "multiply",
          maskImage: "linear-gradient(to bottom, transparent 0%, black 3%, black 96%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 3%, black 96%, transparent 100%)",
        }}
      />
      {Object.entries(points).map(([zone, top]) => (
        <span
          key={zone}
          className="absolute h-1.5 w-1.5 -translate-x-1/2 rounded-full border border-current/45 bg-accent/45 shadow-[0_0_0_5px_rgba(212,176,90,.06)]"
          style={{ left: `${geometry.axisX}%`, top: `${top}%` }}
        />
      ))}
    </div>
  );
}
