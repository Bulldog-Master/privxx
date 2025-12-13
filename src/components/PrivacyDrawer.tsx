import { Globe, CreditCard, EyeOff, Info } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { useTranslations } from "@/lib/i18n";

const PrivacyDrawer = () => {
  const { t } = useTranslations();

  return (
    <Drawer direction="right">
      <DrawerTrigger asChild>
        <Button 
          className="border border-white/20 text-foreground hover:brightness-110 font-medium"
          style={{
            background: 'linear-gradient(90deg, hsl(340 50% 40% / 0.6) 0%, hsl(45 60% 45% / 0.6) 50%, hsl(172 50% 35% / 0.6) 100%)'
          }}
        >
          {t("privacy")}
        </Button>
      </DrawerTrigger>
      <DrawerContent className="h-full w-80 sm:w-96 right-0 left-auto rounded-none bg-[hsl(215_25%_22%)] border-l border-white/10">
        <DrawerHeader className="border-b border-white/10 pb-4">
          <DrawerTitle className="text-foreground text-xl">{t("privacyDrawerTitle")}</DrawerTitle>
        </DrawerHeader>
        
        <div className="p-5 space-y-6 overflow-y-auto">
          {/* Section 1: Browsing */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/20">
                <Globe className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground">{t("privacySectionBrowsingTitle")}</h3>
            </div>
            <p className="text-sm text-foreground/70 leading-relaxed">
              {t("privacySectionBrowsingText")}
            </p>
          </section>

          {/* Section 2: Payments */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/20">
                <CreditCard className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground">{t("privacySectionPaymentsTitle")}</h3>
            </div>
            <p className="text-sm text-foreground/70 leading-relaxed">
              {t("privacySectionPaymentsText")}
            </p>
          </section>

          {/* Section 3: What we don't do */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/20">
                <EyeOff className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground">{t("privacySectionNotTitle")}</h3>
            </div>
            <ul className="text-sm text-foreground/70 leading-relaxed space-y-1">
              <li>{t("privacySectionNotPoint1")}</li>
              <li>{t("privacySectionNotPoint2")}</li>
              <li>{t("privacySectionNotPoint3")}</li>
            </ul>
          </section>

          {/* Section 4: Transparency */}
          <section className="space-y-3 pt-2 border-t border-white/10">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-amber-500/20">
                <Info className="h-5 w-5 text-amber-400" />
              </div>
              <h3 className="font-semibold text-foreground">{t("privacySectionStatusTitle")}</h3>
            </div>
            <p className="text-sm text-foreground/60 leading-relaxed italic">
              {t("privacySectionStatusText")}
            </p>
          </section>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default PrivacyDrawer;