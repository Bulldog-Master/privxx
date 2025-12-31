import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  ArrowDown, 
  ArrowUp, 
  Gauge, 
  Play, 
  Loader2, 
  TrendingUp, 
  TrendingDown,
  Minus,
  Clock,
  Trash2
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { formatDistanceToNow } from 'date-fns';

interface SpeedTestResult {
  id: number;
  timestamp: Date;
  download: number; // Mbps
  upload: number; // Mbps
  latency: number; // ms
}

type TestPhase = 'idle' | 'latency' | 'download' | 'upload' | 'complete';

const MAX_HISTORY = 20;

export function NetworkStatsPanel() {
  const { t } = useTranslation();
  const [phase, setPhase] = useState<TestPhase>('idle');
  const [progress, setProgress] = useState(0);
  const [history, setHistory] = useState<SpeedTestResult[]>([]);
  const [testIdCounter, setTestIdCounter] = useState(0);

  // Load history from sessionStorage
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('privxx-speed-history');
      if (saved) {
        const parsed = JSON.parse(saved);
        setHistory(parsed.map((r: any) => ({ ...r, timestamp: new Date(r.timestamp) })));
        setTestIdCounter(parsed.length);
      }
    } catch {
      // Ignore errors
    }
  }, []);

  // Save history to sessionStorage
  useEffect(() => {
    if (history.length > 0) {
      try {
        sessionStorage.setItem('privxx-speed-history', JSON.stringify(history));
      } catch {
        // Ignore errors
      }
    }
  }, [history]);

  const runSpeedTest = useCallback(async () => {
    setPhase('latency');
    setProgress(0);

    // Simulate latency test
    await simulateProgress(15);
    const latency = Math.floor(500 + Math.random() * 2000);

    // Simulate download test
    setPhase('download');
    await simulateProgress(45);
    const download = parseFloat((0.5 + Math.random() * 2.5).toFixed(2));

    // Simulate upload test
    setPhase('upload');
    await simulateProgress(40);
    const upload = parseFloat((0.3 + Math.random() * 1.5).toFixed(2));

    setPhase('complete');
    setProgress(100);

    const newResult: SpeedTestResult = {
      id: testIdCounter + 1,
      timestamp: new Date(),
      download,
      upload,
      latency,
    };

    setTestIdCounter(prev => prev + 1);
    setHistory(prev => [newResult, ...prev].slice(0, MAX_HISTORY));

    // Reset to idle after a short delay
    setTimeout(() => {
      setPhase('idle');
      setProgress(0);
    }, 1500);
  }, [testIdCounter]);

  const simulateProgress = async (targetProgress: number) => {
    const steps = 10;
    const stepDelay = 150;
    const progressPerStep = targetProgress / steps;
    
    for (let i = 0; i < steps; i++) {
      await new Promise(resolve => setTimeout(resolve, stepDelay));
      setProgress(prev => Math.min(prev + progressPerStep, 100));
    }
  };

  const clearHistory = () => {
    setHistory([]);
    sessionStorage.removeItem('privxx-speed-history');
  };

  const getSpeedQuality = (speed: number, type: 'download' | 'upload'): 'excellent' | 'good' | 'fair' | 'poor' => {
    const thresholds = type === 'download' 
      ? { excellent: 2, good: 1, fair: 0.5 }
      : { excellent: 1, good: 0.5, fair: 0.3 };
    
    if (speed >= thresholds.excellent) return 'excellent';
    if (speed >= thresholds.good) return 'good';
    if (speed >= thresholds.fair) return 'fair';
    return 'poor';
  };

  const getLatencyQuality = (latency: number): 'excellent' | 'good' | 'fair' | 'poor' => {
    if (latency < 800) return 'excellent';
    if (latency < 1200) return 'good';
    if (latency < 1800) return 'fair';
    return 'poor';
  };

  const qualityColors = {
    excellent: 'text-emerald-500',
    good: 'text-emerald-400',
    fair: 'text-amber-500',
    poor: 'text-red-500',
  };

  const qualityBadgeVariants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    excellent: 'default',
    good: 'secondary',
    fair: 'outline',
    poor: 'destructive',
  };

  const phaseLabels: Record<TestPhase, string> = {
    idle: t('speedTest.ready', 'Ready'),
    latency: t('speedTest.testingLatency', 'Testing latency...'),
    download: t('speedTest.testingDownload', 'Testing download...'),
    upload: t('speedTest.testingUpload', 'Testing upload...'),
    complete: t('speedTest.complete', 'Complete'),
  };

  // Calculate averages and trends
  const latestResult = history[0];
  const avgDownload = history.length > 0 
    ? history.reduce((sum, r) => sum + r.download, 0) / history.length 
    : 0;
  const avgUpload = history.length > 0 
    ? history.reduce((sum, r) => sum + r.upload, 0) / history.length 
    : 0;
  const avgLatency = history.length > 0 
    ? history.reduce((sum, r) => sum + r.latency, 0) / history.length 
    : 0;

  // Trend calculation (compare last 3 vs previous 3)
  const getTrend = (metric: 'download' | 'upload' | 'latency'): 'up' | 'down' | 'stable' => {
    if (history.length < 4) return 'stable';
    const recent = history.slice(0, 3).reduce((sum, r) => sum + r[metric], 0) / 3;
    const older = history.slice(3, 6).reduce((sum, r) => sum + r[metric], 0) / Math.min(3, history.length - 3);
    const diff = ((recent - older) / older) * 100;
    if (Math.abs(diff) < 10) return 'stable';
    return diff > 0 ? 'up' : 'down';
  };

  const TrendIcon = ({ trend, inverted = false }: { trend: 'up' | 'down' | 'stable'; inverted?: boolean }) => {
    if (trend === 'stable') return <Minus className="h-3 w-3 text-muted-foreground" />;
    const isGood = inverted ? trend === 'down' : trend === 'up';
    if (trend === 'up') return <TrendingUp className={`h-3 w-3 ${isGood ? 'text-emerald-500' : 'text-red-500'}`} />;
    return <TrendingDown className={`h-3 w-3 ${isGood ? 'text-emerald-500' : 'text-red-500'}`} />;
  };

  // Prepare chart data (reverse for chronological order)
  const chartData = [...history].reverse().map((r, i) => ({
    index: i + 1,
    download: r.download,
    upload: r.upload,
    latency: r.latency,
    time: formatDistanceToNow(r.timestamp, { addSuffix: true }),
  }));

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="h-4 w-4" />
              {t('networkStats.title', 'Network Statistics')}
            </CardTitle>
            <CardDescription className="text-xs">
              {t('networkStats.description', 'Speed test history and latency trends')}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {history.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearHistory}
                className="h-7 px-2 text-xs"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                {t('networkStats.clear', 'Clear')}
              </Button>
            )}
            <Button
              variant="default"
              size="sm"
              onClick={runSpeedTest}
              disabled={phase !== 'idle'}
              className="h-7 px-3 text-xs"
            >
              {phase !== 'idle' ? (
                <>
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  {phaseLabels[phase]}
                </>
              ) : (
                <>
                  <Play className="h-3 w-3 mr-1" />
                  {t('networkStats.runTest', 'Run Test')}
                </>
              )}
            </Button>
          </div>
        </div>
        {phase !== 'idle' && (
          <Progress value={progress} className="h-1 mt-2" />
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current/Latest Results */}
        {latestResult && (
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1">
                <ArrowDown className="h-3 w-3" />
                {t('speedTest.download', 'Download')}
                <TrendIcon trend={getTrend('download')} />
              </div>
              <div className={`text-lg font-bold ${qualityColors[getSpeedQuality(latestResult.download, 'download')]}`}>
                {latestResult.download}
              </div>
              <div className="text-[10px] text-muted-foreground">Mbps</div>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1">
                <ArrowUp className="h-3 w-3" />
                {t('speedTest.upload', 'Upload')}
                <TrendIcon trend={getTrend('upload')} />
              </div>
              <div className={`text-lg font-bold ${qualityColors[getSpeedQuality(latestResult.upload, 'upload')]}`}>
                {latestResult.upload}
              </div>
              <div className="text-[10px] text-muted-foreground">Mbps</div>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1">
                <Gauge className="h-3 w-3" />
                {t('speedTest.latency', 'Latency')}
                <TrendIcon trend={getTrend('latency')} inverted />
              </div>
              <div className={`text-lg font-bold ${qualityColors[getLatencyQuality(latestResult.latency)]}`}>
                {latestResult.latency}
              </div>
              <div className="text-[10px] text-muted-foreground">ms</div>
            </div>
          </div>
        )}

        {/* Averages */}
        {history.length > 1 && (
          <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground py-2 border-y">
            <span>{t('networkStats.averages', 'Averages')}:</span>
            <span className="flex items-center gap-1">
              <ArrowDown className="h-3 w-3" />
              {avgDownload.toFixed(2)} Mbps
            </span>
            <span className="flex items-center gap-1">
              <ArrowUp className="h-3 w-3" />
              {avgUpload.toFixed(2)} Mbps
            </span>
            <span className="flex items-center gap-1">
              <Gauge className="h-3 w-3" />
              {Math.round(avgLatency)} ms
            </span>
          </div>
        )}

        {/* Charts */}
        {chartData.length > 1 && (
          <div className="space-y-4">
            {/* Speed Chart */}
            <div>
              <div className="text-xs text-muted-foreground mb-2">
                {t('networkStats.speedHistory', 'Speed History')}
              </div>
              <div className="h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="downloadGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="uploadGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(172, 60%, 50%)" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(172, 60%, 50%)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="index" hide />
                    <YAxis hide domain={[0, 'auto']} />
                    <RechartsTooltip 
                      contentStyle={{ 
                        background: 'hsl(var(--popover))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '6px',
                        fontSize: '11px',
                      }}
                      labelFormatter={(v) => `Test #${v}`}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="download" 
                      stroke="hsl(var(--primary))" 
                      fill="url(#downloadGradient)"
                      strokeWidth={2}
                      name={t('speedTest.download', 'Download')}
                      unit=" Mbps"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="upload" 
                      stroke="hsl(172, 60%, 50%)" 
                      fill="url(#uploadGradient)"
                      strokeWidth={2}
                      name={t('speedTest.upload', 'Upload')}
                      unit=" Mbps"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Latency Chart */}
            <div>
              <div className="text-xs text-muted-foreground mb-2">
                {t('networkStats.latencyHistory', 'Latency History')}
              </div>
              <div className="h-24">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <XAxis dataKey="index" hide />
                    <YAxis hide domain={['auto', 'auto']} />
                    <RechartsTooltip 
                      contentStyle={{ 
                        background: 'hsl(var(--popover))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '6px',
                        fontSize: '11px',
                      }}
                      labelFormatter={(v) => `Test #${v}`}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="latency" 
                      stroke="hsl(var(--destructive))" 
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--destructive))', strokeWidth: 0, r: 3 }}
                      name={t('speedTest.latency', 'Latency')}
                      unit=" ms"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* History List */}
        {history.length > 0 && (
          <div>
            <div className="text-xs text-muted-foreground mb-2 flex items-center justify-between">
              <span>{t('networkStats.history', 'Test History')}</span>
              <Badge variant="outline" className="text-[10px]">
                {history.length} {t('networkStats.tests', 'tests')}
              </Badge>
            </div>
            <div className="max-h-40 overflow-y-auto space-y-1">
              {history.slice(0, 10).map((result) => (
                <div 
                  key={result.id} 
                  className="flex items-center justify-between text-[10px] py-1.5 px-2 rounded bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="h-2.5 w-2.5" />
                    {formatDistanceToNow(result.timestamp, { addSuffix: true })}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={qualityColors[getSpeedQuality(result.download, 'download')]}>
                      ↓{result.download}
                    </span>
                    <span className={qualityColors[getSpeedQuality(result.upload, 'upload')]}>
                      ↑{result.upload}
                    </span>
                    <span className={qualityColors[getLatencyQuality(result.latency)]}>
                      {result.latency}ms
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {history.length === 0 && phase === 'idle' && (
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">{t('networkStats.noTests', 'No speed tests yet')}</p>
            <p className="text-xs">{t('networkStats.runFirstTest', 'Run a test to see your mixnet performance')}</p>
          </div>
        )}

        {/* Disclaimer */}
        <p className="text-[10px] text-muted-foreground text-center pt-2 border-t">
          {t('networkStats.disclaimer', 'Simulated results — actual mixnet speeds vary based on network conditions')}
        </p>
      </CardContent>
    </Card>
  );
}
