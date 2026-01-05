import { createContext, useContext, useState, useCallback, ReactNode } from "react";

interface DiagnosticsDrawerContextValue {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

const DiagnosticsDrawerContext = createContext<DiagnosticsDrawerContextValue | null>(null);

export function DiagnosticsDrawerProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen(prev => !prev), []);

  return (
    <DiagnosticsDrawerContext.Provider value={{ isOpen, open, close, toggle }}>
      {children}
    </DiagnosticsDrawerContext.Provider>
  );
}

export function useDiagnosticsDrawer() {
  const context = useContext(DiagnosticsDrawerContext);
  if (!context) {
    throw new Error("useDiagnosticsDrawer must be used within DiagnosticsDrawerProvider");
  }
  return context;
}

// Optional hook that returns null if outside provider (for components that may or may not have access)
export function useDiagnosticsDrawerOptional() {
  return useContext(DiagnosticsDrawerContext);
}
