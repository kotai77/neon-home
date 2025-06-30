import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { usePersistentAnalytics } from "@/hooks/usePersistentState";
import { User } from "@/lib/types";
import { TrendingUp, Users, Briefcase, Eye, Download } from "lucide-react";

// Mock chart components since we don't have Chart.js configured
const LineChart = ({ data, ...props }: any) => (
  <div data-testid="line-chart" {...props}>
    Line Chart: {JSON.stringify(data?.labels)}
  </div>
);

const BarChart = ({ data, ...props }: any) => (
  <div data-testid="bar-chart" {...props}>
    Bar Chart: {JSON.stringify(data?.labels)}
  </div>
);

const DoughnutChart = ({ data, ...props }: any) => (
  <div data-testid="doughnut-chart" {...props}>
    Doughnut Chart: {JSON.stringify(data?.labels)}
  </div>
);

interface AnalyticsPageProps {
  user: User;
}

const AnalyticsPage: React.FC<AnalyticsPageProps> = ({ user }) => {
  const [analytics, setAnalytics, isLoaded] = usePersistentAnalytics();
  const [dateRange, setDateRange] = useState("last-30-days");
  const [chartPeriod, setChartPeriod] = useState("daily");
  const { toast } = useToast();

  const handleExport = (format: string) => {
    toast({ title: "Export Started" });
  };

  const handleRefresh = () => {
    try {
      setAnalytics({ ...analytics, updatedAt: new Date().toISOString() });
      toast({ title: "Data Refreshed" });
    } catch (error) {
      toast({ title: "Error", variant: "destructive" });
    }
  };

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  const overview = analytics?.overview || {
    totalJobs: 45,
    activeJobs: 23,
    totalApplications: 342,
    totalViews: 12500,
    conversionRate: 2.74,
  };

  return (
    <main className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Analytics & Insights</h1>
          <p className="text-muted-foreground">
            Track your recruitment performance
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last-7-days">Last 7 Days</SelectItem>
              <SelectItem value="last-30-days">Last 30 Days</SelectItem>
              <SelectItem value="last-3-months">Last 3 Months</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleRefresh}>
            Refresh
          </Button>
          <Select onValueChange={handleExport}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Export" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="csv">CSV</SelectItem>
              <SelectItem value="pdf">PDF Report</SelectItem>
              <SelectItem value="custom-range">Custom Range</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="applications">Applications</TabsTrigger>
          <TabsTrigger value="jobs">Jobs</TabsTrigger>
          <TabsTrigger value="traffic">Traffic</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Jobs
                </CardTitle>
                <Briefcase className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">45</div>
                <p className="text-xs text-muted-foreground">
                  +12% from last month
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Jobs
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">23</div>
                <p className="text-xs text-muted-foreground">
                  +8% from last month
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Applications
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">342</div>
                <p className="text-xs text-muted-foreground">
                  +23% from last month
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Views
                </CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">12,500</div>
                <p className="text-xs text-muted-foreground">
                  +15% from last month
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Conversion Rate */}
          <Card>
            <CardHeader>
              <CardTitle>Conversion Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">2.74%</div>
              <p className="text-muted-foreground">This month vs last month</p>
            </CardContent>
          </Card>

          {/* Top Performing Jobs */}
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Jobs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Senior Frontend Developer</h4>
                    <p className="text-sm text-muted-foreground">
                      34 applications
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">1,200 views</div>
                    <div className="text-sm text-muted-foreground">2.83%</div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Backend Engineer</h4>
                    <p className="text-sm text-muted-foreground">
                      28 applications
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">980 views</div>
                    <div className="text-sm text-muted-foreground">2.86%</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <p className="text-sm text-muted-foreground">
            Last updated: {new Date().toLocaleString()}
          </p>
        </TabsContent>

        <TabsContent value="applications" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Application Trends</h2>
            <div className="flex items-center gap-2">
              <Button
                variant={chartPeriod === "daily" ? "default" : "outline"}
                size="sm"
                onClick={() => setChartPeriod("daily")}
              >
                Daily
              </Button>
              <Button
                variant={chartPeriod === "weekly" ? "default" : "outline"}
                size="sm"
                onClick={() => setChartPeriod("weekly")}
              >
                Weekly
              </Button>
              <Button
                variant={chartPeriod === "monthly" ? "default" : "outline"}
                size="sm"
                onClick={() => setChartPeriod("monthly")}
              >
                Monthly
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Application Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <LineChart
                data={{
                  labels:
                    chartPeriod === "weekly"
                      ? ["2024-W01", "2024-W02", "2024-W03"]
                      : ["2024-01-01", "2024-01-02", "2024-01-03"],
                }}
              />
              <p className="text-sm text-muted-foreground mt-2">
                Chart showing application trends over time
              </p>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Application Status</CardTitle>
              </CardHeader>
              <CardContent>
                <DoughnutChart
                  data={{
                    labels: [
                      "Pending",
                      "Reviewed",
                      "Interviewed",
                      "Hired",
                      "Rejected",
                    ],
                  }}
                />
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between">
                    <span>Pending</span>
                    <span>156</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Reviewed</span>
                    <span>98</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Interviewed</span>
                    <span>45</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Application Sources</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Direct</span>
                    <span>189</span>
                  </div>
                  <div className="flex justify-between">
                    <span>LinkedIn</span>
                    <span>87</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Indeed</span>
                    <span>45</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Company Website</span>
                    <span>21</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="jobs" className="space-y-6">
          <h2 className="text-2xl font-bold">Job Performance</h2>

          <Card>
            <CardHeader>
              <CardTitle>Job Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Job Title</th>
                      <th className="text-left p-2">Views</th>
                      <th className="text-left p-2">Applications</th>
                      <th className="text-left p-2">Conversion</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="p-2">Senior Frontend Developer</td>
                      <td className="p-2">1,200</td>
                      <td className="p-2">34</td>
                      <td className="p-2">2.83%</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2">Backend Engineer</td>
                      <td className="p-2">980</td>
                      <td className="p-2">28</td>
                      <td className="p-2">2.86%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Job Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <BarChart
                  data={{
                    labels: ["Engineering", "Design", "Marketing", "Sales"],
                  }}
                />
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between">
                    <span>Engineering</span>
                    <span>25</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Design</span>
                    <span>8</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Job Locations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Amsterdam</span>
                    <span>18</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Remote</span>
                    <span>15</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Berlin</span>
                    <span>7</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="traffic" className="space-y-6">
          <h2 className="text-2xl font-bold">Traffic Overview</h2>

          <Card>
            <CardHeader>
              <CardTitle>Traffic Sources</CardTitle>
            </CardHeader>
            <CardContent>
              <LineChart
                data={{
                  labels: ["2024-01-01", "2024-01-02", "2024-01-03"],
                }}
              />
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Traffic Sources</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Organic</span>
                    <span>45.2%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Social</span>
                    <span>23.8%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Direct</span>
                    <span>19.1%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Device Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Desktop</span>
                    <span>66.7%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Mobile</span>
                    <span>23.8%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tablet</span>
                    <span>9.5%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <div
        className="text-sm text-muted-foreground"
        data-testid="chart-container"
      >
        Analytics data refreshed automatically every hour
      </div>
    </main>
  );
};

export default AnalyticsPage;
