import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { usePatientWorkflow } from '@/hooks/usePatientWorkflow';
import {
  CheckCircle,
  TestTube,
  Stethoscope,
  ArrowRight,
  Heart,
  Activity
} from 'lucide-react';

interface StationCompletionProps {
  stationType: 'vitals' | 'tests';
  patientId?: string;
  patientName?: string;
  examinationType?: string;
  completedData?: any;
  onContinue?: () => void;
}

export function StationCompletion({
  stationType,
  patientId,
  patientName = 'Patient',
  examinationType = 'pre-employment',
  completedData,
  onContinue
}: StationCompletionProps) {
  const navigate = useNavigate();
  const { completeStep, workflowState, getAvailableSteps } = usePatientWorkflow(patientId);

  // Mark current station as completed
  React.useEffect(() => {
    completeStep(stationType);
  }, [stationType]);

  const stationConfig = {
    vitals: {
      title: 'Vital Signs Recorded',
      icon: <Heart className="h-16 w-16 text-green-600" />,
      description: 'Height, weight, blood pressure, and pulse have been successfully recorded',
      completedItems: [
        'Height and Weight measured',
        'Blood Pressure recorded', 
        'Pulse rate documented',
        'BMI calculated',
        'Temperature taken'
      ]
    },
    tests: {
      title: 'Medical Tests Completed',
      icon: <TestTube className="h-16 w-16 text-green-600" />,
      description: 'All required medical tests have been completed and results recorded',
      completedItems: [
        'Vision test completed',
        'Hearing assessment finished',
        'Lung function test done',
        'Drug screening completed',
        'X-ray images taken'
      ]
    }
  };

  const config = stationConfig[stationType];
  const availableSteps = getAvailableSteps();
  const completedSteps = workflowState.completedSteps;

  // Determine next actions
  const canProceedToReview = completedSteps.includes('vitals') && completedSteps.includes('tests');
  const remainingStation = stationType === 'vitals' ? 
    (!completedSteps.includes('tests') ? 'tests' : null) :
    (!completedSteps.includes('vitals') ? 'vitals' : null);

  const handleContinue = () => {
    if (onContinue) {
      onContinue();
    } else if (canProceedToReview) {
      navigate('/review');
    } else if (remainingStation) {
      navigate(`/${remainingStation}`);
    } else {
      navigate('/patients');
    }
  };

  return (
    <div className="space-y-6">
      {/* Success Message */}
      <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
        <CardContent className="p-8 text-center">
          {config.icon}
          <h2 className="text-2xl font-bold text-green-800 mb-2 mt-4">
            {config.title} ✅
          </h2>
          <p className="text-green-700 mb-4">
            {config.description} for{' '}
            <strong>{patientName}</strong>
          </p>
          <Badge className="bg-green-100 text-green-800 border-green-200">
            {examinationType.replace('-', ' ').toUpperCase()} EXAMINATION
          </Badge>
        </CardContent>
      </Card>

      {/* Completed Items Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Completed Tasks
          </CardTitle>
          <CardDescription>
            All required {stationType === 'vitals' ? 'vital signs' : 'medical tests'} have been recorded
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2">
            {config.completedItems.map((item, index) => (
              <div key={index} className="flex items-center gap-3">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">{item}</span>
              </div>
            ))}
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
        </CardHeader>
        <CardContent>
          {canProceedToReview ? (
            // Ready for medical review
            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 text-green-800 mb-2">
                  <CheckCircle className="h-4 w-4" />
                  <span className="font-medium">Ready for Medical Review!</span>
                </div>
                <p className="text-sm text-green-700 mb-3">
                  All required examinations have been completed. The patient is ready for doctor review and certificate generation.
                </p>
              </div>
              
              <Button 
                onClick={handleContinue}
                className="w-full bg-green-600 hover:bg-green-700"
                size="lg"
              >
                <Stethoscope className="h-4 w-4 mr-2" />
                Proceed to Medical Review
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          ) : remainingStation ? (
            // Need to complete remaining station
            <div className="space-y-4">
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-center gap-2 text-orange-800 mb-2">
                  <Activity className="h-4 w-4" />
                  <span className="font-medium">One More Station Required</span>
                </div>
                <p className="text-sm text-orange-700 mb-3">
                  Please complete the {remainingStation === 'vitals' ? 'vital signs recording' : 'medical tests'} to proceed to medical review.
                </p>
              </div>
              
              <Button 
                onClick={handleContinue}
                className="w-full"
                size="lg"
              >
                {remainingStation === 'vitals' ? (
                  <>
                    <Heart className="h-4 w-4 mr-2" />
                    Continue to Vital Signs
                  </>
                ) : (
                  <>
                    <TestTube className="h-4 w-4 mr-2" />
                    Continue to Medical Tests
                  </>
                )}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          ) : (
            // All complete
            <div className="text-center">
              <p className="text-muted-foreground mb-4">
                Examination workflow completed successfully!
              </p>
              <Button onClick={() => navigate('/patients')} variant="outline">
                Return to Patient Queue
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

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
              onClick={() => navigate(`/${stationType}`)}
              className="flex items-center gap-2"
            >
              <Activity className="h-4 w-4" />
              Review {stationType === 'vitals' ? 'Vital Signs' : 'Test Results'}
            </Button>
            {patientId && (
              <Button 
                variant="outline" 
                onClick={() => navigate(`/patients/${patientId}/questionnaire`)}
                className="flex items-center gap-2"
              >
                <ArrowRight className="h-4 w-4" />
                View Questionnaire
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default StationCompletion;