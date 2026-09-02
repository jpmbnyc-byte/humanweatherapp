import React from "react";
import "../somatic-sfumato.css";
import { SOMATIC_BODY_FIELD_IMAGE } from "../assets/somaticBodyField";
import { SomaticFigurePreference } from "../lib/somaticFigure";

type Props = { currentTheme: "day" | "night"; preference: SomaticFigurePreference };

/** Static male/female somatic reference figures, dissolved into the surrounding field. */
export default function SomaticBodyFigure({ currentTheme, preference }: Props) {
  const isNight = currentTheme === "night";
  const image = preference.standard === "man" ? SOMATIC_BODY_FIELD_IMAGE : "/somatic-female.jpg";

  return (
    <div
      className="pointer-events-none absolute inset-0 z-0 select-none hw-somatic-figure-field"
      aria-hidden="true"
    >
      <img
        src={image}
        alt=""
        draggable={false}
        className="absolute inset-0 h-full w-full object-contain object-center hw-somatic-figure-image"
        style={{
          opacity: isNight ? 0.74 : 0.9,
          mixBlendMode: isNight ? "soft-light" : "multiply",
          filter: isNight
            ? "grayscale(.1) sepia(.08) saturate(.74) brightness(1.08) contrast(.8)"
            : "grayscale(.02) sepia(.04) saturate(.92) brightness(1.04) contrast(.9)",
        }}
      />
      <div className="absolute inset-[7%] hw-somatic-luminous-veil" />
    </div>
  );
}
