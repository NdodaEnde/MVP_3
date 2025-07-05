// components/OfflineCapableQuestionnaire.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '@/hooks/useToast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Save, 
  Upload, 
  CheckCircle, 
  AlertTriangle,
  RefreshCw,
  Wifi,
  WifiOff
} from 'lucide-react';

import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useOfflineStorage } from '@/hooks/useOfflineStorage';
import { NetworkStatusBanner } from './NetworkStatusBanner';
import { OfflineIndicator } from './OfflineIndicator';
import { questionnaireSchema } from '@/schemas/questionnaire-schema';

// Import your existing questionnaire sections

import { Patient } from '@/types';
import { PersonalDemographicsSection } from './sections/PersonalDemographicsSection';
import { MedicalHistorySection } from './sections/MedicalHistorySection';
import { WorkingAtHeightsSection } from './sections/WorkingAtHeightsSection';
import { PeriodicHealthHistorySection } from './sections/PeriodicHealthHistorySection';
import { ReturnToWorkSection } from './sections/ReturnToWorkSection';
import { DeclarationsSection } from './sections/DeclarationsSection';

interface OfflineCapableQuestionnaireProps {
  patient: {
    id: string;
    name: string;
    idNumber: string;
    age: number;
    employer: string;
  };
  examinationType: string;
  questionnaireId?: string;
  onComplete?: (data: any) => void;
  onSectionComplete?: (sectionName: string, data: any) => void;
}

export function OfflineCapableQuestionnaire({
  patient,
  examinationType,
  questionnaireId,
  onComplete,
  onSectionComplete
}: OfflineCapableQuestionnaireProps) {
  // Network and offline storage hooks
  const { isOnline, isReconnecting } = useNetworkStatus();
  const {
    saveOffline,
    loadOffline,
    syncPendingData,
    hasPendingSync,
    getStorageInfo,
    clearAllOfflineData,
    syncStatus,
    syncProgress,
    lastSyncAttempt
  } = useOfflineStorage();

  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [completionProgress, setCompletionProgress] = useState(0);
  const [activeTab, setActiveTab] = useState('demographics');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Offline storage state
  const [storageInfo, setStorageInfo] = useState({
    itemCount: 0,
    totalSize: 0,
    pendingSync: 0,
    storageQuota: 5 * 1024 * 1024
  });

  // Auto-save timer ref
  const autoSaveTimerRef = useRef<NodeJS.Timeout>();
  const saveKeyRef = useRef(`${patient.id}_${examinationType}`);

  // Form setup
  const form = useForm({
    resolver: zodResolver(questionnaireSchema),
    mode: 'onChange',
    defaultValues: {
      metadata: {
        questionnaire_id: questionnaireId || '',
        company_name: patient.employer,
        employee_id: patient.id,
        examination_type: examinationType,
        examination_date: new Date().toISOString().split('T')[0]
      },
      patient_demographics: {
        personal_info: {
          first_names: patient.name.split(' ').slice(0, -1).join(' '),
          surname: patient.name.split(' ').pop() || '',
          id_number: patient.idNumber,
          age: patient.age
        }
      }
    }
  });

  // Load offline data on component mount
  useEffect(() => {
    const loadStoredData = async () => {
      try {
        const offlineData = await loadOffline(saveKeyRef.current);
        if (offlineData) {
          form.reset(offlineData.formData);
          setLastSaved(new Date(offlineData.timestamp));
          setHasUnsavedChanges(true);
          
          toast({
            title: "Offline Data Restored",
            description: "Your previously saved questionnaire data has been restored.",
            duration: 5000
          });
        }
      } catch (error) {
        console.error('Failed to load offline data:', error);
      }
    };

    loadStoredData();
  }, [patient.id, examinationType, loadOffline, form]);

  // Update storage info periodically
  useEffect(() => {
    const updateStorageInfo = () => {
      setStorageInfo(getStorageInfo());
    };

    updateStorageInfo();
    const interval = setInterval(updateStorageInfo, 5000);
    return () => clearInterval(interval);
  }, [getStorageInfo]);

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline && hasPendingSync()) {
      handleRetrySync();
    }
  }, [isOnline]);

  // Auto-save functionality with debouncing
  const scheduleAutoSave = useCallback((formData: any) => {
    setHasUnsavedChanges(true);
    
    // Clear existing timer
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    // Schedule new auto-save
    autoSaveTimerRef.current = setTimeout(async () => {
      await handleAutoSave(formData);
    }, 3000); // 3 second delay
  }, []);

  // Handle auto-save
  const handleAutoSave = useCallback(async (formData?: any) => {
    if (autoSaving) return;

    setAutoSaving(true);
    try {
      const dataToSave = formData || form.getValues();
      
      if (isOnline && questionnaireId) {
        // Try to save to server first
        const { autoSaveQuestionnaire } = await import('@/api/questionnaires');
        await autoSaveQuestionnaire(questionnaireId, dataToSave);
        setLastSaved(new Date());
        setHasUnsavedChanges(false);
      } else {
        // Save offline
        await saveOffline(saveKeyRef.current, dataToSave, {
          patientId: patient.id,
          questionnaireId,
          examinationType,
          action: 'update'
        });
        setLastSaved(new Date());
        setHasUnsavedChanges(false);
      }
    } catch (error) {
      console.error('Auto-save failed:', error);
      
      // Fallback to offline storage if server save fails
      if (isOnline) {
        try {
          const dataToSave = formData || form.getValues();
          await saveOffline(saveKeyRef.current, dataToSave, {
            patientId: patient.id,
            questionnaireId,
            examinationType,
            action: 'update'
          });
          setLastSaved(new Date());
          setHasUnsavedChanges(false);
          
          toast({
            title: "Saved Offline",
            description: "Failed to save to server, but saved locally. Will sync when connection is restored.",
            variant: "default"
          });
        } catch (offlineError) {
          toast({
            title: "Save Failed",
            description: "Unable to save questionnaire data. Please try again.",
            variant: "destructive"
          });
        }
      }
    } finally {
      setAutoSaving(false);
    }
  }, [autoSaving, isOnline, questionnaireId, form, saveOffline, patient.id, examinationType]);

  // Watch form changes for auto-save
  useEffect(() => {
    const subscription = form.watch((data) => {
      scheduleAutoSave(data);
    });
    return () => subscription.unsubscribe();
  }, [form, scheduleAutoSave]);

  // Handle manual sync retry
  const handleRetrySync = useCallback(async () => {
    if (!isOnline || syncStatus === 'syncing') return;

    try {
      await syncPendingData();
      
      if (syncStatus === 'success') {
        toast({
          title: "Sync Successful",
          description: "All offline questionnaire data has been synced to the server.",
          duration: 5000
        });
      }
    } catch (error) {
      toast({
        title: "Sync Failed",
        description: "Failed to sync offline data. Please try again later.",
        variant: "destructive"
      });
    }
  }, [isOnline, syncStatus, syncPendingData]);

  // Handle clear offline data
  const handleClearOfflineData = useCallback(async () => {
    if (confirm('Are you sure you want to clear all offline questionnaire data? This action cannot be undone.')) {
      clearAllOfflineData();
      setHasUnsavedChanges(false);
      setLastSaved(null);
      
      toast({
        title: "Offline Data Cleared",
        description: "All offline questionnaire data has been removed.",
        duration: 3000
      });
    }
  }, [clearAllOfflineData]);

  // Calculate completion progress
  useEffect(() => {
    const calculateProgress = () => {
      const formData = form.getValues();
      let totalFields = 0;
      let completedFields = 0;

      // Count personal demographics
      if (formData.patient_demographics?.personal_info) {
        const personalInfo = formData.patient_demographics.personal_info;
        totalFields += 6; // Essential fields
        if (personalInfo.first_names) completedFields++;
        if (personalInfo.surname) completedFields++;
        if (personalInfo.id_number) completedFields++;
        if (personalInfo.date_of_birth) completedFields++;
        if (personalInfo.gender) completedFields++;
        if (personalInfo.age) completedFields++;
      }

      // Count medical history
      if (formData.medical_history?.current_conditions) {
        const conditions = formData.medical_history.current_conditions;
        totalFields += 11; // Number of medical conditions
        Object.values(conditions).forEach(value => {
          if (value !== undefined) completedFields++;
        });
      }

      // Count examination-specific sections
      if (examinationType.includes('heights') && formData.working_at_heights_assessment) {
        totalFields += 5;
        Object.values(formData.working_at_heights_assessment).forEach(value => {
          if (value !== undefined) completedFields++;
        });
      }

      if (examinationType === 'periodic' && formData.periodic_health_history) {
        totalFields += 4;
        const periodicData = formData.periodic_health_history.since_last_examination;
        if (periodicData) {
          Object.values(periodicData).forEach(value => {
            if (value && value.toString().trim()) completedFields++;
          });
        }
      }

      if (examinationType === 'return_to_work' && formData.return_to_work_surveillance) {
        totalFields += 3;
        const returnToWorkData = formData.return_to_work_surveillance;
        if (returnToWorkData.absence_reason) completedFields++;
        if (returnToWorkData.absence_duration) completedFields++;
        if (returnToWorkData.medical_clearance !== undefined) completedFields++;
      }

      // Count declarations
      if (formData.declarations_and_signatures?.employee_declaration) {
        totalFields += 4;
        const declaration = formData.declarations_and_signatures.employee_declaration;
        if (declaration.information_correct) completedFields++;
        if (declaration.no_misleading_information) completedFields++;
        if (declaration.employee_name) completedFields++;
        if (declaration.employee_signature) completedFields++;
      }

      const progress = totalFields > 0 ? Math.round((completedFields / totalFields) * 100) : 0;
      setCompletionProgress(progress);
    };

    const subscription = form.watch(() => calculateProgress());
    calculateProgress(); // Initial calculation
    
    return () => subscription.unsubscribe();
  }, [form, examinationType]);

  // Handle form submission
  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      if (isOnline && questionnaireId) {
        // Try to submit to server
        const { completeQuestionnaire } = await import('@/api/questionnaires');
        await completeQuestionnaire(
          questionnaireId, 
          data.declarations_and_signatures?.employee_declaration?.employee_signature
        );
        
        // Clear offline data after successful submission
        localStorage.removeItem(`offline_questionnaire_${saveKeyRef.current}`);
        
        toast({
          title: "Questionnaire Completed",
          description: "The questionnaire has been successfully submitted and saved.",
          duration: 5000
        });
        
        onComplete?.(data);
      } else {
        // Save for offline submission
        await saveOffline(saveKeyRef.current, data, {
          patientId: patient.id,
          questionnaireId,
          examinationType,
          action: 'complete'
        });
        
        toast({
          title: "Questionnaire Saved",
          description: "Questionnaire completed and saved offline. It will be submitted when connection is restored.",
          duration: 5000
        });
        
        onComplete?.(data);
      }
    } catch (error) {
      // Fallback to offline storage
      try {
        await saveOffline(saveKeyRef.current, data, {
          patientId: patient.id,
          questionnaireId,
          examinationType,
          action: 'complete'
        });
        
        toast({
          title: "Saved Offline",
          description: "Failed to submit to server, but questionnaire is saved offline and will be submitted when connection is restored.",
          duration: 5000
        });
      } catch (offlineError) {
        toast({
          title: "Submission Failed",
          description: "Unable to save or submit questionnaire. Please try again.",
          variant: "destructive"
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Section completion handler
  const handleSectionComplete = useCallback((sectionName: string, sectionData: any) => {
    onSectionComplete?.(sectionName, sectionData);
    
    // Trigger auto-save for section completion
    scheduleAutoSave(form.getValues());
  }, [onSectionComplete, scheduleAutoSave, form]);

  return (
    <div className="space-y-6">
      {/* Network Status Banner */}
      <NetworkStatusBanner
        isOnline={isOnline}
        isReconnecting={isReconnecting}
        syncStatus={syncStatus}
        syncProgress={syncProgress}
        pendingItems={storageInfo.pendingSync}
        onRetrySync={handleRetrySync}
        onClearOfflineData={handleClearOfflineData}
      />

      {/* Offline Indicator */}
      {!isOnline && (
        <OfflineIndicator
          storageInfo={storageInfo}
          lastSyncAttempt={lastSyncAttempt}
        />
      )}

      {/* Patient Info Card */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">{patient.name}</CardTitle>
              <p className="text-sm text-muted-foreground">
                ID: {patient.idNumber} • Age: {patient.age} • {patient.employer}
              </p>
              <Badge variant="outline" className="mt-1">
                {examinationType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Badge>
            </div>
            
            <div className="text-right space-y-2">
              {/* Connection Status */}
              <div className="flex items-center gap-2">
                {isOnline ? (
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    <Wifi className="h-3 w-3 mr-1" />
                    Online
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-orange-600 border-orange-600">
                    <WifiOff className="h-3 w-3 mr-1" />
                    Offline
                  </Badge>
                )}
              </div>
              
              {/* Completion Progress */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Progress</span>
                  <span className="text-muted-foreground">{completionProgress}%</span>
                </div>
                <Progress value={completionProgress} className="w-32 h-2" />
              </div>
              
              {/* Save Status */}
              <div className="flex items-center gap-2 text-sm">
                {autoSaving ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
                    <span className="text-blue-600">Saving...</span>
                  </>
                ) : hasUnsavedChanges ? (
                  <>
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                    <span className="text-orange-600">Unsaved changes</span>
                  </>
                ) : lastSaved ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-green-600">
                      Saved {lastSaved.toLocaleTimeString()}
                    </span>
                  </>
                ) : null}
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Questionnaire Content */}
      <Card className="tablet-layout">
        <CardContent className="p-6">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Personal Demographics Section */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-sm font-medium text-blue-600">
                  1
                </div>
                Personal Demographics
              </h3>
              <PersonalDemographicsSection 
                form={form} 
                examinationType={examinationType}
                onComplete={(data) => handleSectionComplete('personal_demographics', data)}
              />
            </div>

            <Separator />

            {/* Medical History Section */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center text-sm font-medium text-red-600">
                  2
                </div>
                Medical History
              </h3>
              <MedicalHistorySection 
                form={form} 
                examinationType={examinationType}
                onComplete={(data) => handleSectionComplete('medical_history', data)}
              />
            </div>

            <Separator />

            {/* Conditional Sections Based on Examination Type */}
            {examinationType.includes('heights') && (
              <>
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center text-sm font-medium text-orange-600">
                      3
                    </div>
                    Working at Heights Assessment
                  </h3>
                  <WorkingAtHeightsSection 
                    form={form}
                    onComplete={(data) => handleSectionComplete('working_at_heights_assessment', data)}
                  />
                </div>
                <Separator />
              </>
            )}

            {examinationType === 'periodic' && (
              <>
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-sm font-medium text-green-600">
                      3
                    </div>
                    Health Changes Since Last Examination
                  </h3>
                  <PeriodicHealthHistorySection 
                    form={form}
                    onComplete={(data) => handleSectionComplete('periodic_health_history', data)}
                  />
                </div>
                <Separator />
              </>
            )}

            {examinationType === 'return_to_work' && (
              <>
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center text-sm font-medium text-purple-600">
                      3
                    </div>
                    Return to Work Assessment
                  </h3>
                  <ReturnToWorkSection 
                    form={form}
                    onComplete={(data) => handleSectionComplete('return_to_work_surveillance', data)}
                  />
                </div>
                <Separator />
              </>
            )}

            {/* Declarations and Signatures Section */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-medium text-indigo-600">
                  {examinationType === 'pre_employment' ? '3' : '4'}
                </div>
                Declarations and Signatures
              </h3>
              <DeclarationsSection 
                form={form} 
                examinationType={examinationType}
                onComplete={(data) => handleSectionComplete('declarations_and_signatures', data)}
              />
            </div>

            {/* Submit Button */}
            <div className="flex items-center justify-between pt-6 border-t">
              <div className="flex items-center gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleAutoSave()}
                  disabled={autoSaving || !hasUnsavedChanges}
                  className="tablet-touch-target"
                >
                  {autoSaving ? (
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save Progress
                </Button>
                
                {!isOnline && (
                  <div className="flex items-center gap-2 text-sm text-orange-600">
                    <WifiOff className="h-4 w-4" />
                    <span>Will submit when online</span>
                  </div>
                )}
              </div>

              <Button
                type="submit"
                disabled={isSubmitting || completionProgress < 90}
                className="tablet-touch-target bg-green-600 hover:bg-green-700"
                size="lg"
              >
                {isSubmitting ? (
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                ) : isOnline ? (
                  <CheckCircle className="h-4 w-4 mr-2" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                {isOnline ? 'Complete Questionnaire' : 'Save for Submission'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}