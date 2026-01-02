/**
 * ConnectionSuccessAnimation
 * 
 * Visual celebration when connection succeeds.
 * Plays once and fades out.
 */

import { useEffect, useState } from "react";
import { Shield, CheckCircle2 } from "lucide-react";

interface ConnectionSuccessAnimationProps {
  show: boolean;
  latency?: number;
  onComplete?: () => void;
}

export function ConnectionSuccessAnimation({
  show,
  latency,
  onComplete,
}: ConnectionSuccessAnimationProps) {
  const [phase, setPhase] = useState<"hidden" | "entering" | "visible" | "exiting">("hidden");

  useEffect(() => {
    if (show) {
      setPhase("entering");
      
      const visibleTimer = setTimeout(() => setPhase("visible"), 50);
      const exitTimer = setTimeout(() => setPhase("exiting"), 2000);
      const hideTimer = setTimeout(() => {
        setPhase("hidden");
        onComplete?.();
      }, 2500);

      return () => {
        clearTimeout(visibleTimer);
        clearTimeout(exitTimer);
        clearTimeout(hideTimer);
      };
    }
  }, [show, onComplete]);

  if (phase === "hidden") return null;

  return (
    <div
      className={`absolute inset-0 pointer-events-none flex items-center justify-center z-10 transition-all duration-500 ${
        phase === "entering" ? "opacity-0 scale-90" :
        phase === "visible" ? "opacity-100 scale-100" :
        "opacity-0 scale-110"
      }`}
      role="status"
      aria-live="polite"
    >
      {/* Glow ring */}
      <div className="absolute inset-0 rounded-2xl bg-emerald-500/20 animate-pulse" />
      
      {/* Center badge */}
      <div className="relative flex flex-col items-center gap-2">
        <div className="relative">
          <Shield className="h-12 w-12 text-emerald-400 animate-[scale-in_0.3s_ease-out]" />
          <CheckCircle2 className="absolute -bottom-1 -right-1 h-5 w-5 text-emerald-300 bg-background rounded-full" />
        </div>
        
        {latency !== undefined && (
          <span className="text-sm font-mono text-emerald-300/80">
            {latency}ms
          </span>
        )}
      </div>
    </div>
  );
}

export default ConnectionSuccessAnimation;
