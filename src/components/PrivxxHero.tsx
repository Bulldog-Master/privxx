import { useTranslations } from "@/lib/i18n";

const PrivxxHero = () => {
  const { t } = useTranslations();

  return (
    <div className="flex flex-col items-center text-center space-y-4 relative">
      {/* Subtle background glow */}
      <div className="absolute -inset-20 bg-primary/5 blur-3xl rounded-full pointer-events-none" />
      
      {/* Stylized Logo */}
      <div className="relative">
        <h1 className="text-6xl sm:text-7xl font-bold tracking-tight">
          <span className="text-foreground">Priv</span>
          <span className="text-primary drop-shadow-[0_0_20px_hsl(172,70%,52%,0.4)]">xx</span>
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
