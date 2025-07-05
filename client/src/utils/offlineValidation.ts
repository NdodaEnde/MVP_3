// utils/offlineValidation.ts
export class OfflineValidator {
  static validateQuestionnaireData(data: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate required personal information
    if (!data.patient_demographics?.personal_info) {
      errors.push('Personal demographics section is required');
    } else {
      const personalInfo = data.patient_demographics.personal_info;
      if (!personalInfo.first_names) errors.push('First names are required');
      if (!personalInfo.surname) errors.push('Surname is required');
      if (!personalInfo.id_number) errors.push('ID number is required');
    }

    // Validate medical history responses
    if (!data.medical_history?.current_conditions) {
      errors.push('Medical history section is required');
    }

    // Validate declarations and signatures
    if (!data.declarations_and_signatures?.employee_declaration) {
      errors.push('Employee declaration is required');
    } else {
      const declaration = data.declarations_and_signatures.employee_declaration;
      if (!declaration.information_correct) {
        errors.push('Information correctness declaration is required');
      }
      if (!declaration.no_misleading_information) {
        errors.push('No misleading information declaration is required');
      }
      if (!declaration.employee_signature) {
        errors.push('Employee signature is required');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static calculateCompletionScore(data: any, examinationType: string): number {
    let totalFields = 0;
    let completedFields = 0;

    // Personal demographics (6 essential fields)
    totalFields += 6;
    const personalInfo = data.patient_demographics?.personal_info || {};
    if (personalInfo.first_names) completedFields++;
    if (personalInfo.surname) completedFields++;
    if (personalInfo.id_number) completedFields++;
    if (personalInfo.date_of_birth) completedFields++;
    if (personalInfo.gender) completedFields++;
    if (personalInfo.age) completedFields++;

    // Medical history (11 main conditions)
    totalFields += 11;
    const conditions = data.medical_history?.current_conditions || {};
    Object.values(conditions).forEach(value => {
      if (value !== undefined) completedFields++;
    });

    // Examination-specific sections
    if (examinationType.includes('heights')) {
      totalFields += 5;
      const heightsData = data.working_at_heights_assessment || {};
      Object.values(heightsData).forEach(value => {
        if (value !== undefined) completedFields++;
      });
    }

    if (examinationType === 'periodic') {
      totalFields += 4;
      const periodicData = data.periodic_health_history?.since_last_examination || {};
      Object.values(periodicData).forEach(value => {
        if (value && value.toString().trim()) completedFields++;
      });
    }

    if (examinationType === 'return_to_work') {
      totalFields += 3;
      const returnData = data.return_to_work_surveillance || {};
      if (returnData.absence_reason) completedFields++;
      if (returnData.absence_duration) completedFields++;
      if (returnData.medical_clearance !== undefined) completedFields++;
    }

    // Declarations (4 fields)
    totalFields += 4;
    const declaration = data.declarations_and_signatures?.employee_declaration || {};
    if (declaration.information_correct) completedFields++;
    if (declaration.no_misleading_information) completedFields++;
    if (declaration.employee_name) completedFields++;
    if (declaration.employee_signature) completedFields++;

    return totalFields > 0 ? Math.round((completedFields / totalFields) * 100) : 0;
  }
}
