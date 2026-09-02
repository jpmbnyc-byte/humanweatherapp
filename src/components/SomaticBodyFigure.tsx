import React, { useId } from "react";
import { SomaticFigurePreference } from "../lib/somaticFigure";

type Props = { currentTheme: "day" | "night"; preference: SomaticFigurePreference };

/** A quiet full-length body field. The face may be locally personalised; anatomy is never inferred. */
export default function SomaticBodyFigure({ currentTheme, preference }: Props) {
  const id = useId().replace(/:/g, "");
  const faceClip = `somatic-face-${id}`;
  const paper = currentTheme === "night" ? "#d8c7a9" : "#5d5146";
  const wash = currentTheme === "night" ? "#c7ad7d" : "#b8a184";

  return (
    <svg viewBox="0 0 100 180" preserveAspectRatio="xMidYMid meet"
      className="pointer-events-none absolute inset-0 z-0 h-full w-full select-none"
      aria-hidden="true" focusable="false">
      <defs>
        <clipPath id={faceClip}><ellipse cx="50" cy="24" rx="8.2" ry="10" /></clipPath>
        <filter id={`soft-${id}`} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="5.5" />
        </filter>
      </defs>
      <g opacity={currentTheme === "night" ? 0.22 : 0.16} filter={`url(#soft-${id})`}>
        <ellipse cx="49" cy="69" rx="25" ry="20" fill="#b86050" />
        <ellipse cx="51" cy="103" rx="24" ry="22" fill="#557987" />
        <ellipse cx="48" cy="127" rx="22" ry="18" fill="#9b574d" />
      </g>
      <g fill="none" stroke={paper} strokeLinecap="round" strokeLinejoin="round">
        <path d="M50 7V173" strokeWidth=".34" opacity=".35" />
        <path d="M46 34C43 38 37 40 32 43C28 46 27 55 26 67L22 102C21 108 24 112 28 109L31 77" strokeWidth=".72" opacity=".58" />
        <path d="M54 34C57 38 63 40 68 43C72 46 73 55 74 67L78 102C79 108 76 112 72 109L69 77" strokeWidth=".72" opacity=".58" />
        <path d="M43 37C39 48 36 64 36 82C36 94 39 104 40 112L38 157C38 164 42 168 47 165L49 112" strokeWidth=".82" opacity=".66" />
        <path d="M57 37C61 48 64 64 64 82C64 94 61 104 60 112L62 157C62 164 58 168 53 165L51 112" strokeWidth=".82" opacity=".66" />
        <path d="M40 112C44 115 56 115 60 112" strokeWidth=".55" opacity=".45" />
        <path d="M38 157C35 161 34 166 35 169C39 171 44 170 47 166M62 157C65 161 66 166 65 169C61 171 56 170 53 166" strokeWidth=".62" opacity=".58" />
        <path d="M43 37C45 34 46 32 46 30M57 37C55 34 54 32 54 30" strokeWidth=".52" opacity=".5" />
        <ellipse cx="50" cy="23" rx="8" ry="10.5" strokeWidth=".72" opacity=".68" />
        <path d="M43 20C44 12 48 10 51 11C56 11 58 16 57 21" strokeWidth="1" opacity=".65" />
      </g>
      <path d="M43 38C39 55 38 75 39 91C40 103 42 108 50 110C58 108 60 103 61 91C62 75 61 55 57 38C53 41 47 41 43 38Z"
        fill={wash} opacity={currentTheme === "night" ? 0.12 : 0.1} />
      {preference.kind === "likeness" && preference.portrait ? (
        <g clipPath={`url(#${faceClip})`}>
          <image href={preference.portrait} x="41.8" y="13" width="16.4" height="21"
            preserveAspectRatio="xMidYMid slice" opacity={currentTheme === "night" ? 0.76 : 0.82} />
          <ellipse cx="50" cy="23.5" rx="8.2" ry="10" fill={wash} opacity=".1" />
        </g>
      ) : (
        <g fill="none" stroke={paper} strokeLinecap="round" opacity=".45">
          <path d="M46 22.5H48M52 22.5H54M48 27C49.5 28 50.5 28 52 27" strokeWidth=".48" />
          {preference.standard === "man" && <path d="M44 25C45 31 48 33 50 33C53 33 56 30 56 25" strokeWidth=".62" />}
        </g>
      )}
    </svg>
  );
}
