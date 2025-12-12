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
      title: "IP & Location Hidden",
      description: "Privxx hides your IP and location (design goal).",
    },
    {
      icon: Shield,
      title: "Metadata Removal",
      description: "Privxx removes metadata using mixnet technology (cMixx).",
    },
    {
      icon: Lock,
      title: "Post-Quantum Security",
      description: "Privxx uses post-quantum-safe cryptography for future-proof security.",
    },
    {
      icon: Database,
      title: "No History Storage",
      description: "Privxx will not store browsing history or persistent IDs.",
    },
    {
      icon: BarChart3,
      title: "No Tracking",
      description: "Privxx will never use analytics or tracking.",
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
          <DrawerTitle className="text-foreground">Privxx Privacy Principles</DrawerTitle>
        </DrawerHeader>
        <div className="p-4 space-y-4">
          {principles.map((principle, index) => (
            <div 
              key={index} 
              className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50 border border-border"
            >
              <div className="p-2 rounded-md bg-primary/10">
                <principle.icon className="h-4 w-4 text-primary" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-medium text-foreground">{principle.title}</h3>
                <p className="text-xs text-muted-foreground">{principle.description}</p>
              </div>
            </div>
          ))}
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default PrivacyDrawer;
