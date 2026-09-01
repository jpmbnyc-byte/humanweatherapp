import React, { useId } from "react";
import { SomaticFigurePreference } from "../lib/somaticFigure";

type Props = { currentTheme: "day" | "night"; preference: SomaticFigurePreference };
type TileBand = readonly [row: number, startsAndEnds: readonly number[]];

/** Frontal, gender-neutral body constellation built from the grid's own visual language. */
const BODY_TILE_BANDS: readonly TileBand[] = [
  [1, [7, 8]],
  [2, [6, 9]],
  [3, [6, 9]],
  [4, [7, 8]],
  [5, [4, 11]],
  [6, [3, 12]],
  [7, [3, 12]],
  [8, [3, 12]],
  [9, [4, 11]],
  [10, [4, 11]],
  [11, [4, 11]],
  [12, [4, 11]],
  [13, [5, 10]],
  [14, [5, 7, 8, 10]],
  [15, [5, 7, 8, 10]],
  [16, [5, 7, 8, 10]],
  [17, [5, 7, 8, 10]],
  [18, [5, 7, 8, 10]],
  [19, [4, 7, 8, 11]],
] as const;

const BODY_TILES = BODY_TILE_BANDS.flatMap(([row, startsAndEnds]) => {
  const tiles: { x: number; y: number; key: string }[] = [];
  for (let range = 0; range < startsAndEnds.length; range += 2) {
    for (let column = startsAndEnds[range]; column <= startsAndEnds[range + 1]; column += 1) {
      tiles.push({ x: column, y: row, key: `${row}-${column}` });
    }
  }
  return tiles;
});

function HandContours({ side, ink }: { side: "left" | "right"; ink: string }) {
  const flip = side === "right" ? "translate(100 0) scale(-1 1)" : undefined;
  return (
    <g transform={flip} fill="none" stroke={ink} strokeLinecap="round" strokeLinejoin="round">
      <path d="M39 34C31 34 27 39 23 45C19 51 14 54 8 54" strokeWidth="0.8" />
      <path d="M39 39C32 40 29 45 25 50C20 57 14 60 8 60" strokeWidth="0.62" />
      <path
        d="M8 51.7C5.5 51 3.7 51.3 2.2 52.2C1.2 52.9 1.6 54 2.8 54.1L7.8 54"
        strokeWidth="0.58"
      />
      <path
        d="M7.8 54L2.2 55.3M7.9 55.1L2.8 57M8.2 56.2L4 58.3M8.6 57L5.4 59.1"
        strokeWidth="0.5"
      />
      <path d="M8.4 53.4C9.6 54.8 9.5 56.4 8.4 57.4" strokeWidth="0.42" opacity="0.75" />
    </g>
  );
}

function FootContours({ side, ink }: { side: "left" | "right"; ink: string }) {
  const flip = side === "right" ? "translate(100 0) scale(-1 1)" : undefined;
  return (
    <g transform={flip} fill="none" stroke={ink} strokeLinecap="round" strokeLinejoin="round">
      <path
        d="M44 88C43.7 91.5 41.7 93.2 38.5 94.5C36.8 95.2 37.2 96.6 39.2 96.8H47.8"
        strokeWidth="0.72"
      />
      <path
        d="M38.8 94.5L38.4 96M40.7 93.8L40.5 96.3M42.7 92.9L42.6 96.4M44.6 91.8L44.7 96.5M46.3 90.8L46.6 96.5"
        strokeWidth="0.42"
      />
      <path d="M38.4 96.5C41.3 97.3 44.7 97.3 48 96.6" strokeWidth="0.38" opacity="0.8" />
    </g>
  );
}

/** Original mosaic body compass with hands, feet, and orbital field lines. */
export default function SomaticBodyFigure({ currentTheme, preference }: Props) {
  const rawId = useId().replace(/:/g, "");
  const glowId = `body-constellation-glow-${rawId}`;
  const portraitId = `body-portrait-${rawId}`;
  const ink = currentTheme === "night" ? "#d4b05a" : "#8a6f2e";
  const tileOpacity = currentTheme === "night" ? 0.34 : 0.22;

  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid meet"
      className="absolute inset-[4%] z-0 h-[92%] w-[92%] pointer-events-none select-none"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <filter id={glowId} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="0.65" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <clipPath id={portraitId}>
          <ellipse cx="50" cy="16.5" rx="6.2" ry="7.6" />
        </clipPath>
      </defs>

      <g fill="none" stroke={ink} opacity={currentTheme === "night" ? 0.28 : 0.18}>
        <circle cx="50" cy="50" r="44" strokeWidth="0.65" />
        <ellipse cx="50" cy="50" rx="34" ry="44" strokeWidth="0.45" />
        <path d="M15 27C25 27 29 35 34 43C38 49 42 51 46 51" strokeWidth="0.52" />
        <path d="M85 27C75 27 71 35 66 43C62 49 58 51 54 51" strokeWidth="0.52" />
        <path d="M15 69C25 69 30 74 35 81M85 69C75 69 70 74 65 81" strokeWidth="0.44" />
      </g>

      <g
        transform="translate(18 4) scale(4 4.55)"
        fill={ink}
        opacity={tileOpacity}
        filter={`url(#${glowId})`}
      >
        {BODY_TILES.map((tile) => (
          <rect key={tile.key} x={tile.x} y={tile.y} width="0.72" height="0.72" rx="0.12" />
        ))}
      </g>

      <g opacity={currentTheme === "night" ? 0.42 : 0.3}>
        <HandContours side="left" ink={ink} />
        <HandContours side="right" ink={ink} />
        <FootContours side="left" ink={ink} />
        <FootContours side="right" ink={ink} />
      </g>

      <g fill="none" stroke={ink} opacity={currentTheme === "night" ? 0.24 : 0.16}>
        <ellipse cx="50" cy="16.5" rx="5.7" ry="7" strokeWidth="0.52" />
        <path d="M43 28C45 25.5 47.5 25 50 25C52.5 25 55 25.5 57 28" strokeWidth="0.5" />
        <path d="M43 56C45 59 47 60.5 50 60.5C53 60.5 55 59 57 56" strokeWidth="0.46" />
      </g>

      {preference.kind === "likeness" && preference.portrait && (
        <g clipPath={`url(#${portraitId})`} opacity={currentTheme === "night" ? 0.74 : 0.82}>
          <image
            href={preference.portrait}
            x="43.8"
            y="8.8"
            width="12.4"
            height="15.2"
            preserveAspectRatio="xMidYMid slice"
          />
          <ellipse
            cx="50"
            cy="16.5"
            rx="6.2"
            ry="7.6"
            fill={currentTheme === "night" ? "#171713" : "#d8c9b4"}
            opacity={currentTheme === "night" ? 0.18 : 0.12}
          />
        </g>
      )}

      {preference.kind === "standard" && (
        <g
          fill="none"
          stroke={ink}
          opacity={currentTheme === "night" ? 0.38 : 0.28}
          strokeLinecap="round"
        >
          {preference.standard === "man" ? (
            <>
              <path
                d="M44.7 14.3C45.6 10.4 48.1 9.2 50.3 9.2C52.8 9.2 54.8 10.6 55.4 14.3"
                strokeWidth="0.8"
              />
              <path d="M46.5 19.5C48.2 21.4 52 21.4 53.6 19.5" strokeWidth="0.45" />
            </>
          ) : (
            <>
              <path
                d="M44.6 15C44.8 10.7 47.2 9.1 50 9.1C52.8 9.1 55.2 10.7 55.4 15"
                strokeWidth="0.68"
              />
              <path
                d="M45.1 14.4C44.8 17.5 45.2 20.6 46.1 22.2M54.9 14.4C55.2 17.5 54.8 20.6 53.9 22.2"
                strokeWidth="0.48"
              />
            </>
          )}
          <path
            d="M47.2 16.1H49M51 16.1H52.8M48.6 19.3C49.5 19.7 50.5 19.7 51.4 19.3"
            strokeWidth="0.38"
          />
        </g>
      )}
    </svg>
  );
}
