import { useTranslations } from "@/lib/i18n";
import PrivxxLogo from "@/components/PrivxxLogo";

const PrivxxHero = () => {
  const { t } = useTranslations();

  return (
    <div className="flex flex-col items-center text-center space-y-4 relative">
      {/* Subtle background glow */}
      <div className="absolute -inset-20 bg-primary/5 blur-3xl rounded-full pointer-events-none" />
      
      {/* Stylized Logo with custom mark */}
      <div className="relative">
        <h1 className="flex items-baseline justify-center">
          <PrivxxLogo size="lg" />
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
