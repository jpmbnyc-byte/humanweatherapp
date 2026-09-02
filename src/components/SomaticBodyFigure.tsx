import React from "react";
import { SOMATIC_BODY_FIELD_IMAGE } from "../assets/somaticBodyField";
import { SomaticFigurePreference } from "../lib/somaticFigure";

type Props = { currentTheme: "day" | "night"; preference: SomaticFigurePreference };

/** Static male/female somatic reference figures. Interactive marks render above them. */
export default function SomaticBodyFigure({ currentTheme, preference }: Props) {
  const isNight = currentTheme === "night";
  const image = preference.standard === "man" ? SOMATIC_BODY_FIELD_IMAGE : "/somatic-female.jpg";

  return (
    <div
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden select-none"
      aria-hidden="true"
    >
      <img
        src={image}
        alt=""
        draggable={false}
        className="absolute inset-0 h-full w-full object-contain object-center"
        style={{
          opacity: isNight ? 0.7 : 0.86,
          mixBlendMode: isNight ? "screen" : "multiply",
          filter: isNight
            ? "invert(1) grayscale(.2) sepia(.12) saturate(.8) brightness(.94) contrast(.9)"
            : "grayscale(.03) sepia(.05) saturate(.94) contrast(.98)",
        }}
      />
    </div>
  );
}
