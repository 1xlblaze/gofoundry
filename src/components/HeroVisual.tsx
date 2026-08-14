export function HeroVisual() {
  return (
    <svg
      viewBox="0 0 1200 800"
      className="animate-drift h-full w-full"
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label="Abstract forge lattice of Go runtime and data-structure nodes"
    >
      <defs>
        <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#007a72" />
          <stop offset="100%" stopColor="#1e3a5f" />
        </linearGradient>
        <linearGradient id="g2" x1="1" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0e7490" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#99f6e4" stopOpacity="0.35" />
        </linearGradient>
        <filter id="soft">
          <feGaussianBlur stdDeviation="28" />
        </filter>
      </defs>
      <rect width="1200" height="800" fill="transparent" />
      <circle cx="880" cy="160" r="220" fill="url(#g2)" filter="url(#soft)" opacity="0.55" />
      <circle cx="240" cy="620" r="260" fill="url(#g1)" filter="url(#soft)" opacity="0.4" />
      <g
        fill="none"
        stroke="#0b1220"
        strokeWidth="1.75"
        strokeDasharray="7 12"
        opacity="0.55"
        style={{ animation: "pulse-line 5s linear infinite" }}
      >
        <path d="M80 360 C260 80, 420 680, 680 240 S980 180, 1140 360" />
        <path d="M60 520 C280 480, 400 160, 640 460 S920 620, 1120 480" opacity="0.55" />
        <path d="M200 200 C360 300, 520 120, 760 280 S980 420, 1100 260" opacity="0.35" />
      </g>
      {[
        [180, 280],
        [320, 180],
        [460, 420],
        [580, 220],
        [720, 360],
        [860, 200],
        [980, 320],
        [260, 500],
        [420, 580],
        [640, 540],
        [820, 500],
        [1000, 460],
      ].map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r="11" fill="#0b1220" />
          <circle cx={x} cy={y} r="4.5" fill="#99f6e4" />
        </g>
      ))}
      <g
        fontFamily="var(--font-mono), monospace"
        fontSize="14"
        fill="#0b1220"
        opacity="0.55"
      >
        <text x="150" y="260">slice</text>
        <text x="545" y="200">graph</text>
        <text x="790" y="485">heap</text>
        <text x="390" y="560">chan</text>
        <text x="930" y="300">goroutine</text>
      </g>
    </svg>
  );
}
