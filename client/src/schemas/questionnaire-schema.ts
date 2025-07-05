import { z } from 'zod';

// Enhanced Zod Schema for Medical Questionnaires
export const questionnaireSchema = z.object({
  metadata: z.object({
    questionnaire_id: z.string().min(1, "Questionnaire ID is required"),
    company_name: z.string().min(1, "Company name is required"),
    employee_id: z.string().min(1, "Employee ID is required"),
    examination_type: z.enum(['pre_employment', 'periodic', 'exit', 'return_to_work'], {
      errorMap: () => ({ message: "Invalid examination type" })
    }),
    examination_date: z.string().min(1, "Examination date is required"),
    created_at: z.string().optional(),
    updated_at: z.string().optional(),
    version: z.string().optional()
  }),

  patient_demographics: z.object({
    personal_info: z.object({
      initials: z.string().min(1, "Initials are required"),
      first_names: z.string().min(1, "First names are required"),
      surname: z.string().min(1, "Surname is required"),
      id_number: z.string().regex(/^\d{13}$/, "SA ID number must be 13 digits"),
      date_of_birth: z.string().min(1, "Date of birth is required"),
      marital_status: z.enum(['single', 'married', 'divorced', 'widow_widower'], {
        errorMap: () => ({ message: "Invalid marital status" })
      }),
      gender: z.enum(['male', 'female', 'other'], {
        errorMap: () => ({ message: "Invalid gender" })
      }),
      age: z.number().min(16, "Age must be at least 16").max(120, "Age must be less than 120"),
      contact_details: z.object({
        phone: z.string().optional(),
        email: z.string().email().optional(),
        address: z.string().optional(),
        emergency_contact: z.string().optional()
      }).optional()
    }),
    employment_info: z.object({
      position: z.string().min(1, "Position is required"),
      department: z.string().min(1, "Department is required"),
      employee_number: z.string().min(1, "Employee number is required"),
      company_name: z.string().min(1, "Company name is required"),
      employment_type: z.enum(['pre_employment', 'baseline', 'transfer', 'periodical', 'exit', 'other'], {
        errorMap: () => ({ message: "Invalid employment type" })
      }),
      start_date: z.string().optional(),
      supervisor: z.string().optional(),
      work_location: z.string().optional()
    })
  }),

  medical_history: z.object({
    current_conditions: z.object({
      heart_disease_high_bp: z.boolean(),
      epilepsy_convulsions: z.boolean(),
      glaucoma_blindness: z.boolean(),
      diabetes_endocrine: z.boolean(),
      kidney_disease: z.boolean(),
      liver_disease: z.boolean(),
      mental_health_conditions: z.boolean(),
      neurological_conditions: z.boolean(),
      blood_disorders: z.boolean(),
      cancer_tumors: z.boolean(),
      autoimmune_conditions: z.boolean(),
      other_conditions: z.string().optional()
    }),
    respiratory_conditions: z.object({
      tuberculosis_pneumonia: z.boolean(),
      chest_discomfort_palpitations: z.boolean(),
      asthma_allergies: z.boolean(),
      chronic_cough: z.boolean(),
      breathing_difficulties: z.boolean(),
      lung_disease: z.boolean(),
      other_respiratory: z.string().optional()
    }),
    occupational_health: z.object({
      noise_exposure: z.boolean(),
      heat_exposure: z.boolean(),
      chemical_exposure: z.boolean(),
      dust_exposure: z.boolean(),
      radiation_exposure: z.boolean(),
      vibration_exposure: z.boolean(),
      fitness_status: z.enum(['fit', 'unfit', 'fit_with_restrictions'], {
        errorMap: () => ({ message: "Invalid fitness status" })
      }),
      competitive_sport: z.boolean(),
      regular_exercise: z.boolean(),
      exercise_frequency: z.string().optional(),
      previous_occupational_injuries: z.boolean(),
      injury_details: z.string().optional()
    }),
    medication_history: z.object({
      current_medications: z.array(z.object({
        name: z.string(),
        dosage: z.string(),
        frequency: z.string(),
        purpose: z.string(),
        prescribing_doctor: z.string().optional()
      })),
      allergies: z.array(z.object({
        allergen: z.string(),
        reaction: z.string(),
        severity: z.enum(['mild', 'moderate', 'severe'])
      })),
      previous_reactions: z.string().optional()
    }),
    family_history: z.object({
      hereditary_conditions: z.array(z.string()),
      cardiovascular_disease: z.boolean(),
      diabetes: z.boolean(),
      cancer: z.boolean(),
      mental_health: z.boolean(),
      other_significant: z.string().optional()
    })
  }),

  periodic_health_history: z.object({
    since_last_examination: z.object({
      illness_injury_treatment: z.string().optional(),
      family_history_changes: z.string().optional(),
      occupational_risk_profile_changes: z.string().optional(),
      current_medications: z.string().optional(),
      lifestyle_changes: z.string().optional(),
      new_symptoms: z.string().optional()
    }),
    previous_examination_results: z.object({
      last_examination_date: z.string().optional(),
      last_examination_outcome: z.enum(['fit', 'unfit', 'fit_with_restrictions']).optional(),
      restrictions_previously_imposed: z.string().optional(),
      follow_up_required: z.boolean().optional()
    }).optional()
  }).optional(),

  working_at_heights_assessment: z.object({
    fear_of_heights: z.boolean(),
    vertigo_dizziness: z.boolean(),
    balance_problems: z.boolean(),
    previous_falls: z.boolean(),
    medication_affecting_balance: z.boolean(),
    vision_problems: z.boolean(),
    hearing_problems: z.boolean(),
    mobility_restrictions: z.boolean(),
    physical_fitness_level: z.enum(['excellent', 'good', 'fair', 'poor']).optional(),
    specific_concerns: z.string().optional()
  }).optional(),

  return_to_work_surveillance: z.object({
    absence_reason: z.string().min(1, "Absence reason is required"),
    absence_duration: z.string().min(1, "Absence duration is required"),
    medical_clearance: z.boolean(),
    restrictions_required: z.boolean(),
    restriction_details: z.string().optional(),
    gradual_return_plan: z.string().optional(),
    follow_up_schedule: z.string().optional(),
    treating_physician: z.string().optional(),
    medical_reports_attached: z.boolean().optional()
  }).optional(),

  medical_treatment_history: z.object({
    last_two_years: z.array(z.object({
      date: z.string(),
      practitioner_name: z.string(),
      medical_specialty: z.string(),
      diagnosis_reason: z.string(),
      treatment_outcome: z.string().optional(),
      ongoing_treatment: z.boolean().optional()
    })),
    general_practitioners_ten_years: z.array(z.object({
      name: z.string(),
      contact_details: z.string(),
      period_of_care: z.string().optional()
    })),
    hospitalizations: z.array(z.object({
      date: z.string(),
      hospital: z.string(),
      reason: z.string(),
      duration: z.string(),
      outcome: z.string().optional()
    })),
    surgical_history: z.array(z.object({
      date: z.string(),
      procedure: z.string(),
      surgeon: z.string(),
      complications: z.string().optional()
    }))
  }),

  lifestyle_factors: z.object({
    smoking_history: z.object({
      current_smoker: z.boolean(),
      previous_smoker: z.boolean(),
      packs_per_day: z.number().optional(),
      years_smoking: z.number().optional(),
      quit_date: z.string().optional()
    }),
    alcohol_consumption: z.object({
      frequency: z.enum(['never', 'occasional', 'regular', 'daily']).optional(),
      units_per_week: z.number().optional(),
      binge_drinking: z.boolean().optional()
    }),
    substance_use: z.object({
      recreational_drugs: z.boolean(),
      prescription_drug_misuse: z.boolean(),
      details: z.string().optional()
    }),
    diet_exercise: z.object({
      diet_quality: z.enum(['excellent', 'good', 'fair', 'poor']).optional(),
      exercise_frequency: z.enum(['daily', 'weekly', 'monthly', 'rarely', 'never']).optional(),
      sleep_quality: z.enum(['excellent', 'good', 'fair', 'poor']).optional()
    })
  }).optional(),

  declarations_and_signatures: z.object({
    employee_declaration: z.object({
      information_correct: z.boolean(),
      no_misleading_information: z.boolean(),
      consent_to_medical_examination: z.boolean(),
      consent_to_information_sharing: z.boolean(),
      employee_name: z.string().min(1, "Employee name is required"),
      employee_signature: z.string().min(1, "Employee signature is required"),
      employee_signature_date: z.string().min(1, "Signature date is required"),
      witness_name: z.string().optional(),
      witness_signature: z.string().optional()
    }),
    health_practitioner: z.object({
      practitioner_name: z.string().optional(),
      practitioner_registration_number: z.string().optional(),
      practitioner_signature: z.string().optional(),
      practitioner_date: z.string().optional(),
      practitioner_comments: z.string().optional(),
      recommendations: z.string().optional(),
      follow_up_required: z.boolean().optional(),
      next_examination_date: z.string().optional()
    }).optional()
  }),

  validation_status: z.object({
    questionnaire_complete: z.boolean(),
    vitals_validated: z.boolean(),
    assessment_complete: z.boolean(),
    ready_for_certificate: z.boolean(),
    validation_errors: z.array(z.string()),
    last_validated_by: z.string().optional(),
    last_validated_at: z.string().optional(),
    completion_percentage: z.number().min(0).max(100).optional(),
    missing_sections: z.array(z.string()).optional()
  }),

  audit_trail: z.object({
    created_by: z.string(),
    created_at: z.string(),
    updated_by: z.string().optional(),
    updated_at: z.string().optional(),
    version_history: z.array(z.object({
      version: z.string(),
      changes: z.string(),
      changed_by: z.string(),
      changed_at: z.string()
    })),
    access_log: z.array(z.object({
      user: z.string(),
      action: z.string(),
      timestamp: z.string()
    }))
  }).optional()
});

// Type inference from the schema
export type Questionnaire = z.infer<typeof questionnaireSchema>;

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

export const periodicHealthSchema = questionnaireSchema.pick({
  periodic_health_history: true
});

export const heightsAssessmentSchema = questionnaireSchema.pick({
  working_at_heights_assessment: true
});

export const returnToWorkSchema = questionnaireSchema.pick({
  return_to_work_surveillance: true
});

export const treatmentHistorySchema = questionnaireSchema.pick({
  medical_treatment_history: true
});

export const lifestyleFactorsSchema = questionnaireSchema.pick({
  lifestyle_factors: true
});

export const declarationsSchema = questionnaireSchema.pick({
  declarations_and_signatures: true
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
    case 'periodic_health':
      return periodicHealthSchema.safeParse(data);
    case 'heights_assessment':
      return heightsAssessmentSchema.safeParse(data);
    case 'return_to_work':
      return returnToWorkSchema.safeParse(data);
    case 'treatment_history':
      return treatmentHistorySchema.safeParse(data);
    case 'lifestyle_factors':
      return lifestyleFactorsSchema.safeParse(data);
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
    examination_type: 'pre_employment',
    examination_date: new Date().toISOString().split('T')[0],
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
      employee_number: '',
      company_name: '',
      employment_type: 'pre_employment',
    },
  },
  medical_history: {
    current_conditions: {
      heart_disease_high_bp: false,
      epilepsy_convulsions: false,
      glaucoma_blindness: false,
      diabetes_endocrine: false,
      kidney_disease: false,
      liver_disease: false,
      mental_health_conditions: false,
      neurological_conditions: false,
      blood_disorders: false,
      cancer_tumors: false,
      autoimmune_conditions: false,
    },
    respiratory_conditions: {
      tuberculosis_pneumonia: false,
      chest_discomfort_palpitations: false,
      asthma_allergies: false,
      chronic_cough: false,
      breathing_difficulties: false,
      lung_disease: false,
    },
    occupational_health: {
      noise_exposure: false,
      heat_exposure: false,
      chemical_exposure: false,
      dust_exposure: false,
      radiation_exposure: false,
      vibration_exposure: false,
      fitness_status: 'fit',
      competitive_sport: false,
      regular_exercise: false,
      previous_occupational_injuries: false,
    },
    medication_history: {
      current_medications: [],
      allergies: [],
    },
    family_history: {
      hereditary_conditions: [],
      cardiovascular_disease: false,
      diabetes: false,
      cancer: false,
      mental_health: false,
    },
  },
  medical_treatment_history: {
    last_two_years: [],
    general_practitioners_ten_years: [],
    hospitalizations: [],
    surgical_history: [],
  },
  declarations_and_signatures: {
    employee_declaration: {
      information_correct: false,
      no_misleading_information: false,
      consent_to_medical_examination: false,
      consent_to_information_sharing: false,
      employee_name: '',
      employee_signature: '',
      employee_signature_date: '',
    },
  },
  validation_status: {
    questionnaire_complete: false,
    vitals_validated: false,
    assessment_complete: false,
    ready_for_certificate: false,
    validation_errors: [],
    completion_percentage: 0,
    missing_sections: [],
  },
};