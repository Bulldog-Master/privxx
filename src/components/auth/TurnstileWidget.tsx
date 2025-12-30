/**
 * Cloudflare Turnstile CAPTCHA Widget
 * 
 * Privacy-preserving CAPTCHA that integrates with Cloudflare's Turnstile service.
 * Renders invisibly when possible, shows challenge only when needed.
 */

import { useEffect, useRef, useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface TurnstileWidgetProps {
  onVerify: (token: string) => void;
  onError?: () => void;
  onExpire?: () => void;
  resetTrigger?: number;
}

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: TurnstileRenderOptions) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
    onTurnstileLoad?: () => void;
  }
}

interface TurnstileRenderOptions {
  sitekey: string;
  callback: (token: string) => void;
  "error-callback"?: () => void;
  "expired-callback"?: () => void;
  theme?: "light" | "dark" | "auto";
  size?: "normal" | "compact";
}

export function TurnstileWidget({ 
  onVerify, 
  onError, 
  onExpire,
  resetTrigger 
}: TurnstileWidgetProps) {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [siteKey, setSiteKey] = useState<string | null>(null);
  const [configError, setConfigError] = useState(false);

  // Fetch site key from backend
  useEffect(() => {
    let mounted = true;

    async function fetchSiteKey() {
      try {
        const { data, error } = await supabase.functions.invoke("turnstile-config");
        
        if (error) {
          console.error("Failed to fetch Turnstile config:", error);
          if (mounted) setConfigError(true);
          return;
        }

        if (mounted && data?.siteKey) {
          setSiteKey(data.siteKey);
        } else if (mounted) {
          console.warn("Turnstile not configured");
          setConfigError(true);
        }
      } catch (err) {
        console.error("Turnstile config fetch error:", err);
        if (mounted) setConfigError(true);
      }
    }

    fetchSiteKey();
    return () => { mounted = false; };
  }, []);

  // Load Turnstile script once we have the site key
  useEffect(() => {
    if (!siteKey) return;

    // Check if already loaded
    if (window.turnstile) {
      setScriptLoaded(true);
      return;
    }

    // Check if script is already being loaded
    const existingScript = document.querySelector('script[src*="challenges.cloudflare.com/turnstile"]');
    if (existingScript) {
      window.onTurnstileLoad = () => setScriptLoaded(true);
      return;
    }

    // Load the script
    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoad";
    script.async = true;
    script.defer = true;

    window.onTurnstileLoad = () => {
      setScriptLoaded(true);
    };

    document.head.appendChild(script);

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
      }
    };
  }, [siteKey]);

  // Render widget when script is loaded
  const renderWidget = useCallback(() => {
    if (!containerRef.current || !window.turnstile || !siteKey) {
      return;
    }

    // Remove existing widget if any
    if (widgetIdRef.current) {
      window.turnstile.remove(widgetIdRef.current);
    }

    setIsLoading(true);

    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: siteKey,
      callback: (token: string) => {
        setIsLoading(false);
        onVerify(token);
      },
      "error-callback": () => {
        setIsLoading(false);
        onError?.();
      },
      "expired-callback": () => {
        setIsLoading(false);
        onExpire?.();
      },
      theme: "auto",
      size: "normal",
    });
  }, [siteKey, onVerify, onError, onExpire]);

  // Render when script loads
  useEffect(() => {
    if (scriptLoaded && siteKey) {
      renderWidget();
    }
  }, [scriptLoaded, siteKey, renderWidget]);

  // Reset widget when trigger changes
  useEffect(() => {
    if (resetTrigger !== undefined && resetTrigger > 0 && widgetIdRef.current && window.turnstile) {
      window.turnstile.reset(widgetIdRef.current);
      setIsLoading(true);
    }
  }, [resetTrigger]);

  // Don't render if configuration error
  if (configError) {
    return null;
  }

  return (
    <div className="flex flex-col items-center gap-2">
      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>{t("verifyingHuman", "Verifying...")}</span>
        </div>
      )}
      <div 
        ref={containerRef} 
        className="min-h-[65px] flex items-center justify-center"
      />
    </div>
  );
}

export default TurnstileWidget;
