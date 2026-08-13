export function HeroVisual() {
  return (
    <svg
      viewBox="0 0 640 480"
      className="animate-drift h-full w-full"
      role="img"
      aria-label="Abstract lattice of nodes and paths representing Go data structures"
    >
      <defs>
        <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0f766e" />
          <stop offset="100%" stopColor="#0e7490" />
        </linearGradient>
        <linearGradient id="g2" x1="1" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c45c26" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#5eead4" stopOpacity="0.5" />
        </linearGradient>
        <filter id="soft">
          <feGaussianBlur stdDeviation="18" />
        </filter>
      </defs>
      <rect width="640" height="480" fill="transparent" />
      <circle cx="480" cy="90" r="120" fill="url(#g2)" filter="url(#soft)" opacity="0.45" />
      <circle cx="120" cy="360" r="140" fill="url(#g1)" filter="url(#soft)" opacity="0.35" />
      <g
        fill="none"
        stroke="#0b4f4a"
        strokeWidth="2"
        strokeDasharray="6 10"
        style={{ animation: "pulse-line 4s linear infinite" }}
      >
        <path d="M80 240 C180 80, 300 400, 420 160 S560 120, 600 220" />
        <path d="M60 320 C200 280, 260 120, 380 280 S520 360, 580 300" opacity="0.5" />
      </g>
      {[
        [120, 180],
        [220, 120],
        [300, 260],
        [380, 160],
        [460, 240],
        [520, 140],
        [180, 300],
        [280, 360],
        [400, 320],
        [500, 300],
      ].map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r="10" fill="#102a2e" />
          <circle cx={x} cy={y} r="4" fill="#5eead4" />
        </g>
      ))}
      <g fontFamily="var(--font-mono)" fontSize="12" fill="#0b4f4a">
        <text x="96" y="168">slice</text>
        <text x="360" y="148">graph</text>
        <text x="470" y="288">heap</text>
        <text x="250" y="348">chan</text>
      </g>
    </svg>
  );
}
