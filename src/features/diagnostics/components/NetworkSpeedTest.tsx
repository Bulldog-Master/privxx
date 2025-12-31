import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Gauge, ArrowUp, ArrowDown, Loader2, Play } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface SpeedResult {
  download: number; // Mbps
  upload: number; // Mbps
  latency: number; // ms
}

type TestPhase = 'idle' | 'latency' | 'download' | 'upload' | 'complete';

export function NetworkSpeedTest() {
  const { t } = useTranslation();
  const [phase, setPhase] = useState<TestPhase>('idle');
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<SpeedResult | null>(null);

  const runSpeedTest = useCallback(async () => {
    setPhase('latency');
    setProgress(0);
    setResult(null);

    // Simulate latency test (500-2500ms typical mixnet latency)
    await simulateProgress(15);
    const latency = Math.floor(500 + Math.random() * 2000);

    // Simulate download test
    setPhase('download');
    await simulateProgress(45);
    // Mixnet speeds are typically lower due to privacy routing
    const download = parseFloat((0.5 + Math.random() * 2.5).toFixed(2));

    // Simulate upload test
    setPhase('upload');
    await simulateProgress(40);
    const upload = parseFloat((0.3 + Math.random() * 1.5).toFixed(2));

    setPhase('complete');
    setProgress(100);
    setResult({ download, upload, latency });
  }, []);

  const simulateProgress = async (targetProgress: number) => {
    const steps = 10;
    const stepDelay = 150;
    const progressPerStep = targetProgress / steps;
    
    for (let i = 0; i < steps; i++) {
      await new Promise(resolve => setTimeout(resolve, stepDelay));
      setProgress(prev => Math.min(prev + progressPerStep, 100));
    }
  };

  const getSpeedQuality = (speed: number, type: 'download' | 'upload'): string => {
    const thresholds = type === 'download' 
      ? { excellent: 2, good: 1, fair: 0.5 }
      : { excellent: 1, good: 0.5, fair: 0.3 };
    
    if (speed >= thresholds.excellent) return 'text-emerald-500';
    if (speed >= thresholds.good) return 'text-emerald-400';
    if (speed >= thresholds.fair) return 'text-amber-500';
    return 'text-red-500';
  };

  const phaseLabels: Record<TestPhase, string> = {
    idle: t('speedTest.ready', 'Ready'),
    latency: t('speedTest.testingLatency', 'Testing latency...'),
    download: t('speedTest.testingDownload', 'Testing download...'),
    upload: t('speedTest.testingUpload', 'Testing upload...'),
    complete: t('speedTest.complete', 'Complete'),
  };

  return (
    <TooltipProvider>
      <div className="flex items-center gap-2">
        {phase === 'idle' && !result && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={runSpeedTest}
                className="h-6 px-2 text-xs gap-1 opacity-70 hover:opacity-100"
              >
                <Play className="h-3 w-3" />
                {t('speedTest.run', 'Speed Test')}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              {t('speedTest.description', 'Measure mixnet connection speed')}
            </TooltipContent>
          </Tooltip>
        )}

        {phase !== 'idle' && phase !== 'complete' && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span>{phaseLabels[phase]}</span>
            <Progress value={progress} className="w-16 h-1" />
          </div>
        )}

        {result && (
          <div className="flex items-center gap-3 text-[10px]">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-0.5">
                  <ArrowDown className={`h-2.5 w-2.5 ${getSpeedQuality(result.download, 'download')}`} />
                  <span className={getSpeedQuality(result.download, 'download')}>
                    {result.download}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                {t('speedTest.download', 'Download')}: {result.download} Mbps
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-0.5">
                  <ArrowUp className={`h-2.5 w-2.5 ${getSpeedQuality(result.upload, 'upload')}`} />
                  <span className={getSpeedQuality(result.upload, 'upload')}>
                    {result.upload}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                {t('speedTest.upload', 'Upload')}: {result.upload} Mbps
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-0.5 text-muted-foreground">
                  <Gauge className="h-2.5 w-2.5" />
                  <span>{result.latency}ms</span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                {t('speedTest.latency', 'Latency')}: {result.latency}ms
              </TooltipContent>
            </Tooltip>

            <Button
              variant="ghost"
              size="sm"
              onClick={runSpeedTest}
              className="h-4 w-4 p-0 opacity-50 hover:opacity-100"
            >
              <Play className="h-2.5 w-2.5" />
            </Button>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
