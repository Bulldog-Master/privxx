import { Shield, Eye, Lock, Database, BarChart3 } from "lucide-react";
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
  
  const principles = [
    {
      icon: Eye,
      title: t("privacyDrawerPoint1"),
    },
    {
      icon: Shield,
      title: t("privacyDrawerPoint2"),
    },
    {
      icon: Lock,
      title: t("privacyDrawerPoint3"),
    },
    {
      icon: Database,
      title: t("privacyDrawerPoint4"),
    },
    {
      icon: BarChart3,
      title: t("privacyDrawerPoint5"),
    },
  ];

  return (
    <Drawer direction="right">
      <DrawerTrigger asChild>
        <Button variant="outline" className="border-border text-foreground hover:bg-secondary">
          {t("privacy")}
        </Button>
      </DrawerTrigger>
      <DrawerContent className="h-full w-80 right-0 left-auto rounded-none">
        <DrawerHeader className="border-b border-border">
          <DrawerTitle className="text-foreground">{t("privacyDrawerTitle")}</DrawerTitle>
        </DrawerHeader>
        <div className="p-4 space-y-4">
          <p className="text-sm text-muted-foreground">
            {t("privacyDrawerIntro")}
          </p>
          {principles.map((principle, index) => (
            <div 
              key={index} 
              className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50 border border-border"
            >
              <div className="p-2 rounded-md bg-primary/10">
                <principle.icon className="h-4 w-4 text-primary" />
              </div>
              <p className="text-sm text-foreground">{principle.title}</p>
            </div>
          ))}
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default PrivacyDrawer;
