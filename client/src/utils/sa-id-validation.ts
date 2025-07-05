/**
 * South African ID Number Validation Utility
 * Validates format, checksum, and extracts demographic data
 */

export interface SAIDValidationResult {
  isValid: boolean;
  errors: string[];
  data?: {
    dateOfBirth: string;
    age: number;
    gender: 'male' | 'female';
    citizenship: 'citizen' | 'permanent_resident';
  };
}

/**
 * Validates SA ID number format (13 digits)
 */
export function validateSAIDFormat(idNumber: string): boolean {
  const cleanId = String(idNumber).replace(/\s/g, '');
  return /^\d{13}$/.test(cleanId);
}

/**
 * Validates SA ID number using Luhn algorithm checksum
 */
export function validateLuhnChecksum(idNumber: string): boolean {
  const digits = idNumber.split('').map(Number);
  let sum = 0;
  
  // Process first 12 digits
  for (let i = 0; i < 12; i++) {
    let digit = digits[i];
    
    // Double every second digit from the right
    if ((12 - i) % 2 === 0) {
      digit *= 2;
      if (digit > 9) {
        digit = Math.floor(digit / 10) + (digit % 10);
      }
    }
    
    sum += digit;
  }
  
  // Calculate checksum
  const checksum = (10 - (sum % 10)) % 10;
  return checksum === digits[12];
}

/**
 * Extracts demographic data from SA ID number
 */
export function extractSAIDData(idNumber: string): SAIDValidationResult['data'] {
  const year = parseInt(idNumber.substring(0, 2));
  const month = parseInt(idNumber.substring(2, 4));
  const day = parseInt(idNumber.substring(4, 6));
  const genderDigit = parseInt(idNumber.substring(6, 7));
  const citizenshipDigit = parseInt(idNumber.substring(10, 11));
  
  // Determine century (current year determines cutoff)
  const currentYear = new Date().getFullYear();
  const currentCentury = Math.floor(currentYear / 100) * 100;
  const fullYear = year < 50 ? currentCentury + year : currentCentury - 100 + year;
  
  // Validate date components
  if (month < 1 || month > 12) {
    throw new Error('Invalid month in SA ID number');
  }
  
  if (day < 1 || day > 31) {
    throw new Error('Invalid day in SA ID number');
  }
  
  // Create and validate date
  const testDate = new Date(fullYear, month - 1, day);
  if (testDate.getFullYear() !== fullYear || 
      testDate.getMonth() !== month - 1 || 
      testDate.getDate() !== day ||
      testDate > new Date()) {
    throw new Error('Invalid date in SA ID number');
  }
  
  // Calculate age
  const today = new Date();
  let age = today.getFullYear() - fullYear;
  if (today.getMonth() < month - 1 || 
      (today.getMonth() === month - 1 && today.getDate() < day)) {
    age--;
  }
  
  // Validate age is reasonable
  if (age < 0 || age > 120) {
    throw new Error('Invalid age calculated from SA ID number');
  }
  
  return {
    dateOfBirth: `${fullYear}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`,
    age,
    gender: genderDigit >= 5 ? 'male' : 'female',
    citizenship: citizenshipDigit === 0 ? 'citizen' : 'permanent_resident'
  };
}

/**
 * Main validation function - validates format, checksum, and extracts data
 */
export function validateAndExtractSAID(idNumber: string): SAIDValidationResult {
  const errors: string[] = [];
  
  if (!idNumber) {
    return { isValid: false, errors: ['SA ID number is required'] };
  }
  
  const cleanId = String(idNumber).replace(/\s/g, '');
  
  // Format validation
  if (!validateSAIDFormat(cleanId)) {
    errors.push('SA ID must be exactly 13 digits');
  }
  
  if (errors.length > 0) {
    return { isValid: false, errors };
  }
  
  // Checksum validation
  if (!validateLuhnChecksum(cleanId)) {
    errors.push('Invalid SA ID number checksum');
  }
  
  if (errors.length > 0) {
    return { isValid: false, errors };
  }
  
  // Data extraction
  try {
    const extractedData = extractSAIDData(cleanId);
    return {
      isValid: true,
      errors: [],
      data: extractedData
    };
  } catch (error) {
    return { 
      isValid: false, 
      errors: [error instanceof Error ? error.message : 'Failed to extract data from SA ID'] 
    };
  }
}

/**
 * Format SA ID number for display (adds spaces for readability)
 */
export function formatSAIDForDisplay(idNumber: string): string {
  const cleanId = String(idNumber).replace(/\s/g, '');
  if (cleanId.length === 13) {
    return `${cleanId.substring(0, 6)} ${cleanId.substring(6, 10)} ${cleanId.substring(10, 13)}`;
  }
  return idNumber;
}

/**
 * Parse and clean SA ID number input
 */
export function cleanSAIDInput(idNumber: string): string {
  return String(idNumber).replace(/[^\d]/g, '');
}

/**
 * Get provinces for address selection
 */
export const SA_PROVINCES = [
  'Eastern Cape',
  'Free State',
  'Gauteng',
  'KwaZulu-Natal',
  'Limpopo',
  'Mpumalanga',
  'Northern Cape',
  'North West',
  'Western Cape'
] as const;

export type SAProvince = typeof SA_PROVINCES[number];

/**
 * Validate email address
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate South African phone number
 */
export function validateSAPhoneNumber(phone: string): boolean {
  const cleanPhone = phone.replace(/[^\d]/g, '');
  // SA phone numbers: 10 digits starting with 0, or 11 digits starting with 27
  return /^0\d{9}$/.test(cleanPhone) || /^27\d{9}$/.test(cleanPhone);
}

/**
 * Format SA phone number for display
 */
export function formatSAPhoneNumber(phone: string): string {
  const cleanPhone = phone.replace(/[^\d]/g, '');
  
  if (cleanPhone.length === 10 && cleanPhone.startsWith('0')) {
    return `${cleanPhone.substring(0, 3)} ${cleanPhone.substring(3, 6)} ${cleanPhone.substring(6)}`;
  }
  
  if (cleanPhone.length === 11 && cleanPhone.startsWith('27')) {
    return `+${cleanPhone.substring(0, 2)} ${cleanPhone.substring(2, 4)} ${cleanPhone.substring(4, 7)} ${cleanPhone.substring(7)}`;
  }
  
  return phone;
}