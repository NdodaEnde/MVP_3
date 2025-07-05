export interface User {
  _id: string;
  email: string;
  name: string;
  role: 'receptionist' | 'nurse' | 'technician' | 'doctor' | 'admin' | 'employer';
  organization: string;
  location?: string;
}

export interface Patient {
  _id: string;
  name: string;
  idNumber: string;
  email: string;
  phone: string;
  employer: string;
  age: number;
  status: 'checked-in' | 'questionnaire' | 'nurse' | 'technician' | 'doctor' | 'completed';
  examinationType: 'pre-employment' | 'periodic' | 'exit';
  createdAt: string;
  updatedAt: string;
}

export interface Questionnaire {
  _id: string;
  patientId: string;
  responses: Record<string, any>;
  completed: boolean;
  signature?: string;
  completedAt?: string;
}

// Enhanced questionnaire types from schema
export interface QuestionnaireMetadata {
  questionnaire_id: string;
  company_name: string;
  employee_id: string;
  examination_type: 'pre_employment' | 'periodic' | 'exit' | 'return_to_work';
  examination_date: string;
  created_at?: string;
  updated_at?: string;
  version?: string;
}

export interface PersonalInfo {
  initials: string;
  first_names: string;
  surname: string;
  id_number: string;
  date_of_birth: string;
  marital_status: 'single' | 'married' | 'divorced' | 'widow_widower';
  gender: 'male' | 'female' | 'other';
  age: number;
  contact_details?: {
    phone?: string;
    email?: string;
    address?: string;
    emergency_contact?: string;
  };
}

export interface EmploymentInfo {
  position: string;
  department: string;
  employee_number: string;
  company_name: string;
  employment_type: 'pre_employment' | 'baseline' | 'transfer' | 'periodical' | 'exit' | 'other';
  start_date?: string;
  supervisor?: string;
  work_location?: string;
}

export interface CurrentConditions {
  heart_disease_high_bp: boolean;
  epilepsy_convulsions: boolean;
  glaucoma_blindness: boolean;
  diabetes_endocrine: boolean;
  kidney_disease: boolean;
  liver_disease: boolean;
  mental_health_conditions: boolean;
  neurological_conditions: boolean;
  blood_disorders: boolean;
  cancer_tumors: boolean;
  autoimmune_conditions: boolean;
  other_conditions?: string;
}

export interface RespiratoryConditions {
  tuberculosis_pneumonia: boolean;
  chest_discomfort_palpitations: boolean;
  asthma_allergies: boolean;
  chronic_cough: boolean;
  breathing_difficulties: boolean;
  lung_disease: boolean;
  other_respiratory?: string;
}

export interface OccupationalHealth {
  noise_exposure: boolean;
  heat_exposure: boolean;
  chemical_exposure: boolean;
  dust_exposure: boolean;
  radiation_exposure: boolean;
  vibration_exposure: boolean;
  fitness_status: 'fit' | 'unfit' | 'fit_with_restrictions';
  competitive_sport: boolean;
  regular_exercise: boolean;
  exercise_frequency?: string;
  previous_occupational_injuries: boolean;
  injury_details?: string;
}

export interface MedicalHistoryEntry {
  date: string;
  practitioner_name: string;
  medical_specialty: string;
  diagnosis_reason: string;
  treatment_outcome?: string;
  ongoing_treatment?: boolean;
}

export interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  purpose: string;
  prescribing_doctor?: string;
}

export interface Allergy {
  allergen: string;
  reaction: string;
  severity: 'mild' | 'moderate' | 'severe';
}

export interface WorkingAtHeightsAssessment {
  fear_of_heights: boolean;
  vertigo_dizziness: boolean;
  balance_problems: boolean;
  previous_falls: boolean;
  medication_affecting_balance: boolean;
  vision_problems: boolean;
  hearing_problems: boolean;
  mobility_restrictions: boolean;
  physical_fitness_level?: 'excellent' | 'good' | 'fair' | 'poor';
  specific_concerns?: string;
}

export interface ReturnToWorkSurveillance {
  absence_reason: string;
  absence_duration: string;
  medical_clearance: boolean;
  restrictions_required: boolean;
  restriction_details?: string;
  gradual_return_plan?: string;
  follow_up_schedule?: string;
  treating_physician?: string;
  medical_reports_attached?: boolean;
}

export interface ValidationStatus {
  questionnaire_complete: boolean;
  vitals_validated: boolean;
  assessment_complete: boolean;
  ready_for_certificate: boolean;
  validation_errors: string[];
  last_validated_by?: string;
  last_validated_at?: string;
  completion_percentage?: number;
  missing_sections?: string[];
}

export interface EmployeeDeclaration {
  information_correct: boolean;
  no_misleading_information: boolean;
  consent_to_medical_examination: boolean;
  consent_to_information_sharing: boolean;
  employee_name: string;
  employee_signature: string;
  employee_signature_date: string;
  witness_name?: string;
  witness_signature?: string;
}

export interface HealthPractitionerSection {
  practitioner_name?: string;
  practitioner_registration_number?: string;
  practitioner_signature?: string;
  practitioner_date?: string;
  practitioner_comments?: string;
  recommendations?: string;
  follow_up_required?: boolean;
  next_examination_date?: string;
}

export interface VitalSigns {
  _id: string;
  patientId: string;
  height: number;
  weight: number;
  bloodPressure: {
    systolic: number;
    diastolic: number;
  };
  pulse: number;
  temperature: number;
  bmi: number;
  notes?: string;
  nurseId: string;
  recordedAt: string;
}

export interface TestResults {
  _id: string;
  patientId: string;
  vision?: {
    leftEye: string;
    rightEye: string;
    colorVision: boolean;
    restrictions?: string;
  };
  hearing?: {
    leftEar: number;
    rightEar: number;
    restrictions?: string;
  };
  lungFunction?: {
    fev1: number;
    fvc: number;
    peakFlow: number;
  };
  drugScreen?: {
    result: 'negative' | 'positive' | 'pending';
    substances?: string[];
  };
  xray?: {
    result: string;
    abnormalities?: string;
    imageUrl?: string;
  };
  technicianId: string;
  completedAt: string;
}

export interface Certificate {
  _id: string;
  patientId: string;
  status: 'fit' | 'fit-with-restrictions' | 'unfit';
  restrictions?: string[];
  recommendations?: string;
  validUntil: string;
  doctorId: string;
  digitalSignature: string;
  issuedAt: string;
}

export interface Organization {
  _id: string;
  name: string;
  domain: string;
  subscriptionTier: 'basic' | 'premium' | 'enterprise';
  locations: string[];
  settings: {
    branding: {
      logo?: string;
      primaryColor: string;
      secondaryColor: string;
    };
    certificateTemplate: string;
  };
  role?: 'admin' | 'member' | 'viewer';
}