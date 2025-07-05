// utils/questionnaire-integration.ts
import { validateAndExtractSAID } from './sa-id-validation';
import { validateMedicalHistory, MedicalValidationResult } from './medical-validation';
import { ExaminationType } from './examination-types';

export interface QuestionnaireValidationResult {
  isValid: boolean;
  isComplete: boolean;
  completionPercentage: number;
  sectionStatus: {
    demographics: 'complete' | 'incomplete' | 'invalid';
    medical_history: 'complete' | 'incomplete' | 'invalid';
    periodic_health_history?: 'complete' | 'incomplete' | 'invalid';
    working_at_heights_assessment?: 'complete' | 'incomplete' | 'invalid';
    return_to_work_surveillance?: 'complete' | 'incomplete' | 'invalid';
    declarations_and_signatures: 'complete' | 'incomplete' | 'invalid';
  };
  criticalIssues: string[];
  warnings: string[];
  recommendations: string[];
  medicalRiskLevel: 'low' | 'medium' | 'high' | 'critical';
  requiresReview: boolean;
  canSubmit: boolean;
}

export interface QuestionnaireSubmissionData {
  questionnaire: any;
  validationResult: QuestionnaireValidationResult;
  medicalAlerts: any[];
  recommendedFollowUp: {
    interval: string;
    reason: string;
  };
  submissionMetadata: {
    submittedAt: string;
    submittedBy: string;
    ipAddress?: string;
    userAgent?: string;
    completionTime: number;
  };
}

/**
 * Comprehensive questionnaire validation
 */
export function validateCompleteQuestionnaire(
  formData: any,
  examinationType: ExaminationType,
  startTime?: Date
): QuestionnaireValidationResult {
  const criticalIssues: string[] = [];
  const warnings: string[] = [];
  const recommendations: string[] = [];
  let requiresReview = false;

  // Validate Demographics Section
  const demographicsStatus = validateDemographics(formData.patient_demographics);
  if (demographicsStatus.issues.length > 0) {
    criticalIssues.push(...demographicsStatus.issues);
  }

  // Validate Medical History Section
  const medicalValidation = validateMedicalHistory(
    formData.medical_history,
    examinationType,
    {
      position: formData.patient_demographics?.employment_info?.position,
      company: formData.patient_demographics?.employment_info?.company_name
    }
  );

  if (!medicalValidation.isValid) {
    criticalIssues.push('Medical history contains critical issues requiring review');
    requiresReview = true;
  }

  warnings.push(...medicalValidation.alerts.filter(a => a.type === 'warning').map(a => a.message));
  recommendations.push(...medicalValidation.recommendations);

  // Validate Examination-Specific Sections
  const specificSectionStatus = validateExaminationSpecificSections(formData, examinationType);
  criticalIssues.push(...specificSectionStatus.criticalIssues);
  warnings.push(...specificSectionStatus.warnings);

  // Validate Declarations Section
  const declarationsStatus = validateDeclarations(formData.declarations_and_signatures);
  if (!declarationsStatus.isValid) {
    criticalIssues.push(...declarationsStatus.issues);
  }

  // Calculate completion percentage
  const completionPercentage = calculateCompletionPercentage(formData, examinationType);

  // Determine section statuses
  const sectionStatus = {
    demographics: demographicsStatus.isValid ? 'complete' : 'incomplete',
    medical_history: medicalValidation.completionScore > 80 ? 'complete' : 'incomplete',
    declarations_and_signatures: declarationsStatus.isValid ? 'complete' : 'incomplete',
    ...(examinationType === 'periodic' && {
      periodic_health_history: validatePeriodicSection(formData.periodic_health_history) ? 'complete' : 'incomplete'
    }),
    ...(examinationType === 'working_at_heights' && {
      working_at_heights_assessment: validateHeightsSection(formData.working_at_heights_assessment) ? 'complete' : 'incomplete'
    }),
    ...(examinationType === 'return_to_work' && {
      return_to_work_surveillance: validateReturnToWorkSection(formData.return_to_work_surveillance) ? 'complete' : 'incomplete'
    })
  } as QuestionnaireValidationResult['sectionStatus'];

  // Final validation
  const isComplete = completionPercentage >= 95 && criticalIssues.length === 0;
  const canSubmit = isComplete && !requiresReview;

  return {
    isValid: criticalIssues.length === 0,
    isComplete,
    completionPercentage,
    sectionStatus,
    criticalIssues,
    warnings,
    recommendations,
    medicalRiskLevel: medicalValidation.riskLevel,
    requiresReview: requiresReview || medicalValidation.alerts.some(a => a.requiresReview),
    canSubmit
  };
}

/**
 * Validate demographics section
 */
function validateDemographics(demographics: any): { isValid: boolean; issues: string[] } {
  const issues: string[] = [];

  if (!demographics?.personal_info?.id_number) {
    issues.push('South African ID number is required');
  } else {
    const idValidation = validateAndExtractSAID(demographics.personal_info.id_number);
    if (!idValidation.isValid) {
      issues.push(`Invalid SA ID number: ${idValidation.errors.join(', ')}`);
    }
  }

  if (!demographics?.personal_info?.first_names) {
    issues.push('First names are required');
  }

  if (!demographics?.personal_info?.surname) {
    issues.push('Surname is required');
  }

  if (!demographics?.employment_info?.company_name) {
    issues.push('Company name is required');
  }

  if (!demographics?.employment_info?.position) {
    issues.push('Job position is required');
  }

  if (!demographics?.contact_info?.phone) {
    issues.push('Phone number is required');
  }

  return {
    isValid: issues.length === 0,
    issues
  };
}

/**
 * Validate examination-specific sections
 */
function validateExaminationSpecificSections(
  formData: any,
  examinationType: ExaminationType
): { criticalIssues: string[]; warnings: string[] } {
  const criticalIssues: string[] = [];
  const warnings: string[] = [];

  switch (examinationType) {
    case 'working_at_heights':
      const heightsAssessment = formData.working_at_heights_assessment;
      if (!heightsAssessment) {
        criticalIssues.push('Working at heights assessment is required');
      } else {
        // Check for critical safety issues
        if (heightsAssessment.safety_questions?.fear_of_heights && 
            heightsAssessment.safety_questions?.vertigo_dizziness) {
          criticalIssues.push('Multiple height-related safety concerns detected - immediate review required');
        }
        
        if (heightsAssessment.safety_questions?.fits_seizures_epilepsy_blackouts) {
          criticalIssues.push('Seizure/epilepsy history incompatible with heights work');
        }
      }
      break;

    case 'periodic':
      const periodicHistory = formData.periodic_health_history;
      if (!periodicHistory?.since_last_examination) {
        warnings.push('Periodic health history section should be completed');
      }
      break;

    case 'return_to_work':
      const returnToWork = formData.return_to_work_surveillance;
      if (!returnToWork?.medical_clearance) {
        criticalIssues.push('Medical clearance is required for return to work');
      }
      
      if (!returnToWork?.absence_reason) {
        criticalIssues.push('Reason for absence must be specified');
      }
      break;
  }

  return { criticalIssues, warnings };
}

/**
 * Validate declarations section
 */
function validateDeclarations(declarations: any): { isValid: boolean; issues: string[] } {
  const issues: string[] = [];

  const employeeDeclaration = declarations?.employee_declaration;

  if (!employeeDeclaration?.information_correct) {
    issues.push('Must confirm information is correct');
  }

  if (!employeeDeclaration?.no_misleading_information) {
    issues.push('Must confirm no misleading information provided');
  }

  if (!employeeDeclaration?.consent_to_medical_examination) {
    issues.push('Must consent to medical examination');
  }

  if (!employeeDeclaration?.consent_to_information_sharing) {
    issues.push('Must consent to appropriate information sharing');
  }

  if (!employeeDeclaration?.employee_name) {
    issues.push('Employee name is required');
  }

  if (!employeeDeclaration?.employee_signature) {
    issues.push('Employee signature is required');
  }

  return {
    isValid: issues.length === 0,
    issues
  };
}

/**
 * Calculate overall completion percentage
 */
function calculateCompletionPercentage(formData: any, examinationType: ExaminationType): number {
  const sections = [
    { name: 'demographics', weight: 25, complete: validateDemographics(formData.patient_demographics).isValid },
    { name: 'medical_history', weight: 35, complete: calculateMedicalHistoryCompletion(formData.medical_history) > 80 },
    { name: 'declarations', weight: 20, complete: validateDeclarations(formData.declarations_and_signatures).isValid }
  ];

  // Add examination-specific sections
  switch (examinationType) {
    case 'periodic':
      sections.push({ 
        name: 'periodic_history', 
        weight: 20, 
        complete: validatePeriodicSection(formData.periodic_health_history) 
      });
      break;
    case 'working_at_heights':
      sections.push({ 
        name: 'heights_assessment', 
        weight: 20, 
        complete: validateHeightsSection(formData.working_at_heights_assessment) 
      });
      break;
    case 'return_to_work':
      sections.push({ 
        name: 'return_to_work', 
        weight: 20, 
        complete: validateReturnToWorkSection(formData.return_to_work_surveillance) 
      });
      break;
    default:
      // Redistribute weight for pre-employment
      sections[0].weight = 30; // demographics
      sections[1].weight = 40; // medical_history
      sections[2].weight = 30; // declarations
  }

  const totalWeight = sections.reduce((sum, section) => sum + section.weight, 0);
  const completedWeight = sections.reduce((sum, section) => sum + (section.complete ? section.weight : 0), 0);

  return Math.round((completedWeight / totalWeight) * 100);
}

/**
 * Helper validation functions for specific sections
 */
function calculateMedicalHistoryCompletion(medicalHistory: any): number {
  if (!medicalHistory) return 0;
  
  let completedSections = 0;
  let totalSections = 4;

  // Current conditions
  if (medicalHistory.current_conditions && 
      Object.values(medicalHistory.current_conditions).some(value => value !== undefined)) {
    completedSections++;
  }

  // Respiratory conditions
  if (medicalHistory.respiratory_conditions && 
      Object.values(medicalHistory.respiratory_conditions).some(value => value !== undefined)) {
    completedSections++;
  }

  // Occupational health
  if (medicalHistory.occupational_health?.fitness_status) {
    completedSections++;
  }

  // Medications/allergies
  if (medicalHistory.current_medications?.length > 0 || medicalHistory.known_allergies?.length > 0) {
    completedSections++;
  }

  return (completedSections / totalSections) * 100;
}

function validatePeriodicSection(periodicHistory: any): boolean {
  return !!(periodicHistory?.since_last_examination?.illness_injury_treatment !== undefined);
}

function validateHeightsSection(heightsAssessment: any): boolean {
  return !!(heightsAssessment?.safety_questions && 
           Object.keys(heightsAssessment.safety_questions).length > 0);
}

function validateReturnToWorkSection(returnToWork: any): boolean {
  return !!(returnToWork?.absence_reason && 
           returnToWork?.medical_clearance !== undefined);
}

/**
 * Prepare questionnaire for submission
 */
export function prepareQuestionnaireSubmission(
  formData: any,
  examinationType: ExaminationType,
  startTime: Date,
  userId: string
): QuestionnaireSubmissionData {
  const validationResult = validateCompleteQuestionnaire(formData, examinationType, startTime);
  
  // Generate medical alerts
  const medicalValidation = validateMedicalHistory(formData.medical_history, examinationType);
  const medicalAlerts = medicalValidation.alerts.filter(alert => 
    alert.type === 'critical' || alert.severity === 'high'
  );

  // Calculate recommended follow-up
  const recommendedFollowUp = calculateFollowUpRecommendation(formData, examinationType, medicalValidation);

  // Prepare submission metadata
  const submissionMetadata = {
    submittedAt: new Date().toISOString(),
    submittedBy: userId,
    ipAddress: '', // Would be filled by backend
    userAgent: navigator.userAgent,
    completionTime: Math.round((new Date().getTime() - startTime.getTime()) / 1000 / 60) // minutes
  };

  return {
    questionnaire: {
      ...formData,
      validation_status: {
        questionnaire_complete: validationResult.isComplete,
        vitals_validated: false,
        assessment_complete: false,
        ready_for_certificate: false,
        validation_errors: validationResult.criticalIssues,
        last_validated_by: userId,
        last_validated_at: new Date().toISOString()
      }
    },
    validationResult,
    medicalAlerts,
    recommendedFollowUp,
    submissionMetadata
  };
}

/**
 * Calculate recommended follow-up interval
 */
function calculateFollowUpRecommendation(
  formData: any,
  examinationType: ExaminationType,
  medicalValidation: MedicalValidationResult
): { interval: string; reason: string } {
  // High-risk conditions require frequent monitoring
  if (medicalValidation.riskLevel === 'critical' || medicalValidation.riskLevel === 'high') {
    return {
      interval: '6_months',
      reason: 'High-risk medical conditions require frequent monitoring'
    };
  }

  // Working at heights requires annual review
  if (examinationType === 'working_at_heights') {
    return {
      interval: '12_months',
      reason: 'Working at heights requires annual medical review'
    };
  }

  // Return to work cases may need follow-up
  if (examinationType === 'return_to_work') {
    return {
      interval: '6_months',
      reason: 'Return to work assessment requires follow-up monitoring'
    };
  }

  // Standard intervals based on medical conditions
  const medicalConditions = formData.medical_history?.current_conditions || {};
  
  if (medicalConditions.heart_disease_high_bp || 
      medicalConditions.epilepsy_convulsions ||
      medicalCon