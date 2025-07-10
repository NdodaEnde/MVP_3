import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Heart,
  TestTube,
  Stethoscope,
  FileCheck,
  User,
  CheckCircle,
  Clock,
  ArrowRight
} from 'lucide-react';

export interface WorkflowStep {
  id: string;
  name: string;
  description: string;
  route: string;
  icon: React.ReactNode;
  status: 'completed' | 'current' | 'pending' | 'available';
  required: boolean;
}

export interface PatientWorkflowProps {
  patientId?: string;
  patientName?: string;
  examinationType?: string;
  currentStep?: string;
  completedSteps?: string[];
  onNavigate?: (route: string, stepId: string) => void;
  showNextSteps?: boolean;
}

export function PatientWorkflow({
  patientId,
  patientName = 'Patient',
  examinationType = 'pre-employment',
  currentStep,
  completedSteps = [],
  onNavigate,
  showNextSteps = true
}: PatientWorkflowProps) {
  const navigate = useNavigate();

  const workflowSteps: WorkflowStep[] = [
    {
      id: 'registration',
      name: 'Registration',
      description: 'Patient information and details',
      route: '/patients/register',
      icon: <User className="h-4 w-4" />,
      status: completedSteps.includes('registration') ? 'completed' : 'pending',
      required: true
    },
    {
      id: 'questionnaire',
      name: 'Medical Questionnaire',
      description: 'Health history and declarations',
      route: patientId ? `/patients/${patientId}/questionnaire` : '/questionnaires',
      icon: <FileCheck className="h-4 w-4" />,
      status: completedSteps.includes('questionnaire') ? 'completed' : 
              currentStep === 'questionnaire' ? 'current' : 'pending',
      required: true
    },
    {
      id: 'vitals',
      name: 'Vital Signs',
      description: 'Nurse station - Height, weight, BP, pulse',
      route: '/vitals',
      icon: <Heart className="h-4 w-4" />,
      status: completedSteps.includes('vitals') ? 'completed' : 
              currentStep === 'vitals' ? 'current' : 
              completedSteps.includes('questionnaire') ? 'available' : 'pending',
      required: true
    },
    {
      id: 'tests',
      name: 'Medical Tests',
      description: 'Technician station - Vision, hearing, lung function',
      route: '/tests',
      icon: <TestTube className="h-4 w-4" />,
      status: completedSteps.includes('tests') ? 'completed' : 
              currentStep === 'tests' ? 'current' : 
              completedSteps.includes('questionnaire') ? 'available' : 'pending',
      required: true
    },
    {
      id: 'review',
      name: 'Medical Review',
      description: 'Doctor review and certificate generation',
      route: '/review',
      icon: <Stethoscope className="h-4 w-4" />,
      status: completedSteps.includes('review') ? 'completed' : 
              currentStep === 'review' ? 'current' : 
              (completedSteps.includes('vitals') && completedSteps.includes('tests')) ? 'available' : 'pending',
      required: true
    }
  ];

  const getStepColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'current': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'available': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const getStepIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'current': return <ArrowRight className="h-4 w-4" />;
      case 'available': return <Clock className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const completedCount = workflowSteps.filter(step => step.status === 'completed').length;
  const totalSteps = workflowSteps.length;
  const progressPercentage = (completedCount / totalSteps) * 100;

  const availableSteps = workflowSteps.filter(step => step.status === 'available');
  const nextStep = workflowSteps.find(step => step.status === 'current') || availableSteps[0];

  const handleNavigation = (route: string, stepId: string) => {
    if (onNavigate) {
      onNavigate(route, stepId);
    } else {
      navigate(route);
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress Header */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">
                {patientName} - {examinationType.replace('-', ' ').toUpperCase()} Examination
              </CardTitle>
              <CardDescription>
                Progress: {completedCount} of {totalSteps} steps completed
              </CardDescription>
            </div>
            <Badge className={progressPercentage === 100 ? 
              'bg-green-100 text-green-800 border-green-200' : 
              'bg-blue-100 text-blue-800 border-blue-200'
            }>
              {Math.round(progressPercentage)}% Complete
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={progressPercentage} className="w-full" />
        </CardContent>
      </Card>

      {/* Workflow Steps */}
      <div className="grid gap-4 md:grid-cols-5">
        {workflowSteps.map((step, index) => (
          <Card 
            key={step.id} 
            className={`transition-all duration-200 ${
              step.status === 'available' ? 'ring-2 ring-orange-200 shadow-md' : ''
            } ${step.status === 'current' ? 'ring-2 ring-blue-200 shadow-md' : ''}`}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className={`p-2 rounded-lg ${getStepColor(step.status).replace('text-', 'bg-').replace('800', '200')}`}>
                  {step.icon}
                </div>
                <div className="flex-1">
                  <Badge className={getStepColor(step.status)}>
                    {getStepIcon(step.status)}
                    <span className="ml-1">{step.status.toUpperCase()}</span>
                  </Badge>
                </div>
              </div>
              <h4 className="font-medium text-sm mb-1">{step.name}</h4>
              <p className="text-xs text-muted-foreground mb-3">{step.description}</p>
              
              {step.status === 'available' && (
                <Button 
                  size="sm" 
                  className="w-full"
                  onClick={() => handleNavigation(step.route, step.id)}
                >
                  Start {step.name}
                </Button>
              )}
              
              {step.status === 'current' && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="w-full"
                  onClick={() => handleNavigation(step.route, step.id)}
                >
                  Continue
                </Button>
              )}
              
              {step.status === 'completed' && (
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="w-full text-green-600"
                  onClick={() => handleNavigation(step.route, step.id)}
                >
                  Review
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Next Steps */}
      {showNextSteps && availableSteps.length > 0 && (
        <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ArrowRight className="h-5 w-5" />
              What's Next?
            </CardTitle>
            <CardDescription>
              Choose your next station to continue the examination
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2">
              {availableSteps.map((step) => (
                <Button
                  key={step.id}
                  variant="outline"
                  className="justify-start h-auto p-4 border-orange-200 hover:bg-orange-50"
                  onClick={() => handleNavigation(step.route, step.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      {step.icon}
                    </div>
                    <div className="text-left">
                      <div className="font-medium">{step.name}</div>
                      <div className="text-sm text-muted-foreground">{step.description}</div>
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Completion Message */}
      {progressPercentage === 100 && (
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardContent className="p-6 text-center">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-green-800 mb-2">
              Examination Complete! 🎉
            </h3>
            <p className="text-green-700 mb-4">
              All required steps have been completed. The medical review and certificate are ready.
            </p>
            <Button 
              className="bg-green-600 hover:bg-green-700"
              onClick={() => handleNavigation('/certificates', 'certificate')}
            >
              View Certificate
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default PatientWorkflow;