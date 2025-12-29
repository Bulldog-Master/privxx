// Re-export from new location for backwards compatibility
// TODO: Update imports to use @/features/diagnostics directly
export {
  StatusCard,
  StatusCardSkeleton,
  DiagnosticsFooter,
  DiagnosticsDrawer,
  BridgeStatusCard,
  ReadinessPanel,
  TranslationStatusDashboard,
  useDiagnosticsState,
  getBackendStatusDisplay,
  getModeDisplay,
} from "@/features/diagnostics";
export type { UiState } from "@/features/diagnostics";
