import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DigitalQuestionnaireForm } from '@/components/forms/DigitalQuestionnaireForm';
import { questionnaireService } from '@/services/questionnaireService';
import { getPatientById } from '@/api/patients';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/useToast';
import {
  ArrowLeft, CheckCircle, AlertTriangle, Clock, User, Building, 
  FileText, Wifi, WifiOff, RefreshCw
} from 'lucide-react';

export default function DigitalQuestionnairePage() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [existingQuestionnaire, setExistingQuestionnaire] = useState<any>(null);

  // Monitor network status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load patient data
  useEffect(() => {
    const loadPatientData = async () => {
      if (!patientId) {
        setError('Patient ID is required');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // 🔧 FIX: Load patient by ID directly
        console.log('🔍 QUESTIONNAIRE DEBUG: Loading patient with ID:', patientId);
        const patientResponse = await getPatientById(patientId);
        
        if (!patientResponse.patient) {
          setError('Patient not found');
          return;
        }

        console.log('✅ QUESTIONNAIRE DEBUG: Found patient:', patientResponse.patient.firstName, patientResponse.patient.surname);
        setPatient(patientResponse.patient);

        // Try to load existing questionnaire
        if (patientResponse.patient.currentExamination) {
          const existingData = await questionnaireService.loadQuestionnaire(patientResponse.patient.currentExamination);
          if (existingData) {
            setExistingQuestionnaire(existingData);
          }
        }

      } catch (err) {
        console.error('Error loading patient data:', err);
        setError('Failed to load patient information');
      } finally {
        setLoading(false);
      }
    };

    loadPatientData();
  }, [patientId]);

  const handleQuestionnaireSubmit = async (data: any) => {
    setSubmissionStatus('submitting');
    
    try {
      // Enhance data with patient and metadata
      const enhancedData = {
        ...data,
        patient_id: patientId,
        metadata: {
          ...data.metadata,
          submission_timestamp: new Date().toISOString(),
          submitted_online: isOnline,
          user_agent: navigator.userAgent,
          completion_time: calculateCompletionTime(data.metadata?.start_time)
        }
      };

      const result = await questionnaireService.submitQuestionnaire(enhancedData);
      
      if (result.success) {
        setSubmissionStatus('success');
        
        toast({
          title: "Questionnaire Submitted Successfully",
          description: result.medicalAlerts?.length 
            ? `Medical alerts flagged: ${result.medicalAlerts.length}` 
            : "No medical concerns identified",
        });

        // Navigate to workflow completion page
        setTimeout(() => {
          navigate(`/questionnaire-complete`, {
            state: {
              patientId,
              patientName: `${patient?.firstName} ${patient?.surname}`,
              examinationType: patient?.examinationType || 'pre-employment'
            }
          });
        }, 2000);
        
      } else {
        throw new Error(result.message || 'Submission failed');
      }
      
    } catch (error) {
      console.error('Submission error:', error);
      setSubmissionStatus('error');
      
      toast({
        title: "Submission Failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    }
  };

  const handleSaveDraft = async (data: any) => {
    try {
      const enhancedData = {
        ...data,
        patient_id: patientId,
        metadata: {
          ...data.metadata,
          last_saved: new Date().toISOString(),
          saved_offline: !isOnline
        }
      };

      await questionnaireService.saveDraft(enhancedData);
    } catch (error) {
      console.error('Save draft error:', error);
      
      if (isOnline) {
        toast({
          title: "Save Failed",
          description: "Unable to save draft. Your data is still preserved locally.",
          variant: "destructive",
        });
      }
    }
  };

  const calculateCompletionTime = (startTime?: string): number => {
    if (!startTime) return 0;
    const start = new Date(startTime);
    const now = new Date();
    return Math.round((now.getTime() - start.getTime()) / 1000 / 60); // minutes
  };

  const getExaminationTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      'pre_employment': 'Pre-Employment Medical',
      'periodic': 'Periodic Health Assessment',
      'exit': 'Exit Medical',
      'return_to_work': 'Return to Work Assessment',
      'working_at_heights': 'Working at Heights Assessment'
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-64"></div>
          <div className="h-4 bg-muted rounded w-96"></div>
          <Card>
            <CardHeader>
              <div className="h-6 bg-muted rounded w-48"></div>
              <div className="h-4 bg-muted rounded w-64"></div>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 p-6">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => navigate('/patients')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Patients
          </Button>
        </div>
        
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle className="text-red-800">Error Loading Questionnaire</AlertTitle>
          <AlertDescription className="text-red-700">
            {error}
          </AlertDescription>
        </Alert>
        
        <Button 
          onClick={() => window.location.reload()} 
          variant="outline"
          className="w-full"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </div>
    );
  }

  if (submissionStatus === 'success') {
    return (
      <div className="max-w-4xl mx-auto space-y-6 p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-green-800 mb-2">
              Questionnaire Submitted Successfully
            </h2>
            <p className="text-green-600 mb-4">
              Your medical questionnaire has been completed and submitted for review.
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              Redirecting to next station...
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-6">
      {/* Header with Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => navigate('/patients')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Digital Medical Questionnaire</h1>
            <p className="text-muted-foreground">Complete all sections for medical review</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Network Status */}
          <Badge variant={isOnline ? "default" : "destructive"} className="flex items-center gap-1">
            {isOnline ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
            {isOnline ? 'Online' : 'Offline'}
          </Badge>
          
          {/* Examination Type */}
          <Badge variant="outline">
            {getExaminationTypeLabel(patient?.examinationType || 'pre_employment')}
          </Badge>
        </div>
      </div>

      {/* Patient Information Summary */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-lg">
                  {patient?.firstName} {patient?.surname}
                </CardTitle>
                <CardDescription>
                  ID: {patient?.idNumber} • Age: {patient?.age} • {patient?.gender}
                </CardDescription>
              </div>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Building className="h-4 w-4" />
                {patient?.employerName}
              </div>
              <div className="flex items-center gap-1">
                <FileText className="h-4 w-4" />
                {patient?.position}
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Offline Mode Alert */}
      {!isOnline && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <WifiOff className="h-4 w-4" />
          <AlertTitle className="text-yellow-800">Working Offline</AlertTitle>
          <AlertDescription className="text-yellow-700">
            You're currently offline. Your questionnaire data will be saved locally and synced when connection is restored.
          </AlertDescription>
        </Alert>
      )}

      {/* Existing Questionnaire Alert */}
      {existingQuestionnaire && (
        <Alert className="border-blue-200 bg-blue-50">
          <FileText className="h-4 w-4" />
          <AlertTitle className="text-blue-800">Previous Data Found</AlertTitle>
          <AlertDescription className="text-blue-700">
            We found a previous questionnaire for this patient. The form has been pre-filled with existing data.
          </AlertDescription>
        </Alert>
      )}

      {/* Main Questionnaire Form */}
      <DigitalQuestionnaireForm
        patient={patient}
        examinationType={patient?.examinationType || 'pre_employment'}
        onSubmit={handleQuestionnaireSubmit}
        onSave={handleSaveDraft}
        initialData={existingQuestionnaire}
      />

      {/* Submission Status */}
      {submissionStatus === 'submitting' && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center gap-3">
              <Clock className="h-5 w-5 animate-spin" />
              <span className="text-lg">Submitting questionnaire...</span>
            </div>
            <p className="text-center text-muted-foreground mt-2">
              Please wait while we process your information
            </p>
          </CardContent>
        </Card>
      )}

      {/* Footer Information */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-4">
              <span>All information is confidential and protected</span>
              <span>•</span>
              <span>Auto-save enabled</span>
              {!isOnline && (
                <>
                  <span>•</span>
                  <span className="text-yellow-600">Offline mode active</span>
                </>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <span>Session ID: {`Q${Date.now().toString().slice(-6)}`}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}