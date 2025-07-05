import React, { useState, useEffect, useCallback, useMemo, lazy, Suspense } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, CheckCircle, Wifi, WifiOff, Save, Send, User, FileText, Activity, Shield, Clock, PenTool } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Mobile-optimized questionnaire component
export default function MobileOptimizedQuestionnaire() {
  const [currentSection, setCurrentSection] = useState(0);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [autoSaveStatus, setAutoSaveStatus] = useState('saved');
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [touchFeedback, setTouchFeedback] = useState(null);

  // Mock patient data
  const patient = {
    id: 'patient_001',
    name: 'John Doe',
    idNumber: '9001015009087',
    age: 34,
    employer: 'ABC Mining Corp'
  };

  // Form state with optimized defaults
  const form = useForm({
    resolver: zodResolver(questionnaireSchema),
    mode: 'onChange',
    defaultValues: {
      patient_demographics: {
        personal_info: {
          initials: '',
          first_names: '',
          surname: '',
          id_number: '',
          age: null,
          gender: '',
          marital_status: ''
        },
        employment_info: {
          position: '',
          department: '',
          company_name: patient.employer
        }
      },
      medical_history: {
        current_conditions: {},
        respiratory_conditions: {},
        occupational_health: {}
      },
      declarations_and_signatures: {
        employee_declaration: {
          information_correct: false,
          no_misleading_information: false,
          employee_name: '',
          employee_signature: '',
          employee_signature_date: ''
        }
      }
    }
  });

  // Network status monitoring
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

  // Auto-save functionality with debouncing
  const debouncedSave = useCallback(
    debounce(async (data) => {
      setAutoSaveStatus('saving');
      try {
        if (isOnline) {
          // Save to server
          await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API call
        } else {
          // Save to localStorage
          localStorage.setItem(`questionnaire_${patient.id}`, JSON.stringify(data));
        }
        setAutoSaveStatus('saved');
      } catch (error) {
        setAutoSaveStatus('error');
      }
    }, 1000),
    [isOnline, patient.id]
  );

  // Watch form changes for auto-save
  const watchedValues = form.watch();
  useEffect(() => {
    debouncedSave(watchedValues);
  }, [watchedValues, debouncedSave]);

  // Touch feedback for better UX
  const handleTouchFeedback = (element) => {
    setTouchFeedback(element);
    setTimeout(() => setTouchFeedback(null), 200);
  };

  // Form sections configuration
  const sections = [
    {
      id: 'demographics',
      title: 'Personal Information',
      icon: <User className="h-5 w-5" />,
      component: PersonalDemographicsSection
    },
    {
      id: 'medical_history',
      title: 'Medical History',
      icon: <Activity className="h-5 w-5" />,
      component: MedicalHistorySection
    },
    {
      id: 'working_heights',
      title: 'Working at Heights',
      icon: <Shield className="h-5 w-5" />,
      component: WorkingAtHeightsSection
    },
    {
      id: 'declarations',
      title: 'Declarations & Signatures',
      icon: <PenTool className="h-5 w-5" />,
      component: DeclarationsSection
    }
  ];

  // Calculate completion percentage
  useEffect(() => {
    const fields = Object.keys(form.getValues());
    const completedFields = fields.filter(field => {
      const value = form.getValues(field);
      return value !== '' && value !== null && value !== undefined;
    });
    const percentage = Math.round((completedFields.length / fields.length) * 100);
    setCompletionPercentage(percentage);
  }, [watchedValues]);

  return (
    <div className="min-h-screen bg-gray-50 pb-safe">
      {/* Network Status Banner */}
      <div className={`w-full p-2 text-center text-sm font-medium transition-colors ${
        isOnline ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
      }`}>
        <div className="flex items-center justify-center gap-2">
          {isOnline ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
          {isOnline ? 'Connected' : 'Offline Mode - Data will sync when reconnected'}
        </div>
      </div>

      {/* Header */}
      <div className="bg-white shadow-sm border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Health Questionnaire</h1>
            <p className="text-sm text-gray-600">{patient.name} - {patient.employer}</p>
          </div>
          <div className="flex items-center gap-2">
            <AutoSaveIndicator status={autoSaveStatus} />
            <Badge variant="secondary" className="text-xs">
              {completionPercentage}% Complete
            </Badge>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="mt-3">
          <Progress value={completionPercentage} className="h-2" />
        </div>
      </div>

      {/* Mobile-Optimized Tabs */}
      <div className="bg-white border-b">
        <div className="flex overflow-x-auto scrollbar-hide">
          {sections.map((section, index) => (
            <button
              key={section.id}
              onClick={() => {
                setCurrentSection(index);
                handleTouchFeedback(section.id);
              }}
              className={`flex-shrink-0 flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors min-w-[120px] ${
                currentSection === index
                  ? 'border-blue-500 text-blue-600 bg-blue-50'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              } ${touchFeedback === section.id ? 'bg-gray-100' : ''}`}
              style={{ minHeight: '52px' }}
            >
              {section.icon}
              <span className="truncate">{section.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Form Content */}
      <div className="p-4">
        <div className="max-w-2xl mx-auto">
          {currentSection === 0 && <PersonalDemographicsSection form={form} patient={patient} />}
          {currentSection === 1 && <MedicalHistorySection form={form} />}
          {currentSection === 2 && <WorkingAtHeightsSection form={form} />}
          {currentSection === 3 && <DeclarationsSection form={form} />}
        </div>
      </div>

      {/* Mobile-Optimized Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg safe-area-inset-bottom">
        <div className="flex items-center justify-between p-4">
          <Button
            variant="outline"
            onClick={() => setCurrentSection(Math.max(0, currentSection - 1))}
            disabled={currentSection === 0}
            className="min-h-[48px] px-6"
          >
            Previous
          </Button>
          
          {currentSection === sections.length - 1 ? (
            <Button
              onClick={() => handleSubmit()}
              className="min-h-[48px] px-8 bg-green-600 hover:bg-green-700"
              disabled={completionPercentage < 100}
            >
              <Send className="h-4 w-4 mr-2" />
              Submit
            </Button>
          ) : (
            <Button
              onClick={() => setCurrentSection(Math.min(sections.length - 1, currentSection + 1))}
              className="min-h-[48px] px-6"
            >
              Next
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// Auto-save status indicator
function AutoSaveIndicator({ status }) {
  const icons = {
    saving: <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>,
    saved: <CheckCircle className="h-4 w-4 text-green-600" />,
    error: <AlertTriangle className="h-4 w-4 text-red-600" />
  };

  const labels = {
    saving: 'Saving...',
    saved: 'Saved',
    error: 'Save Error'
  };

  return (
    <div className="flex items-center gap-1 text-xs">
      {icons[status]}
      <span className={
        status === 'saving' ? 'text-blue-600' :
        status === 'saved' ? 'text-green-600' :
        'text-red-600'
      }>
        {labels[status]}
      </span>
    </div>
  );
}

// Personal Demographics Section - Mobile Optimized
function PersonalDemographicsSection({ form, patient }) {
  const [idValidation, setIdValidation] = useState(null);

  const validateSAID = (idNumber) => {
    if (!idNumber || idNumber.length !== 13) return null;
    
    // Mock SA ID validation
    return {
      isValid: true,
      age: 34,
      gender: 'male',
      dateOfBirth: '1990-01-01'
    };
  };

  const handleIdChange = (value) => {
    form.setValue('patient_demographics.personal_info.id_number', value);
    const validation = validateSAID(value);
    setIdValidation(validation);
    
    if (validation?.isValid) {
      form.setValue('patient_demographics.personal_info.age', validation.age);
      form.setValue('patient_demographics.personal_info.gender', validation.gender);
    }
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">Personal Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* SA ID with validation */}
        <div className="space-y-2">
          <Label htmlFor="id_number" className="text-base font-medium">
            South African ID Number *
          </Label>
          <Input
            id="id_number"
            placeholder="Enter 13-digit ID number"
            maxLength={13}
            className="min-h-[48px] text-base"
            onChange={(e) => handleIdChange(e.target.value)}
            style={{ fontSize: '16px' }} // Prevent iOS zoom
          />
          {idValidation?.isValid && (
            <div className="text-sm text-green-600 flex items-center gap-1">
              <CheckCircle className="h-4 w-4" />
              Valid ID - Auto-populated age and gender
            </div>
          )}
        </div>

        {/* Name fields */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="first_names" className="text-base font-medium">First Names *</Label>
            <Input
              id="first_names"
              {...form.register('patient_demographics.personal_info.first_names')}
              className="min-h-[48px] text-base"
              style={{ fontSize: '16px' }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="surname" className="text-base font-medium">Surname *</Label>
            <Input
              id="surname"
              {...form.register('patient_demographics.personal_info.surname')}
              className="min-h-[48px] text-base"
              style={{ fontSize: '16px' }}
            />
          </div>
        </div>

        {/* Gender and Age (auto-populated) */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-base font-medium">Age</Label>
            <Input
              value={form.watch('patient_demographics.personal_info.age') || ''}
              disabled
              className="min-h-[48px] text-base bg-gray-50"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-base font-medium">Gender</Label>
            <Input
              value={form.watch('patient_demographics.personal_info.gender') || ''}
              disabled
              className="min-h-[48px] text-base bg-gray-50"
            />
          </div>
        </div>

        {/* Employment Information */}
        <div className="space-y-4">
          <h3 className="text-base font-semibold text-gray-900">Employment Information</h3>
          <div className="space-y-2">
            <Label htmlFor="position" className="text-base font-medium">Position *</Label>
            <Input
              id="position"
              {...form.register('patient_demographics.employment_info.position')}
              className="min-h-[48px] text-base"
              style={{ fontSize: '16px' }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="department" className="text-base font-medium">Department *</Label>
            <Input
              id="department"
              {...form.register('patient_demographics.employment_info.department')}
              className="min-h-[48px] text-base"
              style={{ fontSize: '16px' }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Medical History Section - Mobile Optimized
function MedicalHistorySection({ form }) {
  const medicalConditions = [
    { key: 'heart_disease_high_bp', label: 'Heart disease or high blood pressure' },
    { key: 'epilepsy_convulsions', label: 'Epilepsy or convulsions' },
    { key: 'glaucoma_blindness', label: 'Glaucoma or blindness' },
    { key: 'family_mellitus_diabetes', label: 'Family history of diabetes' },
    { key: 'bleeding_from_rectum', label: 'Bleeding from rectum' },
    { key: 'kidney_stones_blood_urine', label: 'Kidney stones or blood in urine' },
    { key: 'prostate_gynaecological_problems', label: 'Prostate/gynaecological problems' }
  ];

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">Medical History</CardTitle>
        <p className="text-sm text-gray-600">
          Please indicate if you have or have had any of the following conditions:
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {medicalConditions.map((condition) => (
          <div key={condition.key} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
            <Checkbox
              id={condition.key}
              {...form.register(`medical_history.current_conditions.${condition.key}`)}
              className="mt-1 h-5 w-5"
            />
            <Label 
              htmlFor={condition.key} 
              className="text-base leading-relaxed cursor-pointer flex-1"
            >
              {condition.label}
            </Label>
          </div>
        ))}
        
        <div className="mt-6 space-y-2">
          <Label htmlFor="additional_comments" className="text-base font-medium">
            Additional Comments
          </Label>
          <Textarea
            id="additional_comments"
            {...form.register('medical_history.additional_comments')}
            placeholder="Any additional medical information..."
            className="min-h-[96px] text-base"
            style={{ fontSize: '16px' }}
          />
        </div>
      </CardContent>
    </Card>
  );
}

// Working at Heights Section - Mobile Optimized
function WorkingAtHeightsSection({ form }) {
  const heightQuestions = [
    { key: 'fear_of_heights', label: 'Do you have a fear of heights or enclosed spaces?' },
    { key: 'vertigo_dizziness', label: 'Do you suffer from vertigo or dizziness?' },
    { key: 'balance_problems', label: 'Do you have any balance problems?' },
    { key: 'previous_falls', label: 'Have you had any previous falls from height?' }
  ];

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">Working at Heights Assessment</CardTitle>
        <p className="text-sm text-gray-600">
          These questions help assess your fitness for working at heights:
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {heightQuestions.map((question) => (
          <div key={question.key} className="space-y-3 p-4 bg-gray-50 rounded-lg">
            <Label className="text-base font-medium">{question.label}</Label>
            <RadioGroup
              value={form.watch(`working_at_heights_assessment.${question.key}`) || ''}
              onValueChange={(value) => 
                form.setValue(`working_at_heights_assessment.${question.key}`, value === 'true')
              }
              className="flex gap-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="false" id={`${question.key}_no`} className="h-5 w-5" />
                <Label htmlFor={`${question.key}_no`} className="text-base cursor-pointer">No</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="true" id={`${question.key}_yes`} className="h-5 w-5" />
                <Label htmlFor={`${question.key}_yes`} className="text-base cursor-pointer">Yes</Label>
              </div>
            </RadioGroup>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// Declarations Section - Mobile Optimized
function DeclarationsSection({ form }) {
  const [signature, setSignature] = useState('');

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">Declarations & Signatures</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-start space-x-3">
            <Checkbox
              id="info_correct"
              {...form.register('declarations_and_signatures.employee_declaration.information_correct')}
              className="mt-1 h-5 w-5"
            />
            <Label htmlFor="info_correct" className="text-base leading-relaxed cursor-pointer">
              I declare that the information provided is correct and complete to the best of my knowledge.
            </Label>
          </div>
          
          <div className="flex items-start space-x-3">
            <Checkbox
              id="no_misleading"
              {...form.register('declarations_and_signatures.employee_declaration.no_misleading_information')}
              className="mt-1 h-5 w-5"
            />
            <Label htmlFor="no_misleading" className="text-base leading-relaxed cursor-pointer">
              I have not provided any misleading information and understand the importance of accurate health disclosure.
            </Label>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="employee_name" className="text-base font-medium">Full Name *</Label>
            <Input
              id="employee_name"
              {...form.register('declarations_and_signatures.employee_declaration.employee_name')}
              className="min-h-[48px] text-base"
              style={{ fontSize: '16px' }}
            />
          </div>
          
          <div className="space-y-2">
            <Label className="text-base font-medium">Digital Signature *</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
              <PenTool className="h-8 w-8 mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-gray-600">Tap to sign digitally</p>
              <Button 
                variant="outline" 
                className="mt-2 min-h-[44px]"
                onClick={() => {
                  // Open signature modal/canvas
                  setSignature('Digital signature captured');
                  form.setValue('declarations_and_signatures.employee_declaration.employee_signature', 'signature_data');
                }}
              >
                Sign Document
              </Button>
              {signature && (
                <div className="mt-2 text-sm text-green-600 flex items-center justify-center gap-1">
                  <CheckCircle className="h-4 w-4" />
                  Signature captured
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Utility function for debouncing
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Mock schema for demonstration
const questionnaireSchema = {
  parse: (data) => data,
  safeParse: (data) => ({ success: true, data })
};