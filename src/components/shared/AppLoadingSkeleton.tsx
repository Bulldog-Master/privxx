import { useTranslation } from "react-i18next";

/**
 * App-level loading skeleton shown during initialization.
 * Matches the brand dark glassmorphic aesthetic.
 */
export function AppLoadingSkeleton() {
  const { t, ready } = useTranslation("ui");
  
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
      
      {/* Loading text */}
      <p className="mt-6 text-white/60 text-sm tracking-wide">
        {ready ? t("statusInitializing", "Initializing secure tunnel...") : "Initializing secure tunnel..."}
      </p>
    </div>
  );
}
