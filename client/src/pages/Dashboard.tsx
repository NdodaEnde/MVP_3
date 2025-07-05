import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { getDashboardStats, getQueueStatus } from '@/api/dashboard';
import { useToast } from '@/hooks/useToast';
import { OnboardingGuide } from '@/components/OnboardingGuide';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Calendar,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  TrendingUp,
  Activity,
  UserPlus,
  Upload,
  Stethoscope,
  TestTube,
  Award,
  ArrowRight,
  Lightbulb,
  PlayCircle
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [queue, setQueue] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsResponse, queueResponse] = await Promise.all([
          getDashboardStats(),
          getQueueStatus()
        ]);
        setStats((statsResponse as any).stats);
        setQueue((queueResponse as any).queue);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load dashboard data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  // Check if user is new (in real app, this would be based on user data)
  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding');
    if (hasSeenOnboarding) {
      setShowOnboarding(false);
    }
  }, []);

  const handleDismissOnboarding = () => {
    setShowOnboarding(false);
    localStorage.setItem('hasSeenOnboarding', 'true');
  };

  // Quick action items for "What's Next"
  const quickActions = [
    {
      title: "Register Your First Patient",
      description: "Start by adding a new patient to the system",
      icon: UserPlus,
      route: "/patients/register",
      color: "from-blue-500 to-purple-600",
      priority: 1
    },
    {
      title: "Upload Historical Documents",
      description: "Digitize existing medical records with OCR",
      icon: Upload,
      route: "/documents",
      color: "from-green-500 to-blue-600",
      priority: 2
    },
    {
      title: "Manage Patient Queue",
      description: "Monitor patients through the workflow",
      icon: Users,
      route: "/patients",
      color: "from-purple-500 to-pink-600",
      priority: 3
    },
    {
      title: "Record Vital Signs",
      description: "Capture patient measurements and vitals",
      icon: Stethoscope,
      route: "/vitals",
      color: "from-orange-500 to-red-600",
      priority: 4
    },
    {
      title: "Conduct Medical Tests",
      description: "Perform specialized health assessments",
      icon: TestTube,
      route: "/tests",
      color: "from-teal-500 to-cyan-600",
      priority: 5
    },
    {
      title: "Generate Certificates",
      description: "Issue digital certificates of fitness",
      icon: Award,
      route: "/certificates",
      color: "from-yellow-500 to-orange-600",
      priority: 6
    }
  ];

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

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

  return (
    <div className="space-y-6">
      {/* Onboarding Guide */}
      {showOnboarding && (
        <div className="mb-8">
          <OnboardingGuide />
        </div>
      )}

      {/* What's Next Section - Always visible for guidance */}
      <Card className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 border-indigo-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg">
                <PlayCircle className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl">What's Next?</CardTitle>
                <CardDescription className="text-base">
                  Here are the key actions you can take to get started with your occupational health workflow
                </CardDescription>
              </div>
            </div>
            {!showOnboarding && (
              <Button
                variant="outline"
                onClick={() => setShowOnboarding(true)}
                className="flex items-center gap-2"
              >
                <Lightbulb className="h-4 w-4" />
                Show Full Guide
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {quickActions.slice(0, 6).map((action, index) => {
              const Icon = action.icon;
              return (
                <Card
                  key={index}
                  className="hover:shadow-lg transition-all duration-200 cursor-pointer border-2 hover:border-indigo-200 bg-white/80 backdrop-blur-sm"
                  onClick={() => navigate(action.route)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg bg-gradient-to-r ${action.color} flex-shrink-0`}>
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm mb-1">{action.title}</h4>
                        <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                          {action.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <Badge variant="secondary" className="text-xs">
                            Step {action.priority}
                          </Badge>
                          <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-indigo-600 transition-colors" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's what's happening today.
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            onClick={() => navigate('/patients/register')}
          >
            <Calendar className="mr-2 h-4 w-4" />
            Schedule Exam
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">
              Total Patients
            </CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-800">{stats?.totalPatients}</div>
            <p className="text-xs text-blue-600">
              +12% from last month
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700">
              Today's Exams
            </CardTitle>
            <Activity className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-800">{stats?.todayExaminations}</div>
            <p className="text-xs text-green-600">
              {stats?.completedToday} completed
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-yellow-700">
              Pending Certificates
            </CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-800">{stats?.pendingCertificates}</div>
            <p className="text-xs text-yellow-600">
              Awaiting doctor review
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-700">
              Completed Today
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-800">{stats?.completedToday}</div>
            <p className="text-xs text-purple-600">
              Certificates issued
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Queue Status */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Current Queue Status
            </CardTitle>
            <CardDescription>
              Real-time patient flow through examination stations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(stats?.queueStats || {}).map(([station, count]) => (
              <div key={station} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${
                    count === 0 ? 'bg-green-500' :
                    (count as number) < 3 ? 'bg-yellow-500' : 'bg-red-500'
                  }`} />
                  <span className="font-medium capitalize">{station}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={count === 0 ? 'secondary' : 'default'}>
                    {count} waiting
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    ~{(count as number) * 15}min
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Certificate Status Distribution
            </CardTitle>
            <CardDescription>
              Current month fitness assessment results
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats?.statusDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ status, percentage }) => `${status}: ${percentage}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {stats?.statusDistribution?.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Monthly Examination Trends
          </CardTitle>
          <CardDescription>
            Examinations and certificates issued over the past 6 months
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats?.monthlyTrends}>
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
    </div>
  );
}