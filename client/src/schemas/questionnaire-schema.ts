import { z } from 'zod';

// 🔧 SA ID Validation Helper
const validateSAID = (id: string): boolean => {
  if (!/^\d{13}$/.test(id)) return false;
  
  // Luhn algorithm validation for SA ID
  const digits = id.split('').map(Number);
  const checksum = digits.pop()!;
  
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    let digit = digits[i];
    if (i % 2 === 1) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }
  
  return (10 - (sum % 10)) % 10 === checksum;
};

// 🔧 Extract info from SA ID
export const extractFromSAID = (id: string) => {
  if (!validateSAID(id)) return null;
  
  const year = parseInt(id.substring(0, 2));
  const month = parseInt(id.substring(2, 4));
  const day = parseInt(id.substring(4, 6));
  const gender = parseInt(id.substring(6, 10)) >= 5000 ? 'male' : 'female';
  
  // Determine century
  const currentYear = new Date().getFullYear();
  const century = year <= (currentYear % 100) ? 2000 : 1900;
  const fullYear = century + year;
  
  const birthDate = new Date(fullYear, month - 1, day);
  const age = currentYear - fullYear;
  
  return {
    dateOfBirth: birthDate.toISOString().split('T')[0],
    age,
    gender
  };
};

// Enhanced Zod Schema for Medical Questionnaires
export const questionnaireSchema = z.object({
  // 📊 Metadata for tracking and workflow
  metadata: z.object({
    questionnaire_id: z.string().default(() => `Q_${Date.now()}`),
    company_name: z.string().min(1, "Company name is required"),
    employee_id: z.string().min(1, "Employee ID is required"),
    session_type: z.enum(['self_service', 'staff_assisted']).default('self_service'),
    start_method: z.enum(['tablet', 'staff_dashboard', 'kiosk']).default('tablet'),
    completion_path: z.enum(['guided', 'assisted', 'hybrid']).default('guided'),
    examination_type: z.enum(['pre_employment', 'periodic', 'exit', 'return_to_work', 'working_at_heights'], {
      errorMap: () => ({ message: "Invalid examination type" })
    }),
    examination_date: z.string().min(1, "Examination date is required"),
    start_time: z.string().default(() => new Date().toISOString()),
    last_saved: z.string().optional(),
    completion_time: z.number().optional(), // minutes
    staff_member_id: z.string().optional(),
    created_at: z.string().optional(),
    updated_at: z.string().optional(),
    version: z.string().optional(),
    device_info: z.object({
      type: z.enum(['tablet', 'desktop', 'mobile', 'kiosk']),
      screen_size: z.string().optional(),
      user_agent: z.string().optional()
    }).optional()
  }),

  patient_demographics: z.object({
    personal_info: z.object({
      initials: z.string().min(1, "Initials are required"),
      first_names: z.string().min(1, "First names are required"),
      surname: z.string().min(1, "Surname is required"),
      id_number: z.string()
        .min(13, 'SA ID must be 13 digits')
        .max(13, 'SA ID must be 13 digits')
        .regex(/^\d{13}$/, 'SA ID must contain only numbers')
        .refine(validateSAID, 'Invalid South African ID number'),
      date_of_birth: z.string().min(1, "Date of birth is required"),
      marital_status: z.enum(['single', 'married', 'divorced', 'widow_widower'], {
        errorMap: () => ({ message: "Invalid marital status" })
      }),
      gender: z.enum(['male', 'female', 'other'], {
        errorMap: () => ({ message: "Invalid gender" })
      }),
      age: z.number().min(16, 'Must be at least 16 years old').max(100),
      home_language: z.string().optional(),
      contact_number: z.string().optional(),
      email_address: z.string().email().optional(),
      home_address: z.object({
        street: z.string().optional(),
        suburb: z.string().optional(),
        city: z.string().optional(),
        postal_code: z.string().optional(),
        province: z.string().optional()
      }).optional(),
      emergency_contact: z.string().optional()
    }),
    employment_info: z.object({
      employee_number: z.string().optional(),
      position: z.string().min(1, "Position is required"),
      department: z.string().min(1, "Department is required"),
      company_name: z.string().min(1, "Company name is required"),
      employment_type: z.enum([
        'pre_employment', 
        'baseline', 
        'transfer', 
        'periodical', 
        'exit', 
        'return_to_work',
        'working_at_heights',
        'other'
      ]),
      start_date: z.string().optional(),
      supervisor_name: z.string().optional(),
      work_location: z.string().optional()
    })
  }),

  medical_history: z.object({
    // Current Medical Conditions
    current_conditions: z.object({
      heart_disease_high_bp: z.boolean().nullable(),
      epilepsy_convulsions: z.boolean().nullable(),
      glaucoma_blindness: z.boolean().nullable(),
      family_mellitus_diabetes: z.boolean().nullable(),
      family_deaths_before_60: z.boolean().nullable(),
      bleeding_from_rectum: z.boolean().nullable(),
      kidney_stones_blood_urine: z.boolean().nullable(),
      sugar_protein_urine: z.boolean().nullable(),
      prostate_gynaecological_problems: z.boolean().nullable(),
      blood_thyroid_disorder: z.boolean().nullable(),
      malignant_tumours_cancer: z.boolean().nullable()
    }),
    // Respiratory Conditions
    respiratory_conditions: z.object({
      tuberculosis_pneumonia: z.boolean().nullable(),
      chest_discomfort_palpitations: z.boolean().nullable(),
      shortness_of_breath: z.boolean().nullable(),
      chronic_cough: z.boolean().nullable(),
      asthma: z.boolean().nullable(),
      smoking_history: z.object({
        current_smoker: z.boolean().nullable(),
        cigarettes_per_day: z.number().optional(),
        years_smoking: z.number().optional(),
        quit_date: z.string().optional()
      }).optional()
    }),

    // Previous Medical History
    previous_medical_history: z.object({
      previous_operations: z.boolean().nullable(),
      operation_details: z.string().optional(),
      hospital_admissions: z.boolean().nullable(),
      admission_details: z.string().optional(),
      chronic_medications: z.boolean().nullable(),
      medication_list: z.string().optional(),
      allergies: z.boolean().nullable(),
      allergy_details: z.string().optional()
    }),

    // Occupational Health History
    occupational_health: z.object({
      previous_occupational_illness: z.boolean().nullable(),
      workers_compensation_claims: z.boolean().nullable(),
      asbestos_exposure: z.boolean().nullable(),
      chemical_exposure: z.boolean().nullable(),
      noise_exposure: z.boolean().nullable(),
      dust_exposure: z.boolean().nullable(),
      radiation_exposure: z.boolean().nullable(),
      previous_medical_surveillance: z.boolean().nullable()
    })
  }),

  // 🏋️ Working at Heights Assessment (conditional)
  working_at_heights: z.object({
    safety_questions: z.object({
      advised_not_work_at_height: z.boolean().nullable(),
      serious_occupational_accident: z.boolean().nullable(),
      fear_of_heights_enclosed_spaces: z.boolean().nullable(),
      fits_seizures_epilepsy_blackouts: z.boolean().nullable(),
      suicide_thoughts_attempts: z.boolean().nullable(),
      seen_mental_health_professional: z.boolean().nullable(),
      thoughts_not_own_messages_spirits: z.boolean().nullable(),
      substance_abuse_problem: z.boolean().nullable(),
      other_problems_affecting_safety: z.boolean().nullable()
    }),
    training_awareness: z.object({
      informed_of_tasks_safety_requirements: z.boolean().nullable(),
      chronic_diseases_diabetes_epilepsy: z.boolean().nullable()
    }),
    additional_comments: z.string().max(500).optional(),
    examiner_notes: z.string().max(500).optional()
  }).optional(),

  // 🔄 Periodic Health Assessment (conditional)
  periodic_health: z.object({
    health_changes_since_last: z.boolean().nullable(),
    health_changes_details: z.string().max(500).optional(),
    new_medications: z.boolean().nullable(),
    new_medications_details: z.string().max(300).optional(),
    illness_injury_treatment: z.string().max(500).optional(),
    time_off_work_medical: z.boolean().nullable(),
    time_off_details: z.string().max(300).optional(),
    work_related_symptoms: z.boolean().nullable(),
    work_symptoms_details: z.string().max(500).optional()
  }).optional(),

  // 🔙 Return to Work Assessment (conditional)
  return_to_work: z.object({
    reason_for_absence: z.string().min(1, 'Reason for absence is required'),
    absence_start_date: z.string().min(1, 'Start date is required'),
    treating_physician: z.string().optional(),
    current_treatment: z.string().optional(),
    functional_limitations: z.boolean().nullable(),
    limitation_details: z.string().max(500).optional(),
    medication_affecting_work: z.boolean().nullable(),
    medication_details: z.string().max(300).optional(),
    gradual_return_recommended: z.boolean().nullable(),
    accommodation_required: z.boolean().nullable(),
    accommodation_details: z.string().max(500).optional()
  }).optional(),

  // 📋 Physical Examination Data
  physical_examination: z.object({
    height: z.string().optional(),
    weight: z.string().optional(),
    bmi: z.number().optional(),
    pulse_rate: z.string().optional(),
    bp_systolic: z.string().optional(),
    bp_diastolic: z.string().optional(),
    weight_change_reason: z.string().optional(),
    urinalysis: z.object({
      blood: z.boolean().nullable(),
      protein: z.boolean().nullable(),
      glucose: z.boolean().nullable(),
      random_glucose: z.string().optional(),
      random_cholesterol: z.string().optional()
    }).optional()
  }),

  // ✍️ Digital Signatures and Declarations
  declarations: z.object({
    employee_declaration: z.object({
      information_correct: z.boolean().refine(val => val === true, 'Must confirm information is correct'),
      no_misleading_information: z.boolean().refine(val => val === true, 'Must confirm no misleading information'),
      signature: z.string().min(1, 'Employee signature is required'),
      date: z.string().min(1, 'Date is required')
    }),
    
    consent_declarations: z.object({
      medical_examination_consent: z.boolean().refine(val => val === true, 'Medical examination consent required'),
      information_sharing_consent: z.boolean().refine(val => val === true, 'Information sharing consent required'),
      occupational_health_program_consent: z.boolean().nullable()
    }),

    staff_signatures: z.object({
      nurse_signature: z.string().optional(),
      nurse_date: z.string().optional(),
      ohp_signature: z.string().optional(),
      ohp_date: z.string().optional(),
      omp_signature: z.string().optional(),
      omp_date: z.string().optional()
    }).optional()
  }),

  // 🚨 System Generated Data
  system_data: z.object({
    medical_alerts: z.array(z.string()).default([]),
    validation_warnings: z.array(z.string()).default([]),
    completion_score: z.number().min(0).max(100).default(0),
    required_follow_ups: z.array(z.string()).default([]),
    next_station_recommendations: z.array(z.object({
      station: z.string(),
      priority: z.enum(['high', 'medium', 'low']),
      reason: z.string(),
      estimated_time: z.string()
    })).default([]),
    workflow_status: z.enum(['in_progress', 'completed', 'requires_review']).default('in_progress')
  }).optional(),

  audit_trail: z.object({
    created_by: z.string(),
    created_at: z.string(),
    updated_by: z.string().optional(),
    updated_at: z.string().optional()
  }).optional()
});

// 📊 Form Section Configuration
export const sectionConfigs = {
  pre_employment: {
    required_sections: [
      'patient_demographics',
      'medical_history',
      'physical_examination',
      'declarations'
    ],
    optional_sections: ['working_at_heights'],
    estimated_time: 15
  },
  periodic: {
    required_sections: [
      'patient_demographics.personal_info',
      'periodic_health',
      'medical_history.current_conditions',
      'physical_examination',
      'declarations'
    ],
    optional_sections: ['working_at_heights'],
    estimated_time: 10
  },
  working_at_heights: {
    required_sections: [
      'patient_demographics',
      'medical_history',
      'working_at_heights',
      'physical_examination',
      'declarations'
    ],
    optional_sections: [],
    estimated_time: 20
  },
  return_to_work: {
    required_sections: [
      'patient_demographics.personal_info',
      'return_to_work',
      'medical_history.current_conditions',
      'physical_examination',
      'declarations'
    ],
    optional_sections: [],
    estimated_time: 12
  }
};

// 🔧 Validation Helper Functions
export const validationHelpers = {
  calculateCompletionScore: (data: any, examinationType: string): number => {
    const config = sectionConfigs[examinationType as keyof typeof sectionConfigs];
    if (!config) return 0;

    let totalFields = 0;
    let completedFields = 0;

    // Count completion for required sections
    config.required_sections.forEach(section => {
      const sectionData = getNestedProperty(data, section);
      if (sectionData) {
        const fields = countFields(sectionData);
        totalFields += fields.total;
        completedFields += fields.completed;
      }
    });

    return totalFields > 0 ? Math.round((completedFields / totalFields) * 100) : 0;
  },

  generateMedicalAlerts: (data: any): string[] => {
    const alerts: string[] = [];
    
    if (data.medical_history?.current_conditions) {
      const conditions = data.medical_history.current_conditions;
      
      if (conditions.heart_disease_high_bp) alerts.push('Cardiovascular condition requires monitoring');
      if (conditions.epilepsy_convulsions) alerts.push('Neurological condition - fitness assessment required');
      if (conditions.glaucoma_blindness) alerts.push('Visual impairment - vision testing priority');
      // Add more medical alert logic
    }

    if (data.working_at_heights?.safety_questions) {
      const safetyQuestions = data.working_at_heights.safety_questions;
      
      if (safetyQuestions.fear_of_heights_enclosed_spaces) alerts.push('Fear of heights - height work restrictions may apply');
      if (safetyQuestions.fits_seizures_epilepsy_blackouts) alerts.push('History of seizures - height work contraindicated');
      if (safetyQuestions.suicide_thoughts_attempts) alerts.push('Mental health concerns - immediate referral required');
      if (safetyQuestions.advised_not_work_at_height) alerts.push('Previously advised not to work at heights');
      if (safetyQuestions.substance_abuse_problem) alerts.push('Substance abuse concerns - assessment required');
    }

    return alerts;
  },

  getNextStationRecommendations: (data: any, examinationType: string) => {
    const recommendations = [];
    
    // Base recommendations
    recommendations.push({
      station: 'nursing',
      priority: 'high' as const,
      reason: 'Vital signs assessment',
      estimated_time: '10 minutes'
    });

    // Medical condition based routing
    if (data.medical_history?.current_conditions?.glaucoma_blindness) {
      recommendations.unshift({
        station: 'vision_testing',
        priority: 'high' as const,
        reason: 'Vision impairment reported',
        estimated_time: '15 minutes'
      });
    }

    if (data.medical_history?.current_conditions?.heart_disease_high_bp) {
      recommendations.unshift({
        station: 'ecg',
        priority: 'high' as const,
        reason: 'Cardiovascular condition',
        estimated_time: '20 minutes'
      });
    }

    return recommendations;
  }
};

// 🔧 Helper Functions
function getNestedProperty(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

function countFields(obj: any): { total: number; completed: number } {
  let total = 0;
  let completed = 0;

  Object.values(obj || {}).forEach(value => {
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      const nested = countFields(value);
      total += nested.total;
      completed += nested.completed;
    } else {
      total++;
      if (value !== null && value !== undefined && value !== '') {
        completed++;
      }
    }
  });

  return { total, completed };
}

export type QuestionnaireFormData = z.infer<typeof questionnaireSchema>;
export type Questionnaire = z.infer<typeof questionnaireSchema>;
export default questionnaireSchema;

// Partial schema for form validation during input
export const partialQuestionnaireSchema = questionnaireSchema.partial();
export type PartialQuestionnaire = z.infer<typeof partialQuestionnaireSchema>;

// Section-specific schemas for step-by-step validation
export const demographicsSchema = questionnaireSchema.pick({
  patient_demographics: true
});

export const medicalHistorySchema = questionnaireSchema.pick({
  medical_history: true
});

export const workingAtHeightsSchema = questionnaireSchema.pick({
  working_at_heights: true
});

export const periodicHealthSchema = questionnaireSchema.pick({
  periodic_health: true
});

export const returnToWorkSchema = questionnaireSchema.pick({
  return_to_work: true
});

export const physicalExaminationSchema = questionnaireSchema.pick({
  physical_examination: true
});

export const declarationsSchema = questionnaireSchema.pick({
  declarations: true
});

// Validation helper functions
export const validateQuestionnaire = (data: unknown) => {
  return questionnaireSchema.safeParse(data);
};

export const validatePartialQuestionnaire = (data: unknown) => {
  return partialQuestionnaireSchema.safeParse(data);
};

export const validateSection = (sectionName: string, data: unknown) => {
  switch (sectionName) {
    case 'demographics':
      return demographicsSchema.safeParse(data);
    case 'medical_history':
      return medicalHistorySchema.safeParse(data);
    case 'working_at_heights':
      return workingAtHeightsSchema.safeParse(data);
    case 'periodic_health':
      return periodicHealthSchema.safeParse(data);
    case 'return_to_work':
      return returnToWorkSchema.safeParse(data);
    case 'physical_examination':
      return physicalExaminationSchema.safeParse(data);
    case 'declarations':
      return declarationsSchema.safeParse(data);
    default:
      throw new Error(`Unknown section: ${sectionName}`);
  }
};

// Default values for new questionnaires
export const defaultQuestionnaireValues: Partial<Questionnaire> = {
  metadata: {
    questionnaire_id: '',
    company_name: '',
    employee_id: '',
    session_type: 'self_service',
    start_method: 'tablet',
    completion_path: 'guided',
    examination_type: 'pre_employment',
    examination_date: new Date().toISOString().split('T')[0],
    start_time: new Date().toISOString(),
  },
  patient_demographics: {
    personal_info: {
      initials: '',
      first_names: '',
      surname: '',
      id_number: '',
      date_of_birth: '',
      marital_status: 'single',
      gender: 'male',
      age: 0,
    },
    employment_info: {
      position: '',
      department: '',
      company_name: '',
      employment_type: 'pre_employment',
    },
  },
  medical_history: {
    current_conditions: {
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
      malignant_tumours_cancer: null,
    },
    respiratory_conditions: {
      tuberculosis_pneumonia: null,
      chest_discomfort_palpitations: null,
      shortness_of_breath: null,
      chronic_cough: null,
      asthma: null,
    },
    previous_medical_history: {
      previous_operations: null,
      hospital_admissions: null,
      chronic_medications: null,
      allergies: null,
    },
    occupational_health: {
      previous_occupational_illness: null,
      workers_compensation_claims: null,
      asbestos_exposure: null,
      chemical_exposure: null,
      noise_exposure: null,
      dust_exposure: null,
      radiation_exposure: null,
      previous_medical_surveillance: null,
    },
  },
  physical_examination: {
    height: '',
    weight: '',
    pulse_rate: '',
    bp_systolic: '',
    bp_diastolic: '',
  },
  declarations: {
    employee_declaration: {
      information_correct: false,
      no_misleading_information: false,
      signature: '',
      date: '',
    },
    consent_declarations: {
      medical_examination_consent: false,
      information_sharing_consent: false,
      occupational_health_program_consent: null,
    },
  },
};