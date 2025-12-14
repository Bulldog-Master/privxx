import { useTranslations } from "@/lib/i18n";
import PrivxxLogo from "@/components/PrivxxLogo";

const PrivxxHero = () => {
  const { t } = useTranslations();

  return (
    <div className="flex flex-col items-center text-center space-y-4 relative">
      {/* Stylized Logo with custom mark */}
      <div className="relative">
        {/* Ambient glow dot - above left of "P" */}
        <div 
          className="absolute pointer-events-none z-0"
          style={{
            top: '-12px',
            left: '38%',
            width: '14px',
            height: '14px',
            borderRadius: '999px',
            background: 'rgba(64, 226, 198, 0.75)',
            boxShadow: '0 0 18px rgba(64, 226, 198, 0.55), 0 0 42px rgba(64, 226, 198, 0.25)',
            filter: 'blur(0.5px)',
            opacity: 0.5,
          }}
        />
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