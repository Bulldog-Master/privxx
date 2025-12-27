import { useTranslation } from "react-i18next";
import PrivxxLogo from "./PrivxxLogo";

const PrivxxHero = () => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center text-center space-y-4 relative">
      {/* Stylized Logo with custom mark */}
      <div className="hero">
        <div className="hero-ambient-dot" />
        <h1 className="flex items-baseline justify-center relative z-10">
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
