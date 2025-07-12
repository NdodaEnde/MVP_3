// 🔧 FIXED: DigitalQuestionnaireForm.tsx - Fixed infinite useEffect loop

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { questionnaireSchema, defaultQuestionnaireValues, partialQuestionnaireSchema } from '@/schemas/questionnaire-schema';
import { questionnaireService } from '@/services/questionnaireService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/useToast';
import {
  User, FileText, Heart, Activity, Shield, PenTool, CheckCircle, 
  AlertTriangle, Save, Send, Clock, Eye, Stethoscope
} from 'lucide-react';

// Import existing components
import { PersonalDemographicsSection } from '@/components/PersonalDemographicsSection';
import { MedicalHistorySection } from '@/components/MedicalHistorySection';
import { WorkingAtHeightsSection } from '@/components/WorkingAtHeightsSection';
import { PeriodicHealthHistorySection } from '@/components/PeriodicHealthHistorySection';
import { ReturnToWorkSection } from '@/components/ReturnToWorkSection';
import { EnhancedDeclarationsSection } from '@/components/EnhancedDeclarationsSection';

interface DigitalQuestionnaireFormProps {
  patient?: any;
  examinationType: 'pre_employment' | 'periodic' | 'exit' | 'return_to_work' | 'working_at_heights';
  onSubmit: (data: any) => Promise<void>;
  onSave?: (data: any) => Promise<void>;
  initialData?: any;
}

export function DigitalQuestionnaireForm({ 
  patient, 
  examinationType, 
  onSubmit, 
  onSave,
  initialData 
}: DigitalQuestionnaireFormProps) {
  const [currentTab, setCurrentTab] = useState('demographics');
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(partialQuestionnaireSchema),
    defaultValues: {
      ...defaultQuestionnaireValues,
      ...initialData,
      metadata: {
        questionnaire_id: `Q${Date.now()}`,
        company_name: patient?.employerName || '',
        employee_id: patient?.employeeNumber || '',
        examination_type: examinationType,
        examination_date: new Date().toISOString().split('T')[0],
        start_time: new Date().toISOString(),
        ...initialData?.metadata
      },
      patient_demographics: {
        personal_info: {
          initials: patient?.initials || '',
          first_names: patient?.firstName || '',
          surname: patient?.surname || '',
          id_number: patient?.idNumber || '',
          date_of_birth: patient?.dateOfBirth || '',
          marital_status: patient?.maritalStatus || 'single',
          gender: patient?.gender || 'male',
          age: patient?.age || 0,
          ...initialData?.patient_demographics?.personal_info
        },
        employment_info: {
          position: patient?.position || '',
          department: patient?.department || '',
          employee_number: patient?.employeeNumber || '',
          company_name: patient?.employerName || '',
          employment_type: examinationType,
          ...initialData?.patient_demographics?.employment_info
        }
      }
    }
  });

  // Watch form data for real-time validation and completion tracking
  const formData = form.watch();

  // 🔧 FIXED: Memoize validation to prevent infinite loops
  const validationMemo = useMemo(() => {
    if (!formData || typeof formData !== 'object') {
      return { completionPercentage: 0, isValid: false };
    }

    try {
      const validation = questionnaireService.validateQuestionnaire(formData, examinationType);
      return validation;
    } catch (error) {
      console.error('Validation error:', error);
      return { completionPercentage: 0, isValid: false, criticalIssues: ['Validation error'] };
    }
  }, [
    // 🔧 FIXED: Only depend on specific form fields that matter for validation
    formData?.patient_demographics?.personal_info?.id_number,
    formData?.patient_demographics?.personal_info?.first_names,
    formData?.patient_demographics?.personal_info?.surname,
    formData?.patient_demographics?.employment_info?.position,
    formData?.declarations_and_signatures?.employee_declaration?.information_correct,
    formData?.declarations_and_signatures?.employee_declaration?.no_misleading_information,
    formData?.declarations_and_signatures?.employee_declaration?.consent_to_medical_examination,
    formData?.declarations_and_signatures?.employee_declaration?.employee_name,
    formData?.declarations_and_signatures?.employee_declaration?.employee_signature,
    examinationType
  ]);

  // 🔧 FIXED: Update validation state only when memoized validation changes
  useEffect(() => {
    setValidationResult(validationMemo);
    setCompletionPercentage(validationMemo.completionPercentage || 0);
  }, [validationMemo]);

  // 🔧 FIXED: Stable auto-save with useCallback to prevent infinite loops
  const stableAutoSave = useCallback(async () => {
    if (onSave && completionPercentage > 5 && !isSaving) {
      setIsSaving(true);
      try {
        await onSave(formData);
        setLastSaved(new Date());
      } catch (error) {
        console.error('Auto-save failed:', error);
      } finally {
        setIsSaving(false);
      }
    }
  }, [onSave, completionPercentage, formData, isSaving]);

  // Auto-save functionality with debouncing
  useEffect(() => {
    const timer = setTimeout(stableAutoSave, 3000); // Auto-save after 3 seconds of inactivity
    return () => clearTimeout(timer);
  }, [stableAutoSave]);

  // SA ID validation and auto-population
  const watchedIdNumber = form.watch('patient_demographics.personal_info.id_number');
  
  useEffect(() => {
    if (watchedIdNumber && watchedIdNumber.length === 13) {
      const saidInfo = questionnaireService.extractSAIDInfo(watchedIdNumber);
      
      if (saidInfo) {
        form.setValue('patient_demographics.personal_info.age', saidInfo.age);
        form.setValue('patient_demographics.personal_info.date_of_birth', saidInfo.dateOfBirth);
        form.setValue('patient_demographics.personal_info.gender', saidInfo.gender);
      }
    }
  }, [watchedIdNumber, form]);

  const handleSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
      toast({
        title: "Questionnaire Submitted",
        description: "Your medical questionnaire has been submitted successfully.",
      });
    } catch (error) {
      console.error('Submission failed:', error);
      toast({
        title: "Submission Failed",
        description: "Please check your answers and try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const tabs = [
    { id: 'demographics', label: 'Personal Info', icon: User },
    { id: 'medical_history', label: 'Medical History', icon: Heart },
    { id: 'lifestyle_factors', label: 'Lifestyle', icon: Activity },
    ...(examinationType === 'working_at_heights' ? [{ id: 'heights_assessment', label: 'Heights Assessment', icon: Shield }] : []),
    ...(examinationType === 'periodic' ? [{ id: 'periodic_health', label: 'Health Update', icon: Stethoscope }] : []),
    ...(examinationType === 'return_to_work' ? [{ id: 'return_to_work', label: 'Return to Work', icon: CheckCircle }] : []),
    { id: 'declarations', label: 'Signatures', icon: PenTool }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Digital Medical Questionnaire</h2>
          <p className="text-muted-foreground">
            Complete all sections for medical review
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <Badge variant={isSubmitting ? "secondary" : "default"}>
            {completionPercentage}% Complete
          </Badge>
          {validationResult?.requiresReview && (
            <Badge variant="destructive">Medical Review Required</Badge>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <Progress value={completionPercentage} className="w-full" />

      {/* Critical Issues Alert */}
      {validationResult?.criticalIssues?.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Critical Issues ({validationResult.criticalIssues.length})</AlertTitle>
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1">
              {validationResult.criticalIssues.map((issue: string, index: number) => (
                <li key={index}>{issue}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Auto-save Status */}
      {isSaving && (
        <Alert>
          <Clock className="h-4 w-4 animate-spin" />
          <AlertDescription>Auto-saving draft...</AlertDescription>
        </Alert>
      )}

      {lastSaved && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Last saved: {lastSaved.toLocaleTimeString()}
          </AlertDescription>
        </Alert>
      )}

      {/* Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <Tabs value={currentTab} onValueChange={setCurrentTab}>
            <TabsList className="grid w-full grid-cols-4 lg:grid-cols-6">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>

            <TabsContent value="demographics" className="space-y-6">
              <PersonalDemographicsSection 
                form={form} 
                examinationType={examinationType}
                onDataChange={(data) => {
                  // Handle data change without causing re-renders
                }}
              />
            </TabsContent>

            <TabsContent value="medical_history" className="space-y-6">
              <MedicalHistorySection 
                form={form} 
                examinationType={examinationType}
              />
            </TabsContent>

            <TabsContent value="lifestyle_factors" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Lifestyle Factors
                  </CardTitle>
                  <CardDescription>
                    Information about smoking, alcohol consumption, and exercise habits
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Lifestyle factors section - implementation pending
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            {examinationType === 'working_at_heights' && (
              <TabsContent value="heights_assessment" className="space-y-6">
                <WorkingAtHeightsSection 
                  form={form}
                />
              </TabsContent>
            )}

            {examinationType === 'periodic' && (
              <TabsContent value="periodic_health" className="space-y-6">
                <PeriodicHealthHistorySection 
                  form={form}
                />
              </TabsContent>
            )}

            {examinationType === 'return_to_work' && (
              <TabsContent value="return_to_work" className="space-y-6">
                <ReturnToWorkSection 
                  form={form}
                />
              </TabsContent>
            )}

            <TabsContent value="declarations" className="space-y-6">
              <EnhancedDeclarationsSection 
                form={form} 
                examinationType={examinationType}
                onDataChange={(data) => {
                  // Handle data change without causing re-renders
                }}
              />
            </TabsContent>
          </Tabs>

          {/* Submit Button */}
          <div className="flex items-center justify-between pt-6 border-t">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              {lastSaved && (
                <span className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Saved {lastSaved.toLocaleTimeString()}
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => onSave?.(formData)}
                disabled={isSaving || completionPercentage < 5}
              >
                <Save className="h-4 w-4 mr-2" />
                Save Draft
              </Button>

              <Button
                type="submit"
                disabled={isSubmitting || completionPercentage < 100 || validationResult?.criticalIssues?.length > 0}
                className="min-w-32"
              >
                {isSubmitting ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Submit Questionnaire
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}

// Helper function to validate SA ID (using the service)
function validateSAID(idNumber: string): boolean {
  const saidInfo = questionnaireService.extractSAIDInfo(idNumber);
  return saidInfo?.isValid || false;
}