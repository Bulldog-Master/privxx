/**
 * Identity Unlock Form
 * 
 * Password form for unlocking the xxDK identity on the bridge.
 * Used in Inbox and other areas requiring identity unlock.
 */

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, Unlock, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useIdentityActions } from "@/features/identity/hooks/useIdentityActions";

interface IdentityUnlockFormProps {
  onSuccess?: () => void;
  compact?: boolean;
}

export function IdentityUnlockForm({ onSuccess, compact = false }: IdentityUnlockFormProps) {
  const { t } = useTranslation();
  const { handleUnlock, isLoading } = useIdentityActions();
  
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!password.trim()) {
      setError(t("passwordRequired", "Password required"));
      return;
    }
    
    const success = await handleUnlock(password);
    if (success) {
      setPassword("");
      onSuccess?.();
    } else {
      setError(t("unlockFailed", "Unlock failed. Check your password."));
    }
  };

  if (compact) {
    return (
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <div className="relative flex-1">
          <Input
            type={showPassword ? "text" : "password"}
            placeholder={t("identityPassword", "Identity password")}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            className="h-9 pr-10 text-sm"
            autoComplete="current-password"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <Button type="submit" size="sm" disabled={isLoading || !password.trim()}>
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Unlock className="h-4 w-4" />
          )}
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="relative">
        <Input
          type={showPassword ? "text" : "password"}
          placeholder={t("enterIdentityPassword", "Enter identity password")}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isLoading}
          className="pr-10"
          autoComplete="current-password"
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          tabIndex={-1}
        >
          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      
      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
      
      <Button type="submit" className="w-full" disabled={isLoading || !password.trim()}>
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            {t("unlocking", "Unlocking...")}
          </>
        ) : (
          <>
            <Unlock className="h-4 w-4 mr-2" />
            {t("unlockIdentity", "Unlock Identity")}
          </>
        )}
      </Button>
    </form>
  );
}

export default IdentityUnlockForm;
