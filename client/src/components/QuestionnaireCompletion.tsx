import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PatientWorkflow } from '@/components/PatientWorkflow';
import { usePatientWorkflow } from '@/hooks/usePatientWorkflow';
import {
  CheckCircle,
  Heart,
  TestTube,
  ArrowRight,
  Clock,
  FileCheck
} from 'lucide-react';

interface QuestionnaireCompletionProps {
  patientId?: string;
  patientName?: string;
  examinationType?: string;
  onContinueToStation?: (stationRoute: string) => void;
}

export function QuestionnaireCompletion({
  patientId,
  patientName = 'Patient',
  examinationType = 'pre-employment',
  onContinueToStation
}: QuestionnaireCompletionProps) {
  const navigate = useNavigate();
  const { completeStep, workflowState, navigateWithWorkflow } = usePatientWorkflow(patientId);

  // Mark questionnaire as completed
  React.useEffect(() => {
    completeStep('questionnaire');
  }, []);

  const handleNavigateToStation = (route: string, stepId: string) => {
    if (onContinueToStation) {
      onContinueToStation(route);
    } else {
      navigateWithWorkflow(route, stepId);
    }
  };

  const nextStations = [
    {
      id: 'vitals',
      name: 'Vital Signs',
      description: 'Height, weight, blood pressure, and pulse recording',
      route: '/vitals',
      icon: <Heart className="h-5 w-5" />,
      estimatedTime: '10-15 minutes',
      station: 'Nurse Station'
    },
    {
      id: 'tests',
      name: 'Medical Tests',
      description: 'Vision, hearing, lung function, and drug screening tests',
      route: '/tests',
      icon: <TestTube className="h-5 w-5" />,
      estimatedTime: '20-30 minutes',
      station: 'Technician Station'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Success Message */}
      <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
        <CardContent className="p-6 text-center">
          <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-green-800 mb-2">
            Questionnaire Completed Successfully! ✅
          </h2>
          <p className="text-green-700 mb-4">
            <strong>{patientName}</strong> has completed the medical questionnaire for{' '}
            <Badge className="bg-green-100 text-green-800 border-green-200">
              {examinationType.replace('-', ' ').toUpperCase()}
            </Badge>{' '}
            examination.
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-green-600">
            <FileCheck className="h-4 w-4" />
            <span>All medical history and declarations recorded</span>
          </div>
        </CardContent>
      </Card>

      {/* Next Steps */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <ArrowRight className="h-6 w-6" />
            What's Next?
          </CardTitle>
          <CardDescription>
            Choose your next station to continue the medical examination process
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {nextStations.map((station) => (
              <Card 
                key={station.id}
                className="transition-all duration-200 hover:shadow-md hover:scale-[1.02] cursor-pointer border-blue-200"
                onClick={() => handleNavigateToStation(station.route, station.id)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      {station.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">{station.name}</h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        {station.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="h-3 w-3" />
                            <span>{station.estimatedTime}</span>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {station.station}
                          </Badge>
                        </div>
                        <Button size="sm" className="ml-4">
                          Start
                          <ArrowRight className="h-3 w-3 ml-1" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-center gap-2 text-amber-800 mb-2">
              <Clock className="h-4 w-4" />
              <span className="font-medium">Flexible Scheduling</span>
            </div>
            <p className="text-sm text-amber-700">
              You can complete these stations in any order. Both vital signs and medical tests 
              must be completed before proceeding to the final medical review.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Workflow Progress */}
      <PatientWorkflow
        patientId={patientId}
        patientName={patientName}
        examinationType={examinationType}
        completedSteps={['registration', 'questionnaire']}
        onNavigate={handleNavigateToStation}
        showNextSteps={false}
      />

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button 
              variant="outline" 
              onClick={() => navigate('/patients')}
              className="flex items-center gap-2"
            >
              <ArrowRight className="h-4 w-4" />
              Patient Queue
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.print()}
              className="flex items-center gap-2"
            >
              <FileCheck className="h-4 w-4" />
              Print Questionnaire
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate(`/patients/${patientId}/questionnaire`)}
              className="flex items-center gap-2"
            >
              <FileCheck className="h-4 w-4" />
              Review Questionnaire
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default QuestionnaireCompletion;