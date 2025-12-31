import { useState } from "react";
import { useTranslation } from "react-i18next";
import { 
  Monitor, 
  Globe, 
  Server, 
  Shield, 
  CheckCircle2, 
  XCircle, 
  Loader2,
  ChevronDown,
  ChevronUp,
  ArrowDown
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { getBridgeUrl } from "@/api/bridge";

export type LayerStatus = "reachable" | "unreachable" | "starting" | "unknown";

export interface LayerState {
  client: LayerStatus;
  proxy: LayerStatus;
  bridge: LayerStatus;
  xxdk: LayerStatus;
}

interface ConnectionPathDiagramProps {
  layerState: LayerState;
  isLoading?: boolean;
  proxyLatency?: number | null;
  bridgeLatency?: number | null;
  xxdkLatency?: number | null;
}

interface LayerNodeProps {
  icon: React.ReactNode;
  label: string;
  sublabel: string;
  status: LayerStatus;
  explanation?: string;
  latency?: number | null;
  isLast?: boolean;
  showAdvanced?: boolean;
  technicalDetails?: string;
}

const LayerNode = ({ 
  icon, 
  label, 
  sublabel, 
  status, 
  explanation, 
  latency,
  isLast,
  showAdvanced,
  technicalDetails
}: LayerNodeProps) => {
  const { t } = useTranslation();
  
  const getStatusIcon = () => {
    switch (status) {
      case "reachable":
        return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      case "unreachable":
        return <XCircle className="h-4 w-4 text-destructive" />;
      case "starting":
        return <Loader2 className="h-4 w-4 text-amber-500 animate-spin" />;
      default:
        return <div className="h-4 w-4 rounded-full bg-muted" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case "reachable":
        return "border-emerald-500/30 bg-emerald-500/5";
      case "unreachable":
        return "border-destructive/30 bg-destructive/5";
      case "starting":
        return "border-amber-500/30 bg-amber-500/5";
      default:
        return "border-border bg-muted/20";
    }
  };

  const getStatusLabel = () => {
    switch (status) {
      case "reachable":
        return t("connectionPath.reachable", "Reachable");
      case "unreachable":
        return t("connectionPath.unreachable", "Unreachable");
      case "starting":
        return t("connectionPath.starting", "Starting");
      default:
        return t("connectionPath.unknown", "Unknown");
    }
  };

  return (
    <div className="flex flex-col items-center">
      {/* Node */}
      <div className={`relative flex items-center gap-3 w-full p-3 rounded-lg border ${getStatusColor()} transition-colors`}>
        <div className="p-2 rounded-md bg-background/80 border border-border/50">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{label}</span>
            {getStatusIcon()}
          </div>
          <p className="text-xs text-muted-foreground truncate">{sublabel}</p>
          {showAdvanced && technicalDetails && (
            <p className="text-[10px] font-mono text-muted-foreground mt-1 truncate">
              {technicalDetails}
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
            status === "reachable" ? "bg-emerald-500/10 text-emerald-500" :
            status === "unreachable" ? "bg-destructive/10 text-destructive" :
            status === "starting" ? "bg-amber-500/10 text-amber-500" :
            "bg-muted text-muted-foreground"
          }`}>
            {getStatusLabel()}
          </span>
          {latency !== null && latency !== undefined && (
            <span className="text-[10px] font-mono text-muted-foreground">
              {latency}ms
            </span>
          )}
        </div>
      </div>

      {/* Explanation if failure */}
      {status === "unreachable" && explanation && (
        <div className="w-full mt-2 p-2.5 rounded-md bg-destructive/5 border border-destructive/20">
          <p className="text-xs text-destructive/90">{explanation}</p>
        </div>
      )}

      {/* Arrow connector */}
      {!isLast && (
        <div className="flex flex-col items-center py-1.5">
          <ArrowDown className="h-4 w-4 text-muted-foreground/50" />
        </div>
      )}
    </div>
  );
};

export const ConnectionPathDiagram = ({
  layerState,
  isLoading = false,
  proxyLatency,
  bridgeLatency,
  xxdkLatency,
}: ConnectionPathDiagramProps) => {
  const { t } = useTranslation();
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  const bridgeUrl = getBridgeUrl();

  // Generate explanations for failures
  const getProxyExplanation = () => {
    if (layerState.proxy === "unreachable") {
      return t("connectionPath.proxyExplanation", "Public entry point is unreachable. Check DNS, Cloudflare deployment, or SSL configuration.");
    }
    return undefined;
  };

  const getBridgeExplanation = () => {
    if (layerState.bridge === "unreachable") {
      return t("connectionPath.bridgeExplanation", "Security boundary isn't reachable. Check bridge service status and tunnel configuration.");
    }
    return undefined;
  };

  const getXxdkExplanation = () => {
    if (layerState.xxdk === "unreachable") {
      return t("connectionPath.xxdkExplanation", "Private client reported an error. Identity or network initialization may have failed.");
    }
    if (layerState.xxdk === "starting") {
      return t("connectionPath.xxdkStarting", "Private client is initializing — this is expected during startup.");
    }
    return undefined;
  };

  if (isLoading) {
    return (
      <Card className="bg-card/50 border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t("connectionPath.title", "Connection Path")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 rounded-lg bg-muted/30 animate-pulse" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/50 border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">
            {t("connectionPath.title", "Connection Path")}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="h-7 text-xs gap-1"
          >
            {showAdvanced ? (
              <>
                <ChevronUp className="h-3 w-3" />
                {t("connectionPath.hideDetails", "Hide details")}
              </>
            ) : (
              <>
                <ChevronDown className="h-3 w-3" />
                {t("connectionPath.showDetails", "Technical details")}
              </>
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          {t("connectionPath.description", "Logical connection layers — no raw infrastructure exposed")}
        </p>
      </CardHeader>
      <CardContent className="space-y-0">
        {/* Client (Browser) */}
        <LayerNode
          icon={<Monitor className="h-4 w-4 text-primary" />}
          label={t("connectionPath.clientLabel", "Client (Browser)")}
          sublabel={t("connectionPath.clientSublabel", "Your device")}
          status={layerState.client}
          showAdvanced={showAdvanced}
          technicalDetails={showAdvanced ? navigator.userAgent.slice(0, 50) + "..." : undefined}
        />

        {/* Proxy (Public) */}
        <LayerNode
          icon={<Globe className="h-4 w-4 text-blue-500" />}
          label={t("connectionPath.proxyLabel", "Proxy (Public)")}
          sublabel={t("connectionPath.proxySublabel", "Public entry point")}
          status={layerState.proxy}
          explanation={getProxyExplanation()}
          latency={proxyLatency}
          showAdvanced={showAdvanced}
          technicalDetails={showAdvanced ? bridgeUrl.replace(/(\d+\.\d+\.\d+)\.\d+/, "$1.xxx") : undefined}
        />

        {/* Bridge (Local) */}
        <LayerNode
          icon={<Server className="h-4 w-4 text-amber-500" />}
          label={t("connectionPath.bridgeLabel", "Bridge (Local)")}
          sublabel={t("connectionPath.bridgeSublabel", "Secure API boundary")}
          status={layerState.bridge}
          explanation={getBridgeExplanation()}
          latency={bridgeLatency}
          showAdvanced={showAdvanced}
          technicalDetails={showAdvanced ? "127.0.0.1:8787" : undefined}
        />

        {/* xxDK Client */}
        <LayerNode
          icon={<Shield className="h-4 w-4 text-emerald-500" />}
          label={t("connectionPath.xxdkLabel", "xxDK Client")}
          sublabel={t("connectionPath.xxdkSublabel", "Private network client")}
          status={layerState.xxdk}
          explanation={getXxdkExplanation()}
          latency={xxdkLatency}
          isLast
          showAdvanced={showAdvanced}
          technicalDetails={showAdvanced ? "cMixx mixnet" : undefined}
        />
      </CardContent>
    </Card>
  );
};

export default ConnectionPathDiagram;
