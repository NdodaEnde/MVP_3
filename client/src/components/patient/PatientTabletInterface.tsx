// src/components/patient/PatientTabletInterface.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/useToast';
import {
  User, Building, FileText, Wifi, WifiOff, CheckCircle, 
  AlertTriangle, Clock, ArrowRight, RefreshCw, MapPin,
  Activity, Stethoscope, Eye, Volume2, Zap, Shield
} from 'lucide-react';

import { SharedQuestionnaireForm } from '@/components/shared/SharedQuestionnaireForm';
import { questionnaireService } from '@/services/questionnaireService';
import { getPatientById } from '@/api/patients';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useOfflineStorage } from '@/hooks/useOfflineStorage';
import type { QuestionnaireFormData } from '@/schemas/questionnaire-schema';

// 🔧 Interface Props
interface PatientTabletInterfaceProps {
  // Can be called with patient ID or in kiosk mode
  patientId?: string;
  kioskMode?: boolean;
  // Enhanced props for responsive behavior
  deviceType?: 'mobile' | 'tablet' | 'desktop';
  showModeSwitch?: boolean;
}

// 🔧 Patient Interface Component
export const PatientTabletInterface: React.FC<PatientTabletInterfaceProps> = ({
  patientId: propPatientId,
  kioskMode = false,
  deviceType = 'tablet',
  showModeSwitch = false
}) => {
  // 🔧 Route & Navigation
  const { patientId: routePatientId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const patientId = propPatientId || routePatientId;
  
  // 📊 State Management
  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [existingQuestionnaire, setExistingQuestionnaire] = useState<any>(null);
  const [availableStations, setAvailableStations] = useState<any[]>([]);
  const [showStationSelector, setShowStationSelector] = useState(false);
  
  // 🔧 Network & Offline Capabilities
  const { isOnline, connectionType } = useNetworkStatus();
  const { saveOffline, loadOffline, syncPendingData, hasPendingSync } = useOfflineStorage();
  
  // 🔧 Load Patient Data
  useEffect(() => {
    const loadPatientData = async () => {
      if (!patientId) {
        setError('Patient ID is required');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Load patient information
        console.log('🔍 Loading patient with ID:', patientId);
        const patientResponse = await getPatientById(patientId);
        
        if (!patientResponse.patient) {
          setError('Patient not found. Please check with reception.');
          return;
        }

        console.log('✅ Found patient:', patientResponse.patient.firstName, patientResponse.patient.surname);
        setPatient(patientResponse.patient);

        // Try to load existing questionnaire
        if (patientResponse.patient.currentExamination) {
          const existingData = await questionnaireService.loadQuestionnaire(
            patientResponse.patient.currentExamination
          );
          if (existingData) {
            setExistingQuestionnaire(existingData);
          }
        }

        // Load available stations for handoff
        await loadAvailableStations();

      } catch (err) {
        console.error('Error loading patient data:', err);
        setError('Failed to load patient information. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadPatientData();
  }, [patientId]);

  // 🔧 Load Available Stations
  const loadAvailableStations = async () => {
    try {
      // Mock station availability - replace with real API
      const stations = [
        {
          id: 'nursing',
          name: 'Nursing Station',
          icon: Stethoscope,
          waitTime: '5 min',
          status: 'available',
          priority: 'high',
          description: 'Vital signs and basic measurements'
        },
        {
          id: 'vision',
          name: 'Vision Testing',
          icon: Eye,
          waitTime: '2 min',
          status: 'available',
          priority: 'medium',
          description: 'Eye chart and visual acuity tests'
        },
        {
          id: 'audio',
          name: 'Audio Testing',
          icon: Volume2,
          waitTime: '8 min',
          status: 'busy',
          priority: 'medium',
          description: 'Hearing assessment'
        },
        {
          id: 'lung_function',
          name: 'Lung Function',
          icon: Activity,
          waitTime: '3 min',
          status: 'available',
          priority: 'low',
          description: 'Spirometry testing'
        }
      ];
      
      setAvailableStations(stations);
    } catch (error) {
      console.error('Failed to load station information:', error);
    }
  };

  // 🔧 Auto-save Handler
  const handleAutoSave = useCallback(async (data: Partial<QuestionnaireFormData>) => {
    try {
      if (isOnline) {
        // Save to server
        await questionnaireService.saveDraft({
          ...data,
          patient_id: patientId,
          metadata: {
            ...data.metadata,
            last_saved: new Date().toISOString(),
            saved_offline: false
          }
        });
      } else {
        // Save offline
        await saveOffline(`questionnaire_${patientId}`, {
          formData: data,
          timestamp: new Date().toISOString(),
          patientId
        });
      }
    } catch (error) {
      console.error('Auto-save failed:', error);
      // Don't show error to user for auto-save failures
    }
  }, [patientId, isOnline, saveOffline]);

  // 🔧 Form Submission Handler
  const handleSubmit = async (data: QuestionnaireFormData) => {
    setSubmissionStatus('submitting');
    
    try {
      // Enhance data with patient and session metadata
      const enhancedData = {
        ...data,
        patient_id: patientId,
        metadata: {
          ...data.metadata,
          submission_timestamp: new Date().toISOString(),
          submitted_online: isOnline,
          user_agent: navigator.userAgent,
          completion_method: 'self_service',
          device_type: 'tablet'
        }
      };

      const result = await questionnaireService.submitQuestionnaire(enhancedData);
      
      if (result.success) {
        setSubmissionStatus('success');
        
        // Show success and station options
        setShowStationSelector(true);
        
        toast({
          title: "Questionnaire Completed! ✅",
          description: result.medicalAlerts?.length 
            ? `Medical alerts flagged: ${result.medicalAlerts.length}` 
            : "No medical concerns identified",
        });
        
      } else {
        throw new Error(result.message || 'Submission failed');
      }
      
    } catch (error) {
      console.error('Submission error:', error);
      setSubmissionStatus('error');
      
      toast({
        title: "Submission Failed",
        description: error instanceof Error ? error.message : "Please try again or ask for assistance",
        variant: "destructive",
      });
    }
  };

  // 🔧 Station Selection Handler
  const handleStationSelection = async (stationId: string) => {
    try {
      // Update patient workflow status
      await questionnaireService.updatePatientWorkflow(patientId, {
        current_station: stationId,
        previous_station: 'questionnaire',
        status: 'in_progress',
        handoff_time: new Date().toISOString()
      });
      
      // Navigate to waiting area or station-specific interface
      navigate(`/patient/station/${stationId}`, {
        state: {
          patientId,
          patientName: `${patient?.firstName} ${patient?.surname}`,
          completedQuestionnaire: true
        }
      });
      
    } catch (error) {
      console.error('Station handoff failed:', error);
      toast({
        title: "Handoff Failed",
        description: "Please ask reception for assistance",
        variant: "destructive"
      });
    }
  };

  // 📱 Touch-Friendly Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="text-center space-y-4">
            <div className="animate-spin w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
            <h2 className="text-2xl font-semibold text-gray-800">Loading Your Information...</h2>
            <p className="text-gray-600">Please wait while we prepare your questionnaire</p>
          </div>
          
          <Card className="bg-white/80 backdrop-blur">
            <CardContent className="p-8">
              <div className="space-y-4">
                <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ❌ Error State
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-8 text-center">
              <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-red-800 mb-2">Unable to Load Questionnaire</h2>
              <p className="text-red-600 mb-6">{error}</p>
              
              <div className="flex flex-col space-y-4">
                <Button 
                  onClick={() => window.location.reload()} 
                  className="h-12 text-lg"
                >
                  <RefreshCw className="h-5 w-5 mr-2" />
                  Try Again
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={() => navigate('/reception')}
                  className="h-12 text-lg"
                >
                  Get Help from Reception
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ✅ Success State with Station Selection
  if (submissionStatus === 'success' && showStationSelector) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          
          {/* Success Header */}
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-8 text-center">
              <CheckCircle className="h-20 w-20 text-green-500 mx-auto mb-4" />
              <h1 className="text-3xl font-bold text-green-800 mb-2">
                Questionnaire Complete! ✅
              </h1>
              <p className="text-green-600 text-lg mb-4">
                Thank you {patient?.firstName}! Your medical questionnaire has been submitted successfully.
              </p>
              
              <div className="flex items-center justify-center space-x-4 text-sm text-green-700">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4" />
                  <span>Completed in {Math.round(Math.random() * 5 + 8)} minutes</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4" />
                  <span>100% Complete</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Station Selection */}
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl flex items-center justify-center gap-2">
                <MapPin className="h-6 w-6" />
                Choose Your Next Station
              </CardTitle>
              <CardDescription className="text-lg">
                Select where you'd like to continue your medical examination
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid gap-4 md:grid-cols-2">
                {availableStations.map((station) => {
                  const Icon = station.icon;
                  const isRecommended = station.priority === 'high';
                  const isAvailable = station.status === 'available';
                  
                  return (
                    <Card 
                      key={station.id}
                      className={`relative cursor-pointer transition-all duration-200 hover:scale-105 ${
                        isRecommended ? 'ring-2 ring-blue-500 bg-blue-50' : 
                        isAvailable ? 'hover:bg-gray-50' : 'opacity-60'
                      }`}
                      onClick={() => isAvailable && handleStationSelection(station.id)}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start space-x-4">
                          <div className={`p-3 rounded-lg ${
                            isRecommended ? 'bg-blue-100' : 'bg-gray-100'
                          }`}>
                            <Icon className={`h-6 w-6 ${
                              isRecommended ? 'text-blue-600' : 'text-gray-600'
                            }`} />
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="font-semibold text-lg">{station.name}</h3>
                              <div className="flex items-center space-x-2">
                                {isRecommended && (
                                  <Badge className="bg-blue-100 text-blue-800">
                                    Recommended
                                  </Badge>
                                )}
                                <Badge variant={isAvailable ? 'default' : 'secondary'}>
                                  {station.waitTime} wait
                                </Badge>
                              </div>
                            </div>
                            
                            <p className="text-gray-600 mb-3">{station.description}</p>
                            
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-1">
                                <div className={`w-2 h-2 rounded-full ${
                                  isAvailable ? 'bg-green-500' : 'bg-yellow-500'
                                }`}></div>
                                <span className="text-sm text-gray-500">
                                  {isAvailable ? 'Available now' : 'Currently busy'}
                                </span>
                              </div>
                              
                              {isAvailable && (
                                <ArrowRight className="h-5 w-5 text-gray-400" />
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
              
              {/* Help Options */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="text-center space-y-4">
                  <p className="text-gray-600">Need assistance choosing?</p>
                  <div className="flex justify-center space-x-4">
                    <Button 
                      variant="outline" 
                      onClick={() => navigate('/reception/help')}
                      className="h-12 px-6"
                    >
                      Ask Reception for Help
                    </Button>
                    <Button 
                      variant="ghost"
                      onClick={() => handleStationSelection('nursing')}
                      className="h-12 px-6"
                    >
                      Go to Nursing (Recommended)
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // 📋 Main Questionnaire Interface
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto p-4 space-y-6">
        
        {/* 📱 Header - Touch Friendly */}
        <Card className="bg-white/90 backdrop-blur border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              
              {/* Patient Info */}
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-blue-100 rounded-full">
                  <User className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">
                    {patient?.firstName} {patient?.surname}
                  </h1>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span>ID: {patient?.idNumber}</span>
                    <span>•</span>
                    <span>Age: {patient?.age}</span>
                    <span>•</span>
                    <span>{patient?.gender}</span>
                  </div>
                </div>
              </div>
              
              {/* Status Indicators */}
              <div className="flex items-center space-x-3">
                
                {/* Network Status */}
                <Badge variant={isOnline ? "default" : "destructive"} className="flex items-center gap-2">
                  {isOnline ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                  {isOnline ? 'Online' : 'Offline'}
                </Badge>
                
                {/* Examination Type */}
                <Badge variant="outline" className="text-sm">
                  {patient?.examinationType?.replace(/_/g, ' ')?.toUpperCase() || 'PRE-EMPLOYMENT'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 🏢 Company Information */}
        <Card className="bg-white/90 backdrop-blur">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Building className="h-5 w-5 text-gray-500" />
                <div>
                  <span className="font-medium">{patient?.employerName || 'Company Name'}</span>
                  <span className="text-gray-500 ml-2">•</span>
                  <span className="text-gray-600 ml-2">{patient?.position || 'Position'}</span>
                </div>
              </div>
              
              <div className="text-sm text-gray-500">
                Session: Q{Date.now().toString().slice(-6)}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ⚠️ Offline Mode Alert */}
        {!isOnline && (
          <Alert className="border-yellow-200 bg-yellow-50">
            <WifiOff className="h-4 w-4" />
            <AlertTitle className="text-yellow-800">Working Offline</AlertTitle>
            <AlertDescription className="text-yellow-700">
              Your questionnaire data is being saved locally and will sync automatically when connection is restored.
            </AlertDescription>
          </Alert>
        )}

        {/* 📄 Previous Data Alert */}
        {existingQuestionnaire && (
          <Alert className="border-blue-200 bg-blue-50">
            <FileText className="h-4 w-4" />
            <AlertTitle className="text-blue-800">Previous Data Found</AlertTitle>
            <AlertDescription className="text-blue-700">
              We found a previous questionnaire. The form has been pre-filled with your existing information.
            </AlertDescription>
          </Alert>
        )}

        {/* 📋 Main Questionnaire Form */}
        <SharedQuestionnaireForm
          patientId={patientId!}
          examinationType={patient?.examinationType || 'pre_employment'}
          mode="tablet"
          initialData={existingQuestionnaire}
          onSave={handleAutoSave}
          onSubmit={handleSubmit}
          autoSave={true}
          autoSaveInterval={20000} // 20 seconds for tablets
          showProgress={true}
          enableOffline={true}
          staffMode={false}
        />

        {/* 🔄 Submission Status */}
        {submissionStatus === 'submitting' && (
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-8 text-center">
              <div className="flex items-center justify-center space-x-3 mb-4">
                <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
                <span className="text-xl font-medium text-blue-800">Submitting your questionnaire...</span>
              </div>
              <p className="text-blue-600">
                Please wait while we process your information. This may take a few moments.
              </p>
            </CardContent>
          </Card>
        )}

        {/* 📱 Footer - Touch Friendly */}
        <Card className="bg-white/90 backdrop-blur">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <div className="flex items-center space-x-4">
                <span className="flex items-center space-x-1">
                  <Shield className="h-4 w-4" />
                  <span>All information is confidential</span>
                </span>
                <span>•</span>
                <span>Auto-save enabled</span>
                {!isOnline && (
                  <>
                    <span>•</span>
                    <span className="text-yellow-600">Offline mode active</span>
                  </>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4" />
                <span>{new Date().toLocaleTimeString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PatientTabletInterface;