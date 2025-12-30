/**
 * Event Type Distribution Chart
 * 
 * Displays a breakdown of security events by type using a bar chart.
 */

import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart } from "lucide-react";
import type { AuditLog } from "@/hooks/useAuditLogs";

interface EventTypeChartProps {
  logs: AuditLog[];
}

// Event category colors
const categoryColors: Record<string, string> = {
  auth: "hsl(210, 100%, 56%)",
  passkey: "hsl(280, 87%, 65%)",
  totp: "hsl(45, 93%, 47%)",
  identity: "hsl(142, 76%, 36%)",
  profile: "hsl(190, 90%, 50%)",
  session: "hsl(330, 80%, 60%)",
};

// Event category labels
const categoryLabels: Record<string, string> = {
  auth: "Authentication",
  passkey: "Passkeys",
  totp: "Two-Factor",
  identity: "Identity",
  profile: "Profile",
  session: "Session",
};

function getEventCategory(eventType: string): string {
  if (eventType.startsWith("auth_")) return "auth";
  if (eventType.startsWith("passkey_")) return "passkey";
  if (eventType.startsWith("totp_")) return "totp";
  if (eventType.startsWith("identity_")) return "identity";
  if (eventType.startsWith("profile_")) return "profile";
  if (eventType.startsWith("session_")) return "session";
  return "auth";
}

interface CategoryData {
  category: string;
  label: string;
  count: number;
  color: string;
}

export function EventTypeChart({ logs }: EventTypeChartProps) {
  const { t } = useTranslation();

  // Process logs into category counts
  const chartData = useMemo(() => {
    const categoryMap = new Map<string, number>();

    logs.forEach((log) => {
      const category = getEventCategory(log.event_type);
      categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
    });

    const data: CategoryData[] = [];
    categoryMap.forEach((count, category) => {
      data.push({
        category,
        label: categoryLabels[category] || category,
        count,
        color: categoryColors[category] || "hsl(var(--primary))",
      });
    });

    // Sort by count descending
    return data.sort((a, b) => b.count - a.count);
  }, [logs]);

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as CategoryData;
      return (
        <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium text-sm">{data.label}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {data.count} {t("security.events", "events")}
          </p>
        </div>
      );
    }
    return null;
  };

  if (chartData.length === 0) {
    return (
      <Card className="bg-card/90 backdrop-blur-sm border-border/50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <PieChart className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">
              {t("security.eventsByCategory", "Events by Category")}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            {t("security.noDataForChart", "No data available")}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/90 backdrop-blur-sm border-border/50">
      <CardHeader>
        <div className="flex items-center gap-2">
          <PieChart className="h-4 w-4 text-primary" />
          <CardTitle className="text-base">
            {t("security.eventsByCategory", "Events by Category")}
          </CardTitle>
        </div>
        <CardDescription>
          {t("security.eventsByCategoryDescription", "Distribution of security events")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
                opacity={0.3}
                horizontal={false}
              />
              <XAxis
                type="number"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <YAxis
                type="category"
                dataKey="label"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                width={90}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={30}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
