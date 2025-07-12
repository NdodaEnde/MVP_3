// 🔧 FIXED: QuestionnaireService - Removed require() calls for browser compatibility

import { validateAndExtractSAID } from '../utils/sa-id-validation';

export interface QuestionnaireValidationResult {
  isValid: boolean;
  isComplete: boolean;
  completionPercentage: number;
  sectionStatus: {
    [key: string]: 'complete' | 'incomplete' | 'invalid';
  };
  criticalIssues: string[];
  warnings: string[];
  recommendations: string[];
  medicalRiskLevel: 'low' | 'medium' | 'high' | 'critical';
  requiresReview: boolean;
  canSubmit: boolean;
}

export interface QuestionnaireSubmissionResult {
  success: boolean;
  message?: string;
  questionnaire?: any;
  validationErrors?: string[];
}

export interface Questionnaire {
  _id?: string;
  patient_id: string;
  examination_type: string;
  patient_demographics?: any;
  medical_history?: any;
  periodic_health_history?: any;
  working_at_heights_assessment?: any;
  return_to_work_surveillance?: any;
  medical_treatment_history?: any;
  lifestyle_factors?: any;
  declarations_and_signatures?: any;
  completed?: boolean;
  completed_at?: string;
  metadata?: any;
}

class QuestionnaireService {
  private baseUrl = '/api/questionnaires';

  // 🔧 FIXED: validateSAID method without require()
  private validateSAID(idNumber: string): boolean {
    try {
      if (!idNumber || idNumber.length !== 13) {
        return false;
      }

      // Use the imported validation function directly
      const validation = validateAndExtractSAID(idNumber);
      return validation.isValid;
    } catch (error) {
      console.error('SA ID validation error:', error);
      return false;
    }
  }

  // Main validation method
  validateQuestionnaire(data: any, examinationType: string): QuestionnaireValidationResult {
    const result: QuestionnaireValidationResult = {
      isValid: false,
      isComplete: false,
      completionPercentage: 0,
      sectionStatus: {},
      criticalIssues: [],
      warnings: [],
      recommendations: [],
      medicalRiskLevel: 'low',
      requiresReview: false,
      canSubmit: false
    };

    try {
      // Validate Demographics
      const demographicsResult = this.validateDemographics(data.patient_demographics);
      result.sectionStatus.demographics = demographicsResult.isComplete ? 'complete' : 'incomplete';
      if (!demographicsResult.isComplete) {
        result.criticalIssues.push(...demographicsResult.issues);
      }

      // Validate Medical History
      const medicalHistoryResult = this.validateMedicalHistory(data.medical_history, examinationType);
      result.sectionStatus.medical_history = medicalHistoryResult.isComplete ? 'complete' : 'incomplete';
      if (medicalHistoryResult.warnings) {
        result.warnings.push(...medicalHistoryResult.warnings);
      }
      if (medicalHistoryResult.requiresReview) {
        result.requiresReview = true;
      }

      // Validate examination-specific sections
      if (examinationType === 'periodic' && data.periodic_health_history) {
        const periodicStatus = this.validatePeriodicHealthHistory(data.periodic_health_history);
        result.sectionStatus.periodic_health_history = periodicStatus.isComplete ? 'complete' : 'incomplete';
      }

      if (examinationType === 'working_at_heights' && data.working_at_heights_assessment) {
        const heightsStatus = this.validateWorkingAtHeights(data.working_at_heights_assessment);
        result.sectionStatus.working_at_heights_assessment = heightsStatus.isComplete ? 'complete' : 'incomplete';
      }

      if (examinationType === 'return_to_work' && data.return_to_work_surveillance) {
        const returnToWorkStatus = this.validateReturnToWork(data.return_to_work_surveillance);
        result.sectionStatus.return_to_work = returnToWorkStatus.isComplete ? 'complete' : 'incomplete';
      }

      // Validate Declarations Section
      const declarationsStatus = this.validateDeclarations(data.declarations_and_signatures);
      result.sectionStatus.declarations = declarationsStatus.isComplete ? 'complete' : 'incomplete';
      if (!declarationsStatus.isComplete) {
        result.criticalIssues.push(...declarationsStatus.issues);
      }

      // Calculate completion percentage
      result.completionPercentage = this.calculateCompletionPercentage(data, examinationType);
      
      // Overall validity
      result.isValid = result.criticalIssues.length === 0;
      result.isComplete = result.completionPercentage >= 95;
      result.canSubmit = result.isComplete && result.criticalIssues.length === 0;

      return result;
    } catch (error) {
      console.error('Error validating questionnaire:', error);
      result.criticalIssues.push('Validation error occurred');
      return result;
    }
  }

  private validateDemographics(demographics: any): { isComplete: boolean; issues: string[] } {
    const issues: string[] = [];
    
    if (!demographics?.personal_info) {
      issues.push('Personal information is required');
      return { isComplete: false, issues };
    }

    const personal = demographics.personal_info;
    
    // 🔧 FIXED: Direct SA ID validation without require()
    if (!personal.id_number) {
      issues.push('South African ID number is required');
    } else if (!this.validateSAID(personal.id_number)) {
      issues.push('Valid South African ID number is required');
    }
    
    if (!personal.first_names?.trim()) {
      issues.push('First names are required');
    }
    
    if (!personal.surname?.trim()) {
      issues.push('Surname is required');
    }

    if (!demographics.employment_info?.position?.trim()) {
      issues.push('Employment position is required');
    }

    if (!demographics.declarations_and_signatures?.employee_name?.trim()) {
      issues.push('Employee name is required');
    }

    if (!demographics.declarations_and_signatures?.employee_signature?.trim()) {
      issues.push('Employee signature is required');
    }

    if (!demographics.declarations_and_signatures?.information_correct) {
      issues.push('You must confirm that the information provided is correct');
    }

    if (!demographics.declarations_and_signatures?.no_misleading_information) {
      issues.push('You must confirm that no misleading information was provided');
    }

    if (!demographics.declarations_and_signatures?.consent_to_medical_examination) {
      issues.push('Consent to medical examination is required');
    }

    return { isComplete: issues.length === 0, issues };
  }

  private validateMedicalHistory(medicalHistory: any, examinationType: string): {
    isComplete: boolean;
    warnings: string[];
    recommendations: string[];
    requiresReview: boolean;
  } {
    const warnings: string[] = [];
    const recommendations: string[] = [];
    let requiresReview = false;

    if (!medicalHistory) {
      return { isComplete: false, warnings: [], recommendations: [], requiresReview: false };
    }

    // Check for high-risk conditions
    if (medicalHistory.current_conditions) {
      if (medicalHistory.current_conditions.heart_disease_high_bp) {
        warnings.push('Heart disease/high blood pressure detected');
        requiresReview = true;
      }
      if (medicalHistory.current_conditions.epilepsy_convulsions) {
        warnings.push('Epilepsy/convulsions detected');
        requiresReview = true;
      }
      if (medicalHistory.current_conditions.diabetes_endocrine) {
        warnings.push('Diabetes/endocrine condition detected');
        requiresReview = true;
      }
    }

    return { isComplete: true, warnings, recommendations, requiresReview };
  }

  private validatePeriodicHealthHistory(periodicHistory: any): { isComplete: boolean; issues: string[] } {
    if (!periodicHistory) {
      return { isComplete: false, issues: ['Periodic health history is required'] };
    }
    return { isComplete: true, issues: [] };
  }

  private validateWorkingAtHeights(heightsAssessment: any): { isComplete: boolean; issues: string[] } {
    if (!heightsAssessment) {
      return { isComplete: false, issues: ['Working at heights assessment is required'] };
    }
    return { isComplete: true, issues: [] };
  }

  private validateReturnToWork(returnToWork: any): { isComplete: boolean; issues: string[] } {
    if (!returnToWork) {
      return { isComplete: false, issues: ['Return to work surveillance is required'] };
    }
    return { isComplete: true, issues: [] };
  }

  private validateDeclarations(declarations: any): { isComplete: boolean; issues: string[] } {
    const issues: string[] = [];

    if (!declarations) {
      issues.push('Declarations and signatures section is required');
      return { isComplete: false, issues };
    }

    if (!declarations.employee_name?.trim()) {
      issues.push('Employee name is required');
    }

    if (!declarations.employee_signature?.trim()) {
      issues.push('Employee signature is required');
    }

    if (!declarations.information_correct) {
      issues.push('You must confirm that the information provided is correct');
    }

    if (!declarations.no_misleading_information) {
      issues.push('You must confirm that no misleading information was provided');
    }

    if (!declarations.consent_to_medical_examination) {
      issues.push('Consent to medical examination is required');
    }

    return { isComplete: issues.length === 0, issues };
  }

  private calculateCompletionPercentage(data: any, examinationType: string): number {
    let completedSections = 0;
    let totalSections = 4; // Base sections: demographics, medical_history, declarations, one examination-specific

    // Check demographics
    if (this.validateDemographics(data.patient_demographics).isComplete) {
      completedSections++;
    }

    // Check medical history
    if (data.medical_history && Object.keys(data.medical_history).length > 0) {
      completedSections++;
    }

    // Check examination-specific section
    if (examinationType === 'periodic' && data.periodic_health_history) {
      completedSections++;
    } else if (examinationType === 'working_at_heights' && data.working_at_heights_assessment) {
      completedSections++;
    } else if (examinationType === 'return_to_work' && data.return_to_work_surveillance) {
      completedSections++;
    } else {
      completedSections++; // For pre-employment, no additional section required
    }

    // Check declarations
    if (this.validateDeclarations(data.declarations_and_signatures).isComplete) {
      completedSections++;
    }

    return Math.round((completedSections / totalSections) * 100);
  }

  // 🔧 FIXED: extractSAIDInfo method without require()
  extractSAIDInfo(idNumber: string) {
    try {
      if (!idNumber || idNumber.length !== 13) {
        return null;
      }

      // Use the imported validation function
      const validation = validateAndExtractSAID(idNumber);
      
      if (validation.isValid && validation.data) {
        return {
          dateOfBirth: validation.data.dateOfBirth,
          age: validation.data.age,
          gender: validation.data.gender,
          citizenship: validation.data.citizenship,
          isValid: true
        };
      }

      return null;
    } catch (error) {
      console.error('Error extracting SA ID info:', error);
      return null;
    }
  }

  // Auto-save functionality
  private autoSaveTimers = new Map<string, NodeJS.Timeout>();

  setupAutoSave(questionnaireId: string, getData: () => any, onSave: (data: any) => void) {
    // Clear existing timer
    if (this.autoSaveTimers.has(questionnaireId)) {
      clearTimeout(this.autoSaveTimers.get(questionnaireId)!);
    }

    // Set new timer
    const timer = setTimeout(async () => {
      const data = getData();
      if (data && Object.keys(data).length > 0) {
        try {
          await this.saveDraft(data);
          onSave(data);
        } catch (error) {
          console.error('Auto-save failed:', error);
        }
      }
    }, 3000);

    this.autoSaveTimers.set(questionnaireId, timer);
  }

  clearAutoSave(questionnaireId: string) {
    if (this.autoSaveTimers.has(questionnaireId)) {
      clearTimeout(this.autoSaveTimers.get(questionnaireId)!);
      this.autoSaveTimers.delete(questionnaireId);
    }
  }

  // API methods
  async submitQuestionnaire(questionnaire: Questionnaire): Promise<QuestionnaireSubmissionResult> {
    try {
      console.log('📤 Submitting questionnaire:', questionnaire);

      // Development mode - return mock success
      if (process.env.NODE_ENV === 'development') {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              success: true,
              message: 'Questionnaire submitted successfully',
              questionnaire: {
                ...questionnaire,
                _id: `quest_${Date.now()}`,
                completed: true,
                completed_at: new Date().toISOString()
              }
            });
          }, 1000);
        });
      }

      // Production API call would go here
      const response = await fetch(`${this.baseUrl}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(questionnaire),
      });

      if (!response.ok) {
        throw new Error(`Submission failed: ${response.statusText}`);
      }

      const result = await response.json();
      return {
        success: true,
        message: 'Questionnaire submitted successfully',
        questionnaire: result.questionnaire
      };

    } catch (error) {
      console.error('❌ Error submitting questionnaire:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Submission failed'
      };
    }
  }

  async saveDraft(data: any): Promise<void> {
    try {
      // Save to localStorage as backup
      localStorage.setItem('questionnaire_draft', JSON.stringify({
        data,
        timestamp: new Date().toISOString()
      }));

      console.log('💾 Draft saved to localStorage');
    } catch (error) {
      console.error('❌ Error saving draft:', error);
    }
  }

  async submitQuestionnaireWithPatientId(patientId: string, data: any): Promise<QuestionnaireSubmissionResult> {
    try {
      console.log('📤 Submitting questionnaire with patient ID:', patientId);
      
      const submissionData = {
        ...data,
        patient_id: patientId,
        metadata: {
          ...data.metadata,
          submission_timestamp: new Date().toISOString(),
          submitted_online: navigator.onLine,
        }
      };

      return await this.submitQuestionnaire(submissionData as Questionnaire);
    } catch (error) {
      console.error('❌ Error in submitQuestionnaireWithPatientId:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Submission failed'
      };
    }
  }

  async submitCompleteQuestionnaire(data: any): Promise<QuestionnaireSubmissionResult> {
    const patientId = data.patient_id;
    
    if (!patientId) {
      console.error('❌ No patient_id provided to submitCompleteQuestionnaire');
      return {
        success: false,
        message: 'Patient ID is required'
      };
    }

    return await this.submitQuestionnaireWithPatientId(patientId, data);
  }
}

export const questionnaireService = new QuestionnaireService();

// Export convenience function for forms
export const submitCompleteQuestionnaire = (data: any) => {
  return questionnaireService.submitCompleteQuestionnaire(data);
};