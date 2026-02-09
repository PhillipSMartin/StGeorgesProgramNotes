import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import {
  useAdminSession,
  useCurrentAnalytics,
  useAnalyticsArchives,
  useArchivedAnalytics,
  useClearAnalytics,
} from "@/hooks/use-admin";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  ChevronLeft,
  BarChart3,
  Download,
  Trash2,
  Archive,
  Calendar,
  Users,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "#8884d8",
  "#82ca9d",
  "#ffc658",
  "#ff7300",
  "#0088fe",
];

type AnalyticsData = {
  stats: { language: string; label: string; count: number; percentage: number }[];
  dateRange: { start: string; end: string };
  totalCount: number;
};

function formatDate(isoString: string) {
  return new Date(isoString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function AnalyticsReport({ data, title, dateLabel }: { data: AnalyticsData; title: string; dateLabel: string }) {
  const reportRef = useRef<HTMLDivElement>(null);
  const [chartType, setChartType] = useState<"bar" | "pie">("bar");

  const handleExportPDF = () => {
    const printContent = reportRef.current;
    if (!printContent) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Language Analytics Report - St. George's Choral Society</title>
        <style>
          body {
            font-family: 'Georgia', 'Times New Roman', serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 40px;
            color: #1a1a1a;
          }
          h1 {
            text-align: center;
            color: #4a1c2e;
            border-bottom: 2px solid #c4a35a;
            padding-bottom: 12px;
            margin-bottom: 8px;
          }
          .subtitle {
            text-align: center;
            color: #666;
            margin-bottom: 24px;
            font-size: 14px;
          }
          .summary {
            display: flex;
            justify-content: space-between;
            background: #f8f5f0;
            padding: 16px 24px;
            border-radius: 8px;
            margin-bottom: 32px;
          }
          .summary-item {
            text-align: center;
          }
          .summary-label {
            font-size: 12px;
            color: #666;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          .summary-value {
            font-size: 24px;
            font-weight: bold;
            color: #4a1c2e;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 24px;
          }
          th {
            background: #4a1c2e;
            color: white;
            padding: 12px 16px;
            text-align: left;
            font-size: 13px;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          td {
            padding: 10px 16px;
            border-bottom: 1px solid #e0d8ce;
          }
          tr:nth-child(even) {
            background: #f8f5f0;
          }
          .percentage-bar {
            background: #e0d8ce;
            border-radius: 4px;
            height: 8px;
            overflow: hidden;
          }
          .percentage-fill {
            background: #c4a35a;
            height: 100%;
            border-radius: 4px;
          }
          .footer {
            margin-top: 40px;
            text-align: center;
            font-size: 12px;
            color: #999;
            border-top: 1px solid #e0d8ce;
            padding-top: 16px;
          }
          @media print {
            body { padding: 20px; }
          }
        </style>
      </head>
      <body>
        <h1>Language Selection Report</h1>
        <p class="subtitle">St. George's Choral Society - Concert Program Notes</p>
        <div class="summary">
          <div class="summary-item">
            <div class="summary-label">Total Selections</div>
            <div class="summary-value">${data.totalCount}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">Languages Used</div>
            <div class="summary-value">${data.stats.length}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">Date Range</div>
            <div class="summary-value" style="font-size:16px">${formatDate(data.dateRange.start)} - ${formatDate(data.dateRange.end)}</div>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th style="width:40px">#</th>
              <th>Language</th>
              <th style="text-align:right">Selections</th>
              <th style="text-align:right">Percentage</th>
              <th style="width:150px">Distribution</th>
            </tr>
          </thead>
          <tbody>
            ${data.stats.map((s, i) => `
              <tr>
                <td>${i + 1}</td>
                <td>${s.label} (${s.language})</td>
                <td style="text-align:right;font-weight:bold">${s.count}</td>
                <td style="text-align:right">${s.percentage}%</td>
                <td>
                  <div class="percentage-bar">
                    <div class="percentage-fill" style="width:${s.percentage}%"></div>
                  </div>
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
        <div class="footer">
          Generated on ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}
        </div>
      </body>
      </html>
    `);

    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  return (
    <div ref={reportRef}>
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h2 className="text-lg font-semibold" data-testid="text-report-title">{title}</h2>
          <p className="text-sm text-muted-foreground flex items-center gap-1" data-testid="text-report-date-range">
            <Calendar className="w-3.5 h-3.5" />
            {dateLabel}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleExportPDF} data-testid="button-export-pdf">
          <Download className="w-4 h-4 mr-1" />
          Export PDF
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-bold" data-testid="text-total-selections">{data.totalCount}</div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Total Selections</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-bold" data-testid="text-languages-used">{data.stats.length}</div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Languages Used</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-bold" data-testid="text-top-language">
              {data.stats.length > 0 ? data.stats[0].label : "N/A"}
            </div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Most Selected</p>
          </CardContent>
        </Card>
      </div>

      {data.stats.length > 0 ? (
        <>
          <Card className="mb-6">
            <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-2">
              <CardTitle className="text-base">Language Distribution</CardTitle>
              <Select value={chartType} onValueChange={(v) => setChartType(v as "bar" | "pie")}>
                <SelectTrigger className="w-28" data-testid="select-chart-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bar">Bar Chart</SelectItem>
                  <SelectItem value="pie">Pie Chart</SelectItem>
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent>
              <div className="h-72" data-testid="chart-container">
                {chartType === "bar" ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.stats} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="label" className="text-xs" tick={{ fontSize: 12 }} />
                      <YAxis className="text-xs" tick={{ fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "6px",
                          color: "hsl(var(--card-foreground))",
                        }}
                        formatter={(value: number, _name: string, props: any) => [
                          `${value} (${props.payload.percentage}%)`,
                          "Selections",
                        ]}
                      />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                        {data.stats.map((_entry, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.stats}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        dataKey="count"
                        nameKey="label"
                        label={({ label, percentage }) => `${label} ${percentage}%`}
                        labelLine={true}
                      >
                        {data.stats.map((_entry, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "6px",
                          color: "hsl(var(--card-foreground))",
                        }}
                        formatter={(value: number, _name: string, props: any) => [
                          `${value} (${props.payload.percentage}%)`,
                          "Selections",
                        ]}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Detailed Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm" data-testid="table-analytics">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-3 font-medium text-muted-foreground">#</th>
                      <th className="text-left py-2 px-3 font-medium text-muted-foreground">Language</th>
                      <th className="text-left py-2 px-3 font-medium text-muted-foreground">Code</th>
                      <th className="text-right py-2 px-3 font-medium text-muted-foreground">Selections</th>
                      <th className="text-right py-2 px-3 font-medium text-muted-foreground">Percentage</th>
                      <th className="py-2 px-3 font-medium text-muted-foreground w-32">Distribution</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.stats.map((stat, index) => (
                      <tr key={stat.language} className="border-b last:border-b-0" data-testid={`row-stat-${stat.language}`}>
                        <td className="py-2.5 px-3 text-muted-foreground">{index + 1}</td>
                        <td className="py-2.5 px-3 font-medium">{stat.label}</td>
                        <td className="py-2.5 px-3">
                          <Badge variant="secondary" className="font-mono text-xs">{stat.language}</Badge>
                        </td>
                        <td className="py-2.5 px-3 text-right font-semibold">{stat.count}</td>
                        <td className="py-2.5 px-3 text-right">{stat.percentage}%</td>
                        <td className="py-2.5 px-3">
                          <div className="w-full bg-muted rounded-full h-2">
                            <div
                              className="h-2 rounded-full transition-all"
                              style={{
                                width: `${stat.percentage}%`,
                                backgroundColor: CHART_COLORS[index % CHART_COLORS.length],
                              }}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground" data-testid="text-no-data">No language selection data available for this period</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function AdminAnalytics() {
  const [_, setLocation] = useLocation();
  const { data: session, isLoading: sessionLoading } = useAdminSession();
  const { data: currentData, isLoading: currentLoading } = useCurrentAnalytics();
  const { data: archives, isLoading: archivesLoading } = useAnalyticsArchives();
  const clearMutation = useClearAnalytics();
  const { toast } = useToast();

  const [viewMode, setViewMode] = useState<"current" | string>("current");
  const selectedArchiveId = viewMode !== "current" ? Number(viewMode) : null;
  const { data: archivedData } = useArchivedAnalytics(selectedArchiveId);

  useEffect(() => {
    if (!sessionLoading && !session?.authenticated) {
      setLocation("/admin");
    }
  }, [session?.authenticated, sessionLoading, setLocation]);

  if (sessionLoading || !session?.authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const handleClearStats = async () => {
    if (!currentData || currentData.totalCount === 0) {
      toast({ title: "Nothing to clear", description: "There are no statistics to archive" });
      return;
    }
    if (!confirm("This will archive the current statistics and clear the data. Continue?")) return;
    try {
      await clearMutation.mutateAsync();
      toast({ title: "Archived", description: "Statistics have been archived and cleared" });
      setViewMode("current");
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const activeData = viewMode === "current" ? currentData : archivedData;
  const isLoading = viewMode === "current" ? currentLoading : !archivedData && selectedArchiveId !== null;

  const selectedArchive = archives?.find(a => a.id === selectedArchiveId);
  const dateLabel = viewMode === "current"
    ? activeData
      ? `${formatDate(activeData.dateRange.start)} - ${formatDate(activeData.dateRange.end)}`
      : "No data yet"
    : selectedArchive
      ? `${formatDate(selectedArchive.periodStart)} - ${formatDate(selectedArchive.periodEnd)}`
      : "";

  const reportTitle = viewMode === "current" ? "Current Statistics" : "Archived Statistics";

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container max-w-5xl mx-auto px-6 py-3 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setLocation("/admin/dashboard")} data-testid="button-back-dashboard">
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <h1 className="font-serif text-lg font-bold flex items-center gap-2" data-testid="text-analytics-title">
              <BarChart3 className="w-5 h-5" />
              Analytics & Reporting
            </h1>
          </div>
        </div>
      </header>

      <main className="container max-w-5xl mx-auto px-6 py-8 space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 flex-wrap">
            <div className="flex items-center gap-3 flex-wrap">
              <Select value={viewMode} onValueChange={setViewMode}>
                <SelectTrigger className="w-64" data-testid="select-view-mode">
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current">
                    Current Statistics
                  </SelectItem>
                  {archives && archives.length > 0 && (
                    archives.map(archive => (
                      <SelectItem key={archive.id} value={String(archive.id)}>
                        {formatDate(archive.periodStart)} - {formatDate(archive.periodEnd)} ({archive.totalCount} selections)
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {archives && archives.length > 0 && (
                <Badge variant="secondary" className="shrink-0">
                  <Archive className="w-3 h-3 mr-1" />
                  {archives.length} archived {archives.length === 1 ? "period" : "periods"}
                </Badge>
              )}
            </div>
            {viewMode === "current" && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearStats}
                disabled={clearMutation.isPending || !currentData || currentData.totalCount === 0}
                data-testid="button-clear-stats"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                {clearMutation.isPending ? "Archiving..." : "Clear & Archive"}
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-24 bg-muted rounded animate-pulse" />
                  ))}
                </div>
                <div className="h-72 bg-muted rounded animate-pulse" />
              </div>
            ) : activeData ? (
              <AnalyticsReport
                data={activeData}
                title={reportTitle}
                dateLabel={dateLabel}
              />
            ) : (
              <div className="py-12 text-center">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground" data-testid="text-no-analytics">No analytics data available</p>
                <p className="text-xs text-muted-foreground mt-1">Statistics will appear as audience members select languages</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
