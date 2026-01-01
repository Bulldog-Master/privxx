/**
 * Security Dashboard Page
 * 
 * Displays audit logs with filtering, search, and export capabilities.
 */

import { useState, useMemo } from "react";
import { DateRange } from "react-day-picker";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { 
  ArrowLeft, 
  Shield, 
  Search, 
  Download, 
  Filter, 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  Loader2,
  Calendar,
  X
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useAuditLogs, type AuditLog } from "@/hooks/useAuditLogs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageBackground } from "@/components/layout/PageBackground";
import { PrivxxLogo } from "@/components/brand";
import { SecurityTrendChart, EventTypeChart } from "@/components/security";
import { AuthServiceDiagnostics } from "@/components/settings/AuthServiceDiagnostics";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { useToast } from "@/components/ui/use-toast";

// Event type display mappings
const eventTypeLabels: Record<string, string> = {
  auth_signin_success: "Sign In",
  auth_signin_failure: "Sign In Failed",
  auth_signup_success: "Sign Up",
  auth_signup_failure: "Sign Up Failed",
  auth_signout: "Sign Out",
  auth_password_reset_request: "Password Reset Request",
  auth_password_reset_complete: "Password Reset Complete",
  auth_email_verification: "Email Verified",
  passkey_registration_start: "Passkey Registration Started",
  passkey_registration_complete: "Passkey Registered",
  passkey_auth_success: "Passkey Authentication",
  passkey_auth_failure: "Passkey Auth Failed",
  totp_setup_start: "2FA Setup Started",
  totp_setup_complete: "2FA Enabled",
  totp_verify_success: "2FA Verified",
  totp_verify_failure: "2FA Verification Failed",
  totp_backup_code_used: "Backup Code Used",
  profile_update: "Profile Updated",
  session_timeout: "Session Timeout",
  identity_create: "Identity Created",
  identity_unlock: "Identity Unlocked",
  identity_lock: "Identity Locked",
};

// Event categories for filtering
const eventCategories = {
  all: "All Events",
  auth: "Authentication",
  passkey: "Passkeys",
  totp: "Two-Factor Auth",
  identity: "Identity",
  profile: "Profile",
};

type EventCategory = keyof typeof eventCategories;

function getEventCategory(eventType: string): EventCategory {
  if (eventType.startsWith("auth_")) return "auth";
  if (eventType.startsWith("passkey_")) return "passkey";
  if (eventType.startsWith("totp_")) return "totp";
  if (eventType.startsWith("identity_")) return "identity";
  if (eventType.startsWith("profile_")) return "profile";
  return "all";
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(date);
}

function formatDateShort(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default function Security() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const { logs, isLoading, error, refetch } = useAuditLogs({ limit: 100 });

  // Filter and search state
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<EventCategory>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "success" | "failure">("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  // Filtered logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // Date range filter
      if (dateRange?.from) {
        const logDate = new Date(log.created_at);
        const fromDate = new Date(dateRange.from);
        fromDate.setHours(0, 0, 0, 0);
        if (logDate < fromDate) return false;
        
        if (dateRange.to) {
          const toDate = new Date(dateRange.to);
          toDate.setHours(23, 59, 59, 999);
          if (logDate > toDate) return false;
        }
      }

      // Category filter
      if (categoryFilter !== "all" && getEventCategory(log.event_type) !== categoryFilter) {
        return false;
      }

      // Status filter
      if (statusFilter === "success" && !log.success) return false;
      if (statusFilter === "failure" && log.success) return false;

      // Search filter (search by event type/label only - IP/UA not available in safe view)
      if (searchQuery) {
        const label = eventTypeLabels[log.event_type] || log.event_type;
        const searchLower = searchQuery.toLowerCase();
        if (
          !label.toLowerCase().includes(searchLower) &&
          !log.event_type.toLowerCase().includes(searchLower)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [logs, categoryFilter, statusFilter, searchQuery, dateRange]);

  // Export to CSV (privacy-safe: excludes IP/UA)
  const handleExport = () => {
    const headers = ["Date", "Event", "Status"];
    const rows = filteredLogs.map((log) => [
      formatDate(log.created_at),
      eventTypeLabels[log.event_type] || log.event_type,
      log.success ? "Success" : "Failed",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `privxx-security-logs-${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: t("security.exportSuccess", "Export Complete"),
      description: t("security.exportDescription", "{{count}} events exported to CSV", { count: filteredLogs.length }),
    });
  };

  // Stats
  const stats = useMemo(() => {
    const total = logs.length;
    const successful = logs.filter((l) => l.success).length;
    const failed = total - successful;
    return { total, successful, failed };
  }, [logs]);

  // Clear filters
  const clearFilters = () => {
    setSearchQuery("");
    setCategoryFilter("all");
    setStatusFilter("all");
    setDateRange(undefined);
  };

  const hasActiveFilters = searchQuery || categoryFilter !== "all" || statusFilter !== "all" || dateRange !== undefined;

  if (!user) {
    return null;
  }

  return (
    <PageBackground>
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild className="text-primary hover:text-primary/80">
              <Link to="/settings">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div className="flex items-center gap-3">
              <Shield className="h-6 w-6 text-primary" />
              <div>
                <h1 className="text-2xl font-bold text-primary">
                  {t("security.title", "Security Dashboard")}
                </h1>
                <p className="text-sm text-primary/70">
                  {t("security.subtitle", "Monitor and review security activity")}
                </p>
              </div>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={refetch} disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="bg-card/90 backdrop-blur-sm border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {t("security.totalEvents", "Total Events")}
                  </p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <Calendar className="h-8 w-8 text-primary/50" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/90 backdrop-blur-sm border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {t("security.successfulEvents", "Successful")}
                  </p>
                  <p className="text-2xl font-bold text-green-500">{stats.successful}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500/50" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/90 backdrop-blur-sm border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {t("security.failedEvents", "Failed")}
                  </p>
                  <p className="text-2xl font-bold text-destructive">{stats.failed}</p>
                </div>
                <XCircle className="h-8 w-8 text-destructive/50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <SecurityTrendChart logs={logs} />
          <EventTypeChart logs={logs} />
        </div>

        {/* Auth Service Diagnostics */}
        <div className="mb-6">
          <AuthServiceDiagnostics />
        </div>

        {/* Filters and Search */}
        <Card className="bg-card/90 backdrop-blur-sm border-border/50 mb-6">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-primary" />
                <CardTitle className="text-base">
                  {t("security.filters", "Filters")}
                </CardTitle>
              </div>
              <div className="flex items-center gap-2">
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs">
                    <X className="h-3 w-3 mr-1" />
                    {t("security.clearFilters", "Clear")}
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={handleExport} disabled={filteredLogs.length === 0}>
                  <Download className="h-4 w-4 mr-2" />
                  {t("security.export", "Export CSV")}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Search */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={t("security.searchPlaceholder", "Search events...")}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>

                {/* Date Range Picker */}
                <DateRangePicker
                  value={dateRange}
                  onChange={setDateRange}
                  placeholder={t("security.dateRange", "Date range")}
                  className="w-full sm:w-[240px]"
                />

                {/* Category Filter */}
                <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v as EventCategory)}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder={t("security.category", "Category")} />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(eventCategories).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Status Filter */}
                <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as "all" | "success" | "failure")}>
                  <SelectTrigger className="w-full sm:w-[140px]">
                    <SelectValue placeholder={t("security.status", "Status")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("security.allStatus", "All Status")}</SelectItem>
                    <SelectItem value="success">{t("security.successOnly", "Success")}</SelectItem>
                    <SelectItem value="failure">{t("security.failedOnly", "Failed")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Audit Logs Table */}
        <Card className="bg-card/90 backdrop-blur-sm border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">
              {t("security.auditLogs", "Audit Logs")}
            </CardTitle>
            <CardDescription>
              {t("security.auditLogsDescription", "Showing {{count}} of {{total}} events", {
                count: filteredLogs.length,
                total: logs.length,
              })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error ? (
              <p className="text-sm text-destructive text-center py-8">{error}</p>
            ) : isLoading && logs.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredLogs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-12">
                {hasActiveFilters
                  ? t("security.noMatchingEvents", "No events match your filters")
                  : t("security.noEvents", "No security events recorded yet")}
              </p>
            ) : (
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("security.date", "Date")}</TableHead>
                      <TableHead>{t("security.event", "Event")}</TableHead>
                      <TableHead>{t("security.statusCol", "Status")}</TableHead>
                      <TableHead className="hidden md:table-cell">
                        {t("security.category", "Category")}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-mono text-xs whitespace-nowrap">
                          {formatDateShort(log.created_at)}
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">
                            {eventTypeLabels[log.event_type] || log.event_type}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={log.success ? "default" : "destructive"} className="text-xs">
                            {log.success ? (
                              <><CheckCircle className="h-3 w-3 mr-1" /> Success</>
                            ) : (
                              <><XCircle className="h-3 w-3 mr-1" /> Failed</>
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-xs text-muted-foreground capitalize">
                          {getEventCategory(log.event_type)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-12 flex justify-center">
          <PrivxxLogo size="sm" />
        </div>
      </div>
    </PageBackground>
  );
}
