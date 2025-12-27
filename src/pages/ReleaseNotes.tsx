import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Clock, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const ReleaseNotes = () => {
  const { t } = useTranslation("ui");

  return (
    <div className="min-h-screen bg-background text-primary">
      <div className="container max-w-3xl mx-auto px-4 py-8">
        {/* Back navigation */}
        <Link to="/">
          <Button variant="ghost" className="mb-6 -ml-2 text-primary/60 hover:text-primary">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t("backToApp")}
          </Button>
        </Link>

        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="w-6 h-6 text-primary" />
            <h1 className="text-3xl font-bold text-primary">{t("releaseNotesTitle")}</h1>
          </div>
          <p className="text-primary/60">{t("releaseNotesSubtitle")}</p>
        </header>

        {/* Current Release */}
        <Card className="mb-6 border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle className="text-xl text-primary">{t("releaseV01Title")}</CardTitle>
              <div className="flex gap-2">
                <Badge variant="default">{t("releaseLatest")}</Badge>
                <Badge variant="outline">{t("releaseBackendLive")}</Badge>
              </div>
            </div>
            <p className="text-sm text-primary/60">{t("releaseV01Date")}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-primary/80">{t("releaseV01Summary")}</p>

            {/* What's Live */}
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2 text-primary">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                {t("releaseWhatsLive")}
              </h3>
              <ul className="space-y-1 text-sm text-primary/60 ml-6">
                <li>• {t("releaseLive1")}</li>
                <li>• {t("releaseLive2")}</li>
                <li>• {t("releaseLive3")}</li>
                <li>• {t("releaseLive4")}</li>
              </ul>
            </div>

            {/* Coming Soon */}
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2 text-primary">
                <Clock className="w-4 h-4 text-amber-500" />
                {t("releaseComingSoon")}
              </h3>
              <ul className="space-y-1 text-sm text-primary/60 ml-6">
                <li>• {t("releaseUpcoming1")}</li>
                <li>• {t("releaseUpcoming2")}</li>
                <li>• {t("releaseUpcoming3")}</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Privacy Commitment */}
        <Card className="mb-6 border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-primary">{t("releasePrivacyTitle")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-primary/60 mb-3">{t("releasePrivacyIntro")}</p>
            <ul className="space-y-1 text-sm text-primary/60">
              <li>• {t("releasePrivacy1")}</li>
              <li>• {t("releasePrivacy2")}</li>
              <li>• {t("releasePrivacy3")}</li>
              <li>• {t("releasePrivacy4")}</li>
            </ul>
          </CardContent>
        </Card>

        {/* Footer */}
        <footer className="text-center text-sm text-primary/60 pt-4 border-t border-border">
          <p>{t("releaseFooter")}</p>
        </footer>
      </div>
    </div>
  );
};

export default ReleaseNotes;
