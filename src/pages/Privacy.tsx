import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslations } from "@/lib/i18n";

const Privacy = () => {
  const { t } = useTranslations();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 sticky top-0 bg-background/95 backdrop-blur z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild aria-label={t("backToHome")}>
            <Link to="/">
              <ArrowLeft className="h-5 w-5" aria-hidden="true" />
            </Link>
          </Button>
          <h1 className="text-lg font-semibold">{t("privacyPolicyTitle")}</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <article className="prose prose-invert prose-sm max-w-none">
          <p className="text-muted-foreground text-sm mb-6">
            {t("privacyPolicyEffective")}
          </p>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-3">{t("privacyPolicyIntroTitle")}</h2>
            <p className="text-foreground/80 leading-relaxed">
              {t("privacyPolicyIntroText")}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-3">{t("privacyPolicyNoCollectTitle")}</h2>
            <p className="text-foreground/80 mb-3">{t("privacyPolicyNoCollectIntro")}</p>
            <ul className="list-disc list-inside space-y-1 text-foreground/70">
              <li>{t("privacyPolicyNoCollect1")}</li>
              <li>{t("privacyPolicyNoCollect2")}</li>
              <li>{t("privacyPolicyNoCollect3")}</li>
              <li>{t("privacyPolicyNoCollect4")}</li>
              <li>{t("privacyPolicyNoCollect5")}</li>
              <li>{t("privacyPolicyNoCollect6")}</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-3">{t("privacyPolicyLocalTitle")}</h2>
            <p className="text-foreground/80 leading-relaxed">
              {t("privacyPolicyLocalText")}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-3">{t("privacyPolicyThirdPartyTitle")}</h2>
            <p className="text-foreground/80 leading-relaxed">
              {t("privacyPolicyThirdPartyText")}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-3">{t("privacyPolicyChildrenTitle")}</h2>
            <p className="text-foreground/80 leading-relaxed">
              {t("privacyPolicyChildrenText")}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-3">{t("privacyPolicyChangesTitle")}</h2>
            <p className="text-foreground/80 leading-relaxed">
              {t("privacyPolicyChangesText")}
            </p>
          </section>

          <section className="mb-8 p-4 rounded-lg bg-muted/30 border border-border/50">
            <h2 className="text-lg font-semibold mb-3">{t("privacyPolicySummaryTitle")}</h2>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-muted-foreground">{t("privacyPolicySummaryQ1")}</span>
              <span className="text-foreground">{t("privacyPolicySummaryA1")}</span>
              <span className="text-muted-foreground">{t("privacyPolicySummaryQ2")}</span>
              <span className="text-foreground">{t("privacyPolicySummaryA2")}</span>
              <span className="text-muted-foreground">{t("privacyPolicySummaryQ3")}</span>
              <span className="text-foreground">{t("privacyPolicySummaryA3")}</span>
              <span className="text-muted-foreground">{t("privacyPolicySummaryQ4")}</span>
              <span className="text-foreground">{t("privacyPolicySummaryA4")}</span>
            </div>
          </section>
        </article>
      </main>

      <footer className="border-t border-border/50 py-6">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <p className="text-xs text-muted-foreground">{t("privacyPolicyFooter")}</p>
        </div>
      </footer>
    </div>
  );
};

export default Privacy;