import React from "react";
import { SOMATIC_BODY_FIELD_IMAGE } from "../assets/somaticBodyField";
import { SomaticFigurePreference } from "../lib/somaticFigure";

type Props = { currentTheme: "day" | "night"; preference: SomaticFigurePreference };

/**
 * Human Weather's somatic reference figure. The body image is a quiet visual
 * coordinate system; interactive grid marks and forming dust render above it.
 */
export default function SomaticBodyFigure({ currentTheme, preference }: Props) {
  const isNight = currentTheme === "night";

  return (
    <div
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden select-none"
      aria-hidden="true"
    >
      <img
        src={SOMATIC_BODY_FIELD_IMAGE}
        alt=""
        draggable={false}
        className="absolute inset-0 h-full w-full object-contain object-center"
        style={{
          opacity: isNight ? 0.68 : 0.82,
          mixBlendMode: isNight ? "screen" : "multiply",
          filter: isNight
            ? "invert(1) grayscale(.18) sepia(.12) saturate(.78) brightness(.94) contrast(.88)"
            : "grayscale(.05) sepia(.08) saturate(.9) contrast(.96)",
        }}
      />

      {/* Preserve the personal-likeness option without changing the anatomy field. */}
      {preference.kind === "likeness" && preference.portrait ? (
        <img
          src={preference.portrait}
          alt=""
          draggable={false}
          className="absolute left-1/2 top-[2.8%] aspect-square w-[16%] -translate-x-1/2 rounded-full object-cover"
          style={{
            opacity: isNight ? 0.72 : 0.86,
            mixBlendMode: isNight ? "screen" : "multiply",
            filter: isNight ? "grayscale(.5) sepia(.15)" : "grayscale(.28) sepia(.14)",
            maskImage: "radial-gradient(circle at center, black 42%, transparent 74%)",
            WebkitMaskImage: "radial-gradient(circle at center, black 42%, transparent 74%)",
          }}
        />
      ) : null}
    </div>
  );
}
