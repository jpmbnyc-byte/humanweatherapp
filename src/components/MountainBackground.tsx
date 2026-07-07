interface MountainBackgroundProps {
  theme: 'day' | 'night';
}

/** Subtle ambient warmth — gallery light, not a color theme */
export default function MountainBackground({ theme }: MountainBackgroundProps) {
  const isNight = theme === 'night';

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
      <div
        className="absolute top-[-20%] right-[-10%] w-[70vw] h-[70vw] max-w-[700px] max-h-[700px] rounded-full blur-[140px] transition-all duration-1000"
        style={{
          background: isNight
            ? 'radial-gradient(circle, rgba(212,176,90,0.04) 0%, transparent 65%)'
            : 'radial-gradient(circle, rgba(196,160,68,0.08) 0%, rgba(250,248,245,0) 70%)',
        }}
      />
      <div
        className="absolute bottom-[-30%] left-[-15%] w-[55vw] h-[55vw] max-w-[550px] max-h-[550px] rounded-full blur-[160px] transition-all duration-1000"
        style={{
          background: isNight
            ? 'radial-gradient(circle, rgba(30,28,24,0.6) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(232,226,216,0.35) 0%, transparent 70%)',
        }}
      />
    </div>
  );
}
