import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useNavigate } from 'react-router-dom';
import {
  UserPlus,
  Users,
  Activity,
  TestTube,
  Award,
  FileText,
  CheckCircle,
  ArrowRight,
  Lightbulb,
  Target,
  Clock,
  TrendingUp
} from 'lucide-react';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  route: string;
  completed: boolean;
  role: string[];
}

const onboardingSteps: OnboardingStep[] = [
  {
    id: 'register-patient',
    title: 'Register New Patient',
    description: 'Start by registering a new patient for occupational health examination',
    icon: UserPlus,
    route: '/patients/register',
    completed: false,
    role: ['receptionist', 'admin']
  },
  {
    id: 'manage-queue',
    title: 'Manage Patient Queue',
    description: 'Monitor and move patients through the examination workflow',
    icon: Users,
    route: '/patients',
    completed: false,
    role: ['receptionist', 'nurse', 'technician', 'doctor', 'admin']
  },
  {
    id: 'record-vitals',
    title: 'Record Vital Signs',
    description: 'Capture patient vital signs and measurements',
    icon: Activity,
    route: '/vitals',
    completed: false,
    role: ['nurse', 'admin']
  },
  {
    id: 'conduct-tests',
    title: 'Conduct Medical Tests',
    description: 'Perform and record specialized medical tests',
    icon: TestTube,
    route: '/tests',
    completed: false,
    role: ['technician', 'admin']
  },
  {
    id: 'generate-certificate',
    title: 'Generate Certificate',
    description: 'Review medical data and issue fitness certificates',
    icon: Award,
    route: '/certificates',
    completed: false,
    role: ['doctor', 'admin']
  },
  {
    id: 'upload-documents',
    title: 'Upload Documents',
    description: 'Digitize historical medical documents with OCR processing',
    icon: FileText,
    route: '/documents',
    completed: false,
    role: ['receptionist', 'admin']
  }
];

export function OnboardingGuide() {
  const [dismissed, setDismissed] = useState(false);
  const navigate = useNavigate();
  
  // Mock user role - in real app this would come from auth context
  const userRole = 'admin'; // This should come from useAuth()
  
  const relevantSteps = onboardingSteps.filter(step => 
    step.role.includes(userRole)
  );
  
  const completedSteps = relevantSteps.filter(step => step.completed).length;
  const progressPercentage = (completedSteps / relevantSteps.length) * 100;

  if (dismissed) {
    return null;
  }

  const handleStepClick = (route: string) => {
    navigate(route);
  };

  const quickActions = [
    {
      title: 'Register First Patient',
      description: 'Get started with your first patient registration',
      icon: UserPlus,
      route: '/patients/register',
      color: 'from-blue-500 to-purple-600'
    },
    {
      title: 'Upload Documents',
      description: 'Digitize existing medical records',
      icon: FileText,
      route: '/documents',
      color: 'from-green-500 to-blue-600'
    },
    {
      title: 'View Reports',
      description: 'Check system analytics and reports',
      icon: TrendingUp,
      route: '/reports',
      color: 'from-orange-500 to-red-600'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <Card className="bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 border-blue-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                <Lightbulb className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl">Welcome to HealthForm Harvester!</CardTitle>
                <CardDescription className="text-base">
                  Let's get you started with your occupational health workflow
                </CardDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDismissed(true)}
              className="text-muted-foreground hover:text-foreground"
            >
              Dismiss
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Setup Progress</span>
              <span className="text-sm text-muted-foreground">
                {completedSteps} of {relevantSteps.length} steps completed
              </span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Next Steps */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Your Next Steps
            </CardTitle>
            <CardDescription>
              Complete these steps to set up your workflow
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {relevantSteps.slice(0, 4).map((step, index) => {
                const Icon = step.icon;
                return (
                  <div
                    key={step.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                      step.completed 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-white hover:bg-blue-50 hover:border-blue-200'
                    }`}
                    onClick={() => handleStepClick(step.route)}
                  >
                    <div className={`p-2 rounded-lg ${
                      step.completed 
                        ? 'bg-green-100 text-green-600' 
                        : 'bg-blue-100 text-blue-600'
                    }`}>
                      {step.completed ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <Icon className="h-4 w-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{step.title}</span>
                        {step.completed && (
                          <Badge variant="secondary" className="text-xs">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Done
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {step.description}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Quick Actions
            </CardTitle>
            <CardDescription>
              Jump straight into common tasks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {quickActions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <Button
                    key={index}
                    variant="outline"
                    className="w-full justify-start h-auto p-4 hover:shadow-md transition-all"
                    onClick={() => handleStepClick(action.route)}
                  >
                    <div className={`p-2 rounded-lg bg-gradient-to-r ${action.color} mr-3`}>
                      <Icon className="h-4 w-4 text-white" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-sm">{action.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {action.description}
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 ml-auto text-muted-foreground" />
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Role-specific Tips */}
      <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-800">
            <Lightbulb className="h-5 w-5" />
            Tips for {userRole.charAt(0).toUpperCase() + userRole.slice(1)}s
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            {userRole === 'admin' && (
              <>
                <div className="text-sm">
                  <span className="font-medium text-amber-800">System Setup:</span>
                  <p className="text-amber-700">Configure organization settings and user roles first</p>
                </div>
                <div className="text-sm">
                  <span className="font-medium text-amber-800">Data Migration:</span>
                  <p className="text-amber-700">Use document upload to digitize existing records</p>
                </div>
              </>
            )}
            {userRole === 'receptionist' && (
              <>
                <div className="text-sm">
                  <span className="font-medium text-amber-800">Patient Flow:</span>
                  <p className="text-amber-700">Monitor the queue to ensure smooth patient progression</p>
                </div>
                <div className="text-sm">
                  <span className="font-medium text-amber-800">Registration:</span>
                  <p className="text-amber-700">Verify patient details and examination type carefully</p>
                </div>
              </>
            )}
            {(userRole === 'nurse' || userRole === 'technician' || userRole === 'doctor') && (
              <>
                <div className="text-sm">
                  <span className="font-medium text-amber-800">Data Accuracy:</span>
                  <p className="text-amber-700">Double-check all measurements and test results</p>
                </div>
                <div className="text-sm">
                  <span className="font-medium text-amber-800">Patient Safety:</span>
                  <p className="text-amber-700">Flag any abnormal results immediately</p>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}