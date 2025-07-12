// Workflow completion page
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useWorkflow } from '@/contexts/WorkflowContext';
import {
  CheckCircle, Clock, Activity, Download, 
  Home, RefreshCw, Star, Award
} from 'lucide-react';

export const WorkflowComplete: React.FC = () => {
  const navigate = useNavigate();
  const { state: workflowState, resetJourney } = useWorkflow();

  const handleStartNew = () => {
    resetJourney();
    navigate('/workflow/reception');
  };

  const handleGoHome = () => {
    navigate('/');
  };

  const calculateJourneyTime = () => {
    if (workflowState.journeyStartTime) {
      const duration = Date.now() - workflowState.journeyStartTime.getTime();
      return Math.round(duration / 60000); // minutes
    }
    return 0;
  };

  const getEfficiencyRating = () => {
    const totalTime = calculateJourneyTime();
    if (totalTime <= 30) return 'excellent';
    if (totalTime <= 45) return 'good';
    if (totalTime <= 60) return 'average';
    return 'needs_improvement';
  };

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case 'excellent': return 'text-green-600 bg-green-100';
      case 'good': return 'text-blue-600 bg-blue-100';
      case 'average': return 'text-orange-600 bg-orange-100';
      default: return 'text-red-600 bg-red-100';
    }
  };

  const getRatingIcon = (rating: string) => {
    switch (rating) {
      case 'excellent': return <Award className="h-5 w-5" />;
      case 'good': return <Star className="h-5 w-5" />;
      case 'average': return <Clock className="h-5 w-5" />;
      default: return <RefreshCw className="h-5 w-5" />;
    }
  };

  const efficiency = getEfficiencyRating();

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full space-y-6">
        {/* Success Header */}
        <Card className="border-2 border-green-200 bg-green-50">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              <CheckCircle className="h-20 w-20 text-green-600" />
            </div>
            <CardTitle className="text-3xl text-green-700">
              Journey Complete! 🎉
            </CardTitle>
            <CardDescription className="text-lg text-green-600">
              {workflowState.patientInfo ? 
                `${workflowState.patientInfo.firstName} ${workflowState.patientInfo.surname}` : 
                'Patient'
              } has successfully completed the occupational health examination
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Journey Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Journey Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <Clock className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-blue-600">
                  {calculateJourneyTime()} min
                </div>
                <div className="text-sm text-blue-600">Total Time</div>
              </div>
              
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-green-600">
                  {workflowState.routingData.completedStations.length}
                </div>
                <div className="text-sm text-green-600">Stations Completed</div>
              </div>
              
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="mx-auto mb-2">
                  {getRatingIcon(efficiency)}
                </div>
                <div className="text-2xl font-bold text-purple-600">
                  {efficiency.replace('_', ' ').toUpperCase()}
                </div>
                <div className="text-sm text-purple-600">Efficiency Rating</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Completed Stations */}
        <Card>
          <CardHeader>
            <CardTitle>Completed Stations</CardTitle>
            <CardDescription>
              All required examinations have been successfully completed
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {workflowState.routingData.completedStations.map((stationId, index) => (
                <Badge key={stationId} variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Station {index + 1}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Medical Flags Summary */}
        {workflowState.medicalFlags.length > 0 && (
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="text-orange-700">Medical Attention Required</CardTitle>
              <CardDescription className="text-orange-600">
                The following medical flags were identified during the examination
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {workflowState.medicalFlags.map((flag) => (
                  <Badge key={flag} variant="outline" className="bg-orange-100 text-orange-700 border-orange-300">
                    {flag.replace('_', ' ').toUpperCase()}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Patient Information */}
        {workflowState.patientInfo && (
          <Card>
            <CardHeader>
              <CardTitle>Patient Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Name:</span>
                  <span className="ml-2">
                    {workflowState.patientInfo.firstName} {workflowState.patientInfo.surname}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">ID Number:</span>
                  <span className="ml-2">{workflowState.patientInfo.idNumber}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Company:</span>
                  <span className="ml-2">{workflowState.patientInfo.company}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Examination Type:</span>
                  <span className="ml-2">{workflowState.patientInfo.examinationType?.replace('_', ' ')}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Next Steps */}
        <Card>
          <CardHeader>
            <CardTitle>Next Steps</CardTitle>
            <CardDescription>
              What happens next in the process
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
              <CheckCircle className="h-5 w-5 text-blue-600" />
              <span className="text-blue-700">
                Medical practitioner will review all results
              </span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
              <Download className="h-5 w-5 text-blue-600" />
              <span className="text-blue-700">
                Medical certificate will be generated within 24-48 hours
              </span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
              <Activity className="h-5 w-5 text-blue-600" />
              <span className="text-blue-700">
                Results will be sent to your employer and you directly
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button 
            onClick={handleGoHome} 
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            <Home className="h-4 w-4 mr-2" />
            Return to Dashboard
          </Button>
          
          <Button 
            onClick={handleStartNew} 
            variant="outline"
            className="flex-1"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Start New Journey
          </Button>
        </div>

        {/* Footer Message */}
        <div className="text-center text-sm text-gray-600 bg-white p-4 rounded-lg border">
          <p>
            Thank you for using our digital health examination system. 
            Your experience helps us improve our services.
          </p>
          <p className="mt-2 font-medium">
            Stay healthy and safe! 🌟
          </p>
        </div>
      </div>
    </div>
  );
};

export default WorkflowComplete;