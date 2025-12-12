import { useTranslations } from "@/lib/i18n";

// XX Network symbol component - stylized X mark
const XXSymbol = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    className={className}
    aria-hidden="true"
  >
    <path 
      d="M4 4L12 12M12 12L20 20M12 12L20 4M12 12L4 20" 
      stroke="currentColor" 
      strokeWidth="3.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
);

const PrivxxHero = () => {
  const { t } = useTranslations();

  return (
    <div className="flex flex-col items-center text-center space-y-4 relative">
      {/* Subtle background glow */}
      <div className="absolute -inset-20 bg-primary/5 blur-3xl rounded-full pointer-events-none" />
      
      {/* Stylized Logo */}
      <div className="relative">
        <h1 className="text-6xl sm:text-7xl font-bold tracking-tight flex items-center justify-center">
          <span className="text-foreground">Priv</span>
          <span className="text-primary drop-shadow-[0_0_20px_hsl(172,70%,52%,0.4)]">x</span>
          <XXSymbol className="w-10 h-10 sm:w-12 sm:h-12 text-primary drop-shadow-[0_0_20px_hsl(172,70%,52%,0.5)] -ml-1" />
        </h1>
        
        {/* Accent underline */}
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-16 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent opacity-60" />
      </div>
      
      {/* Tagline */}
      <p className="text-muted-foreground text-sm sm:text-base max-w-xs pt-2">
        {t("subtitle")}
      </p>
    </div>
  );
};

export default PrivxxHero;
