// Re-export from new location for backwards compatibility
// TODO: Update imports to use @/features/diagnostics directly
export {
  StatusCard,
  StatusCardSkeleton,
  DiagnosticsFooter,
  DiagnosticsDrawer,
  BridgeStatusCard,
  BridgeLiveStatusCard,
  ReadinessPanel,
  ConnectionHistoryLog,
  TranslationStatusDashboard,
  LatencyTrendChart,
  HealthScorePanel,
  BrowserAnomalyCard,
  BrowserPolicyCard,
  PaymentIntentPreview,
  ConnectionPathDiagram,
  OverallStatusBar,
  TranslationCoverageBadge,
  BackendStatusBadges,
  HealthIndicatorDot,
  ConnectionTimelineDots,
  useDiagnosticsState,
  useBridgeHealthStatus,
  getBackendStatusDisplay,
  getModeDisplay,
} from "@/features/diagnostics";
export type { UiState, BridgeHealthStatus, LayerState, LayerStatus, OverallStatus } from "@/features/diagnostics";
