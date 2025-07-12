// src/components/shared/SharedQuestionnaireForm.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  User, Heart, Briefcase, Activity, PenTool, AlertTriangle, 
  CheckCircle, Save, Eye, Calendar, MapPin, Phone, Mail,
  Stethoscope, Clipboard, Shield, Clock, Info
} from 'lucide-react';

import { 
  questionnaireSchema, 
  extractFromSAID, 
  validationHelpers, 
  sectionConfigs,
  type QuestionnaireFormData 
} from '@/schemas/questionnaireSchema';

// 🔧 Interface Props
interface SharedQuestionnaireFormProps {
  // Core props
  patientId: string;
  examinationType: 'pre_employment' | 'periodic' | 'working_at_heights' | 'return_to_work';
  
  // UI Mode
  mode: 'tablet' | 'desktop' | 'kiosk';
  
  // Initial data
  initialData?: Partial<QuestionnaireFormData>;
  
  // Callbacks
  onSave?: (data: Partial<QuestionnaireFormData>) => Promise<void>;
  onSubmit?: (data: QuestionnaireFormData) => Promise<void>;
  onSectionComplete?: (section: string, data: any) => void;
  
  // Configuration
  autoSave?: boolean;
  autoSaveInterval?: number; // milliseconds
  showProgress?: boolean;
  enableOffline?: boolean;
  
  // Staff assistance mode
  staffMode?: boolean;
  staffMemberId?: string;
  allowValidationOverrides?: boolean;
}

// 🔧 Custom Hooks
const useAutoSave = (
  form: any, 
  onSave?: (data: any) => Promise<void>, 
  interval: number = 30000,
  enabled: boolean = true
) => {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  
  const watchedData = useWatch({ control: form.control });
  
  const saveData = useCallback(async () => {
    if (!onSave || isSaving) return;
    
    try {
      setIsSaving(true);
      await onSave(form.getValues());
      setLastSaved(new Date());
    } catch (error) {
      console.error('Auto-save failed:', error);
    } finally {
      setIsSaving(false);
    }
  }, [form, onSave, isSaving]);
  
  useEffect(() => {
    if (!enabled || !onSave) return;
    
    const timeoutId = setTimeout(saveData, interval);
    return () => clearTimeout(timeoutId);
  }, [watchedData, saveData, interval, enabled]);
  
  return { isSaving, lastSaved, saveData };
};

// 🎯 Main Shared Form Component
export const SharedQuestionnaireForm: React.FC<SharedQuestionnaireFormProps> = ({
  patientId,
  examinationType,
  mode = 'desktop',
  initialData,
  onSave,
  onSubmit,
  onSectionComplete,
  autoSave = true,
  autoSaveInterval = 30000,
  showProgress = true,
  enableOffline = true,
  staffMode = false,
  staffMemberId,
  allowValidationOverrides = false
}) => {
  // 📊 State Management
  const [currentSection, setCurrentSection] = useState(0);
  const [completionScore, setCompletionScore] = useState(0);
  const [medicalAlerts, setMedicalAlerts] = useState<string[]>([]);
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // 🔧 Form Configuration
  const sectionConfig = useMemo(() => 
    sectionConfigs[examinationType] || sectionConfigs.pre_employment,
    [examinationType]
  );
  
  const defaultValues = useMemo(() => ({
    metadata: {
      questionnaire_id: `Q_${patientId}_${Date.now()}`,
      session_type: staffMode ? 'staff_assisted' : 'self_service',
      start_method: mode === 'desktop' ? 'staff_dashboard' : mode,
      completion_path: staffMode ? 'assisted' : 'guided',
      start_time: new Date().toISOString(),
      staff_member_id: staffMemberId,
      device_info: {
        type: mode,
        user_agent: navigator.userAgent
      }
    },
    patient_demographics: {
      personal_info: {
        initials: '',
        first_names: '',
        surname: '',
        id_number: '',
        date_of_birth: '',
        age: 0,
        marital_status: 'single',
        gender: 'male'
      },
      employment_info: {
        employee_number: '',
        position: '',
        department: '',
        company_name: '',
        employment_type: examinationType
      }
    },
    ...initialData
  }), [patientId, examinationType, mode, staffMode, staffMemberId, initialData]);
  
  // 🔧 Form Setup
  const form = useForm<QuestionnaireFormData>({
    resolver: zodResolver(questionnaireSchema),
    defaultValues,
    mode: 'onChange'
  });
  
  // 🔄 Auto-save Hook
  const { isSaving, lastSaved, saveData } = useAutoSave(
    form, 
    onSave, 
    autoSaveInterval, 
    autoSave
  );
  
  // 📊 Watch Form Changes
  const watchedData = useWatch({ control: form.control });
  const watchedIdNumber = useWatch({ 
    control: form.control, 
    name: 'patient_demographics.personal_info.id_number' 
  });
  
  // 🔧 SA ID Auto-population
  useEffect(() => {
    if (watchedIdNumber && watchedIdNumber.length === 13) {
      const extracted = extractFromSAID(watchedIdNumber);
      if (extracted) {
        form.setValue('patient_demographics.personal_info.date_of_birth', extracted.dateOfBirth);
        form.setValue('patient_demographics.personal_info.age', extracted.age);
        form.setValue('patient_demographics.personal_info.gender', extracted.gender as any);
      }
    }
  }, [watchedIdNumber, form]);
  
  // 📊 Calculate Completion Score
  useEffect(() => {
    const score = validationHelpers.calculateCompletionScore(watchedData, examinationType);
    setCompletionScore(score);
    
    const alerts = validationHelpers.generateMedicalAlerts(watchedData);
    setMedicalAlerts(alerts);
    
    // Update system data
    form.setValue('system_data.completion_score', score);
    form.setValue('system_data.medical_alerts', alerts);
  }, [watchedData, examinationType, form]);
  
  // 🔧 Section Definitions
  const sections = [
    {
      id: 'personal',
      title: 'Personal Information',
      icon: User,
      description: 'Basic demographic and contact information'
    },
    {
      id: 'employment',
      title: 'Employment Details',
      icon: Briefcase,
      description: 'Job position and company information'
    },
    {
      id: 'medical',
      title: 'Medical History',
      icon: Heart,
      description: 'Current conditions and medical background'
    },
    ...(examinationType === 'working_at_heights' ? [{
      id: 'heights',
      title: 'Working at Heights',
      icon: Activity,
      description: 'Height work specific health assessment'
    }] : []),
    ...(examinationType === 'periodic' ? [{
      id: 'periodic',
      title: 'Health Changes',
      icon: Calendar,
      description: 'Changes since last examination'
    }] : []),
    ...(examinationType === 'return_to_work' ? [{
      id: 'return',
      title: 'Return to Work',
      icon: Activity,
      description: 'Post-absence medical assessment'
    }] : []),
    {
      id: 'examination',
      title: 'Physical Examination',
      icon: Stethoscope,
      description: 'Basic measurements and observations'
    },
    {
      id: 'signatures',
      title: 'Declarations & Signatures',
      icon: PenTool,
      description: 'Digital signatures and consent forms'
    }
  ];
  
  // 🔧 Form Submission
  const handleSubmit = async (data: QuestionnaireFormData) => {
    setIsSubmitting(true);
    
    try {
      // Final validation
      const finalScore = validationHelpers.calculateCompletionScore(data, examinationType);
      const finalAlerts = validationHelpers.generateMedicalAlerts(data);
      const recommendations = validationHelpers.getNextStationRecommendations(data, examinationType);
      
      // Update system data
      const enhancedData = {
        ...data,
        metadata: {
          ...data.metadata,
          completion_time: Math.round((Date.now() - new Date(data.metadata.start_time).getTime()) / 60000)
        },
        system_data: {
          medical_alerts: finalAlerts,
          completion_score: finalScore,
          validation_warnings: validationWarnings,
          required_follow_ups: finalAlerts.length > 0 ? ['medical_review'] : [],
          next_station_recommendations: recommendations,
          workflow_status: finalAlerts.length > 0 ? 'requires_review' : 'completed'
        }
      };
      
      await onSubmit?.(enhancedData);
    } catch (error) {
      console.error('Form submission failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // 🎨 Responsive Classes
  const containerClasses = useMemo(() => {
    const base = "w-full max-w-4xl mx-auto space-y-6";
    
    switch (mode) {
      case 'tablet':
        return `${base} p-4 touch-friendly`;
      case 'kiosk':
        return `${base} p-6 kiosk-mode`;
      default:
        return `${base} p-6`;
    }
  }, [mode]);
  
  const buttonClasses = useMemo(() => {
    return mode === 'tablet' ? 'h-12 text-lg min-w-[120px]' : 'h-10';
  }, [mode]);
  
  return (
    <div className={containerClasses}>
      {/* 📊 Progress Header */}
      {showProgress && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Clipboard className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">
                    {examinationType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} Medical Questionnaire
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Section {currentSection + 1} of {sections.length} • {sectionConfig.estimated_time} min estimated
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                {/* Completion Score */}
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Progress:</span>
                  <Progress value={completionScore} className="w-24" />
                  <Badge variant={completionScore > 80 ? "default" : "secondary"}>
                    {completionScore}%
                  </Badge>
                </div>
                
                {/* Auto-save Status */}
                {autoSave && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    {isSaving ? (
                      <><Clock className="h-4 w-4 animate-spin" />Saving...</>
                    ) : lastSaved ? (
                      <><Save className="h-4 w-4" />Saved {lastSaved.toLocaleTimeString()}</>
                    ) : (
                      <><Save className="h-4 w-4" />Auto-save enabled</>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            {/* Medical Alerts */}
            {medicalAlerts.length > 0 && (
              <Alert className="mt-3 border-amber-200 bg-amber-50">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle className="text-amber-800">Medical Alerts Detected</AlertTitle>
                <AlertDescription className="text-amber-700">
                  {medicalAlerts.slice(0, 2).map((alert, idx) => (
                    <div key={idx}>• {alert}</div>
                  ))}
                  {medicalAlerts.length > 2 && (
                    <div className="text-xs mt-1">+{medicalAlerts.length - 2} more alerts</div>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* 📋 Main Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          
          {/* 🔄 Section Navigation */}
          <Card>
            <CardContent className="p-2">
              <Tabs value={sections[currentSection]?.id} className="w-full">
                <TabsList className={`grid w-full ${mode === 'tablet' ? 'grid-cols-2' : `grid-cols-${Math.min(sections.length, 6)}`} gap-1`}>
                  {sections.map((section, index) => {
                    const Icon = section.icon;
                    const isCompleted = index < currentSection;
                    const isCurrent = index === currentSection;
                    
                    return (
                      <TabsTrigger
                        key={section.id}
                        value={section.id}
                        onClick={() => setCurrentSection(index)}
                        className={`flex items-center gap-2 ${mode === 'tablet' ? 'p-3' : 'p-2'} ${
                          isCompleted ? 'bg-green-100 text-green-800' : 
                          isCurrent ? 'bg-blue-100 text-blue-800' : ''
                        }`}
                        disabled={!staffMode && index > currentSection + 1}
                      >
                        {isCompleted ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <Icon className="h-4 w-4" />
                        )}
                        <span className={mode === 'tablet' ? 'text-sm' : 'text-xs'}>
                          {section.title}
                        </span>
                      </TabsTrigger>
                    );
                  })}
                </TabsList>
                
                {/* 👤 Personal Information Section */}
                <TabsContent value="personal" className="mt-6">
                  <PersonalInformationSection 
                    form={form} 
                    mode={mode}
                    staffMode={staffMode}
                  />
                </TabsContent>
                
                {/* 💼 Employment Details Section */}
                <TabsContent value="employment" className="mt-6">
                  <EmploymentDetailsSection 
                    form={form} 
                    mode={mode}
                    examinationType={examinationType}
                  />
                </TabsContent>
                
                {/* 🏥 Medical History Section */}
                <TabsContent value="medical" className="mt-6">
                  <MedicalHistorySection 
                    form={form} 
                    mode={mode}
                    examinationType={examinationType}
                  />
                </TabsContent>
                
                {/* 🏗️ Working at Heights Section */}
                {examinationType === 'working_at_heights' && (
                  <TabsContent value="heights" className="mt-6">
                    <WorkingAtHeightsSection 
                      form={form} 
                      mode={mode}
                    />
                  </TabsContent>
                )}
                
                {/* 📅 Periodic Health Section */}
                {examinationType === 'periodic' && (
                  <TabsContent value="periodic" className="mt-6">
                    <PeriodicHealthSection 
                      form={form} 
                      mode={mode}
                    />
                  </TabsContent>
                )}
                
                {/* 🔙 Return to Work Section */}
                {examinationType === 'return_to_work' && (
                  <TabsContent value="return" className="mt-6">
                    <ReturnToWorkSection 
                      form={form} 
                      mode={mode}
                    />
                  </TabsContent>
                )}
                
                {/* 🩺 Physical Examination Section */}
                <TabsContent value="examination" className="mt-6">
                  <PhysicalExaminationSection 
                    form={form} 
                    mode={mode}
                  />
                </TabsContent>
                
                {/* ✍️ Signatures Section */}
                <TabsContent value="signatures" className="mt-6">
                  <SignaturesSection 
                    form={form} 
                    mode={mode}
                    staffMode={staffMode}
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
          
          {/* 🔄 Navigation Controls */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCurrentSection(Math.max(0, currentSection - 1))}
                    disabled={currentSection === 0}
                    className={buttonClasses}
                  >
                    Previous
                  </Button>
                  
                  {autoSave && (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={saveData}
                      disabled={isSaving}
                      className={buttonClasses}
                    >
                      {isSaving ? 'Saving...' : 'Save Draft'}
                    </Button>
                  )}
                </div>
                
                <div className="flex items-center gap-3">
                  {currentSection < sections.length - 1 ? (
                    <Button
                      type="button"
                      onClick={() => {
                        setCurrentSection(currentSection + 1);
                        onSectionComplete?.(sections[currentSection].id, form.getValues());
                      }}
                      className={buttonClasses}
                    >
                      Next Section
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      disabled={isSubmitting || completionScore < 80}
                      className={`${buttonClasses} bg-green-600 hover:bg-green-700`}
                    >
                      {isSubmitting ? 'Submitting...' : 'Complete Questionnaire'}
                    </Button>
                  )}
                </div>
              </div>
              
              {/* Completion Requirements */}
              {completionScore < 80 && (
                <Alert className="mt-4 border-blue-200 bg-blue-50">
                  <Info className="h-4 w-4" />
                  <AlertDescription className="text-blue-700">
                    Please complete more sections before submitting. Current progress: {completionScore}%
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </form>
      </Form>
    </div>
  );
};

// 🔧 Section Components

// 👤 Personal Information Section
const PersonalInformationSection: React.FC<{
  form: any;
  mode: string;
  staffMode?: boolean;
}> = ({ form, mode, staffMode }) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <User className="h-5 w-5" />
        Personal Information
      </CardTitle>
      <CardDescription>
        Basic demographic information and contact details
      </CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className={`grid gap-4 ${mode === 'tablet' ? 'grid-cols-1' : 'grid-cols-2'}`}>
        
        {/* SA ID Number with Auto-population */}
        <FormField
          control={form.control}
          name="patient_demographics.personal_info.id_number"
          render={({ field }) => (
            <FormItem className={mode === 'tablet' ? 'col-span-1' : 'col-span-2'}>
              <FormLabel className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                South African ID Number *
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="Enter 13-digit ID number"
                  maxLength={13}
                  className={`${mode === 'tablet' ? 'h-12 text-lg' : 'h-10'} font-mono`}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    field.onChange(value);
                  }}
                />
              </FormControl>
              <FormDescription>
                Age, date of birth, and gender will be automatically calculated
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* Name Fields */}
        <FormField
          control={form.control}
          name="patient_demographics.personal_info.initials"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Initials *</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="J.S."
                  className={mode === 'tablet' ? 'h-12 text-lg' : 'h-10'}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="patient_demographics.personal_info.first_names"
          render={({ field }) => (
            <FormItem>
              <FormLabel>First Names *</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="John Samuel"
                  className={mode === 'tablet' ? 'h-12 text-lg' : 'h-10'}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="patient_demographics.personal_info.surname"
          render={({ field }) => (
            <FormItem className={mode === 'tablet' ? 'col-span-1' : 'col-span-2'}>
              <FormLabel>Surname *</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="Smith"
                  className={mode === 'tablet' ? 'h-12 text-lg' : 'h-10'}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* Auto-populated Fields */}
        <FormField
          control={form.control}
          name="patient_demographics.personal_info.date_of_birth"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Date of Birth
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="date"
                  className={mode === 'tablet' ? 'h-12 text-lg' : 'h-10'}
                  readOnly={!staffMode}
                />
              </FormControl>
              <FormDescription>
                Auto-calculated from ID number
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="patient_demographics.personal_info.age"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Age</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="number"
                  className={mode === 'tablet' ? 'h-12 text-lg' : 'h-10'}
                  readOnly={!staffMode}
                />
              </FormControl>
              <FormDescription>
                Auto-calculated from ID number
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* Personal Details */}
        <FormField
          control={form.control}
          name="patient_demographics.personal_info.marital_status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Marital Status *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className={mode === 'tablet' ? 'h-12 text-lg' : 'h-10'}>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="single">Single</SelectItem>
                  <SelectItem value="married">Married</SelectItem>
                  <SelectItem value="divorced">Divorced</SelectItem>
                  <SelectItem value="widow_widower">Widow/Widower</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="patient_demographics.personal_info.gender"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Gender</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex flex-row space-x-4"
                  disabled={!staffMode}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="male" id="male" />
                    <Label htmlFor="male">Male</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="female" id="female" />
                    <Label htmlFor="female">Female</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="other" id="other" />
                    <Label htmlFor="other">Other</Label>
                  </div>
                </RadioGroup>
              </FormControl>
              <FormDescription>
                Auto-determined from ID number
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* Contact Information */}
        <FormField
          control={form.control}
          name="patient_demographics.personal_info.contact_number"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Contact Number
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="081 234 5678"
                  className={mode === 'tablet' ? 'h-12 text-lg' : 'h-10'}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="patient_demographics.personal_info.email_address"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email Address
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="email"
                  placeholder="john.smith@email.com"
                  className={mode === 'tablet' ? 'h-12 text-lg' : 'h-10'}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </CardContent>
  </Card>
);

// 💼 Employment Details Section
const EmploymentDetailsSection: React.FC<{
  form: any;
  mode: string;
  examinationType: string;
}> = ({ form, mode, examinationType }) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Briefcase className="h-5 w-5" />
        Employment Information
      </CardTitle>
      <CardDescription>
        Job position and workplace details
      </CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className={`grid gap-4 ${mode === 'tablet' ? 'grid-cols-1' : 'grid-cols-2'}`}>
        
        <FormField
          control={form.control}
          name="patient_demographics.employment_info.company_name"
          render={({ field }) => (
            <FormItem className={mode === 'tablet' ? 'col-span-1' : 'col-span-2'}>
              <FormLabel>Company Name *</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="ABC Mining Company"
                  className={mode === 'tablet' ? 'h-12 text-lg' : 'h-10'}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="patient_demographics.employment_info.position"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Position/Job Title *</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="Mining Engineer"
                  className={mode === 'tablet' ? 'h-12 text-lg' : 'h-10'}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="patient_demographics.employment_info.department"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Department *</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="Operations"
                  className={mode === 'tablet' ? 'h-12 text-lg' : 'h-10'}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="patient_demographics.employment_info.employee_number"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Employee Number</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="EMP001234"
                  className={mode === 'tablet' ? 'h-12 text-lg' : 'h-10'}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="patient_demographics.employment_info.employment_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Examination Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={examinationType}>
                <FormControl>
                  <SelectTrigger className={mode === 'tablet' ? 'h-12 text-lg' : 'h-10'}>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="pre_employment">Pre-Employment</SelectItem>
                  <SelectItem value="baseline">Baseline</SelectItem>
                  <SelectItem value="periodic">Periodic</SelectItem>
                  <SelectItem value="working_at_heights">Working at Heights</SelectItem>
                  <SelectItem value="return_to_work">Return to Work</SelectItem>
                  <SelectItem value="exit">Exit Medical</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </CardContent>
  </Card>
);

// Export remaining section components as separate files would be imported
export default SharedQuestionnaireForm;