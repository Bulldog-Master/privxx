import { Globe, EyeOff, Info } from "lucide-react";
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
          className="h-6 px-2 rounded-md border border-white/20 text-foreground hover:brightness-110 font-medium text-[10px] transition-all"
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
          {/* Opening intro */}
          <section className="space-y-3">
            <p className="text-sm text-foreground/80 leading-relaxed">
              {t("privacyDrawerIntro")}
            </p>
            <p className="text-sm text-foreground/60 leading-relaxed italic">
              {t("privacyDrawerIntroPreview")}
            </p>
          </section>

          {/* Section 1: What Privxx is designed to do */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/20">
                <Globe className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground">{t("privacySectionDesignedTitle")}</h3>
            </div>
            <ul className="text-sm text-foreground/70 leading-relaxed space-y-1 list-disc list-inside">
              <li>{t("privacySectionDesignedPoint1")}</li>
              <li>{t("privacySectionDesignedPoint2")}</li>
              <li>{t("privacySectionDesignedPoint3")}</li>
            </ul>
          </section>

          {/* Section 2: What Privxx does NOT do */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/20">
                <EyeOff className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground">{t("privacySectionNotTitle")}</h3>
            </div>
            <ul className="text-sm text-foreground/70 leading-relaxed space-y-1 list-disc list-inside">
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