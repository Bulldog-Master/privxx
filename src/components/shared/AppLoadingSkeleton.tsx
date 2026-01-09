import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";

const PROGRESS_STEPS = [
  { key: "statusInitializing", fallback: "Initializing..." },
  { key: "statusLoadingModules", fallback: "Loading secure modules..." },
  { key: "statusPreparingInterface", fallback: "Preparing tunnel interface..." },
];

/**
 * App-level loading skeleton shown during initialization.
 * Matches the brand dark glassmorphic aesthetic with progress steps.
 */
export function AppLoadingSkeleton() {
  const { t, ready } = useTranslation("ui");
  const [stepIndex, setStepIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    if (stepIndex >= PROGRESS_STEPS.length - 1) return;
    
    const timer = setTimeout(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setStepIndex((prev) => Math.min(prev + 1, PROGRESS_STEPS.length - 1));
        setIsTransitioning(false);
      }, 150);
    }, 800);
    
    return () => clearTimeout(timer);
  }, [stepIndex]);

  const currentStep = PROGRESS_STEPS[stepIndex];
  const statusText = ready 
    ? t(currentStep.key, currentStep.fallback) 
    : currentStep.fallback;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[hsl(215_25%_20%)] via-[hsl(215_25%_27%)] to-[hsl(172_25%_22%)]">
      {/* Logo */}
      <div className="flex items-center gap-2 mb-8 animate-pulse">
        <span className="text-4xl font-bold bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent">
          Priv
        </span>
        <span className="text-4xl font-bold text-primary">xx</span>
      </div>
      
      {/* Spinner */}
      <div className="w-10 h-10 border-[3px] border-white/10 border-t-primary rounded-full animate-spin" />
      
      {/* Loading text with fade transition */}
      <p 
        className="mt-6 text-white/60 text-sm tracking-wide transition-opacity duration-150"
        style={{ opacity: isTransitioning ? 0 : 1 }}
      >
        {statusText}
      </p>
    </div>
  );
}
