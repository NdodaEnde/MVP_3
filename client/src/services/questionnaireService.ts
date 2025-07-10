import { Questionnaire } from '@/schemas/questionnaire-schema';

export interface QuestionnaireSubmissionResult {
  success: boolean;
  questionnaireId?: string;
  patientId?: string;
  nextStation?: string;
  medicalAlerts?: string[];
  message: string;
}

export interface QuestionnaireValidationResult {
  isValid: boolean;
  completionPercentage: number;
  criticalIssues: string[];
  warnings: string[];
  recommendations: string[];
  requiresReview: boolean;
  sectionStatus: Record<string, 'complete' | 'incomplete' | 'warning'>;
}

class QuestionnaireService {
  private baseUrl = '/api/questionnaires';

  // Submit completed questionnaire
  async submitQuestionnaire(data: Questionnaire): Promise<QuestionnaireSubmissionResult> {
    try {
      console.log('📤 QuestionnaireService: Submitting questionnaire', { 
        hasPatientId: !!(data as any).patient_id,
        dataKeys: Object.keys(data)
      });

      // 🔧 FIX: Add patient_id validation
      if (!(data as any).patient_id) {
        console.error('❌ No patient_id in submission data');
        return {
          success: false,
          message: 'Patient ID is required for questionnaire submission'
        };
      }

      const response = await fetch(`${this.baseUrl}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ HTTP Error:', response.status, errorText);
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Questionnaire submission successful:', result);
      return result;
    } catch (error) {
      console.error('❌ Error submitting questionnaire:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to submit questionnaire. Please try again.',
      };
    }
  }

  // Save questionnaire draft
  async saveDraft(data: Partial<Questionnaire>): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/draft`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return { success: true, message: 'Draft saved successfully' };
    } catch (error) {
      console.error('Error saving draft:', error);
      return { success: false, message: 'Failed to save draft' };
    }
  }

  // Load existing questionnaire
  async loadQuestionnaire(questionnaireId: string): Promise<Questionnaire | null> {
    try {
      const response = await fetch(`${this.baseUrl}/${questionnaireId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error loading questionnaire:', error);
      return null;
    }
  }

  // Validate questionnaire completeness and business rules
  validateQuestionnaire(data: any, examinationType: string): QuestionnaireValidationResult {
    const result: QuestionnaireValidationResult = {
      isValid: true,
      completionPercentage: 0,
      criticalIssues: [],
      warnings: [],
      recommendations: [],
      requiresReview: false,
      sectionStatus: {}
    };

    // Validate Demographics Section
    const demographicsStatus = this.validateDemographics(data.patient_demographics);
    result.sectionStatus.demographics = demographicsStatus.isComplete ? 'complete' : 'incomplete';
    if (!demographicsStatus.isComplete) {
      result.criticalIssues.push(...demographicsStatus.issues);
    }

    // Validate Medical History Section
    const medicalStatus = this.validateMedicalHistory(data.medical_history, examinationType);
    result.sectionStatus.medical_history = medicalStatus.isComplete ? 'complete' : 'incomplete';
    result.warnings.push(...medicalStatus.warnings);
    result.recommendations.push(...medicalStatus.recommendations);

    if (medicalStatus.requiresReview) {
      result.requiresReview = true;
      result.sectionStatus.medical_history = 'warning';
    }

    // Validate Examination-Specific Sections
    if (examinationType === 'working_at_heights') {
      const heightsStatus = this.validateWorkingAtHeights(data.working_at_heights_assessment);
      result.sectionStatus.heights_assessment = heightsStatus.isComplete ? 'complete' : 'incomplete';
      result.warnings.push(...heightsStatus.warnings);
      
      if (heightsStatus.requiresReview) {
        result.requiresReview = true;
        result.sectionStatus.heights_assessment = 'warning';
      }
    }

    if (examinationType === 'periodic') {
      const periodicStatus = this.validatePeriodicHealth(data.periodic_health_history);
      result.sectionStatus.periodic_health = periodicStatus.isComplete ? 'complete' : 'incomplete';
    }

    if (examinationType === 'return_to_work') {
      const returnToWorkStatus = this.validateReturnToWork(data.return_to_work_surveillance);
      result.sectionStatus.return_to_work = returnToWorkStatus.isComplete ? 'complete' : 'incomplete';
    }

    // Validate Lifestyle Factors
    const lifestyleStatus = this.validateLifestyleFactors(data.lifestyle_factors);
    result.sectionStatus.lifestyle_factors = lifestyleStatus.isComplete ? 'complete' : 'incomplete';

    // Validate Declarations Section
    const declarationsStatus = this.validateDeclarations(data.declarations_and_signatures);
    result.sectionStatus.declarations = declarationsStatus.isComplete ? 'complete' : 'incomplete';
    if (!declarationsStatus.isComplete) {
      result.criticalIssues.push(...declarationsStatus.issues);
    }

    // Calculate overall completion percentage
    result.completionPercentage = this.calculateCompletionPercentage(data, examinationType);
    
    // Overall validity
    result.isValid = result.criticalIssues.length === 0 && result.completionPercentage === 100;

    return result;
  }

  private validateDemographics(demographics: any): { isComplete: boolean; issues: string[] } {
    const issues: string[] = [];
    
    if (!demographics?.personal_info) {
      issues.push('Personal information is required');
      return { isComplete: false, issues };
    }

    const personal = demographics.personal_info;
    
    if (!personal.id_number || !this.validateSAID(personal.id_number)) {
      issues.push('Valid South African ID number is required');
    }
    
    if (!personal.first_names?.trim()) {
      issues.push('First names are required');
    }
    
    if (!personal.surname?.trim()) {
      issues.push('Surname is required');
    }
    
    if (!personal.marital_status) {
      issues.push('Marital status is required');
    }

    if (!demographics.employment_info?.position?.trim()) {
      issues.push('Employment position is required');
    }

    if (!demographics.employment_info?.company_name?.trim()) {
      issues.push('Company name is required');
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
      return { isComplete: false, warnings, recommendations, requiresReview: false };
    }

    // Check for high-risk conditions
    const currentConditions = medicalHistory.current_conditions || {};
    
    if (currentConditions.heart_disease_high_bp) {
      warnings.push('Patient has history of heart disease or high blood pressure');
      recommendations.push('Recommend cardiovascular assessment');
      requiresReview = true;
    }

    if (currentConditions.epilepsy_convulsions) {
      warnings.push('Patient has history of epilepsy or convulsions');
      if (examinationType === 'working_at_heights') {
        warnings.push('CRITICAL: Epilepsy history incompatible with working at heights');
        requiresReview = true;
      }
    }

    if (currentConditions.diabetes_endocrine) {
      warnings.push('Patient has diabetes or endocrine disorders');
      recommendations.push('Monitor blood glucose levels regularly');
    }

    if (currentConditions.mental_health_conditions) {
      warnings.push('Patient has mental health conditions');
      recommendations.push('Consider psychological fitness assessment');
      if (examinationType === 'working_at_heights') {
        requiresReview = true;
      }
    }

    // Check respiratory conditions for specific work types
    const respiratoryConditions = medicalHistory.respiratory_conditions || {};
    
    if (respiratoryConditions.tuberculosis_pneumonia) {
      warnings.push('Patient has history of tuberculosis or pneumonia');
      recommendations.push('Chest X-ray and lung function testing recommended');
      requiresReview = true;
    }

    if (respiratoryConditions.asthma_allergies) {
      warnings.push('Patient has asthma or severe allergies');
      recommendations.push('Consider work environment allergen assessment');
    }

    // Check occupational health factors
    const occupationalHealth = medicalHistory.occupational_health || {};
    
    if (occupationalHealth.previous_occupational_injuries) {
      warnings.push('Patient has history of occupational injuries');
      recommendations.push('Review previous injury details and current fitness');
    }

    return {
      isComplete: true, // Medical history validation is more about alerts than completion
      warnings,
      recommendations,
      requiresReview
    };
  }

  private validateWorkingAtHeights(heightsAssessment: any): {
    isComplete: boolean;
    warnings: string[];
    requiresReview: boolean;
  } {
    const warnings: string[] = [];
    let requiresReview = false;

    if (!heightsAssessment) {
      return { isComplete: false, warnings, requiresReview: false };
    }

    // Check critical height-related safety questions
    if (heightsAssessment.q1_advised_not_work_height === true) {
      warnings.push('CRITICAL: Patient previously advised not to work at heights');
      requiresReview = true;
    }

    if (heightsAssessment.q3_fear_heights_spaces === true) {
      warnings.push('Patient reports fear of heights or enclosed spaces');
      requiresReview = true;
    }

    if (heightsAssessment.q4_fits_seizures === true) {
      warnings.push('CRITICAL: Patient has history of fits or seizures - HEIGHT WORK CONTRAINDICATED');
      requiresReview = true;
    }

    if (heightsAssessment.q5_suicide_thoughts === true) {
      warnings.push('URGENT: Patient reports thoughts of self-harm - IMMEDIATE MENTAL HEALTH REFERRAL');
      requiresReview = true;
    }

    if (heightsAssessment.q6_mental_health_professional === true) {
      warnings.push('Patient is currently seeing a mental health professional');
      requiresReview = true;
    }

    if (heightsAssessment.q7_thoughts_spirits === true) {
      warnings.push('URGENT: Patient reports hearing voices or seeing things - IMMEDIATE PSYCHIATRIC REFERRAL');
      requiresReview = true;
    }

    if (heightsAssessment.q8_substance_abuse === true) {
      warnings.push('Patient reports regular alcohol/drug use - may affect work safety');
      requiresReview = true;
    }

    if (heightsAssessment.q9_other_problems === true) {
      warnings.push('Patient reports other medical problems - review required');
      requiresReview = true;
    }

    // Check if all required questions are answered
    const requiredQuestions = [
      'q1_advised_not_work_height', 'q2_serious_accident', 'q3_fear_heights_spaces',
      'q4_fits_seizures', 'q5_suicide_thoughts', 'q6_mental_health_professional',
      'q7_thoughts_spirits', 'q8_substance_abuse', 'q9_other_problems',
      'q10_informed_tasks', 'q11_chronic_diseases'
    ];

    const unansweredQuestions = requiredQuestions.filter(q => 
      heightsAssessment[q] === null || heightsAssessment[q] === undefined
    );

    const isComplete = unansweredQuestions.length === 0;

    return { isComplete, warnings, requiresReview };
  }

  private validatePeriodicHealth(periodicData: any): { isComplete: boolean } {
    if (!periodicData) {
      return { isComplete: false };
    }
    
    // Check if any required periodic health fields are filled
    const hasHealthChanges = periodicData.health_changes_since_last_exam?.trim();
    const hasMedicationInfo = periodicData.current_medications?.trim();
    
    return { 
      isComplete: !!(hasHealthChanges || hasMedicationInfo) 
    };
  }

  private validateReturnToWork(returnToWorkData: any): { isComplete: boolean } {
    if (!returnToWorkData) {
      return { isComplete: false };
    }
    
    // Check if required return to work fields are filled
    const hasAbsenceReason = returnToWorkData.absence_reason?.trim();
    const hasFitnessLevel = returnToWorkData.current_fitness_level?.trim();
    
    return { 
      isComplete: !!(hasAbsenceReason || hasFitnessLevel) 
    };
  }

  private validateLifestyleFactors(lifestyleData: any): { isComplete: boolean } {
    if (!lifestyleData) {
      return { isComplete: true }; // Optional section
    }
    
    // Lifestyle factors are generally optional, mark as complete if any data exists
    return { isComplete: true };
  }

  private validateDeclarations(declarations: any): { isComplete: boolean; issues: string[] } {
    const issues: string[] = [];

    if (!declarations?.employee_declaration) {
      issues.push('Employee declaration is required');
      return { isComplete: false, issues };
    }

    const empDeclaration = declarations.employee_declaration;

    if (!empDeclaration.information_correct) {
      issues.push('You must confirm that the information provided is correct');
    }

    if (!empDeclaration.no_misleading_information) {
      issues.push('You must confirm that no misleading information was provided');
    }

    if (!empDeclaration.consent_to_medical_examination) {
      issues.push('Consent to medical examination is required');
    }

    if (!empDeclaration.employee_name?.trim()) {
      issues.push('Employee name is required');
    }

    if (!empDeclaration.employee_signature) {
      issues.push('Employee signature is required');
    }

    return { isComplete: issues.length === 0, issues };
  }

  private calculateCompletionPercentage(data: any, examinationType: string): number {
    let score = 0;
    const maxScore = 100;

    // Demographics (25 points)
    const demographicsStatus = this.validateDemographics(data.patient_demographics);
    if (demographicsStatus.isComplete) {
      score += 25;
    }

    // Medical History (25 points) 
    if (data.medical_history && Object.keys(data.medical_history).length > 0) {
      score += 25;
    }

    // Examination-specific sections (25 points)
    if (examinationType === 'working_at_heights') {
      const heightsStatus = this.validateWorkingAtHeights(data.working_at_heights_assessment);
      if (heightsStatus.isComplete) score += 25;
    } else if (examinationType === 'periodic') {
      const periodicStatus = this.validatePeriodicHealth(data.periodic_health_history);
      if (periodicStatus.isComplete) score += 25;
    } else if (examinationType === 'return_to_work') {
      const returnStatus = this.validateReturnToWork(data.return_to_work_surveillance);
      if (returnStatus.isComplete) score += 25;
    } else {
      // For pre_employment and exit, no additional sections required
      score += 25;
    }

    // Declarations and Signatures (25 points)
    const declarationsStatus = this.validateDeclarations(data.declarations_and_signatures);
    if (declarationsStatus.isComplete) {
      score += 25;
    }

    return Math.min(score, maxScore);
  }

  private validateSAID(idNumber: string): boolean {
    if (!idNumber || idNumber.length !== 13) return false;
    
    // 🔧 FIX: Use the same Luhn algorithm as sa-id-validation.ts
    const digits = idNumber.split('').map(Number);
    let sum = 0;
    
    // Process first 12 digits
    for (let i = 0; i < 12; i++) {
      let digit = digits[i];
      
      // Double every second digit from the right (matching sa-id-validation.ts)
      if ((12 - i) % 2 === 0) {
        digit *= 2;
        if (digit > 9) {
          digit = Math.floor(digit / 10) + (digit % 10);
        }
      }
      
      sum += digit;
    }
    
    const checksum = (10 - (sum % 10)) % 10;
    return checksum === digits[12];
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
    }, 3000); // Auto-save after 3 seconds of inactivity

    this.autoSaveTimers.set(questionnaireId, timer);
  }

  clearAutoSave(questionnaireId: string) {
    if (this.autoSaveTimers.has(questionnaireId)) {
      clearTimeout(this.autoSaveTimers.get(questionnaireId)!);
      this.autoSaveTimers.delete(questionnaireId);
    }
  }

  // Utility method to extract SA ID information
  extractSAIDInfo(idNumber: string) {
    // 🔧 TEMPORARY DEBUG: Skip validateSAID to test if this is the issue
    if (!idNumber || idNumber.length !== 13) {
      return null;
    }

    const year = idNumber.substring(0, 2);
    const month = idNumber.substring(2, 4);
    const day = idNumber.substring(4, 6);
    const genderDigit = parseInt(idNumber.substring(6, 10));
    const citizenshipDigit = parseInt(idNumber.substring(10, 11));

    const currentYear = new Date().getFullYear();
    const fullBirthYear = parseInt(year) <= (currentYear - 2000) ? 2000 + parseInt(year) : 1900 + parseInt(year);
    
    const dateOfBirth = `${fullBirthYear}-${month}-${day}`;
    const age = currentYear - fullBirthYear;
    const gender = genderDigit < 5000 ? 'female' : 'male';
    const citizenship = citizenshipDigit === 0 ? 'south_african' : 'foreign';

    return {
      dateOfBirth,
      age,
      gender,
      citizenship,
      isValid: true
    };
  }

  // 🔧 NEW: Helper method for patient ID submissions
  async submitQuestionnaireWithPatientId(patientId: string, data: any): Promise<QuestionnaireSubmissionResult> {
    try {
      console.log('📤 Submitting questionnaire with patient ID:', patientId);
      
      // Ensure the data has the patient_id field that your backend expects
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

  // 🔧 NEW: Convenience method for forms
  async submitCompleteQuestionnaire(data: any): Promise<QuestionnaireSubmissionResult> {
    // This method bridges the gap between your form data and the service
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

// 🔧 NEW: Export convenience function for your forms
export const submitCompleteQuestionnaire = (data: any) => {
  return questionnaireService.submitCompleteQuestionnaire(data);
};