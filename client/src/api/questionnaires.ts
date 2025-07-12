import api from './api';

// Medical History Section interfaces
export interface MedicalHistoryData {
  current_conditions: {
    heart_disease_high_bp: boolean;
    epilepsy_convulsions: boolean;
    glaucoma_blindness: boolean;
    family_mellitus_diabetes: boolean;
    family_deaths_before_60: boolean;
    bleeding_from_rectum: boolean;
    kidney_stones_blood_urine: boolean;
    sugar_protein_urine: boolean;
    prostate_gynaecological_problems: boolean;
    blood_thyroid_disorder: boolean;
    malignant_tumours_cancer: boolean;
  };
  respiratory_conditions: {
    tuberculosis_pneumonia: boolean;
    chest_discomfort_palpitations: boolean;
    heart_murmur_valve_problem: boolean;
    heartburn_indigestion_hernias: boolean;
    stomach_liver_ulcers: boolean;
  };
  occupational_health: {
    noise_exposure: boolean;
    heat_exposure: boolean;
    fitness_status: 'fit' | 'unfit' | 'fit_with_restrictions';
    competitive_sport: boolean;
    regular_exercise: boolean;
  };
  additional_comments: string;
}

// Working at Heights Assessment interfaces
export interface WorkingAtHeightsData {
  safety_questions: {
    advised_not_work_at_height: boolean;
    serious_occupational_accident: boolean;
    fear_of_heights_enclosed_spaces: boolean;
    fits_seizures_epilepsy_blackouts: boolean;
    suicide_thoughts_attempts: boolean;
    seen_mental_health_professional: boolean;
    thoughts_not_own_messages_spirits: boolean;
    substance_abuse_problem: boolean;
    other_problems_affecting_safety: boolean;
  };
  training_awareness: {
    informed_of_tasks_safety_requirements: boolean;
    chronic_diseases_diabetes_epilepsy: boolean;
  };
  additional_comments: string;
  examiner_notes: string;
}

// Periodic Health History interfaces
export interface PeriodicHealthHistoryData {
  since_last_examination: {
    illness_injury_treatment: string;
    family_history_changes: string;
    occupational_risk_profile_changes: string;
    current_medications: string;
  };
  appearance_comment: string;
}

// Return to Work Surveillance interfaces
export interface ReturnToWorkData {
  health_screening: {
    serious_occupational_accident: boolean;
    accident_description: string;
    chronic_diseases: {
      hypertension: boolean;
      diabetes: boolean;
      epilepsy: boolean;
      asthma: boolean;
      tuberculosis: boolean;
      psycho_social_problems: boolean;
    };
  };
  medication: {
    takes_medication: boolean;
    medication_list: string[];
  };
  symptom_check: {
    fever: boolean;
    cough: boolean;
    sore_throat: boolean;
    shortness_of_breath: boolean;
    isolation_required: boolean;
  };
}

// Medical Treatment History interfaces
export interface MedicalTreatmentHistoryData {
  last_two_years: Array<{
    date: string;
    practitioner_name: string;
    medical_specialty: string;
    diagnosis_reason: string;
  }>;
  general_practitioners_ten_years: Array<{
    name: string;
    contact_details: string;
  }>;
}

// Employee Declaration interfaces
export interface EmployeeDeclarationData {
  employee_declaration: {
    information_correct: boolean;
    no_misleading_information: boolean;
    employee_name: string;
    employee_signature: string;
    employee_signature_date: string;
  };
  health_practitioner: {
    practitioner_name: string;
    practitioner_signature: string;
    practitioner_date: string;
    practitioner_comments: string;
  };
}

export interface QuestionnaireResponse {
  _id: string;
  patient: string;
  examination: string;
  examination_type: 'pre_employment' | 'periodic' | 'exit' | 'return_to_work';
  medical_history?: MedicalHistoryData;
  periodic_health_history?: PeriodicHealthHistoryData;
  working_at_heights_assessment?: WorkingAtHeightsData;
  return_to_work_surveillance?: ReturnToWorkData;
  medical_treatment_history?: MedicalTreatmentHistoryData;
  declarations_and_signatures?: EmployeeDeclarationData;
  completed: boolean;
  completedAt?: string;
  sectionProgress: {
    medical_history: boolean;
    periodic_health_history: boolean;
    working_at_heights_assessment: boolean;
    return_to_work_surveillance: boolean;
    medical_treatment_history: boolean;
    declarations_and_signatures: boolean;
  };
}

// Mock questionnaire data
const mockQuestionnaires = {
  '1': [
    {
      _id: 'quest_001',
      patient: '1',
      examination: 'exam_001',
      examination_type: 'pre_employment',
      medical_history: {
        current_conditions: {
          heart_disease_high_bp: false,
          epilepsy_convulsions: false,
          glaucoma_blindness: false,
          family_mellitus_diabetes: true,
          family_deaths_before_60: false,
          bleeding_from_rectum: false,
          kidney_stones_blood_urine: false,
          sugar_protein_urine: false,
          prostate_gynaecological_problems: false,
          blood_thyroid_disorder: false,
          malignant_tumours_cancer: false,
        },
        respiratory_conditions: {
          tuberculosis_pneumonia: false,
          chest_discomfort_palpitations: false,
          heart_murmur_valve_problem: false,
          heartburn_indigestion_hernias: true,
          stomach_liver_ulcers: false,
        },
        occupational_health: {
          noise_exposure: true,
          heat_exposure: false,
          fitness_status: 'fit',
          competitive_sport: false,
          regular_exercise: true,
        },
        additional_comments: 'Patient reports occasional heartburn, manages with diet changes. Regular gym attendance 3x per week.'
      },
      working_at_heights_assessment: {
        safety_questions: {
          advised_not_work_at_height: false,
          serious_occupational_accident: false,
          fear_of_heights_enclosed_spaces: false,
          fits_seizures_epilepsy_blackouts: false,
          suicide_thoughts_attempts: false,
          seen_mental_health_professional: false,
          thoughts_not_own_messages_spirits: false,
          substance_abuse_problem: false,
          other_problems_affecting_safety: false,
        },
        training_awareness: {
          informed_of_tasks_safety_requirements: true,
          chronic_diseases_diabetes_epilepsy: false,
        },
        additional_comments: 'Employee demonstrates good safety awareness and understanding.',
        examiner_notes: 'Cleared for working at heights. No restrictions noted.'
      },
      medical_treatment_history: {
        last_two_years: [
          {
            date: '2023-08-15',
            practitioner_name: 'Dr. Sarah Mitchell',
            medical_specialty: 'General Practice',
            diagnosis_reason: 'Annual physical examination'
          },
          {
            date: '2023-02-10',
            practitioner_name: 'Dr. James Wilson',
            medical_specialty: 'Gastroenterology',
            diagnosis_reason: 'Heartburn consultation'
          }
        ],
        general_practitioners_ten_years: [
          {
            name: 'Dr. Sarah Mitchell',
            contact_details: 'City Medical Centre, 011-123-4567'
          },
          {
            name: 'Dr. Robert Chen',
            contact_details: 'Westgate Clinic, 011-987-6543'
          }
        ]
      },
      declarations_and_signatures: {
        employee_declaration: {
          information_correct: true,
          no_misleading_information: true,
          employee_name: 'John Doe',
          employee_signature: 'John Doe',
          employee_signature_date: '2024-01-15'
        },
        health_practitioner: {
          practitioner_name: 'Dr. Lisa Anderson',
          practitioner_signature: 'Dr. L. Anderson',
          practitioner_date: '2024-01-15',
          practitioner_comments: 'Employee is fit for employment with no restrictions. Family history of diabetes noted for future monitoring.'
        }
      },
      completed: true,
      completedAt: '2024-01-15T10:30:00Z',
      sectionProgress: {
        medical_history: true,
        periodic_health_history: true,
        working_at_heights_assessment: true,
        return_to_work_surveillance: false,
        medical_treatment_history: true,
        declarations_and_signatures: true,
      }
    },
    {
      _id: 'quest_002',
      patient: '1',
      examination: 'exam_002',
      examination_type: 'periodic',
      periodic_health_history: {
        since_last_examination: {
          illness_injury_treatment: 'Minor cold in December 2023, treated with over-counter medication',
          family_history_changes: 'Father diagnosed with Type 2 diabetes in 2023',
          occupational_risk_profile_changes: 'No changes to job role or workplace hazards',
          current_medications: 'Occasional antacid for heartburn (Gaviscon as needed)'
        },
        appearance_comment: 'Patient appears well, alert and oriented. No signs of distress.'
      },
      completed: true,
      completedAt: '2024-07-02T14:15:00Z',
      sectionProgress: {
        medical_history: true,
        periodic_health_history: true,
        working_at_heights_assessment: false,
        return_to_work_surveillance: false,
        medical_treatment_history: true,
        declarations_and_signatures: true,
      }
    }
  ],
  '2': [
    {
      _id: 'quest_003',
      patient: '2',
      examination: 'exam_003',
      examination_type: 'pre_employment',
      medical_history: {
        current_conditions: {
          heart_disease_high_bp: false,
          epilepsy_convulsions: false,
          glaucoma_blindness: false,
          family_mellitus_diabetes: false,
          family_deaths_before_60: false,
          bleeding_from_rectum: false,
          kidney_stones_blood_urine: false,
          sugar_protein_urine: false,
          prostate_gynaecological_problems: false,
          blood_thyroid_disorder: false,
          malignant_tumours_cancer: false,
        },
        respiratory_conditions: {
          tuberculosis_pneumonia: false,
          chest_discomfort_palpitations: false,
          heart_murmur_valve_problem: false,
          heartburn_indigestion_hernias: false,
          stomach_liver_ulcers: false,
        },
        occupational_health: {
          noise_exposure: false,
          heat_exposure: false,
          fitness_status: 'fit',
          competitive_sport: true,
          regular_exercise: true,
        },
        additional_comments: 'Very active individual, participates in marathon running. Excellent health status.'
      },
      completed: true,
      completedAt: '2024-01-20T09:45:00Z',
      sectionProgress: {
        medical_history: true,
        periodic_health_history: true,
        working_at_heights_assessment: true,
        return_to_work_surveillance: false,
        medical_treatment_history: true,
        declarations_and_signatures: true,
      }
    }
  ]
};

// Get questionnaire by ID
export const getQuestionnaire = async (questionnaireId: string) => {
  // DEVELOPMENT: Return mock data
  if (process.env.NODE_ENV === 'development') {
    console.log("🔍 API DEBUG: Getting questionnaire by ID:", questionnaireId);
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Find questionnaire across all patients
        for (const patientQuests of Object.values(mockQuestionnaires)) {
          const questionnaire = patientQuests.find(q => q._id === questionnaireId);
          if (questionnaire) {
            resolve({ questionnaire });
            return;
          }
        }
        reject(new Error('Questionnaire not found'));
      }, 300);
    });
  }

  try {
    const response = await api.get(`/api/questionnaires/${questionnaireId}`);
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.error || error.message);
  }
};

// Get questionnaire by patient ID
export const getQuestionnaireByPatient = async (patientId: string) => {
  // DEVELOPMENT: Return mock data
  if (process.env.NODE_ENV === 'development') {
    console.log("🔍 API DEBUG: Getting questionnaires for patient:", patientId);
    return new Promise((resolve) => {
      setTimeout(() => {
        const questionnaires = mockQuestionnaires[patientId as keyof typeof mockQuestionnaires] || [];
        resolve({ questionnaires });
      }, 500);
    });
  }

  try {
    const response = await api.get(`/api/questionnaires/patient/${patientId}`);
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.error || error.message);
  }
};

// Create a new questionnaire
export const createQuestionnaire = async (data: {
  patientId: string;
  examinationId: string;
  examinationType: string;
}) => {
  // DEVELOPMENT: Return mock success
  if (process.env.NODE_ENV === 'development') {
    console.log("🔍 API DEBUG: Creating questionnaire:", data);
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          questionnaire: {
            _id: `quest_${Date.now()}`,
            ...data,
            completed: false,
            sectionProgress: {
              medical_history: false,
              periodic_health_history: false,
              working_at_heights_assessment: false,
              return_to_work_surveillance: false,
              medical_treatment_history: false,
              declarations_and_signatures: false,
            }
          }
        });
      }, 500);
    });
  }

  try {
    const response = await api.post('/api/questionnaires/create', data);
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.error || error.message);
  }
};

// Update questionnaire section
export const updateQuestionnaireSection = async (
  questionnaireId: string,
  sectionName: string,
  sectionData: any
) => {
  // DEVELOPMENT: Return mock success
  if (process.env.NODE_ENV === 'development') {
    console.log("🔍 API DEBUG: Updating questionnaire section:", { questionnaireId, sectionName });
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          message: 'Section updated successfully'
        });
      }, 300);
    });
  }

  try {
    const response = await api.put(`/api/questionnaires/${questionnaireId}/section`, {
      sectionName,
      sectionData
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.error || error.message);
  }
};

// Auto-save questionnaire data
export const autoSaveQuestionnaire = async (questionnaireId: string, sectionData: any) => {
  // DEVELOPMENT: Return mock success
  if (process.env.NODE_ENV === 'development') {
    console.log("🔍 API DEBUG: Auto-saving questionnaire:", questionnaireId);
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ success: true });
      }, 200);
    });
  }

  try {
    const response = await api.put(`/api/questionnaires/${questionnaireId}/autosave`, {
      sectionData
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.error || error.message);
  }
};

// Complete questionnaire
export const completeQuestionnaire = async (questionnaireId: string, signature?: string) => {
  // DEVELOPMENT: Return mock success
  if (process.env.NODE_ENV === 'development') {
    console.log("🔍 API DEBUG: Completing questionnaire:", questionnaireId);
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          questionnaire: {
            _id: questionnaireId,
            completed: true,
            completedAt: new Date().toISOString(),
            signature
          }
        });
      }, 500);
    });
  }

  try {
    const response = await api.put(`/api/questionnaires/${questionnaireId}/complete`, { signature });
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.error || error.message);
  }
};

// Enhanced API functions with SA ID validation
export const validateSAID = async (idNumber: string) => {
  // DEVELOPMENT: Return mock validation
  if (process.env.NODE_ENV === 'development') {
    console.log("🔍 API DEBUG: Validating SA ID:", idNumber);
    const { validateAndExtractSAID } = await import('../utils/sa-id-validation');
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const validation = validateAndExtractSAID(idNumber);
        if (validation.isValid) {
          resolve({
            success: true,
            isValid: true,
            data: validation.data
          });
        } else {
          reject(new Error(validation.errors.join(', ')));
        }
      }, 300);
    });
  }

  try {
    const response = await api.post('/api/questionnaires/validate-sa-id', { id_number: idNumber });
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.error || error.message);
  }
};

export const createQuestionnaireWithValidation = async (data: any) => {
  try {
    // Frontend pre-validation
    const idNumber = data.patient_demographics?.personal_info?.id_number;
    if (idNumber) {
      const { validateAndExtractSAID } = await import('../utils/sa-id-validation');
      const validation = validateAndExtractSAID(idNumber);
      if (!validation.isValid) {
        throw new Error(`Invalid SA ID: ${validation.errors.join(', ')}`);
      }
    }

    // DEVELOPMENT: Return mock success
    if (process.env.NODE_ENV === 'development') {
      console.log("🔍 API DEBUG: Creating questionnaire with validation:", data);
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            questionnaire: {
              _id: `quest_${Date.now()}`,
              ...data,
              completed: false,
              sectionProgress: {
                patient_demographics: false,
                medical_history: false,
                periodic_health_history: false,
                working_at_heights_assessment: false,
                return_to_work_surveillance: false,
                medical_treatment_history: false,
                lifestyle_factors: false,
                declarations_and_signatures: false,
              }
            }
          });
        }, 500);
      });
    }

    // Send to backend (includes server-side validation)
    const response = await api.post('/api/questionnaires/create', data);
    return response.data;
  } catch (error: any) {
    // Handle validation errors specifically
    if (error.response?.status === 400 && error.response?.data?.field?.includes('id_number')) {
      throw new Error(`SA ID Validation Error: ${error.response.data.details.join ? error.response.data.details.join(', ') : error.response.data.details}`);
    }
    throw new Error(error?.response?.data?.error || error.message);
  }
};

export const updateQuestionnaireWithValidation = async (questionnaireId: string, sectionName: string, sectionData: any) => {
  try {
    // DEVELOPMENT: Return mock success
    if (process.env.NODE_ENV === 'development') {
      console.log("🔍 API DEBUG: Updating questionnaire section with validation:", { questionnaireId, sectionName });
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            success: true,
            message: 'Section updated successfully',
            questionnaire: { _id: questionnaireId, [sectionName]: sectionData },
            completionPercentage: Math.floor(Math.random() * 100)
          });
        }, 300);
      });
    }

    const response = await api.put(`/api/questionnaires/${questionnaireId}/section`, {
      sectionName,
      sectionData
    });
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 400 && error.response?.data?.field === 'patient_demographics') {
      throw new Error(`Validation Error: ${error.response.data.details.join ? error.response.data.details.join(', ') : error.response.data.details}`);
    }
    throw new Error(error?.response?.data?.error || error.message);
  }
};

// Add this function to your existing questionnaires.ts file:
export const submitCompleteQuestionnaire = async (data: any) => {
  try {
    console.log("🔍 API DEBUG: Submitting complete questionnaire:", data);
    
    // DEVELOPMENT: Return mock success for now
    if (process.env.NODE_ENV === 'development') {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            success: true,
            message: 'Questionnaire submitted successfully',
            questionnaireId: `quest_${Date.now()}`,
            patientId: data.patient_id,
            nextStation: 'vitals',
            medicalAlerts: [],
            requiresReview: false
          });
        }, 1000);
      });
    }

    // Production API call
    const response = await api.post('/api/questionnaires/submit', data);
    return response.data;
  } catch (error: any) {
    console.error('Questionnaire submission error:', error);
    throw new Error(error?.response?.data?.message || error.message || 'Failed to submit questionnaire');
  }
};

// Alias for backwards compatibility
export const getPatientQuestionnaire = getQuestionnaireByPatient;