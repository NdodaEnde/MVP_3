import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/useToast';
import {
  BarChart3,
  Download,
  Calendar,
  TrendingUp,
  Users,
  FileText,
  PieChart,
  Activity,
  Building,
  Clock,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell, BarChart, Bar } from 'recharts';

// Mock API functions for reports
const getReportsData = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        summary: {
          totalExaminations: 1247,
          certificatesIssued: 1198,
          pendingReviews: 23,
          averageProcessingTime: 2.3
        },
        monthlyTrends: [
          { month: 'Jan', examinations: 120, certificates: 115, fit: 85, fitWithRestrictions: 25, unfit: 5 },
          { month: 'Feb', examinations: 135, certificates: 130, fit: 95, fitWithRestrictions: 30, unfit: 5 },
          { month: 'Mar', examinations: 156, certificates: 150, fit: 110, fitWithRestrictions: 35, unfit: 5 },
          { month: 'Apr', examinations: 142, certificates: 138, fit: 100, fitWithRestrictions: 32, unfit: 6 },
          { month: 'May', examinations: 168, certificates: 165, fit: 125, fitWithRestrictions: 35, unfit: 5 },
          { month: 'Jun', examinations: 189, certificates: 185, fit: 140, fitWithRestrictions: 40, unfit: 5 }
        ],
        fitnessDistribution: [
          { name: 'Fit for Duty', value: 755, color: '#10b981' },
          { name: 'Fit with Restrictions', value: 367, color: '#f59e0b' },
          { name: 'Unfit for Duty', value: 76, color: '#ef4444' }
        ],
        employerBreakdown: [
          { employer: 'ABC Mining Corp', examinations: 245, certificates: 240, compliance: 98 },
          { employer: 'XYZ Construction', examinations: 189, certificates: 185, compliance: 98 },
          { employer: 'DEF Manufacturing', examinations: 156, certificates: 152, compliance: 97 },
          { employer: 'GHI Transport', examinations: 134, certificates: 130, compliance: 97 },
          { employer: 'JKL Energy', examinations: 98, certificates: 95, compliance: 97 }
        ],
        complianceMetrics: {
          overallCompliance: 97.8,
          onTimeCompletion: 94.2,
          documentationComplete: 99.1,
          qualityScore: 96.5
        }
      });
    }, 500);
  });
};

export function Reports() {
  const [reportsData, setReportsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('6months');
  const [selectedEmployer, setSelectedEmployer] = useState('all');
  const [reportType, setReportType] = useState('summary');
  const { toast } = useToast();

  useEffect(() => {
    fetchReportsData();
  }, [dateRange, selectedEmployer]);

  const fetchReportsData = async () => {
    try {
      const response = await getReportsData();
      setReportsData(response);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load reports data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExportReport = (format: 'pdf' | 'csv' | 'excel') => {
    toast({
      title: "Export Started",
      description: `Generating ${format.toUpperCase()} report...`,
    });
    // Mock export functionality
    setTimeout(() => {
      toast({
        title: "Export Complete",
        description: `Report exported as ${format.toUpperCase()}`,
      });
    }, 2000);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-48 mb-2"></div>
          <div className="h-4 bg-muted rounded w-96"></div>
        </div>
      </div>
    );
  }

  const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#3b82f6'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
            <BarChart3 className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Reports & Analytics</h1>
            <p className="text-muted-foreground">
              Comprehensive reporting and business intelligence dashboard
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleExportReport('csv')}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button onClick={() => handleExportReport('pdf')} className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700">
            <Download className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Report Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 flex-wrap">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-48">
                <Calendar className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Date range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1month">Last Month</SelectItem>
                <SelectItem value="3months">Last 3 Months</SelectItem>
                <SelectItem value="6months">Last 6 Months</SelectItem>
                <SelectItem value="1year">Last Year</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedEmployer} onValueChange={setSelectedEmployer}>
              <SelectTrigger className="w-48">
                <Building className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Employer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Employers</SelectItem>
                <SelectItem value="abc-mining">ABC Mining Corp</SelectItem>
                <SelectItem value="xyz-construction">XYZ Construction</SelectItem>
                <SelectItem value="def-manufacturing">DEF Manufacturing</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">
              Total Examinations
            </CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-800">{reportsData?.summary.totalExaminations}</div>
            <p className="text-xs text-blue-600">
              +12% from last period
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700">
              Certificates Issued
            </CardTitle>
            <FileText className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-800">{reportsData?.summary.certificatesIssued}</div>
            <p className="text-xs text-green-600">
              96% completion rate
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-yellow-700">
              Pending Reviews
            </CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-800">{reportsData?.summary.pendingReviews}</div>
            <p className="text-xs text-yellow-600">
              Awaiting doctor review
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-700">
              Avg Processing Time
            </CardTitle>
            <Activity className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-800">{reportsData?.summary.averageProcessingTime}h</div>
            <p className="text-xs text-purple-600">
              -15% improvement
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="employers">Employers</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Monthly Trends Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Monthly Examination Trends
                </CardTitle>
                <CardDescription>
                  Examinations and certificates over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={reportsData?.monthlyTrends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="examinations"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        name="Examinations"
                      />
                      <Line
                        type="monotone"
                        dataKey="certificates"
                        stroke="#10b981"
                        strokeWidth={2}
                        name="Certificates"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Fitness Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Fitness Status Distribution
                </CardTitle>
                <CardDescription>
                  Breakdown of fitness assessment results
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={reportsData?.fitnessDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {reportsData?.fitnessDistribution?.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Fitness Status Trends</CardTitle>
              <CardDescription>
                Monthly breakdown of fitness assessment outcomes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={reportsData?.monthlyTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="fit" stackId="a" fill="#10b981" name="Fit" />
                    <Bar dataKey="fitWithRestrictions" stackId="a" fill="#f59e0b" name="Fit with Restrictions" />
                    <Bar dataKey="unfit" stackId="a" fill="#ef4444" name="Unfit" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Employers Tab */}
        <TabsContent value="employers" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Employer Performance</CardTitle>
              <CardDescription>
                Examination statistics by employer organization
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employer</TableHead>
                    <TableHead>Examinations</TableHead>
                    <TableHead>Certificates</TableHead>
                    <TableHead>Compliance Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportsData?.employerBreakdown?.map((employer: any, index: number) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{employer.employer}</TableCell>
                      <TableCell>{employer.examinations}</TableCell>
                      <TableCell>{employer.certificates}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge className={
                            employer.compliance >= 98 ? 'bg-green-100 text-green-800' :
                            employer.compliance >= 95 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }>
                            {employer.compliance}%
                          </Badge>
                          {employer.compliance >= 98 && <CheckCircle className="h-4 w-4 text-green-600" />}
                          {employer.compliance < 95 && <AlertTriangle className="h-4 w-4 text-red-600" />}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Compliance Tab */}
        <TabsContent value="compliance" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Overall Compliance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {reportsData?.complianceMetrics.overallCompliance}%
                </div>
                <p className="text-sm text-muted-foreground">Regulatory compliance</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">On-Time Completion</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">
                  {reportsData?.complianceMetrics.onTimeCompletion}%
                </div>
                <p className="text-sm text-muted-foreground">Within SLA</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Documentation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600">
                  {reportsData?.complianceMetrics.documentationComplete}%
                </div>
                <p className="text-sm text-muted-foreground">Complete records</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Quality Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-600">
                  {reportsData?.complianceMetrics.qualityScore}%
                </div>
                <p className="text-sm text-muted-foreground">Quality metrics</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}