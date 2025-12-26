import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslations } from "@/lib/i18n";

const Terms = () => {
  const { t } = useTranslations();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 sticky top-0 bg-background/95 backdrop-blur z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="text-lg font-semibold">{t("termsTitle")}</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <article className="prose prose-invert prose-sm max-w-none">
          <p className="text-muted-foreground text-sm mb-6">
            {t("termsUpdated")}
          </p>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-3">{t("termsUseTitle")}</h2>
            <p className="text-foreground/80 leading-relaxed">
              {t("termsUseBody")}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-3">{t("termsNoGuaranteesTitle")}</h2>
            <p className="text-foreground/80 leading-relaxed">
              {t("termsNoGuaranteesBody")}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-3">{t("termsPrivacyTitle")}</h2>
            <p className="text-foreground/80 leading-relaxed">
              {t("termsPrivacyBody")}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-3">{t("termsChangesTitle")}</h2>
            <p className="text-foreground/80 leading-relaxed">
              {t("termsChangesBody")}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-3">{t("termsContactTitle")}</h2>
            <p className="text-foreground/80 leading-relaxed">
              {t("termsContactBody")}
            </p>
          </section>
        </article>
      </main>

      <footer className="border-t border-border/50 py-6">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <p className="text-xs text-muted-foreground">{t("footerTagline")}</p>
        </div>
      </footer>
    </div>
  );
};

export default Terms;
