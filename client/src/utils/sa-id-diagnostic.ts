/**
 * SA ID Diagnostic and Correction Utility
 * Helps debug and fix SA ID validation issues
 */

import { validateAndExtractSAID, validateLuhnChecksum } from './sa-id-validation';

export interface SAIDDiagnostic {
  originalId: string;
  isValid: boolean;
  errors: string[];
  suggestions: string[];
  correctedId?: string;
  extractedData?: any;
}

/**
 * Comprehensive SA ID diagnostic tool
 */
export function diagnoseSAID(idNumber: string): SAIDDiagnostic {
  const result: SAIDDiagnostic = {
    originalId: idNumber,
    isValid: false,
    errors: [],
    suggestions: []
  };

  // Basic format check
  if (!idNumber || typeof idNumber !== 'string') {
    result.errors.push('SA ID is required');
    result.suggestions.push('Please enter a 13-digit South African ID number');
    return result;
  }

  const cleanId = idNumber.replace(/\s/g, '');
  
  if (cleanId.length !== 13) {
    result.errors.push(`ID must be exactly 13 digits (current: ${cleanId.length})`);
    result.suggestions.push('SA ID format: YYMMDDGGGGSAZ (Year-Month-Day-Gender-Sequence-Citizenship-Checksum)');
    return result;
  }

  if (!/^\d+$/.test(cleanId)) {
    result.errors.push('ID must contain only digits');
    result.suggestions.push('Remove any spaces, dashes, or other characters');
    return result;
  }

  // Date validation
  const year = parseInt(cleanId.substring(0, 2));
  const month = parseInt(cleanId.substring(2, 4));
  const day = parseInt(cleanId.substring(4, 6));

  if (month < 1 || month > 12) {
    result.errors.push(`Invalid month: ${month} (must be 01-12)`);
  }

  if (day < 1 || day > 31) {
    result.errors.push(`Invalid day: ${day} (must be 01-31)`);
  }

  // Checksum validation
  if (!validateLuhnChecksum(cleanId)) {
    result.errors.push('Invalid checksum - the last digit is incorrect');
    
    // Try to find the correct checksum
    const idBase = cleanId.substring(0, 12);
    for (let checkDigit = 0; checkDigit <= 9; checkDigit++) {
      const testId = idBase + checkDigit;
      if (validateLuhnChecksum(testId)) {
        result.correctedId = testId;
        result.suggestions.push(`Try changing the last digit from ${cleanId[12]} to ${checkDigit}: ${testId}`);
        break;
      }
    }
  }

  // If we have corrections or no errors, try full validation
  const testId = result.correctedId || cleanId;
  const validation = validateAndExtractSAID(testId);
  
  if (validation.isValid) {
    result.isValid = true;
    result.extractedData = validation.data;
    if (result.correctedId) {
      result.suggestions.push(`Corrected ID would be valid: Born ${validation.data?.dateOfBirth}, Age ${validation.data?.age}, Gender ${validation.data?.gender}`);
    }
  } else {
    result.errors.push(...validation.errors);
  }

  // Add helpful suggestions
  if (result.errors.length > 0) {
    result.suggestions.push('Double-check the ID number for typos');
    result.suggestions.push('Verify the ID with the ID document or official records');
    result.suggestions.push('Contact system administrator if this is a known valid ID');
  }

  return result;
}

/**
 * Generate test SA ID numbers for debugging
 */
export function generateTestSAIDs(): string[] {
  const testIds: string[] = [];
  
  // Common test patterns
  const patterns = [
    '8001014800086', // Classic test pattern
    '9001010001234', // Another common test
    '0001010001234', // 2000s birth
    '9512314800086', // 1995 birth
  ];

  patterns.forEach(pattern => {
    const base = pattern.substring(0, 12);
    // Find valid checksum for each pattern
    for (let checkDigit = 0; checkDigit <= 9; checkDigit++) {
      const testId = base + checkDigit;
      if (validateLuhnChecksum(testId)) {
        testIds.push(testId);
        break;
      }
    }
  });

  return testIds;
}

/**
 * Format SA ID for better readability
 */
export function formatSAIDDiagnostic(idNumber: string): string {
  if (!idNumber || idNumber.length !== 13) return idNumber;
  
  return `${idNumber.substring(0, 2)}-${idNumber.substring(2, 4)}-${idNumber.substring(4, 6)} ${idNumber.substring(6, 10)} ${idNumber.substring(10, 11)}${idNumber.substring(11, 13)}`;
}

/**
 * Explain SA ID components
 */
export function explainSAID(idNumber: string): string {
  if (!idNumber || idNumber.length !== 13) return 'Invalid ID format';
  
  const year = idNumber.substring(0, 2);
  const month = idNumber.substring(2, 4);
  const day = idNumber.substring(4, 6);
  const gender = idNumber.substring(6, 10);
  const sequence = idNumber.substring(10, 11);
  const citizenship = idNumber.substring(11, 12);
  const checksum = idNumber.substring(12, 13);

  const fullYear = parseInt(year) < 50 ? 2000 + parseInt(year) : 1900 + parseInt(year);
  const genderText = parseInt(gender) >= 5000 ? 'Male' : 'Female';
  const citizenshipText = citizenship === '0' ? 'SA Citizen' : 'Permanent Resident';

  return `Birth Date: ${fullYear}-${month}-${day} | Gender: ${genderText} | Citizenship: ${citizenshipText} | Checksum: ${checksum}`;
}