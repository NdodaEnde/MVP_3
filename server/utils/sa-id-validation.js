/**
 * Server-side SA ID validation utility (Node.js)
 * Mirrors frontend validation for security
 */

function validateSAIDFormat(idNumber) {
  const cleanId = String(idNumber).replace(/\s/g, '');
  return /^\d{13}$/.test(cleanId);
}

function validateLuhnChecksum(idNumber) {
  const digits = idNumber.split('').map(Number);
  let sum = 0;
  
  for (let i = 0; i < 12; i++) {
    let digit = digits[i];
    
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

function extractSAIDData(idNumber) {
  const year = parseInt(idNumber.substring(0, 2));
  const month = parseInt(idNumber.substring(2, 4));
  const day = parseInt(idNumber.substring(4, 6));
  const genderDigit = parseInt(idNumber.substring(6, 7));
  const citizenshipDigit = parseInt(idNumber.substring(10, 11));
  
  // Determine century
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
  
  // Validate date
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

function validateAndExtractSAID(idNumber) {
  const errors = [];
  
  if (!idNumber) {
    return { isValid: false, errors: ['SA ID number is required'] };
  }
  
  const cleanId = String(idNumber).replace(/\s/g, '');
  
  if (!validateSAIDFormat(cleanId)) {
    return { isValid: false, errors: ['SA ID must be exactly 13 digits'] };
  }
  
  if (!validateLuhnChecksum(cleanId)) {
    return { isValid: false, errors: ['Invalid SA ID number checksum'] };
  }
  
  try {
    const extractedData = extractSAIDData(cleanId);
    return {
      isValid: true,
      errors: [],
      data: extractedData
    };
  } catch (error) {
    return { isValid: false, errors: [error.message] };
  }
}

// Validation for other fields
function validateEmail(email) {
  if (!email) return true; // Optional field
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validateSAPhoneNumber(phone) {
  if (!phone) return false; // Required field
  const cleanPhone = phone.replace(/[^\d]/g, '');
  // SA phone numbers: 10 digits starting with 0, or 11 digits starting with 27
  return /^0\d{9}$/.test(cleanPhone) || /^27\d{9}$/.test(cleanPhone);
}

function validatePostalCode(postalCode) {
  if (!postalCode) return true; // Optional field
  // SA postal codes are 4 digits
  return /^\d{4}$/.test(postalCode);
}

// Complete demographics validation
function validateDemographics(demographics) {
  const errors = [];
  const warnings = [];
  
  // Validate personal info
  const personalInfo = demographics.personal_info || {};
  
  // Required fields
  if (!personalInfo.initials) errors.push('Initials are required');
  if (!personalInfo.first_names) errors.push('First names are required');
  if (!personalInfo.surname) errors.push('Surname is required');
  if (!personalInfo.id_number) errors.push('SA ID number is required');
  
  // SA ID validation
  if (personalInfo.id_number) {
    const saIdValidation = validateAndExtractSAID(personalInfo.id_number);
    if (!saIdValidation.isValid) {
      errors.push(...saIdValidation.errors);
    } else {
      // Check consistency with manually entered data
      if (personalInfo.age && personalInfo.age !== saIdValidation.data.age) {
        warnings.push('Age does not match SA ID number, using calculated age');
      }
      if (personalInfo.gender && personalInfo.gender !== saIdValidation.data.gender) {
        warnings.push('Gender does not match SA ID number, using detected gender');
      }
    }
  }
  
  // Validate contact info
  const contactInfo = demographics.contact_info || {};
  
  if (contactInfo.phone && !validateSAPhoneNumber(contactInfo.phone)) {
    errors.push('Invalid phone number format');
  }
  
  if (contactInfo.email && !validateEmail(contactInfo.email)) {
    errors.push('Invalid email address format');
  }
  
  if (contactInfo.address && contactInfo.address.postal_code && 
      !validatePostalCode(contactInfo.address.postal_code)) {
    errors.push('Invalid postal code format (must be 4 digits)');
  }
  
  // Validate employment info
  const employmentInfo = demographics.employment_info || {};
  
  if (!employmentInfo.company_name) errors.push('Company name is required');
  if (!employmentInfo.employee_number) errors.push('Employee number is required');
  if (!employmentInfo.position) errors.push('Position is required');
  if (!employmentInfo.department) errors.push('Department is required');
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

// Auto-populate data from SA ID
function autoPopulateFromSAID(demographics) {
  const personalInfo = demographics.personal_info || {};
  
  if (personalInfo.id_number) {
    const saIdValidation = validateAndExtractSAID(personalInfo.id_number);
    
    if (saIdValidation.isValid) {
      // Auto-populate extracted data
      personalInfo.date_of_birth = saIdValidation.data.dateOfBirth;
      personalInfo.age = saIdValidation.data.age;
      personalInfo.gender = saIdValidation.data.gender;
      
      // Add validation metadata
      return {
        ...demographics,
        personal_info: personalInfo,
        _saIdValidation: {
          validated: true,
          validatedAt: new Date(),
          extractedData: saIdValidation.data
        }
      };
    }
  }
  
  return demographics;
}

module.exports = {
  validateAndExtractSAID,
  validateSAIDFormat,
  validateLuhnChecksum,
  extractSAIDData,
  validateEmail,
  validateSAPhoneNumber,
  validatePostalCode,
  validateDemographics,
  autoPopulateFromSAID
};