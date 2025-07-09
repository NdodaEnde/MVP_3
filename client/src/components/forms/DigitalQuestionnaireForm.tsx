import React, { useState, useEffect, useRef } from 'react';
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

  useEffect(() => {
    // Calculate completion percentage and validate form
    const validation = questionnaireService.validateQuestionnaire(formData, examinationType);
    setValidationResult(validation);
    setCompletionPercentage(validation.completionPercentage || 0);
  }, [formData, examinationType]);

  // Auto-save functionality
  useEffect(() => {
    const autoSave = async () => {
      if (onSave && completionPercentage > 5) {
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
    };

    const timer = setTimeout(autoSave, 3000); // Auto-save after 3 seconds of inactivity
    return () => clearTimeout(timer);
  }, [formData, onSave, completionPercentage]);

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
    ...(examinationType === 'return_to_work' ? [{ id: 'return_to_work', label: 'Return to Work', icon: Stethoscope }] : []),
    { id: 'declarations', label: 'Signatures', icon: PenTool }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header with Progress */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">
                {examinationType.replace('_', ' ').toUpperCase()} Questionnaire
              </CardTitle>
              <CardDescription>
                {patient?.firstName} {patient?.surname} - {patient?.employerName}
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 mb-2">
                <Progress value={completionPercentage} className="w-32" />
                <span className="text-sm font-medium">{completionPercentage}%</span>
              </div>
              {lastSaved && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Save className="h-3 w-3" />
                  Last saved: {lastSaved.toLocaleTimeString()}
                </p>
              )}
              {isSaving && (
                <p className="text-xs text-blue-600 flex items-center gap-1">
                  <Clock className="h-3 w-3 animate-spin" />
                  Saving...
                </p>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Validation Alerts */}
      {validationResult && (
        <div className="space-y-2">
          {validationResult.criticalIssues?.length > 0 && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle className="text-red-800">Critical Issues ({validationResult.criticalIssues.length})</AlertTitle>
              <AlertDescription>
                <ul className="mt-2 space-y-1">
                  {validationResult.criticalIssues.map((issue: string, index: number) => (
                    <li key={index} className="text-red-700">• {issue}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
          
          {validationResult.warnings?.length > 0 && (
            <Alert className="border-yellow-200 bg-yellow-50">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle className="text-yellow-800">Medical Alerts ({validationResult.warnings.length})</AlertTitle>
              <AlertDescription>
                <ul className="mt-2 space-y-1">
                  {validationResult.warnings.map((warning: string, index: number) => (
                    <li key={index} className="text-yellow-700">• {warning}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {/* Main Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <Tabs value={currentTab} onValueChange={setCurrentTab}>
            <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${tabs.length}, 1fr)` }}>
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const sectionStatus = validationResult?.sectionStatus?.[tab.id] || 'incomplete';
                return (
                  <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    {tab.label}
                    {sectionStatus === 'complete' && <CheckCircle className="h-3 w-3 text-green-500" />}
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {/* Demographics Tab */}
            <TabsContent value="demographics" className="space-y-6">
              <PersonalDemographicsSection form={form} examinationType={examinationType} />
            </TabsContent>

            {/* Medical History Tab */}
            <TabsContent value="medical_history" className="space-y-6">
              <MedicalHistorySection form={form} examinationType={examinationType} />
            </TabsContent>

            {/* Lifestyle Factors Tab */}
            <TabsContent value="lifestyle_factors" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Lifestyle Factors</CardTitle>
                  <CardDescription>Information about smoking, alcohol, exercise, and diet</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Smoking History */}
                  <div>
                    <h4 className="font-medium mb-4">Smoking History</h4>
                    <FormField
                      control={form.control}
                      name="lifestyle_factors.smoking.status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Smoking Status</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select smoking status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="never">Never smoked</SelectItem>
                              <SelectItem value="former">Former smoker</SelectItem>
                              <SelectItem value="current">Current smoker</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Exercise */}
                  <div>
                    <h4 className="font-medium mb-4">Exercise</h4>
                    <FormField
                      control={form.control}
                      name="lifestyle_factors.exercise.frequency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Exercise Frequency</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="How often do you exercise?" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="never">Never</SelectItem>
                              <SelectItem value="rarely">Rarely (less than once a week)</SelectItem>
                              <SelectItem value="weekly">Weekly (1-3 times per week)</SelectItem>
                              <SelectItem value="daily">Daily</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Working at Heights Assessment (conditional) */}
            {examinationType === 'working_at_heights' && (
              <TabsContent value="heights_assessment" className="space-y-6">
                <WorkingAtHeightsSection form={form} />
              </TabsContent>
            )}

            {/* Periodic Health History (conditional) */}
            {examinationType === 'periodic' && (
              <TabsContent value="periodic_health" className="space-y-6">
                <PeriodicHealthHistorySection form={form} />
              </TabsContent>
            )}

            {/* Return to Work (conditional) */}
            {examinationType === 'return_to_work' && (
              <TabsContent value="return_to_work" className="space-y-6">
                <ReturnToWorkSection form={form} />
              </TabsContent>
            )}

            {/* Declarations and Signatures */}
            <TabsContent value="declarations" className="space-y-6">
              <EnhancedDeclarationsSection form={form} examinationType={examinationType} />
            </TabsContent>
          </Tabs>

          {/* Form Actions */}
          <div className="flex items-center justify-between pt-6 border-t">
            <div className="flex items-center gap-4">
              <Badge variant={completionPercentage === 100 ? "default" : "secondary"}>
                {completionPercentage}% Complete
              </Badge>
              {validationResult?.requiresReview && (
                <Badge variant="destructive">Medical Review Required</Badge>
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