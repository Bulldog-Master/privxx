import { useTranslations } from "@/lib/i18n";
import PrivxxLogo from "@/components/PrivxxLogo";

const PrivxxHero = () => {
  const { t } = useTranslations();

  return (
    <div className="flex flex-col items-center text-center space-y-4 relative">
      {/* Stylized Logo with custom mark */}
      <div className="relative">
        <h1 className="flex items-baseline justify-center">
          <PrivxxLogo size="lg" />
        </h1>
      </div>
      
      {/* Tagline - same brightness as logo text */}
      <p className="text-foreground text-sm sm:text-base pt-2 font-medium w-full text-center">
        {t("subtitle")}
      </p>
    </div>
  );
};

export default PrivxxHero;