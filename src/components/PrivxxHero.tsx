import { useTranslations } from "@/lib/i18n";

const PrivxxHero = () => {
  const { t } = useTranslations();

  return (
    <div className="flex flex-col items-center text-center space-y-3">
      {/* Stylized Logo */}
      <h1 className="text-5xl sm:text-6xl font-bold tracking-tight">
        <span className="text-foreground">Priv</span>
        <span className="text-primary">xx</span>
      </h1>
      
      {/* Tagline */}
      <p className="text-muted-foreground text-sm sm:text-base max-w-xs">
        {t("subtitle")}
      </p>
    </div>
  );
};

export default PrivxxHero;
