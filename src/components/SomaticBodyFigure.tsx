import React from "react";
import { SOMATIC_FIGURE_POINTS, SomaticFigurePreference } from "../lib/somaticFigure";

type Props = { currentTheme: "day" | "night"; preference: SomaticFigurePreference };

/** The approved static manuscript figure. Touch geometry is figure-specific. */
export default function SomaticBodyFigure({ currentTheme, preference }: Props) {
  const standard = preference.standard === "man" ? "man" : "woman";
  const points = SOMATIC_FIGURE_POINTS[standard];
  return (
    <div className="pointer-events-none absolute inset-0 z-0 select-none" aria-hidden="true">
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
        <span key={zone} className="absolute left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full border border-current/45 bg-accent/45 shadow-[0_0_0_5px_rgba(212,176,90,.06)]" style={{ top: `${top}%` }} />
      ))}
    </div>
  );
}
