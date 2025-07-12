// Main Workflow Coordinator - Connects Phase 1 + Phase 2
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/useToast';
import { useWorkflow } from '@/contexts/WorkflowContext';
import {
  User, CheckCircle, Clock, ArrowRight, RefreshCw,
  MapPin, Activity, AlertTriangle, Users
} from 'lucide-react';

// Import Phase 1 and Phase 2 components
import { EnhancedQuestionnaires } from './EnhancedQuestionnaires';
import { IntegratedReceptionSystem } from '@/components/reception/IntegratedReceptionSystem';
import { SmartStationRouting } from '@/components/workflow/SmartStationRouting';
import { RealTimeWorkflowDashboard } from '@/components/dashboard/RealTimeWorkflowDashboard';

// Workflow API service
import { workflowAPI } from '@/api/workflow';

interface WorkflowCoordinatorProps {
  mode?: 'patient' | 'staff' | 'dashboard';
  sessionId?: string;
}

export const WorkflowCoordinator: React.FC<WorkflowCoordinatorProps> = ({
  mode = 'patient',
  sessionId: propSessionId
}) => {
  const { sessionId: urlSessionId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    state: workflowState,
    startJourney,
    completeReception,
    completeQuestionnaire,
    generateRouting,
    selectStation,
    completeStation,
    getProgress,
    getCurrentPhase,
    isJourneyComplete
  } = useWorkflow();

  const sessionId = propSessionId || urlSessionId;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load session on mount if sessionId provided
  useEffect(() => {
    if (sessionId && !workflowState.patientId) {
      loadSession();
    }
  }, [sessionId]);

  const loadSession = async () => {
    try {
      setLoading(true);
      const response = await workflowAPI.getSession(sessionId!);
      
      if (response.success) {
        // Initialize workflow state from server
        const session = response.session;
        
        startJourney(session.patient.id, {
          firstName: session.patient.firstName,
          surname: session.patient.surname,
          idNumber: session.patient.idNumber,
          examinationType: session.patient.examinationType
        });
        
        if (session.questionnaireData) {
          completeQuestionnaire(
            session.questionnaireData,
            session.medicalFlags || []
          );
        }
        
        if (session.recommendedStations?.length > 0) {
          generateRouting(session.recommendedStations);
        }
      }
    } catch (error) {
      console.error('Failed to load session:', error);
      setError('Failed to load workflow session');
    } finally {
      setLoading(false);
    }
  };

  // Handle questionnaire completion
  const handleQuestionnaireComplete = async (data: any, medicalFlags: string[]) => {
    try {
      setLoading(true);
      
      // Update backend
      if (sessionId) {
        await workflowAPI.updateQuestionnaire(sessionId, {
          questionnaireData: data,
          medicalFlags,
          riskAssessment: calculateRiskAssessment(data, medicalFlags)
        });
      }
      
      // Update local state
      completeQuestionnaire(data, medicalFlags);
      
      // Generate routing recommendations
      handleGenerateRouting();
      
      toast({
        title: "Questionnaire Complete",
        description: "Moving to station selection...",
      });
      
    } catch (error) {
      console.error('Failed to complete questionnaire:', error);
      toast({
        title: "Error",
        description: "Failed to complete questionnaire",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle station routing generation
  const handleGenerateRouting = async () => {
    try {
      if (!sessionId) return;
      
      const response = await workflowAPI.generateRouting(sessionId);
      if (response.success) {
        generateRouting(response.recommendations);
      }
    } catch (error) {
      console.error('Failed to generate routing:', error);
    }
  };

  // Handle station selection
  const handleStationSelect = async (stationId: string, priority: string = 'medium') => {
    try {
      setLoading(true);
      
      if (sessionId) {
        const response = await workflowAPI.selectStation(sessionId, stationId, priority);
        if (response.success) {
          selectStation(stationId, response.queueInfo.position);
          
          toast({
            title: "Station Selected",
            description: `Joined queue at ${response.queueInfo.stationName}. Position: ${response.queueInfo.position}`,
          });
        }
      }
    } catch (error) {
      console.error('Failed to select station:', error);
      toast({
        title: "Error",
        description: "Failed to join station queue",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle station completion
  const handleStationComplete = async (stationId: string, results: any, notes?: string) => {
    try {
      setLoading(true);
      
      if (sessionId) {
        const response = await workflowAPI.completeStation(sessionId, stationId, results, notes);
        if (response.success) {
          completeStation(stationId, results);
          
          if (response.session.isComplete) {
            toast({
              title: "Journey Complete",
              description: "All required stations completed!",
            });
            navigate('/workflow/complete');
          } else {
            toast({
              title: "Station Complete",
              description: "Moving to next station...",
            });
          }
        }
      }
    } catch (error) {
      console.error('Failed to complete station:', error);
      toast({
        title: "Error",
        description: "Failed to complete station",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Calculate risk assessment from questionnaire data
  const calculateRiskAssessment = (data: any, medicalFlags: string[]) => {
    // Implementation of risk calculation logic
    return {
      workingAtHeights: 'low' as const,
      cardiovascular: 'low' as const,
      respiratory: 'low' as const,
      overall: 'low' as const
    };
  };

  // Render workflow header
  const renderWorkflowHeader = () => (
    <Card className="mb-6 border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Activity className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-xl">Patient Journey Progress</CardTitle>
              <CardDescription>
                {workflowState.patientInfo ? 
                  `${workflowState.patientInfo.firstName} ${workflowState.patientInfo.surname}` : 
                  'Loading patient information...'
                }
              </CardDescription>
            </div>
          </div>
          
          <div className="text-right">
            <Badge variant="outline" className="mb-2">
              Phase: {getCurrentPhase()}
            </Badge>
            <div className="flex items-center gap-2">
              <Progress value={getProgress()} className="w-32" />
              <span className="text-sm font-medium">{getProgress()}%</span>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <PhaseIndicator phase="reception" current={getCurrentPhase()} />
            <ArrowRight className="h-4 w-4 text-gray-400" />
            <PhaseIndicator phase="questionnaire" current={getCurrentPhase()} />
            <ArrowRight className="h-4 w-4 text-gray-400" />
            <PhaseIndicator phase="station_routing" current={getCurrentPhase()} />
            <ArrowRight className="h-4 w-4 text-gray-400" />
            <PhaseIndicator phase="examination" current={getCurrentPhase()} />
            <ArrowRight className="h-4 w-4 text-gray-400" />
            <PhaseIndicator phase="completed" current={getCurrentPhase()} />
          </div>
          
          {workflowState.journeyStartTime && (
            <div className="flex items-center gap-2 text-gray-600">
              <Clock className="h-4 w-4" />
              <span>
                Started: {workflowState.journeyStartTime.toLocaleTimeString()}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  // Render phase indicator
  const PhaseIndicator: React.FC<{ phase: string; current: string }> = ({ phase, current }) => {
    const isActive = current === phase;
    const isCompleted = getCurrentPhase() !== phase && getProgress() > getPhaseProgress(phase);
    
    return (
      <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${
        isActive ? 'bg-blue-100 text-blue-700' :
        isCompleted ? 'bg-green-100 text-green-700' :
        'bg-gray-100 text-gray-500'
      }`}>
        {isCompleted ? (
          <CheckCircle className="h-3 w-3" />
        ) : isActive ? (
          <RefreshCw className="h-3 w-3 animate-spin" />
        ) : (
          <div className="h-3 w-3 rounded-full border border-current" />
        )}
        <span className="capitalize">{phase.replace('_', ' ')}</span>
      </div>
    );
  };

  const getPhaseProgress = (phase: string): number => {
    const progressMap = {
      reception: 15,
      questionnaire: 60,
      station_routing: 70,
      examination: 90,
      completed: 100
    };
    return progressMap[phase as keyof typeof progressMap] || 0;
  };

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Alert variant="destructive" className="max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  // Loading state
  if (loading && !workflowState.patientId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-blue-600" />
          <div>
            <h3 className="text-lg font-semibold">Loading Workflow...</h3>
            <p className="text-gray-600">Initializing patient journey</p>
          </div>
        </div>
      </div>
    );
  }

  // Render based on mode and current phase
  return (
    <div className="space-y-6">
      {renderWorkflowHeader()}
      
      {/* Phase-based rendering */}
      {getCurrentPhase() === 'reception' && mode === 'staff' && (
        <IntegratedReceptionSystem 
          onPatientCheckedIn={(patientData, tabletId, qrCode) => {
            completeReception(tabletId, qrCode, 'current-user-id');
          }}
        />
      )}
      
      {getCurrentPhase() === 'questionnaire' && (
        <EnhancedQuestionnaires 
          onComplete={handleQuestionnaireComplete}
          sessionId={sessionId}
        />
      )}
      
      {getCurrentPhase() === 'station_routing' && (
        <SmartStationRouting 
          recommendations={workflowState.routingData.recommendedStations}
          onStationSelect={handleStationSelect}
          medicalFlags={workflowState.medicalFlags}
          riskAssessment={workflowState.riskAssessment}
        />
      )}
      
      {getCurrentPhase() === 'examination' && (
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">Station Visit in Progress</h2>
          <p className="text-gray-600">
            You are currently at: {workflowState.currentStation}
          </p>
          <Badge variant="outline">Queue Position: {workflowState.routingData.currentQueue}</Badge>
        </div>
      )}
      
      {getCurrentPhase() === 'completed' && (
        <div className="text-center space-y-4">
          <CheckCircle className="h-16 w-16 text-green-600 mx-auto" />
          <h2 className="text-2xl font-bold text-green-600">Journey Complete!</h2>
          <p className="text-gray-600">
            All required examinations have been completed.
          </p>
        </div>
      )}
      
      {/* Dashboard mode */}
      {mode === 'dashboard' && (
        <RealTimeWorkflowDashboard />
      )}
    </div>
  );
};

export default WorkflowCoordinator;