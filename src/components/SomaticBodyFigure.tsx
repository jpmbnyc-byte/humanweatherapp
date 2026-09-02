import React from "react";
import { SOMATIC_BODY_FIELD_IMAGE } from "../assets/somaticBodyField";
import { SomaticFigurePreference } from "../lib/somaticFigure";

type Props = { currentTheme: "day" | "night"; preference: SomaticFigurePreference };

/** Static male/female somatic reference figures, dissolved into the surrounding field. */
export default function SomaticBodyFigure({ currentTheme, preference }: Props) {
  const isNight = currentTheme === "night";
  const image = preference.standard === "man" ? SOMATIC_BODY_FIELD_IMAGE : "/somatic-female.jpg";

  return (
    <div
      className="pointer-events-none absolute inset-0 z-0 select-none"
      aria-hidden="true"
      style={{
        maskImage:
          "radial-gradient(ellipse 72% 88% at 50% 49%, #000 0%, #000 58%, rgba(0,0,0,.88) 70%, rgba(0,0,0,.42) 84%, transparent 100%)",
        WebkitMaskImage:
          "radial-gradient(ellipse 72% 88% at 50% 49%, #000 0%, #000 58%, rgba(0,0,0,.88) 70%, rgba(0,0,0,.42) 84%, transparent 100%)",
      }}
    >
      <img
        src={image}
        alt=""
        draggable={false}
        className="absolute inset-0 h-full w-full object-contain object-center"
        style={{
          opacity: isNight ? 0.76 : 0.9,
          mixBlendMode: isNight ? "soft-light" : "multiply",
          filter: isNight
            ? "grayscale(.12) sepia(.08) saturate(.72) brightness(1.04) contrast(.82)"
            : "grayscale(.02) sepia(.045) saturate(.92) brightness(1.035) contrast(.91)",
        }}
      />
      <div
        className="absolute inset-[8%] rounded-[48%] blur-3xl"
        style={{
          background: isNight
            ? "radial-gradient(circle at 50% 42%, rgba(199,177,143,.08), transparent 58%)"
            : "radial-gradient(circle at 50% 42%, rgba(255,250,239,.18), transparent 62%)",
          mixBlendMode: "screen",
        }}
      />
    </div>
  );
}
