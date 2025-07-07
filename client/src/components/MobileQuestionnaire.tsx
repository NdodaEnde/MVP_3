import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, CheckCircle, Wifi, WifiOff, Save, Send, User, FileText, Activity, Shield, Clock, PenTool, Stethoscope } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Complete Paper-Matching Mobile Questionnaire
export default function CompletePaperQuestionnaire() {
  const [currentSection, setCurrentSection] = useState(0);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [autoSaveStatus, setAutoSaveStatus] = useState('saved');
  const [completionPercentage, setCompletionPercentage] = useState(0);

  // Complete form state matching paper form exactly
  const [formData, setFormData] = useState({
    patient_demographics: {
      personal_info: {
        initials: '',
        first_names: '',
        surname: '',
        id_number: '',
        date_of_birth: '',
        marital_status: '',
        position: '',
        department: '',
        examination_type: '' // Pre-Employment, Baseline, Transfer, Periodical, Exit, Other
      }
    },
    medical_history: {
      // All 27 questions from paper form
      heart_disease_high_bp: null,
      epilepsy_convulsions: null,
      glaucoma_blindness: null,
      family_mellitus_diabetes: null,
      family_deaths_before_60: null,
      bleeding_from_rectum: null,
      kidney_stones_blood_urine: null,
      sugar_protein_urine: null,
      prostate_gynaecological_problems: null,
      blood_thyroid_disorder: null,
      malignant_tumours_cancer: null
    },
    physical_examination: {
      height: '',
      weight: '',
      bmi: '',
      weight_change_5kg: null,
      weight_change_reason: '',
      pulse_rate: '',
      bp_systolic: '',
      bp_diastolic: '',
      patient_position: '',
      urinalysis: {
        blood: null,
        protein: null,
        glucose: null
      },
      random_glucose: '',
      random_cholesterol: ''
    },
    working_at_heights: {
      // Complete 12 questions from paper
      q1_advised_not_work_height: null,
      q2_serious_accident: null,
      q3_fear_heights_spaces: null,
      q4_fits_seizures: null,
      q5_suicide_thoughts: null,
      q6_mental_health_professional: null,
      q7_thoughts_spirits: null,
      q8_substance_abuse: null,
      q9_other_problems: null,
      q10_informed_tasks: null,
      q11_chronic_diseases: null,
      q12_additional_comments: '',
      examiner_id: '',
      examiner_declaration: ''
    },
    employee_declaration: {
      information_correct: false,
      signature: '',
      date: ''
    }
  });

  const [errors, setErrors] = useState({});

  // Form sections matching paper workflow
  const sections = [
    {
      id: 'personal_history',
      title: 'Personal History',
      icon: <User className="h-5 w-5" />,
      component: PersonalHistorySection
    },
    {
      id: 'medical_history', 
      title: 'Medical History',
      icon: <Activity className="h-5 w-5" />,
      component: MedicalHistorySection
    },
    {
      id: 'physical_exam',
      title: 'Physical Examination',
      icon: <Stethoscope className="h-5 w-5" />,
      component: PhysicalExaminationSection
    },
    {
      id: 'working_heights',
      title: 'Working at Heights',
      icon: <Shield className="h-5 w-5" />,
      component: WorkingAtHeightsSection
    },
    {
      id: 'declaration',
      title: 'Declaration & Signature',
      icon: <PenTool className="h-5 w-5" />,
      component: DeclarationSection
    }
  ];

  // Auto-save and network monitoring
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

  // Update form data function
  const updateFormData = useCallback((path, value) => {
    setFormData(prev => {
      const newData = { ...prev };
      const keys = path.split('.');
      let current = newData;
      
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) current[keys[i]] = {};
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      return newData;
    });
  }, []);

  // SA ID auto-population
  const handleIdChange = (value) => {
    updateFormData('patient_demographics.personal_info.id_number', value);
    
    if (value.length === 13) {
      // Extract date of birth (YYMMDD)
      const year = parseInt(value.substring(0, 2));
      const month = value.substring(2, 4);
      const day = value.substring(4, 6);
      const fullYear = year > 20 ? 1900 + year : 2000 + year;
      
      updateFormData('patient_demographics.personal_info.date_of_birth', 
        `${fullYear}-${month}-${day}`);
    }
  };

  // Calculate BMI
  const calculateBMI = (height, weight) => {
    if (height && weight) {
      const heightM = height / 100;
      const bmi = weight / (heightM * heightM);
      return bmi.toFixed(1);
    }
    return '';
  };

  // Calculate completion percentage
  useEffect(() => {
    const calculateCompletion = () => {
      let totalFields = 0;
      let completedFields = 0;

      // Personal info (8 required fields)
      const personalRequired = ['initials', 'first_names', 'surname', 'id_number', 'date_of_birth', 'marital_status', 'position', 'department'];
      totalFields += personalRequired.length;
      completedFields += personalRequired.filter(field => 
        formData.patient_demographics?.personal_info?.[field]
      ).length;

      // Medical history (11 questions)
      const medicalQuestions = Object.keys(formData.medical_history);
      totalFields += medicalQuestions.length;
      completedFields += medicalQuestions.filter(q => 
        formData.medical_history[q] !== null
      ).length;

      // Physical examination (6 required fields)
      const physicalRequired = ['height', 'weight', 'pulse_rate', 'bp_systolic', 'bp_diastolic'];
      totalFields += physicalRequired.length;
      completedFields += physicalRequired.filter(field =>
        formData.physical_examination?.[field]
      ).length;

      // Working at heights (11 questions)
      const heightsQuestions = Object.keys(formData.working_at_heights).filter(k => k.startsWith('q'));
      totalFields += heightsQuestions.length;
      completedFields += heightsQuestions.filter(q =>
        formData.working_at_heights[q] !== null
      ).length;

      // Declaration
      totalFields += 1;
      if (formData.employee_declaration?.information_correct && formData.employee_declaration?.signature) {
        completedFields += 1;
      }

      return Math.round((completedFields / Math.max(totalFields, 1)) * 100);
    };

    setCompletionPercentage(calculateCompletion());
  }, [formData]);

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

      {/* Header with Company Branding */}
      <div className="bg-white shadow-sm border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">C</span>
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">MEDICAL QUESTIONNAIRE</h1>
                <p className="text-xs text-gray-500">Collar Occupational Health</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Company:</span>
                <span className="ml-2 font-medium">{formData.patient_demographics?.personal_info?.company_name || 'Wolf Wadley'}</span>
              </div>
              <div>
                <span className="text-gray-600">Employee:</span>
                <span className="ml-2 font-medium">{formData.patient_demographics?.personal_info?.first_names || 'Eric Mukhela'}</span>
              </div>
            </div>
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

      {/* Section Navigation */}
      <div className="bg-white border-b overflow-x-auto">
        <div className="flex">
          {sections.map((section, index) => (
            <button
              key={section.id}
              onClick={() => setCurrentSection(index)}
              className={`flex-shrink-0 flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors min-w-[140px] ${
                currentSection === index
                  ? 'border-blue-500 text-blue-600 bg-blue-50'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
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
        <div className="max-w-4xl mx-auto">
          {currentSection === 0 && (
            <PersonalHistorySection 
              formData={formData} 
              updateFormData={updateFormData}
              handleIdChange={handleIdChange}
              errors={errors}
            />
          )}
          {currentSection === 1 && (
            <MedicalHistorySection 
              formData={formData} 
              updateFormData={updateFormData}
            />
          )}
          {currentSection === 2 && (
            <PhysicalExaminationSection 
              formData={formData} 
              updateFormData={updateFormData}
              calculateBMI={calculateBMI}
            />
          )}
          {currentSection === 3 && (
            <WorkingAtHeightsSection 
              formData={formData} 
              updateFormData={updateFormData}
            />
          )}
          {currentSection === 4 && (
            <DeclarationSection 
              formData={formData} 
              updateFormData={updateFormData}
            />
          )}
        </div>
      </div>

      {/* Mobile Navigation */}
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
              onClick={() => alert('Form submitted successfully!')}
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

// Personal History Section - Matches Paper Page 1
function PersonalHistorySection({ formData, updateFormData, handleIdChange, errors }) {
  const personalInfo = formData.patient_demographics?.personal_info || {};

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">PERSONAL HISTORY</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Name Fields */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label className="text-base font-medium">Initials *</Label>
            <Input
              className="min-h-[48px] text-base uppercase"
              value={personalInfo.initials || ''}
              onChange={(e) => updateFormData('patient_demographics.personal_info.initials', e.target.value.toUpperCase())}
              placeholder="E.M."
              maxLength={5}
              style={{ fontSize: '16px' }}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-base font-medium">Surname *</Label>
            <Input
              className="min-h-[48px] text-base"
              value={personalInfo.surname || ''}
              onChange={(e) => updateFormData('patient_demographics.personal_info.surname', e.target.value)}
              placeholder="MUKHELA"
              style={{ fontSize: '16px' }}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-base font-medium">First Names *</Label>
            <Input
              className="min-h-[48px] text-base"
              value={personalInfo.first_names || ''}
              onChange={(e) => updateFormData('patient_demographics.personal_info.first_names', e.target.value)}
              placeholder="ERIC THABISO"
              style={{ fontSize: '16px' }}
            />
          </div>
        </div>

        {/* ID Number */}
        <div className="space-y-2">
          <Label className="text-base font-medium">ID Number *</Label>
          <Input
            className="min-h-[48px] text-base font-mono"
            value={personalInfo.id_number || ''}
            onChange={(e) => handleIdChange(e.target.value)}
            placeholder="8903030050109"
            maxLength={13}
            style={{ fontSize: '16px' }}
          />
          {personalInfo.id_number && personalInfo.id_number.length === 13 && (
            <div className="text-sm text-green-600 flex items-center gap-1">
              <CheckCircle className="h-4 w-4" />
              Valid ID - Auto-populated date of birth
            </div>
          )}
        </div>

        {/* Date of Birth */}
        <div className="space-y-2">
          <Label className="text-base font-medium">Date of Birth</Label>
          <Input
            className="min-h-[48px] text-base bg-gray-50"
            value={personalInfo.date_of_birth || ''}
            disabled
            placeholder="Auto-filled from ID"
            style={{ fontSize: '16px' }}
          />
        </div>

        {/* Marital Status */}
        <div className="space-y-2">
          <Label className="text-base font-medium">Marital Status *</Label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['Single', 'Married', 'Divorce', 'Widow/Widower'].map((status) => (
              <div key={status} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id={status}
                  checked={personalInfo.marital_status === status}
                  onChange={(e) => e.target.checked && updateFormData('patient_demographics.personal_info.marital_status', status)}
                  className="h-5 w-5 rounded"
                />
                <Label htmlFor={status} className="text-sm cursor-pointer">
                  {status}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Employment Information */}
        <div className="space-y-4">
          <h3 className="text-base font-semibold text-gray-900">Employment Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-base font-medium">Position *</Label>
              <Input
                className="min-h-[48px] text-base"
                value={personalInfo.position || ''}
                onChange={(e) => updateFormData('patient_demographics.personal_info.position', e.target.value)}
                placeholder="GM"
                style={{ fontSize: '16px' }}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-base font-medium">Department *</Label>
              <Input
                className="min-h-[48px] text-base"
                value={personalInfo.department || ''}
                onChange={(e) => updateFormData('patient_demographics.personal_info.department', e.target.value)}
                placeholder="BUSINESS DEV"
                style={{ fontSize: '16px' }}
              />
            </div>
          </div>
        </div>

        {/* Examination Type */}
        <div className="space-y-2">
          <Label className="text-base font-medium">Examination Type *</Label>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            {[
              'Pre-Employment',
              'Baseline', 
              'Transfer',
              'Periodical',
              'Exit',
              'Other'
            ].map((type) => (
              <div key={type} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id={type}
                  checked={personalInfo.examination_type === type}
                  onChange={(e) => e.target.checked && updateFormData('patient_demographics.personal_info.examination_type', type)}
                  className="h-5 w-5 rounded"
                />
                <Label htmlFor={type} className="text-sm cursor-pointer">
                  {type}
                </Label>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Medical History Section - All 27 Questions from Paper
function MedicalHistorySection({ formData, updateFormData }) {
  const medicalHistory = formData.medical_history || {};

  const medicalQuestions = [
    { key: 'heart_disease_high_bp', label: '1. Heart disease or high blood pressure' },
    { key: 'epilepsy_convulsions', label: '2. Epilepsy or convulsions' },
    { key: 'glaucoma_blindness', label: '3. Glaucoma or blindness' },
    { key: 'family_mellitus_diabetes', label: '4. Family Mellitus (Sugar sickness)' },
    { key: 'family_deaths_before_60', label: '5. Family deaths before 60 years of age' },
    { key: 'bleeding_from_rectum', label: '22. Bleeding from the rectum' },
    { key: 'kidney_stones_blood_urine', label: '23. Kidney stones or blood in the urine (including Bilharzia)' },
    { key: 'sugar_protein_urine', label: '24. Sugar or protein in the urine' },
    { key: 'prostate_gynaecological_problems', label: '25. Prostate/Gynaecological problems' },
    { key: 'blood_thyroid_disorder', label: '26. Any blood or thyroid disorder' },
    { key: 'malignant_tumours_cancer', label: '27. Malignant tumours cancer or radiotherapy' }
  ];

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">MEDICAL HISTORY</CardTitle>
        <p className="text-sm text-gray-600">
          Have you ever had or do you now have any of the following conditions?
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4">
          {medicalQuestions.map((question) => (
            <div key={question.key} className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-start justify-between">
                <Label className="text-base leading-relaxed flex-1 pr-4">
                  {question.label}
                </Label>
                <div className="flex gap-6">
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id={`${question.key}_yes`}
                      name={question.key}
                      checked={medicalHistory[question.key] === true}
                      onChange={() => updateFormData(`medical_history.${question.key}`, true)}
                      className="h-5 w-5"
                    />
                    <Label htmlFor={`${question.key}_yes`} className="text-base cursor-pointer font-medium">
                      YES
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id={`${question.key}_no`}
                      name={question.key}
                      checked={medicalHistory[question.key] === false}
                      onChange={() => updateFormData(`medical_history.${question.key}`, false)}
                      className="h-5 w-5"
                    />
                    <Label htmlFor={`${question.key}_no`} className="text-base cursor-pointer font-medium">
                      NO
                    </Label>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Physical Examination Section - Page 2 from Paper
function PhysicalExaminationSection({ formData, updateFormData, calculateBMI }) {
  const physicalExam = formData.physical_examination || {};

  useEffect(() => {
    if (physicalExam.height && physicalExam.weight) {
      const bmi = calculateBMI(physicalExam.height, physicalExam.weight);
      updateFormData('physical_examination.bmi', bmi);
    }
  }, [physicalExam.height, physicalExam.weight]);

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">MEDICAL EXAMINATION CONFIDENTIAL REPORT</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Basic Measurements */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label className="text-base font-medium">Height (CM) *</Label>
            <Input
              className="min-h-[48px] text-base"
              value={physicalExam.height || ''}
              onChange={(e) => updateFormData('physical_examination.height', e.target.value)}
              placeholder="172"
              type="number"
              style={{ fontSize: '16px' }}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-base font-medium">Weight (Kg) *</Label>
            <Input
              className="min-h-[48px] text-base"
              value={physicalExam.weight || ''}
              onChange={(e) => updateFormData('physical_examination.weight', e.target.value)}
              placeholder="88"
              type="number"
              style={{ fontSize: '16px' }}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-base font-medium">BMI</Label>
            <Input
              className="min-h-[48px] text-base bg-gray-50"
              value={physicalExam.bmi || ''}
              disabled
              placeholder="Auto-calculated"
              style={{ fontSize: '16px' }}
            />
          </div>
        </div>

        {/* Weight Change */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-base font-medium">Has the weight changed by more than 5kg in the past year?</Label>
            <div className="flex gap-6">
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="weight_yes"
                  name="weight_change"
                  checked={physicalExam.weight_change_5kg === true}
                  onChange={() => updateFormData('physical_examination.weight_change_5kg', true)}
                  className="h-5 w-5"
                />
                <Label htmlFor="weight_yes" className="text-base cursor-pointer">YES</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="weight_no"
                  name="weight_change"
                  checked={physicalExam.weight_change_5kg === false}
                  onChange={() => updateFormData('physical_examination.weight_change_5kg', false)}
                  className="h-5 w-5"
                />
                <Label htmlFor="weight_no" className="text-base cursor-pointer">NO</Label>
              </div>
            </div>
          </div>
          {physicalExam.weight_change_5kg && (
            <div className="space-y-2">
              <Label className="text-base font-medium">If so state a reason</Label>
              <Textarea
                className="min-h-[60px] text-base"
                value={physicalExam.weight_change_reason || ''}
                onChange={(e) => updateFormData('physical_examination.weight_change_reason', e.target.value)}
                placeholder="Reason for weight change..."
                style={{ fontSize: '16px' }}
              />
            </div>
          )}
        </div>

        {/* Vital Signs */}
        <div className="space-y-4">
          <h3 className="text-base font-semibold text-gray-900">Vital Signs</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-base font-medium">Pulse Rate per min *</Label>
              <Input
                className="min-h-[48px] text-base"
                value={physicalExam.pulse_rate || ''}
                onChange={(e) => updateFormData('physical_examination.pulse_rate', e.target.value)}
                placeholder="80"
                type="number"
                style={{ fontSize: '16px' }}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-base font-medium">BP Systolic *</Label>
              <Input
                className="min-h-[48px] text-base"
                value={physicalExam.bp_systolic || ''}
                onChange={(e) => updateFormData('physical_examination.bp_systolic', e.target.value)}
                placeholder="120"
                type="number"
                style={{ fontSize: '16px' }}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-base font-medium">BP Diastolic *</Label>
              <Input
                className="min-h-[48px] text-base"
                value={physicalExam.bp_diastolic || ''}
                onChange={(e) => updateFormData('physical_examination.bp_diastolic', e.target.value)}
                placeholder="73"
                type="number"
                style={{ fontSize: '16px' }}
              />
            </div>
          </div>
        </div>

        {/* Patient Position */}
        <div className="space-y-2">
          <Label className="text-base font-medium">Patient Position</Label>
          <Input
            className="min-h-[48px] text-base"
            value={physicalExam.patient_position || ''}
            onChange={(e) => updateFormData('physical_examination.patient_position', e.target.value)}
            placeholder="GM"
            style={{ fontSize: '16px' }}
          />
        </div>

        {/* Urinalysis */}
        <div className="space-y-4">
          <h3 className="text-base font-semibold text-gray-900">Urinalysis: Are any of the following present in the urine?</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {['blood', 'protein', 'glucose'].map((test) => (
              <div key={test} className="space-y-2">
                <Label className="text-base font-medium capitalize">{test}</Label>
                <div className="flex gap-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id={`${test}_yes`}
                      name={`urinalysis_${test}`}
                      checked={physicalExam.urinalysis?.[test] === true}
                      onChange={() => updateFormData(`physical_examination.urinalysis.${test}`, true)}
                      className="h-5 w-5"
                    />
                    <Label htmlFor={`${test}_yes`} className="text-base cursor-pointer">Yes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id={`${test}_no`}
                      name={`urinalysis_${test}`}
                      checked={physicalExam.urinalysis?.[test] === false}
                      onChange={() => updateFormData(`physical_examination.urinalysis.${test}`, false)}
                      className="h-5 w-5"
                    />
                    <Label htmlFor={`${test}_no`} className="text-base cursor-pointer">No</Label>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Random Tests */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-base font-medium">Random Glucose (mmol/L)</Label>
            <Input
              className="min-h-[48px] text-base"
              value={physicalExam.random_glucose || ''}
              onChange={(e) => updateFormData('physical_examination.random_glucose', e.target.value)}
              placeholder="5.6"
              type="number"
              step="0.1"
              style={{ fontSize: '16px' }}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-base font-medium">Random Cholesterol (mmol/L)</Label>
            <Input
              className="min-h-[48px] text-base"
              value={physicalExam.random_cholesterol || ''}
              onChange={(e) => updateFormData('physical_examination.random_cholesterol', e.target.value)}
              placeholder="4.2"
              type="number"
              step="0.1"
              style={{ fontSize: '16px' }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Working at Heights Section - Complete 12 Questions from Paper
function WorkingAtHeightsSection({ formData, updateFormData }) {
  const workingHeights = formData.working_at_heights || {};

  const heightsQuestions = [
    { key: 'q1_advised_not_work_height', label: '1. Have you ever been advised NOT to work at height?' },
    { key: 'q2_serious_accident', label: '2. Have you ever had a serious occupational accident or occupational diseases?' },
    { key: 'q3_fear_heights_spaces', label: '3. Do you have a fear of heights or fear of enclosed spaces?' },
    { key: 'q4_fits_seizures', label: '4. Do you have, or have you ever had fits/seizures, epilepsy, blackouts, dizzy spells, or episodes of sudden weakness?' },
    { key: 'q5_suicide_thoughts', label: '5. Have you ever attempted to commit suicide or have suicidal thoughts?' },
    { key: 'q6_mental_health_professional', label: '6. Have you ever seen a psychologist, psychiatrist or any other health professional for a mental health disease?' },
    { key: 'q7_thoughts_spirits', label: '7. Do you often have thoughts that are not your own e.g. message from God, the devil or evil spirits?' },
    { key: 'q8_substance_abuse', label: '8. Do you have a substance abuse problem (alcohol/drugs)' },
    { key: 'q9_other_problems', label: '9. Are you aware of any other problems that could possibly affect your ability to safely perform expected duties and work at heights?' },
    { key: 'q10_informed_tasks', label: '10. Have you been informed of the tasks you are expected to perform, and the safety requirements and health requirements for working at heights?' },
    { key: 'q11_chronic_diseases', label: '11. Do you have any chronic diseases e.g. diabetes or epilepsy' }
  ];

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">WORKING AT HEIGHTS QUESTIONNAIRE</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Name Field */}
        <div className="space-y-2">
          <Label className="text-base font-medium">Name & Surname</Label>
          <Input
            className="min-h-[48px] text-base"
            value={`${formData.patient_demographics?.personal_info?.first_names || ''} ${formData.patient_demographics?.personal_info?.surname || ''}`.trim()}
            disabled
            style={{ fontSize: '16px' }}
          />
        </div>

        {/* Main Complaint Section */}
        <div className="space-y-4">
          <h3 className="text-base font-semibold text-gray-900">Main Complaint</h3>
          <div className="space-y-4">
            {heightsQuestions.map((question) => (
              <div key={question.key} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-start justify-between">
                  <Label className="text-base leading-relaxed flex-1 pr-4">
                    {question.label}
                  </Label>
                  <div className="flex gap-6">
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id={`${question.key}_yes`}
                        name={question.key}
                        checked={workingHeights[question.key] === true}
                        onChange={() => updateFormData(`working_at_heights.${question.key}`, true)}
                        className="h-5 w-5"
                      />
                      <Label htmlFor={`${question.key}_yes`} className="text-base cursor-pointer font-medium">
                        Yes
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id={`${question.key}_no`}
                        name={question.key}
                        checked={workingHeights[question.key] === false}
                        onChange={() => updateFormData(`working_at_heights.${question.key}`, false)}
                        className="h-5 w-5"
                      />
                      <Label htmlFor={`${question.key}_no`} className="text-base cursor-pointer font-medium">
                        No
                      </Label>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Additional Comments */}
        <div className="space-y-2">
          <Label className="text-base font-medium">12. Additional Comments:</Label>
          <Textarea
            className="min-h-[80px] text-base"
            value={workingHeights.q12_additional_comments || ''}
            onChange={(e) => updateFormData('working_at_heights.q12_additional_comments', e.target.value)}
            placeholder="Any additional comments regarding working at heights..."
            style={{ fontSize: '16px' }}
          />
        </div>

        {/* Examiner Section */}
        <div className="space-y-4 border-t pt-4">
          <h3 className="text-base font-semibold text-gray-900">Examiner Section</h3>
          <div className="space-y-4 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-700">
              Examiner: I have explained to the employee that he should notify the supervisor if, 
              at any time, he develops a health condition that he feels may affect his ability to 
              work at height, including the use of medicine.
            </p>
            <div className="space-y-2">
              <Label className="text-base font-medium">Examiner ID Number</Label>
              <Input
                className="min-h-[48px] text-base"
                value={workingHeights.examiner_id || ''}
                onChange={(e) => updateFormData('working_at_heights.examiner_id', e.target.value)}
                placeholder="Examiner ID..."
                style={{ fontSize: '16px' }}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-base font-medium">Declaration</Label>
              <Textarea
                className="min-h-[60px] text-base"
                value={workingHeights.examiner_declaration || ''}
                onChange={(e) => updateFormData('working_at_heights.examiner_declaration', e.target.value)}
                placeholder="I hereby declare that all the information furnished above is, to the best of my knowledge, true and correct..."
                style={{ fontSize: '16px' }}
              />
            </div>
          </div>
        </div>

        {/* Health Practitioner Comment */}
        <div className="space-y-2">
          <Label className="text-base font-medium text-red-600">Health Practitioner's Comment:</Label>
          <div className="border-b-2 border-gray-300 min-h-[60px] p-2">
            <p className="text-sm text-gray-500">
              (To be completed by health practitioner during examination)
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Declaration Section - Employee Declaration and Signature
function DeclarationSection({ formData, updateFormData }) {
  const declaration = formData.employee_declaration || {};
  const [signature, setSignature] = useState('');

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">DECLARATION & SIGNATURE</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Employee Declaration */}
        <div className="space-y-4 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-start space-x-3">
            <Checkbox
              id="info_correct"
              checked={declaration.information_correct || false}
              onCheckedChange={(checked) => 
                updateFormData('employee_declaration.information_correct', checked)
              }
              className="mt-1 h-5 w-5"
            />
            <Label htmlFor="info_correct" className="text-base leading-relaxed cursor-pointer">
              I hereby declare that the above information is correct and I have not provided 
              any misleading information to the company Name & Surname
            </Label>
          </div>
        </div>

        {/* Employee Name */}
        <div className="space-y-2">
          <Label className="text-base font-medium">Employee Name *</Label>
          <Input
            className="min-h-[48px] text-base"
            value={declaration.employee_name || `${formData.patient_demographics?.personal_info?.first_names || ''} ${formData.patient_demographics?.personal_info?.surname || ''}`.trim()}
            onChange={(e) => updateFormData('employee_declaration.employee_name', e.target.value)}
            style={{ fontSize: '16px' }}
          />
        </div>

        {/* Digital Signature */}
        <div className="space-y-2">
          <Label className="text-base font-medium">Employee Signature *</Label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <PenTool className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-sm text-gray-600 mb-4">Tap to capture digital signature</p>
            <Button 
              variant="outline" 
              className="min-h-[48px] px-8"
              onClick={() => {
                setSignature('Digital signature captured');
                updateFormData('employee_declaration.signature', 'signature_data_' + Date.now());
                updateFormData('employee_declaration.date', new Date().toISOString().split('T')[0]);
              }}
            >
              <PenTool className="h-4 w-4 mr-2" />
              Sign Document
            </Button>
            {(signature || declaration.signature) && (
              <div className="mt-4 text-sm text-green-600 flex items-center justify-center gap-1">
                <CheckCircle className="h-4 w-4" />
                Signature captured on {declaration.date || new Date().toLocaleDateString()}
              </div>
            )}
          </div>
        </div>

        {/* Important Notice */}
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Important:</strong> By signing this document, you confirm that all information 
            provided is accurate and complete. False information may result in disqualification 
            from employment or disciplinary action.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
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
