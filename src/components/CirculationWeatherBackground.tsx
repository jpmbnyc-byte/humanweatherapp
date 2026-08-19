import React, { useId } from 'react';

type Props = {
  theme: 'day' | 'night';
  intensity?: 'quiet' | 'alive';
};

const FLOW_PATHS = [
  'M500 108C290 112 126 262 142 448C158 628 352 622 420 772C458 856 416 938 344 980',
  'M516 104C720 124 884 268 858 456C836 616 660 646 588 774C540 860 576 936 650 982',
  'M334 22C402 158 344 278 238 344C126 414 72 532 122 670C168 796 290 844 398 884',
  'M678 20C610 156 672 278 776 346C886 418 926 532 878 670C834 790 716 844 606 886',
] as const;

/**
 * Ambient cardiovascular weather: warm oxygenated flow, cool return flow,
 * and slow pressure fronts. Pure SVG/CSS keeps the fixed layer inexpensive.
 */
export default function CirculationWeatherBackground({ theme, intensity = 'quiet' }: Props) {
  const rawId = useId().replace(/:/g, '');
  const warmId = `circulation-warm-${rawId}`;
  const coolId = `circulation-cool-${rawId}`;
  const plasmaId = `circulation-plasma-${rawId}`;
  const isNight = theme === 'night';

  return (
    <div
      className={`hw-circulation-weather hw-circulation-${theme} hw-circulation-${intensity}`}
      aria-hidden="true"
    >
      <div className="hw-liquid-mass hw-liquid-oxygen" />
      <div className="hw-liquid-mass hw-liquid-return" />
      <div className="hw-liquid-mass hw-liquid-plasma" />

      <svg
        className="hw-circulation-channels"
        viewBox="0 0 1000 1000"
        preserveAspectRatio="xMidYMid slice"
        focusable="false"
      >
        <defs>
          <linearGradient id={warmId} x1="0" y1="1" x2="1" y2="0">
            <stop offset="0" stopColor="#ff315f" stopOpacity={isNight ? 0.08 : 0.04} />
            <stop offset="0.45" stopColor="#ff2d55" stopOpacity={isNight ? 0.75 : 0.38} />
            <stop offset="1" stopColor="#ff8a3d" stopOpacity={isNight ? 0.42 : 0.22} />
          </linearGradient>
          <linearGradient id={coolId} x1="1" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#2bc7ff" stopOpacity={isNight ? 0.5 : 0.22} />
            <stop offset="0.5" stopColor="#3948ff" stopOpacity={isNight ? 0.72 : 0.34} />
            <stop offset="1" stopColor="#682bd7" stopOpacity={isNight ? 0.08 : 0.04} />
          </linearGradient>
          <linearGradient id={plasmaId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#ffd35a" stopOpacity="0" />
            <stop offset="0.5" stopColor="#ffb52e" stopOpacity={isNight ? 0.48 : 0.2} />
            <stop offset="1" stopColor="#fff1ad" stopOpacity="0" />
          </linearGradient>
        </defs>

        <g className="hw-pressure-fronts" fill="none">
          <path d="M-80 274C168 166 348 216 500 322C664 436 822 438 1080 304" />
          <path d="M-80 710C164 600 344 628 500 738C664 850 850 834 1080 704" />
          <ellipse cx="500" cy="514" rx="390" ry="452" />
          <ellipse cx="500" cy="514" rx="278" ry="346" />
        </g>

        {FLOW_PATHS.map((path, index) => (
          <g key={path}>
            <path className="hw-flow-channel-base" d={path} />
            <path
              className={`hw-flow-channel hw-flow-channel-${index % 2 === 0 ? 'warm' : 'cool'}`}
              d={path}
              stroke={`url(#${index % 2 === 0 ? warmId : coolId})`}
              style={{ animationDelay: `${index * -2.4}s` }}
            />
          </g>
        ))}

        <path
          className="hw-plasma-sweep"
          d="M-40 520C190 410 328 444 494 528C662 614 824 616 1040 500"
          stroke={`url(#${plasmaId})`}
        />
      </svg>

      <div className="hw-circulation-veil" />
    </div>
  );
}
