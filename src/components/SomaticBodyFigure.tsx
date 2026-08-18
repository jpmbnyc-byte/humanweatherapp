import React, { useId } from "react";

type Props = { currentTheme: "day" | "night" };

/** Original atelier-style body compass: a clothed, gender-neutral movement study. */
export default function SomaticBodyFigure({ currentTheme }: Props) {
  const rawId = useId().replace(/:/g, "");
  const sketchId = `somatic-sketch-${rawId}`;
  const hatchId = `somatic-hatch-${rawId}`;
  const ink = currentTheme === "night" ? "#d4b05a" : "#765936";
  const contour = {
    fill: "none",
    stroke: ink,
    strokeWidth: 0.9,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid meet"
      className="absolute inset-[5%] w-[90%] h-[90%] pointer-events-none select-none z-0"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <filter id={sketchId} x="-8%" y="-8%" width="116%" height="116%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.055"
            numOctaves="2"
            seed="17"
            result="noise"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale="0.45"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
        <pattern
          id={hatchId}
          width="3"
          height="3"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(18)"
        >
          <path d="M0 0V3" stroke={ink} strokeWidth="0.32" opacity="0.25" />
        </pattern>
      </defs>

      <g opacity="0.28" filter={`url(#${sketchId})`}>
        <circle cx="50" cy="51" r="42" {...contour} strokeWidth="0.55" />
        <path d="M8 9H92V93H8Z" {...contour} strokeWidth="0.42" opacity="0.65" />
        <path d="M8 51H92M50 9V93" {...contour} strokeWidth="0.28" opacity="0.45" />
      </g>

      <g fill={ink} opacity="0.07">
        <ellipse cx="50" cy="18" rx="5.6" ry="7" />
        <path d="M43 27Q50 24 57 27L61 43Q60 56 54 62H46Q40 56 39 43Z" />
        <path d="M44 29L29 35L10 47L12 51L32 43L46 36Z" />
        <path d="M56 29L71 35L90 47L88 51L68 43L54 36Z" />
        <path d="M45 29L29 25L12 14L9 18L27 33L45 37Z" />
        <path d="M55 29L71 25L88 14L91 18L73 33L55 37Z" />
        <path d="M46 59L42 77L40 94H47L50 64Z" />
        <path d="M54 59L58 77L60 94H53L50 64Z" />
        <path d="M46 59L32 73L19 88L24 92L41 79L50 64Z" />
        <path d="M54 59L68 73L81 88L76 92L59 79L50 64Z" />
      </g>

      <g filter={`url(#${sketchId})`} opacity="0.52">
        <ellipse cx="50" cy="18" rx="5.7" ry="7.1" {...contour} strokeWidth="1.05" />
        <path d="M47 24L46 28M53 24L54 28" {...contour} />
        <path
          d="M43 28Q50 24.5 57 28L60.5 42Q60 54 54 61Q50 64 46 61Q40 54 39.5 42Z"
          {...contour}
          strokeWidth="1.15"
        />
        <path
          d="M42 31Q50 35 58 31M41 42Q50 45 59 42M45 59Q50 56 55 59"
          {...contour}
          strokeWidth="0.55"
          opacity="0.7"
        />

        <path d="M43 29Q35 31 28 35L10 46Q8 48 10 51Q12 53 15 51L31 43Q38 40 45 36Z" {...contour} />
        <path
          d="M57 29Q65 31 72 35L90 46Q92 48 90 51Q88 53 85 51L69 43Q62 40 55 36Z"
          {...contour}
        />
        <path
          d="M10 46L6 45L3 47L7 49L4 51L10 51M90 46L94 45L97 47L93 49L96 51L90 51"
          {...contour}
          strokeWidth="0.65"
        />

        <path
          d="M44 29Q35 27 28 24L12 14Q9 13 8 16Q8 19 11 20L27 33Q35 37 44 37Z"
          {...contour}
          opacity="0.78"
        />
        <path
          d="M56 29Q65 27 72 24L88 14Q91 13 92 16Q92 19 89 20L73 33Q65 37 56 37Z"
          {...contour}
          opacity="0.78"
        />
        <path
          d="M12 14L9 10L6 9L8 13L4 12L8 16M88 14L91 10L94 9L92 13L96 12L92 16"
          {...contour}
          strokeWidth="0.65"
        />

        <path
          d="M46 59Q43 67 42 76Q41 84 40 92L37 95Q41 97 46 94L48 78L50 64Z"
          {...contour}
          strokeWidth="1.05"
        />
        <path
          d="M54 59Q57 67 58 76Q59 84 60 92L63 95Q59 97 54 94L52 78L50 64Z"
          {...contour}
          strokeWidth="1.05"
        />
        <path d="M41 77Q44 79 48 78M52 78Q56 79 59 77" {...contour} strokeWidth="0.55" />

        <path
          d="M46 59Q38 65 32 72L19 87L15 89Q17 94 23 92L39 80Q45 73 50 64Z"
          {...contour}
          opacity="0.78"
        />
        <path
          d="M54 59Q62 65 68 72L81 87L85 89Q83 94 77 92L61 80Q55 73 50 64Z"
          {...contour}
          opacity="0.78"
        />
        <path d="M31 73Q35 77 39 80M61 80Q65 77 69 73" {...contour} strokeWidth="0.55" />
      </g>

      <g filter={`url(#${sketchId})`} opacity="0.2" transform="translate(0.45 -0.25)">
        <ellipse cx="50" cy="18" rx="5.9" ry="7.25" {...contour} />
        <path d="M43 28Q50 24 57 28L61 43Q59 56 54 61L50 64L46 61Q40 55 39 42Z" {...contour} />
        <path
          d="M43 30L29 35L10 48M57 30L71 35L90 48M44 30L28 25L10 16M56 30L72 25L90 16"
          {...contour}
        />
        <path
          d="M46 60L42 77L40 94M54 60L58 77L60 94M46 60L32 73L19 89M54 60L68 73L81 89"
          {...contour}
        />
      </g>

      <g opacity="0.13" fill={`url(#${hatchId})`}>
        <path d="M43 29Q50 25 57 29L59 43Q58 54 53 60H47Q42 54 41 43Z" />
        <circle cx="31" cy="39" r="4" />
        <circle cx="69" cy="39" r="4" />
        <circle cx="43" cy="77" r="4" />
        <circle cx="57" cy="77" r="4" />
      </g>
    </svg>
  );
}
