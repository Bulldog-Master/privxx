/**
 * Locked State Component
 * 
 * Shared UI for displaying when identity is locked.
 * Used by BrowserPanel, PaymentsPanel, and other feature panels.
 */

import { useTranslation } from "react-i18next";
import { Lock } from "lucide-react";

interface LockedStateProps {
  titleKey?: string;
  hintKey?: string;
}

export function LockedState({ 
  titleKey = "identityLocked", 
  hintKey = "unlockToAccess" 
}: LockedStateProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center py-12 text-center p-4 space-y-3">
      <Lock className="h-8 w-8 text-primary/60" />
      <div className="text-sm font-medium text-primary/90">
        {t(titleKey, "Identity Locked")}
      </div>
      <div className="text-sm text-primary/60">
        {t(hintKey, "Unlock your identity to access this feature.")}
      </div>
    </div>
  );
}

export default LockedState;
