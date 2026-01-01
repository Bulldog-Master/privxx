/**
 * Passkey Guided Flow
 * 
 * Step-by-step checklist for passkey registration and sign-in workflow.
 */

import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { CheckCircle, Circle, Fingerprint, LogOut, LogIn, ChevronDown, ChevronUp } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface PasskeyGuidedFlowProps {
  userId: string;
}

export function PasskeyGuidedFlow({ userId }: PasskeyGuidedFlowProps) {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const [hasPasskey, setHasPasskey] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkPasskeys = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("passkey_credentials")
        .select("id")
        .eq("user_id", userId)
        .limit(1);
      
      if (!error && data && data.length > 0) {
        setHasPasskey(true);
      } else {
        setHasPasskey(false);
      }
    } catch {
      setHasPasskey(false);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    checkPasskeys();
  }, [checkPasskeys]);

  const steps = [
    {
      key: "step1",
      title: t("passkeyFlow.step1Title", "Sign in with email/password"),
      description: t("passkeyFlow.step1Desc", "You must be logged in to register a passkey."),
      completed: isAuthenticated,
      icon: LogIn,
    },
    {
      key: "step2",
      title: t("passkeyFlow.step2Title", "Register a passkey"),
      description: t("passkeyFlow.step2Desc", "Use the 'Add Passkey' button above to register Touch ID, Face ID, or a security key."),
      completed: hasPasskey,
      icon: Fingerprint,
    },
    {
      key: "step3",
      title: t("passkeyFlow.step3Title", "Sign out"),
      description: t("passkeyFlow.step3Desc", "Log out of your account to test passkey sign-in."),
      completed: false, // Can't track this state easily
      icon: LogOut,
    },
    {
      key: "step4",
      title: t("passkeyFlow.step4Title", "Sign in with Passkey"),
      description: t("passkeyFlow.step4Desc", "On the login page, use the Passkey tab to sign in passwordlessly."),
      completed: false, // Can't track this state easily
      icon: Fingerprint,
    },
  ];

  const completedSteps = steps.filter(s => s.completed).length;

  if (loading) {
    return null;
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="bg-card/90 backdrop-blur-sm border-border/50">
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-primary">
                  <Fingerprint className="h-5 w-5" />
                  {t("passkeyFlow.title", "Passkey Setup Guide")}
                </CardTitle>
                <CardDescription className="text-primary/70">
                  {t("passkeyFlow.progress", "{{completed}}/{{total}} steps completed", {
                    completed: completedSteps,
                    total: steps.length,
                  })}
                </CardDescription>
              </div>
              {isOpen ? (
                <ChevronUp className="h-5 w-5 text-primary/70" />
              ) : (
                <ChevronDown className="h-5 w-5 text-primary/70" />
              )}
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="space-y-4">
            <p className="text-sm text-primary/70">
              {t("passkeyFlow.intro", "Follow these steps to set up passwordless sign-in with passkeys:")}
            </p>

            <div className="space-y-3">
              {steps.map((step, index) => (
                <div
                  key={step.key}
                  className={`flex items-start gap-3 p-3 rounded-lg border ${
                    step.completed ? "bg-emerald-500/5 border-emerald-500/20" : "bg-background/50"
                  }`}
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-full shrink-0">
                    {step.completed ? (
                      <CheckCircle className="h-6 w-6 text-emerald-500" />
                    ) : (
                      <Circle className="h-6 w-6 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground font-mono">
                        {t("passkeyFlow.stepNumber", "Step {{number}}", { number: index + 1 })}
                      </span>
                    </div>
                    <p className={`font-medium ${step.completed ? "text-emerald-500" : "text-primary"}`}>
                      {step.title}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {step.description}
                    </p>
                  </div>
                  <step.icon className={`h-5 w-5 shrink-0 ${step.completed ? "text-emerald-500" : "text-muted-foreground"}`} />
                </div>
              ))}
            </div>

            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <p className="text-sm text-amber-500">
                {t("passkeyFlow.deviceNote", "Passkeys are registered per device and browser. You'll need to repeat this process on each device you want to use.")}
              </p>
            </div>

            <Button variant="outline" onClick={checkPasskeys} className="w-full">
              {t("passkeyFlow.refresh", "Refresh Status")}
            </Button>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
