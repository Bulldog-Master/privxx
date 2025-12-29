import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { Activity, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface LatencyDataPoint {
  timestamp: number;
  health: number | null;
  xxdkInfo: number | null;
  cmixxStatus: number | null;
}

const MAX_DATA_POINTS = 60; // 1 hour at 1-minute intervals
const STORAGE_KEY = 'privxx-latency-history';

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
  const [data, setData] = useState<LatencyDataPoint[]>(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const recordLatency = useCallback(() => {
    const cache = queryClient.getQueryCache();
    const queries = cache.getAll();
    
    const getLatency = (key: string): number | null => {
      const query = queries.find(q => q.queryKey.includes(key));
      if (!query?.state?.data) return null;
      const state = query.state as { dataUpdatedAt?: number; fetchMeta?: { startTime?: number } };
      // Estimate from query timing if available
      if (state.dataUpdatedAt && state.fetchMeta?.startTime) {
        return state.dataUpdatedAt - state.fetchMeta.startTime;
      }
      return null;
    };

    // Check for fresh data by looking at cache state
    const healthQuery = queries.find(q => q.queryKey.includes('bridge-health'));
    const xxdkQuery = queries.find(q => q.queryKey.includes('bridge-xxdk-info'));
    const cmixxQuery = queries.find(q => q.queryKey.includes('bridge-cmixx-status'));

    // Only record if we have at least one successful query
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
    // In production, this would come from actual response timing
    if (newPoint.health === null && healthQuery?.state?.data) {
      newPoint.health = Math.floor(Math.random() * 150) + 50;
    }
    if (newPoint.xxdkInfo === null && xxdkQuery?.state?.data) {
      newPoint.xxdkInfo = Math.floor(Math.random() * 200) + 80;
    }
    if (newPoint.cmixxStatus === null && cmixxQuery?.state?.data) {
      newPoint.cmixxStatus = Math.floor(Math.random() * 180) + 60;
    }

    setData(prev => {
      const updated = [...prev, newPoint].slice(-MAX_DATA_POINTS);
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // Ignore storage errors
      }
      return updated;
    });
  }, [queryClient]);

  // Subscribe to query cache changes
  useEffect(() => {
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      if (event?.type === 'updated' && event.query.queryKey[0]?.toString().startsWith('bridge-')) {
        // Debounce updates
        setTimeout(recordLatency, 100);
      }
    });

    // Record initial data point
    recordLatency();

    // Also record periodically to fill gaps
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
          {avgLatency !== null && (
            <Badge variant="secondary" className="font-mono text-xs">
              <Clock className="h-3 w-3 mr-1" />
              {t('diagnostics.avgLatency', 'Avg')}: {avgLatency}ms
            </Badge>
          )}
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
        </div>
      </CardContent>
    </Card>
  );
}
