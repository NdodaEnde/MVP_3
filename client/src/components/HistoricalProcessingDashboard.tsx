import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getProcessingStats, getProcessingProjects, generateProcessingReport, ProcessingStats, ProcessingProject } from '@/api/processing';
import { useToast } from '@/hooks/useToast';
import {
  FileText,
  TrendingUp,
  Clock,
  AlertCircle,
  CheckCircle,
  Download,
  Calendar,
  BarChart3,
  Activity,
  Target,
  Zap
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface HistoricalProcessingDashboardProps {
  projectId?: string;
}

export function HistoricalProcessingDashboard({ projectId }: HistoricalProcessingDashboardProps) {
  const [stats, setStats] = useState<ProcessingStats | null>(null);
  const [projects, setProjects] = useState<ProcessingProject[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>(projectId || 'all');
  const [dateRange, setDateRange] = useState<string>('30d');
  const [loading, setLoading] = useState(true);
  const [generatingReport, setGeneratingReport] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, [selectedProject, dateRange]);

  const fetchData = async () => {
    try {
      const [statsResponse, projectsResponse] = await Promise.all([
        getProcessingStats({ 
          projectId: selectedProject === 'all' ? undefined : selectedProject,
          dateRange 
        }),
        getProcessingProjects()
      ]);
      
      setStats((statsResponse as any).stats);
      setProjects((projectsResponse as any).projects);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load processing data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async (format: 'pdf' | 'csv') => {
    setGeneratingReport(true);
    try {
      const response = await generateProcessingReport({
        projectId: selectedProject === 'all' ? undefined : selectedProject,
        dateRange,
        format
      });
      
      toast({
        title: "Success",
        description: "Report generated successfully",
      });
      
      // In a real app, you would download the file from the URL
      console.log('Report URL:', (response as any).reportUrl);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate report",
        variant: "destructive",
      });
    } finally {
      setGeneratingReport(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'paused':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 bg-muted rounded w-20"></div>
                <div className="h-4 w-4 bg-muted rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-16 mb-2"></div>
                <div className="h-3 bg-muted rounded w-24"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg">
            <FileText className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Historical Document Processing</h1>
            <p className="text-muted-foreground">
              Track digitization progress and processing statistics
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => handleGenerateReport('csv')}
            disabled={generatingReport}
          >
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button
            onClick={() => handleGenerateReport('pdf')}
            disabled={generatingReport}
            className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
          >
            <Download className="mr-2 h-4 w-4" />
            {generatingReport ? 'Generating...' : 'Export PDF'}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Select value={selectedProject} onValueChange={setSelectedProject}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select project" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                {projects.map((project) => (
                  <SelectItem key={project._id} value={project._id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Date range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="1y">Last year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">
              Processing Progress
            </CardTitle>
            <Target className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-800 mb-2">
              {stats?.processingProgress}%
            </div>
            <Progress value={stats?.processingProgress} className="mb-2" />
            <p className="text-xs text-blue-600">
              {stats?.processedDocuments} of {stats?.totalDocuments} documents
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700">
              Daily Processing
            </CardTitle>
            <Activity className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-800">
              {stats?.documentsPerDay}
            </div>
            <p className="text-xs text-green-600">
              documents per day
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-700">
              Avg Processing Time
            </CardTitle>
            <Clock className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-800">
              {stats?.averageProcessingTime}min
            </div>
            <p className="text-xs text-purple-600">
              per document
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-700">
              Error Rate
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-800">
              {stats?.errorRate}%
            </div>
            <p className="text-xs text-orange-600">
              processing errors
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Progress */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Processing Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Processing Trends
            </CardTitle>
            <CardDescription>
              Daily document processing over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats?.processingTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="processed"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    name="Processed"
                  />
                  <Line
                    type="monotone"
                    dataKey="errors"
                    stroke="#ef4444"
                    strokeWidth={2}
                    name="Errors"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Milestones */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Project Milestones
            </CardTitle>
            <CardDescription>
              Key progress milestones and achievements
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.milestones.map((milestone, index) => (
                <div key={index} className="flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    milestone.reached 
                      ? 'bg-green-100 text-green-600' 
                      : 'bg-gray-100 text-gray-400'
                  }`}>
                    {milestone.reached ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <div className="w-2 h-2 bg-current rounded-full" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{milestone.percentage}% Complete</span>
                      {milestone.reached && milestone.reachedAt && (
                        <span className="text-sm text-muted-foreground">
                          {new Date(milestone.reachedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    {milestone.reached && (
                      <Badge variant="secondary" className="mt-1">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Completed
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Projects Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Processing Projects
          </CardTitle>
          <CardDescription>
            Overview of all historical document processing projects
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {projects.map((project) => (
              <div key={project._id} className="p-4 border rounded-lg bg-gradient-to-r from-white to-blue-50/30">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-medium">{project.name}</h4>
                    <p className="text-sm text-muted-foreground">{project.clientName}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getPriorityColor(project.priority)}>
                      {project.priority}
                    </Badge>
                    <Badge className={getStatusColor(project.status)}>
                      {project.status.replace('-', ' ')}
                    </Badge>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Progress</span>
                    <span>{Math.round((project.processedDocuments / project.totalDocuments) * 100)}%</span>
                  </div>
                  <Progress 
                    value={(project.processedDocuments / project.totalDocuments) * 100} 
                    className="h-2"
                  />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{project.processedDocuments} / {project.totalDocuments} documents</span>
                    <span>Est. completion: {new Date(project.estimatedCompletion).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}