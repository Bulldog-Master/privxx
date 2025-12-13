// Two-layer abstract background representing Privxx's dual mission:
// Layer 1: Browsing/Internet (network paths, routing)
// Layer 2: Payments/Banking (structured geometry, transactions)
// No people, no photos, no cultural/regional imagery

const AbstractBackground = () => {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Light neutral base */}
      <div className="absolute inset-0 bg-gradient-to-br from-stone-50 via-white to-slate-50" />
      
      {/* ═══════════════════════════════════════════════════════════════
          LAYER 1: BROWSING / INTERNET (Back layer)
          - Abstract network routing visuals
          - Subtle lines, nodes, arcs representing packet flow
          - Very low opacity (5-8%)
          - Neutral tones (gray / soft blue-gray)
          ═══════════════════════════════════════════════════════════════ */}
      <svg 
        className="absolute inset-0 w-full h-full" 
        preserveAspectRatio="xMidYMid slice"
        viewBox="0 0 1440 900"
        aria-hidden="true"
      >
        {/* Network routing paths - organic, flowing */}
        <path
          d="M-100 300 Q 200 150, 400 300 T 800 250 T 1200 350 T 1600 200"
          stroke="hsl(220 15% 60% / 0.06)"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M-50 500 Q 300 400, 600 500 T 1100 450 T 1500 550"
          stroke="hsl(220 15% 60% / 0.05)"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M100 700 Q 400 600, 700 700 T 1200 650 T 1600 750"
          stroke="hsl(215 20% 55% / 0.04)"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
        
        {/* Network nodes - connection points */}
        <circle cx="400" cy="300" r="4" fill="hsl(220 15% 60% / 0.08)" />
        <circle cx="800" cy="250" r="3" fill="hsl(220 15% 60% / 0.06)" />
        <circle cx="1200" cy="350" r="5" fill="hsl(220 15% 60% / 0.05)" />
        <circle cx="600" cy="500" r="4" fill="hsl(215 20% 55% / 0.07)" />
        <circle cx="1100" cy="450" r="3" fill="hsl(215 20% 55% / 0.05)" />
        
        {/* Packet flow arcs - subtle routing visualization */}
        <path
          d="M300 200 C 450 100, 550 100, 700 200"
          stroke="hsl(210 15% 65% / 0.05)"
          strokeWidth="1"
          fill="none"
          strokeDasharray="8 4"
        />
        <path
          d="M900 300 C 1000 200, 1100 200, 1200 300"
          stroke="hsl(210 15% 65% / 0.04)"
          strokeWidth="1"
          fill="none"
          strokeDasharray="6 3"
        />
      </svg>

      {/* ═══════════════════════════════════════════════════════════════
          LAYER 2: PAYMENTS / BANKING (Front layer)
          - Abstract financial/transaction geometry
          - More structured than Layer 1
          - Slightly higher opacity (8-12%)
          - Subtle xx teal accents
          ═══════════════════════════════════════════════════════════════ */}
      <svg 
        className="absolute inset-0 w-full h-full" 
        preserveAspectRatio="xMidYMid slice"
        viewBox="0 0 1440 900"
        aria-hidden="true"
      >
        {/* Structured grid lines - ledger/transaction feel */}
        <line x1="200" y1="0" x2="200" y2="900" stroke="hsl(172 50% 45% / 0.04)" strokeWidth="1" />
        <line x1="600" y1="0" x2="600" y2="900" stroke="hsl(172 50% 45% / 0.03)" strokeWidth="1" />
        <line x1="1000" y1="0" x2="1000" y2="900" stroke="hsl(172 50% 45% / 0.04)" strokeWidth="1" />
        <line x1="1400" y1="0" x2="1400" y2="900" stroke="hsl(172 50% 45% / 0.03)" strokeWidth="1" />
        
        {/* Horizontal transaction flows */}
        <line x1="0" y1="300" x2="1440" y2="300" stroke="hsl(172 50% 45% / 0.03)" strokeWidth="1" />
        <line x1="0" y1="600" x2="1440" y2="600" stroke="hsl(172 50% 45% / 0.025)" strokeWidth="1" />
        
        {/* Value movement paths - precise, engineered */}
        <path
          d="M100 450 L 300 450 L 350 400 L 550 400 L 600 450 L 800 450"
          stroke="hsl(172 60% 40% / 0.10)"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M700 550 L 900 550 L 950 500 L 1150 500 L 1200 550 L 1400 550"
          stroke="hsl(172 60% 40% / 0.08)"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Transaction nodes - secure checkpoints */}
        <rect x="295" y="445" width="10" height="10" rx="2" fill="hsl(172 60% 40% / 0.10)" />
        <rect x="545" y="395" width="10" height="10" rx="2" fill="hsl(172 60% 40% / 0.08)" />
        <rect x="895" y="545" width="10" height="10" rx="2" fill="hsl(172 60% 40% / 0.09)" />
        <rect x="1145" y="495" width="10" height="10" rx="2" fill="hsl(172 60% 40% / 0.07)" />
        
        {/* Geometric accents - precision engineering */}
        <polygon 
          points="1300,150 1320,180 1280,180" 
          fill="hsl(172 50% 45% / 0.06)"
        />
        <polygon 
          points="180,700 200,730 160,730" 
          fill="hsl(172 50% 45% / 0.05)"
        />
      </svg>
      
      {/* Soft center focus - where layers converge */}
      <div 
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/4 w-[900px] h-[600px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse, hsl(172 40% 50% / 0.03) 0%, transparent 60%)'
        }}
      />
      
      {/* Top fade for header clarity */}
      <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-white/60 to-transparent" />
    </div>
  );
};

export default AbstractBackground;
