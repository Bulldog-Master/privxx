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
          <p className="text-primary/60 text-sm mb-6">
            {t("privacyPolicyEffective")}
          </p>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-3 text-primary">{t("privacyPolicyIntroTitle")}</h2>
            <p className="text-primary/70 leading-relaxed">
              {t("privacyPolicyIntroText")}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-3 text-primary">{t("privacyPolicyNoCollectTitle")}</h2>
            <p className="text-primary/70 mb-3">{t("privacyPolicyNoCollectIntro")}</p>
            <ul className="list-disc list-inside space-y-1 text-primary/60">
              <li>{t("privacyPolicyNoCollect1")}</li>
              <li>{t("privacyPolicyNoCollect2")}</li>
              <li>{t("privacyPolicyNoCollect3")}</li>
              <li>{t("privacyPolicyNoCollect4")}</li>
              <li>{t("privacyPolicyNoCollect5")}</li>
              <li>{t("privacyPolicyNoCollect6")}</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-3 text-primary">{t("privacyPolicyLocalTitle")}</h2>
            <p className="text-primary/70 leading-relaxed">
              {t("privacyPolicyLocalText")}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-3 text-primary">{t("privacyPolicyThirdPartyTitle")}</h2>
            <p className="text-primary/70 leading-relaxed">
              {t("privacyPolicyThirdPartyText")}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-3 text-primary">{t("privacyPolicyChildrenTitle")}</h2>
            <p className="text-primary/70 leading-relaxed">
              {t("privacyPolicyChildrenText")}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-3 text-primary">{t("privacyPolicyChangesTitle")}</h2>
            <p className="text-primary/70 leading-relaxed">
              {t("privacyPolicyChangesText")}
            </p>
          </section>

          <section className="mb-8 p-4 rounded-lg bg-primary/5 border border-primary/20">
            <h2 className="text-lg font-semibold mb-3 text-primary">{t("privacyPolicySummaryTitle")}</h2>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-primary/60">{t("privacyPolicySummaryQ1")}</span>
              <span className="text-primary">{t("privacyPolicySummaryA1")}</span>
              <span className="text-primary/60">{t("privacyPolicySummaryQ2")}</span>
              <span className="text-primary">{t("privacyPolicySummaryA2")}</span>
              <span className="text-primary/60">{t("privacyPolicySummaryQ3")}</span>
              <span className="text-primary">{t("privacyPolicySummaryA3")}</span>
              <span className="text-primary/60">{t("privacyPolicySummaryQ4")}</span>
              <span className="text-primary">{t("privacyPolicySummaryA4")}</span>
            </div>
          </section>
        </article>
      </main>

      <footer className="border-t border-border/50 py-6">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <p className="text-xs text-primary/60">{t("privacyPolicyFooter")}</p>
        </div>
      </footer>
    </div>
  );
};

export default Privacy;