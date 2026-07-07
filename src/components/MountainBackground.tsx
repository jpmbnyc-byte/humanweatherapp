interface MountainBackgroundProps {
  theme: 'day' | 'night';
}

export default function MountainBackground({ theme }: MountainBackgroundProps) {
  const isNight = theme === 'night';

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
      {/* Soft radial glow — reference purple glow */}
      <div
        className="absolute top-[-10%] right-[-5%] w-[60vw] h-[60vw] max-w-[600px] max-h-[600px] rounded-full blur-[100px] transition-all duration-700"
        style={{
          background: isNight
            ? 'radial-gradient(circle, rgba(70,35,141,0.35) 0%, rgba(137,108,208,0.08) 50%, transparent 70%)'
            : 'radial-gradient(circle, rgba(147,144,255,0.45) 0%, rgba(204,202,255,0.2) 50%, transparent 75%)',
        }}
      />
      <div
        className="absolute bottom-[-15%] left-[-10%] w-[50vw] h-[50vw] max-w-[500px] max-h-[500px] rounded-full blur-[120px] transition-all duration-700"
        style={{
          background: isNight
            ? 'radial-gradient(circle, rgba(41,16,90,0.5) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(140,108,208,0.25) 0%, transparent 70%)',
        }}
      />

      {/* Layered mountain silhouettes */}
      <svg
        className="absolute bottom-0 left-0 w-full h-[45vh] min-h-[200px] transition-opacity duration-700"
        viewBox="0 0 1440 320"
        preserveAspectRatio="none"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M0,320 L0,200 C200,180 350,120 500,160 C650,200 800,80 1000,140 C1200,200 1300,100 1440,180 L1440,320 Z"
          fill={isNight ? '#29105A' : '#9390FF'}
          fillOpacity={isNight ? 0.6 : 0.25}
        />
        <path
          d="M0,320 L0,240 C180,220 320,180 480,210 C640,240 780,160 960,200 C1140,240 1280,180 1440,220 L1440,320 Z"
          fill={isNight ? '#46238D' : '#8C6CD0'}
          fillOpacity={isNight ? 0.5 : 0.2}
        />
        <path
          d="M0,320 L0,270 C150,260 300,250 500,270 C700,290 900,250 1100,275 C1250,290 1350,265 1440,280 L1440,320 Z"
          fill={isNight ? '#654487' : '#654487'}
          fillOpacity={isNight ? 0.4 : 0.15}
        />
      </svg>

      {/* Pine tree silhouettes along horizon */}
      <svg
        className="absolute bottom-[8vh] left-0 w-full h-[120px] transition-opacity duration-700"
        viewBox="0 0 1440 120"
        preserveAspectRatio="xMidYMax slice"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {[80, 200, 380, 520, 700, 880, 1050, 1200, 1350].map((x, i) => (
          <g key={i} transform={`translate(${x}, 0)`} opacity={isNight ? 0.35 : 0.2}>
            <polygon
              points="0,120 8,90 16,120"
              fill={isNight ? '#08011B' : '#46238D'}
            />
            <polygon
              points="4,95 12,65 20,95"
              fill={isNight ? '#08011B' : '#46238D'}
            />
            <rect x="10" y="95" width="4" height="25" fill={isNight ? '#08011B' : '#46238D'} />
          </g>
        ))}
      </svg>
    </div>
  );
}
