import { useTranslations } from "@/lib/i18n";
import PrivxxLogo from "@/components/PrivxxLogo";

const PrivxxHero = () => {
  const { t } = useTranslations();

  return (
    <div className="flex flex-col items-center text-center space-y-4 relative">
      {/* Stylized Logo with custom mark */}
      <div className="relative">
        <h1 className="flex items-baseline justify-center">
          <PrivxxLogo size="lg" darkText />
        </h1>
        
        {/* Accent underline */}
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-16 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent opacity-70" />
      </div>
      
      {/* Tagline - dark text for bright background, centered */}
      <p className="text-slate-600 text-sm sm:text-base pt-2 font-medium w-full text-center">
        {t("subtitle")}
      </p>
    </div>
  );
};

export default PrivxxHero;
