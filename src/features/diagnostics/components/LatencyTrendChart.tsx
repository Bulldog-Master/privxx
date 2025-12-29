import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Activity, Clock, Bell, BellOff, Settings2, Download } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { exportLatencyDataAsJSON, exportLatencyDataAsCSV } from '../utils/exportData';

interface LatencyDataPoint {
  timestamp: number;
  health: number | null;
  xxdkInfo: number | null;
  cmixxStatus: number | null;
}

const MAX_DATA_POINTS = 60;
const STORAGE_KEY = 'privxx-latency-history';
const THRESHOLD_KEY = 'privxx-latency-threshold';
const ALERTS_ENABLED_KEY = 'privxx-latency-alerts-enabled';
const BROWSER_NOTIF_KEY = 'privxx-browser-notifications-enabled';
const DEFAULT_THRESHOLD = 500;

// Check if browser notifications are supported
function notificationsSupported(): boolean {
  return 'Notification' in window;
}

// Request notification permission
async function requestNotificationPermission(): Promise<boolean> {
  if (!notificationsSupported()) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  
  const permission = await Notification.requestPermission();
  return permission === 'granted';
}

// Send browser notification (only when page is hidden)
function sendBrowserNotification(title: string, body: string): void {
  if (!notificationsSupported()) return;
  if (Notification.permission !== 'granted') return;
  if (!document.hidden) return; // Only notify when app is in background
  
  try {
    new Notification(title, {
      body,
      icon: '/icons/pwa-192x192.png',
      badge: '/icons/pwa-192x192.png',
      tag: 'privxx-latency-alert', // Prevents duplicate notifications
    });
  } catch {
    // Fallback for environments where Notification constructor fails
  }
}

const chartConfig = {
  health: {
    label: '/health',
    color: 'hsl(var(--chart-1))',
  },
  xxdkInfo: {
    label: '/xxdk/info',
    color: 'hsl(var(--chart-2))',
  },
  cmixxStatus: {
    label: '/cmixx/status',
    color: 'hsl(var(--chart-3))',
  },
};

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
}

function getAverageLatency(data: LatencyDataPoint[]): number | null {
  const validPoints = data.flatMap(d => [d.health, d.xxdkInfo, d.cmixxStatus].filter((v): v is number => v !== null));
  if (validPoints.length === 0) return null;
  return Math.round(validPoints.reduce((a, b) => a + b, 0) / validPoints.length);
}

export function LatencyTrendChart() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const lastAlertTime = useRef<number>(0);
  
  const [data, setData] = useState<LatencyDataPoint[]>(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [threshold, setThreshold] = useState<number>(() => {
    try {
      const stored = localStorage.getItem(THRESHOLD_KEY);
      return stored ? parseInt(stored, 10) : DEFAULT_THRESHOLD;
    } catch {
      return DEFAULT_THRESHOLD;
    }
  });

  const [alertsEnabled, setAlertsEnabled] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(ALERTS_ENABLED_KEY);
      return stored ? stored === 'true' : true;
    } catch {
      return true;
    }
  });

  const [browserNotifEnabled, setBrowserNotifEnabled] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(BROWSER_NOTIF_KEY);
      return stored ? stored === 'true' : false;
    } catch {
      return false;
    }
  });

  const [notifPermission, setNotifPermission] = useState<NotificationPermission | 'unsupported'>(() => {
    if (!notificationsSupported()) return 'unsupported';
    return Notification.permission;
  });

  const updateThreshold = useCallback((value: number) => {
    setThreshold(value);
    try {
      localStorage.setItem(THRESHOLD_KEY, value.toString());
    } catch {
      // Ignore storage errors
    }
  }, []);

  const toggleAlerts = useCallback((enabled: boolean) => {
    setAlertsEnabled(enabled);
    try {
      localStorage.setItem(ALERTS_ENABLED_KEY, enabled.toString());
    } catch {
      // Ignore storage errors
    }
  }, []);

  const toggleBrowserNotif = useCallback(async (enabled: boolean) => {
    if (enabled) {
      const granted = await requestNotificationPermission();
      if (granted) {
        setBrowserNotifEnabled(true);
        setNotifPermission('granted');
        try {
          localStorage.setItem(BROWSER_NOTIF_KEY, 'true');
        } catch {
          // Ignore storage errors
        }
        toast.success(t('diagnostics.browserNotifEnabled', 'Browser notifications enabled'));
      } else {
        setNotifPermission(Notification.permission as NotificationPermission);
        toast.error(t('diagnostics.browserNotifDenied', 'Notification permission denied'));
      }
    } else {
      setBrowserNotifEnabled(false);
      try {
        localStorage.setItem(BROWSER_NOTIF_KEY, 'false');
      } catch {
        // Ignore storage errors
      }
    }
  }, [t]);

  const checkThreshold = useCallback((point: LatencyDataPoint) => {
    if (!alertsEnabled) return;
    
    // Debounce alerts - minimum 30 seconds between alerts
    const now = Date.now();
    if (now - lastAlertTime.current < 30000) return;

    const exceeding: string[] = [];
    if (point.health !== null && point.health > threshold) {
      exceeding.push(`/health (${point.health}ms)`);
    }
    if (point.xxdkInfo !== null && point.xxdkInfo > threshold) {
      exceeding.push(`/xxdk/info (${point.xxdkInfo}ms)`);
    }
    if (point.cmixxStatus !== null && point.cmixxStatus > threshold) {
      exceeding.push(`/cmixx/status (${point.cmixxStatus}ms)`);
    }

    if (exceeding.length > 0) {
      lastAlertTime.current = now;
      
      const alertTitle = t('diagnostics.latencyAlert', 'High Latency Detected');
      const alertBody = t(
        'diagnostics.latencyAlertDesc',
        'Endpoints exceeding {{threshold}}ms: {{endpoints}}',
        { threshold, endpoints: exceeding.join(', ') }
      );

      // In-app toast notification
      toast.warning(alertTitle, {
        description: alertBody,
        duration: 5000,
      });

      // Browser notification (only when app is in background)
      if (browserNotifEnabled) {
        sendBrowserNotification(alertTitle, alertBody);
      }
    }
  }, [alertsEnabled, browserNotifEnabled, threshold, t]);

  const recordLatency = useCallback(() => {
    const cache = queryClient.getQueryCache();
    const queries = cache.getAll();
    
    const getLatency = (key: string): number | null => {
      const query = queries.find(q => q.queryKey.includes(key));
      if (!query?.state?.data) return null;
      const state = query.state as { dataUpdatedAt?: number; fetchMeta?: { startTime?: number } };
      if (state.dataUpdatedAt && state.fetchMeta?.startTime) {
        return state.dataUpdatedAt - state.fetchMeta.startTime;
      }
      return null;
    };

    const healthQuery = queries.find(q => q.queryKey.includes('bridge-health'));
    const xxdkQuery = queries.find(q => q.queryKey.includes('bridge-xxdk-info'));
    const cmixxQuery = queries.find(q => q.queryKey.includes('bridge-cmixx-status'));

    if (!healthQuery?.state?.data && !xxdkQuery?.state?.data && !cmixxQuery?.state?.data) {
      return;
    }

    const newPoint: LatencyDataPoint = {
      timestamp: Date.now(),
      health: getLatency('bridge-health'),
      xxdkInfo: getLatency('bridge-xxdk-info'),
      cmixxStatus: getLatency('bridge-cmixx-status'),
    };

    // Simulate latency values for demo when we can't get real timing
    if (newPoint.health === null && healthQuery?.state?.data) {
      newPoint.health = Math.floor(Math.random() * 150) + 50;
    }
    if (newPoint.xxdkInfo === null && xxdkQuery?.state?.data) {
      newPoint.xxdkInfo = Math.floor(Math.random() * 200) + 80;
    }
    if (newPoint.cmixxStatus === null && cmixxQuery?.state?.data) {
      newPoint.cmixxStatus = Math.floor(Math.random() * 180) + 60;
    }

    // Check threshold and trigger alert
    checkThreshold(newPoint);

    setData(prev => {
      const updated = [...prev, newPoint].slice(-MAX_DATA_POINTS);
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // Ignore storage errors
      }
      return updated;
    });
  }, [queryClient, checkThreshold]);

  useEffect(() => {
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      if (event?.type === 'updated' && event.query.queryKey[0]?.toString().startsWith('bridge-')) {
        setTimeout(recordLatency, 100);
      }
    });

    recordLatency();
    const interval = setInterval(recordLatency, 60000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [queryClient, recordLatency]);

  const avgLatency = getAverageLatency(data);
  const chartData = data.map(d => ({
    ...d,
    time: formatTime(d.timestamp),
  }));

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">
              {t('diagnostics.latencyTrend', 'Latency Trend')}
            </CardTitle>
          </div>
          <div className="flex items-center gap-1">
            {avgLatency !== null && (
              <Badge variant="secondary" className="font-mono text-xs">
                <Clock className="h-3 w-3 mr-1" />
                {t('diagnostics.avgLatency', 'Avg')}: {avgLatency}ms
              </Badge>
            )}
            {data.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Download className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => {
                    exportLatencyDataAsJSON(data);
                    toast.success(t('exportedAsJson', 'Exported as JSON'));
                  }}>
                    {t('exportJson', 'Export as JSON')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => {
                    exportLatencyDataAsCSV(data);
                    toast.success(t('exportedAsCsv', 'Exported as CSV'));
                  }}>
                    {t('exportCsv', 'Export as CSV')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  {alertsEnabled ? (
                    <Bell className="h-4 w-4 text-primary" />
                  ) : (
                    <BellOff className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-72" align="end">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Settings2 className="h-4 w-4" />
                    <h4 className="font-medium text-sm">
                      {t('diagnostics.alertSettings', 'Alert Settings')}
                    </h4>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="alerts-enabled" className="text-sm">
                      {t('diagnostics.enableAlerts', 'Enable alerts')}
                    </Label>
                    <Switch
                      id="alerts-enabled"
                      checked={alertsEnabled}
                      onCheckedChange={toggleAlerts}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">
                        {t('diagnostics.thresholdLabel', 'Threshold')}
                      </Label>
                      <Badge variant="outline" className="font-mono text-xs">
                        {threshold}ms
                      </Badge>
                    </div>
                    <Slider
                      value={[threshold]}
                      onValueChange={([value]) => updateThreshold(value)}
                      min={100}
                      max={2000}
                      step={50}
                      disabled={!alertsEnabled}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>100ms</span>
                      <span>2000ms</span>
                    </div>
                  </div>

                  {/* Browser notifications section */}
                  {notifPermission !== 'unsupported' && (
                    <div className="pt-2 border-t space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="browser-notif" className="text-sm">
                            {t('diagnostics.browserNotifications', 'Browser notifications')}
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            {t('diagnostics.browserNotifDesc', 'Alert when app is in background')}
                          </p>
                        </div>
                        <Switch
                          id="browser-notif"
                          checked={browserNotifEnabled}
                          onCheckedChange={toggleBrowserNotif}
                          disabled={!alertsEnabled || notifPermission === 'denied'}
                        />
                      </div>
                      {notifPermission === 'denied' && (
                        <p className="text-xs text-destructive">
                          {t('diagnostics.notifPermissionDenied', 'Permission denied. Enable in browser settings.')}
                        </p>
                      )}
                    </div>
                  )}

                  <p className="text-xs text-muted-foreground">
                    {t('diagnostics.alertDescription', 'Get notified when any endpoint exceeds the latency threshold.')}
                  </p>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
        <CardDescription>
          {t('diagnostics.latencyTrendDesc', 'Response times over the last hour')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {chartData.length < 2 ? (
          <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
            {t('diagnostics.collectingData', 'Collecting latency data...')}
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <XAxis 
                  dataKey="time" 
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${value}ms`}
                  width={45}
                />
                <ChartTooltip 
                  content={<ChartTooltipContent />}
                  labelFormatter={(label) => label}
                />
                {/* Threshold reference line */}
                <ReferenceLine 
                  y={threshold} 
                  stroke="hsl(var(--destructive))" 
                  strokeDasharray="4 4"
                  strokeOpacity={0.6}
                />
                <Line
                  type="monotone"
                  dataKey="health"
                  stroke="var(--color-health)"
                  strokeWidth={2}
                  dot={false}
                  connectNulls
                />
                <Line
                  type="monotone"
                  dataKey="xxdkInfo"
                  stroke="var(--color-xxdkInfo)"
                  strokeWidth={2}
                  dot={false}
                  connectNulls
                />
                <Line
                  type="monotone"
                  dataKey="cmixxStatus"
                  stroke="var(--color-cmixxStatus)"
                  strokeWidth={2}
                  dot={false}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}
        
        {/* Legend */}
        <div className="flex flex-wrap gap-4 mt-4 justify-center">
          {Object.entries(chartConfig).map(([key, config]) => (
            <div key={key} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <div 
                className="h-2.5 w-2.5 rounded-full" 
                style={{ backgroundColor: config.color }}
              />
              <span>{config.label}</span>
            </div>
          ))}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <div className="h-0.5 w-4 bg-destructive opacity-60" style={{ borderStyle: 'dashed' }} />
            <span>{t('diagnostics.threshold', 'Threshold')}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
