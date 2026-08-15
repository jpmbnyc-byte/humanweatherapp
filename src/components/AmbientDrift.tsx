import React from 'react';

type Props = {
  intensity?: 'soft' | 'medium';
};

/** Calm-style drifting particles — fixed layer, no pointer events. */
export default function AmbientDrift({ intensity = 'soft' }: Props) {
  const count = intensity === 'medium' ? 14 : 9;
  const seeds = Array.from({ length: count }, (_, i) => ({
    id: i,
    left: `${8 + ((i * 17) % 84)}%`,
    top: `${6 + ((i * 23) % 88)}%`,
    size: 1 + (i % 3),
    delay: (i % 5) * 0.8,
    duration: 6 + (i % 4) * 1.5,
  }));

  return (
    <div className="hw-ambient-drift fixed inset-0 pointer-events-none z-[1] overflow-hidden" aria-hidden>
      {seeds.map(s => (
        <span
          key={s.id}
          className="hw-ambient-particle absolute rounded-full bg-accent/25"
          style={{
            left: s.left,
            top: s.top,
            width: s.size,
            height: s.size,
            animationDelay: `${s.delay}s`,
            animationDuration: `${s.duration}s`,
          }}
        />
      ))}
    </div>
  );
}
