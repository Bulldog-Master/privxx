import { useTranslations } from "@/lib/i18n";

// Custom Privxx mark: 3 lines forming 2 overlapping Xs
// Line 1 & 2 cross = first X, Line 2 & 3 cross = second X
// Middle line (2) is shared — creates network/mixing symbolism
const PrivxxMark = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 40 32" 
    fill="none" 
    className={className}
    aria-hidden="true"
  >
    {/* Line 1: top-left to bottom-right (first X, left stroke) */}
    <path 
      d="M4 4L20 28" 
      stroke="currentColor" 
      strokeWidth="4" 
      strokeLinecap="round"
    />
    {/* Line 2: top-right to bottom-left (shared middle line) */}
    <path 
      d="M20 4L4 28" 
      stroke="currentColor" 
      strokeWidth="4" 
      strokeLinecap="round"
    />
    {/* Line 3: offset top-left to bottom-right (second X, right stroke) */}
    <path 
      d="M36 4L20 28" 
      stroke="currentColor" 
      strokeWidth="4" 
      strokeLinecap="round"
    />
  </svg>
);

const PrivxxHero = () => {
  const { t } = useTranslations();

  return (
    <div className="flex flex-col items-center text-center space-y-4 relative">
      {/* Subtle background glow */}
      <div className="absolute -inset-20 bg-primary/5 blur-3xl rounded-full pointer-events-none" />
      
      {/* Stylized Logo with custom mark */}
      <div className="relative">
        <h1 className="text-6xl sm:text-7xl font-bold tracking-tight flex items-baseline justify-center">
          <span className="text-foreground">Privx</span>
          <PrivxxMark className="w-[0.75em] h-[0.6em] text-primary ml-0.5 -translate-y-[0.15em]" />
        </h1>
        
        {/* Accent underline */}
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-16 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />
      </div>
      
      {/* Tagline */}
      <p className="text-muted-foreground text-sm sm:text-base max-w-xs pt-2">
        {t("subtitle")}
      </p>
    </div>
  );
};

export default PrivxxHero;
