// Abstract geometric background inspired by xx network logo curves
// Clean, modern, precise — no photos, no lifestyle imagery

const AbstractBackground = () => {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Light neutral base */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-slate-100" />
      
      {/* Subtle grid pattern for depth */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px'
        }}
      />
      
      {/* Large curved paths inspired by xx logo - flowing from corners */}
      <svg 
        className="absolute inset-0 w-full h-full" 
        preserveAspectRatio="xMidYMid slice"
        viewBox="0 0 1440 900"
      >
        {/* Top-left flowing curve */}
        <path
          d="M-100 200 Q 300 400, 500 100 T 900 300"
          stroke="hsl(172 70% 52% / 0.08)"
          strokeWidth="120"
          fill="none"
          strokeLinecap="round"
        />
        
        {/* Bottom-right flowing curve */}
        <path
          d="M1540 700 Q 1100 500, 900 800 T 400 600"
          stroke="hsl(172 70% 52% / 0.06)"
          strokeWidth="100"
          fill="none"
          strokeLinecap="round"
        />
        
        {/* Crossing path - represents mixnet routing */}
        <path
          d="M-50 600 Q 400 300, 720 450 T 1500 200"
          stroke="hsl(172 70% 52% / 0.05)"
          strokeWidth="80"
          fill="none"
          strokeLinecap="round"
        />
        
        {/* Subtle accent line */}
        <path
          d="M200 900 Q 600 700, 800 800 T 1200 600"
          stroke="hsl(172 70% 52% / 0.04)"
          strokeWidth="60"
          fill="none"
          strokeLinecap="round"
        />
      </svg>
      
      {/* Soft radial glow at center - focus point */}
      <div 
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] rounded-full"
        style={{
          background: 'radial-gradient(ellipse, hsl(172 70% 52% / 0.04) 0%, transparent 70%)'
        }}
      />
      
      {/* Top fade for header area */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-white/50 to-transparent" />
    </div>
  );
};

export default AbstractBackground;
