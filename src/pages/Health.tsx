/**
 * Health Page
 * 
 * A dedicated endpoint to run backend function checks and generate a copyable report.
 */

import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, ClipboardCopy } from "lucide-react";
import { toast } from "sonner";

import { PageBackground } from "@/components/layout/PageBackground";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BackendHealthPanel, type BackendHealthReport } from "@/components/settings/BackendHealthPanel";
import { AuthServiceDiagnostics } from "@/components/settings/AuthServiceDiagnostics";
import { BuildVersionBadge } from "@/components/shared";
import { buildInfo } from "@/lib/buildInfo";

export default function Health() {
  const { t } = useTranslation();
  const [report, setReport] = useState<BackendHealthReport | null>(null);

  const bundle = useMemo(() => {
    return {
      build: `v${buildInfo.version}${buildInfo.build ? `+${buildInfo.build}` : ""}`,
      origin: window.location.origin,
      userAgent: navigator.userAgent,
      backendHealth: report,
      capturedAt: new Date().toISOString(),
    };
  }, [report]);

  const copy = async () => {
    await navigator.clipboard.writeText(JSON.stringify(bundle, null, 2));
    toast.success(t("health.copied", "Health report copied"));
  };

  return (
    <PageBackground>
      <main className="max-w-2xl mx-auto px-4 py-8">
        <header className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" asChild className="text-primary hover:text-primary/80">
            <Link to="/">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>

          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-primary">{t("health.title", "Health")}</h1>
              <BuildVersionBadge />
            </div>
            <p className="text-sm text-primary/70">
              {t("health.subtitle", "Backend connectivity checks")}
            </p>
          </div>

          <Button variant="outline" onClick={copy} className="shrink-0">
            <ClipboardCopy className="h-4 w-4 mr-2" />
            {t("health.copy", "Copy")}
          </Button>
        </header>

        <section className="space-y-6">
          <BackendHealthPanel autoRun onReportChange={setReport} />
          <AuthServiceDiagnostics />

          <Card className="bg-card/90 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle className="text-primary">{t("health.metaTitle", "Build metadata")}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground font-mono select-all">
              v{buildInfo.version}{buildInfo.build ? `+${buildInfo.build}` : ""}
            </CardContent>
          </Card>
        </section>
      </main>
    </PageBackground>
  );
}
