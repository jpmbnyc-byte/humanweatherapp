import React from "react";

type Props = {
  currentTheme: "day" | "night";
};

/**
 * An original, non-anatomical body compass. The doubled limbs suggest capacity
 * for movement without assigning gender, musculature, or an ideal body shape.
 */
export default function SomaticBodyFigure({ currentTheme }: Props) {
  const stroke = currentTheme === "night" ? "#d4b05a" : "#9a7442";

  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid meet"
      className="absolute inset-[7%] w-[86%] h-[86%] pointer-events-none select-none z-0"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="50" cy="51" r="41" fill="none" stroke={stroke} strokeWidth="0.55" opacity="0.2" />
      <path d="M10 51H90M50 8V93" stroke={stroke} strokeWidth="0.35" opacity="0.12" />

      {/* Head and quiet center line */}
      <circle cx="50" cy="18" r="6.2" fill={stroke} opacity="0.09" />
      <circle
        cx="50"
        cy="18"
        r="6.2"
        fill="none"
        stroke={stroke}
        strokeWidth="1.15"
        opacity="0.48"
      />
      <path d="M50 24.5V61" fill="none" stroke={stroke} strokeWidth="1.25" opacity="0.5" />

      {/* Open torso: a field rather than gendered anatomy */}
      <path d="M43 28Q50 25 57 28L60 48Q58 57 50 62Q42 57 40 48Z" fill={stroke} opacity="0.055" />
      <path
        d="M43 28Q50 25 57 28L60 48Q58 57 50 62Q42 57 40 48Z"
        fill="none"
        stroke={stroke}
        strokeWidth="1.05"
        opacity="0.42"
      />
      <circle cx="50" cy="39" r="2.1" fill="none" stroke={stroke} strokeWidth="0.7" opacity="0.3" />
      <circle cx="50" cy="52" r="2.1" fill="none" stroke={stroke} strokeWidth="0.7" opacity="0.3" />

      {/* Resting and extended arms */}
      <path
        d="M43 30L31 48L27 67M57 30L69 48L73 67"
        fill="none"
        stroke={stroke}
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0.44"
      />
      <path
        d="M43 31L23 38L8 51M57 31L77 38L92 51"
        fill="none"
        stroke={stroke}
        strokeWidth="1.05"
        strokeLinecap="round"
        opacity="0.34"
      />
      <path
        d="M42 33L24 24L11 16M58 33L76 24L89 16"
        fill="none"
        stroke={stroke}
        strokeWidth="0.9"
        strokeLinecap="round"
        opacity="0.26"
      />

      {/* Standing and extended legs */}
      <path
        d="M46 60L44 77L42 93M54 60L56 77L58 93"
        fill="none"
        stroke={stroke}
        strokeWidth="1.25"
        strokeLinecap="round"
        opacity="0.48"
      />
      <path
        d="M46 60L34 75L23 88M54 60L66 75L77 88"
        fill="none"
        stroke={stroke}
        strokeWidth="1.05"
        strokeLinecap="round"
        opacity="0.34"
      />

      {/* Small joints keep the figure about sensation and motion */}
      {["31,48", "69,48", "44,77", "56,77", "34,75", "66,75"].map((point) => {
        const [cx, cy] = point.split(",").map(Number);
        return <circle key={point} cx={cx} cy={cy} r="1.35" fill={stroke} opacity="0.28" />;
      })}
    </svg>
  );
}
