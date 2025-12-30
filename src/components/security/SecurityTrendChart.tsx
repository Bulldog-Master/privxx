/**
 * Security Trend Chart
 * 
 * Displays security event trends over time using recharts.
 */

import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import type { AuditLog } from "@/hooks/useAuditLogs";

interface SecurityTrendChartProps {
  logs: AuditLog[];
}

interface DayData {
  date: string;
  displayDate: string;
  success: number;
  failed: number;
  total: number;
}

export function SecurityTrendChart({ logs }: SecurityTrendChartProps) {
  const { t } = useTranslation();

  // Process logs into daily aggregates
  const chartData = useMemo(() => {
    const dayMap = new Map<string, { success: number; failed: number }>();
    
    // Get the last 14 days
    const now = new Date();
    for (let i = 13; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const key = date.toISOString().split("T")[0];
      dayMap.set(key, { success: 0, failed: 0 });
    }

    // Aggregate logs by day
    logs.forEach((log) => {
      const dateKey = log.created_at.split("T")[0];
      const existing = dayMap.get(dateKey);
      if (existing) {
        if (log.success) {
          existing.success += 1;
        } else {
          existing.failed += 1;
        }
      }
    });

    // Convert to array for recharts
    const data: DayData[] = [];
    dayMap.forEach((value, key) => {
      const date = new Date(key);
      data.push({
        date: key,
        displayDate: new Intl.DateTimeFormat("en-US", {
          month: "short",
          day: "numeric",
        }).format(date),
        success: value.success,
        failed: value.failed,
        total: value.success + value.failed,
      });
    });

    return data;
  }, [logs]);

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium text-sm mb-2">{label}</p>
          <div className="space-y-1">
            <p className="text-xs flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-muted-foreground">
                {t("security.successful", "Successful")}:
              </span>
              <span className="font-medium">{payload[0]?.value || 0}</span>
            </p>
            <p className="text-xs flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-destructive" />
              <span className="text-muted-foreground">
                {t("security.failed", "Failed")}:
              </span>
              <span className="font-medium">{payload[1]?.value || 0}</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="bg-card/90 backdrop-blur-sm border-border/50">
      <CardHeader>
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          <CardTitle className="text-base">
            {t("security.eventTrends", "Event Trends")}
          </CardTitle>
        </div>
        <CardDescription>
          {t("security.eventTrendsDescription", "Security events over the last 14 days")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="successGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="failedGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(0, 84%, 60%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(0, 84%, 60%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
                opacity={0.3}
              />
              <XAxis
                dataKey="displayDate"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ paddingTop: "10px" }}
                formatter={(value) => (
                  <span className="text-xs text-muted-foreground">{value}</span>
                )}
              />
              <Area
                type="monotone"
                dataKey="success"
                name={t("security.successful", "Successful")}
                stroke="hsl(142, 76%, 36%)"
                strokeWidth={2}
                fill="url(#successGradient)"
              />
              <Area
                type="monotone"
                dataKey="failed"
                name={t("security.failed", "Failed")}
                stroke="hsl(0, 84%, 60%)"
                strokeWidth={2}
                fill="url(#failedGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
