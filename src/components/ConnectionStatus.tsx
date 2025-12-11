import { Loader2, CheckCircle2, XCircle, Shield } from "lucide-react";

export type ConnectionState = "idle" | "connecting" | "connected" | "error";

interface ConnectionStatusProps {
  state: ConnectionState;
  message?: string;
}

const ConnectionStatus = ({ state, message }: ConnectionStatusProps) => {
  const getStatusConfig = () => {
    switch (state) {
      case "idle":
        return {
          icon: Shield,
          text: "Ready to connect securely",
          color: "text-muted-foreground",
          dotColor: "bg-muted-foreground",
          animate: false,
        };
      case "connecting":
        return {
          icon: Loader2,
          text: message || "Routing through Privxx mixnet...",
          color: "text-status-connecting",
          dotColor: "bg-status-connecting",
          animate: true,
        };
      case "connected":
        return {
          icon: CheckCircle2,
          text: message || "Secure connection established",
          color: "text-status-connected",
          dotColor: "bg-status-connected",
          animate: false,
        };
      case "error":
        return {
          icon: XCircle,
          text: message || "Connection failed",
          color: "text-status-error",
          dotColor: "bg-status-error",
          animate: false,
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-secondary/50 rounded-lg border border-border">
      <div className="relative">
        <div 
          className={`w-2 h-2 rounded-full ${config.dotColor} ${config.animate ? 'animate-status-dot' : ''}`}
        />
        {config.animate && (
          <div className={`absolute inset-0 w-2 h-2 rounded-full ${config.dotColor} animate-ping opacity-75`} />
        )}
      </div>
      
      <Icon 
        className={`h-4 w-4 ${config.color} ${state === 'connecting' ? 'animate-spin' : ''}`} 
      />
      
      <span className={`text-sm font-mono ${config.color}`}>
        {config.text}
      </span>
    </div>
  );
};

export default ConnectionStatus;
