import { useTranslations } from "@/lib/i18n";

// XX Network symbol - stylized curved X mark
const XXSymbol = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 32 32" 
    fill="none" 
    className={className}
    aria-hidden="true"
  >
    {/* Curved X shape inspired by xx Network */}
    <path 
      d="M8 8C12 12 14 14 16 16C18 18 20 20 24 24" 
      stroke="currentColor" 
      strokeWidth="4" 
      strokeLinecap="round"
    />
    <path 
      d="M24 8C20 12 18 14 16 16C14 18 12 20 8 24" 
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
      
      {/* Stylized Logo */}
      <div className="relative">
        <h1 className="text-6xl sm:text-7xl font-bold tracking-tight flex items-baseline justify-center">
          <span className="text-foreground">Privx</span>
          <span className="inline-flex items-baseline">
            <XXSymbol className="w-[0.85em] h-[0.85em] text-primary drop-shadow-[0_0_15px_hsl(172,70%,52%,0.35)] translate-y-[0.05em]" />
          </span>
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
