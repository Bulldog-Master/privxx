/**
 * Export utility functions for diagnostics data
 */

interface ConnectionEvent {
  id: string;
  timestamp: Date;
  endpoint: string;
  status: 'success' | 'error' | 'pending';
  message?: string;
  responseTime?: number;
}

interface LatencyDataPoint {
  timestamp: number;
  health: number | null;
  xxdkInfo: number | null;
  cmixxStatus: number | null;
}

function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function formatTimestamp(date: Date | number): string {
  const d = typeof date === 'number' ? new Date(date) : date;
  return d.toISOString();
}

// Connection History exports
export function exportConnectionHistoryAsJSON(events: ConnectionEvent[]): void {
  const data = events.map(e => ({
    ...e,
    timestamp: formatTimestamp(e.timestamp),
  }));
  const json = JSON.stringify(data, null, 2);
  const filename = `privxx-connection-history-${new Date().toISOString().split('T')[0]}.json`;
  downloadFile(json, filename, 'application/json');
}

export function exportConnectionHistoryAsCSV(events: ConnectionEvent[]): void {
  const headers = ['timestamp', 'endpoint', 'status', 'message', 'responseTime'];
  const rows = events.map(e => [
    formatTimestamp(e.timestamp),
    e.endpoint,
    e.status,
    e.message?.replace(/,/g, ';') || '',
    e.responseTime?.toString() || '',
  ]);
  
  const csv = [
    headers.join(','),
    ...rows.map(row => row.join(',')),
  ].join('\n');
  
  const filename = `privxx-connection-history-${new Date().toISOString().split('T')[0]}.csv`;
  downloadFile(csv, filename, 'text/csv');
}

// Latency data exports
export function exportLatencyDataAsJSON(data: LatencyDataPoint[]): void {
  const formatted = data.map(d => ({
    ...d,
    timestamp: formatTimestamp(d.timestamp),
  }));
  const json = JSON.stringify(formatted, null, 2);
  const filename = `privxx-latency-data-${new Date().toISOString().split('T')[0]}.json`;
  downloadFile(json, filename, 'application/json');
}

export function exportLatencyDataAsCSV(data: LatencyDataPoint[]): void {
  const headers = ['timestamp', 'health_ms', 'xxdk_info_ms', 'cmixx_status_ms'];
  const rows = data.map(d => [
    formatTimestamp(d.timestamp),
    d.health?.toString() || '',
    d.xxdkInfo?.toString() || '',
    d.cmixxStatus?.toString() || '',
  ]);
  
  const csv = [
    headers.join(','),
    ...rows.map(row => row.join(',')),
  ].join('\n');
  
  const filename = `privxx-latency-data-${new Date().toISOString().split('T')[0]}.csv`;
  downloadFile(csv, filename, 'text/csv');
}

// Combined diagnostics export
export function exportAllDiagnosticsAsJSON(
  connectionEvents: ConnectionEvent[],
  latencyData: LatencyDataPoint[]
): void {
  const data = {
    exportedAt: new Date().toISOString(),
    connectionHistory: connectionEvents.map(e => ({
      ...e,
      timestamp: formatTimestamp(e.timestamp),
    })),
    latencyData: latencyData.map(d => ({
      ...d,
      timestamp: formatTimestamp(d.timestamp),
    })),
  };
  const json = JSON.stringify(data, null, 2);
  const filename = `privxx-diagnostics-${new Date().toISOString().split('T')[0]}.json`;
  downloadFile(json, filename, 'application/json');
}
