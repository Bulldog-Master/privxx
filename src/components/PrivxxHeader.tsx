import { Shield, Settings } from "lucide-react";

interface PrivxxHeaderProps {
  onSettingsClick?: () => void;
}

const PrivxxHeader = ({ onSettingsClick }: PrivxxHeaderProps) => {
  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-card/50 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <div className="relative">
          <Shield className="h-8 w-8 text-primary" />
          <div className="absolute inset-0 blur-lg bg-primary/30 -z-10" />
        </div>
        <div className="flex flex-col">
          <h1 className="text-xl font-semibold tracking-tight text-gradient-primary">
            Privxx
          </h1>
          <span className="text-xs text-muted-foreground font-mono">
            Quantum-Secure Browsing
          </span>
        </div>
      </div>
      
      <button 
        onClick={onSettingsClick}
        className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
        aria-label="Settings"
      >
        <Settings className="h-5 w-5" />
      </button>
    </header>
  );
};

export default PrivxxHeader;
