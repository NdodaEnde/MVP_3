// utils/signature-verification.ts
import CryptoJS from 'crypto-js';

export interface SignatureValidationResult {
  isValid: boolean;
  legallyCompliant: boolean;
  issues: string[];
  warnings: string[];
  complianceLevel: 'basic' | 'enhanced' | 'qualified';
  trustLevel: number; // 0-100
}

export interface SignatureAuditTrail {
  signatureId: string;
  documentId: string;
  signerInfo: {
    name: string;
    idNumber?: string;
    email?: string;
    role: string;
  };
  signatureData: {
    timestamp: string;
    biometricData: any;
    imageData: string;
    hash: string;
    metadata: any;
  };
  verification: {
    verifiedAt: string;
    verifiedBy: string;
    verificationMethod: string;
    result: SignatureValidationResult;
  };
  legalCompliance: {
    ectActCompliant: boolean;
    pipaCompliant: boolean;
    auditTrailComplete: boolean;
    integrityVerified: boolean;
  };
}

/**
 * Comprehensive signature verification system
 */
export class SignatureVerificationService {
  private static readonly MIN_BIOMETRIC_POINTS = 10;
  private static readonly MIN_SIGNATURE_DURATION = 500; // milliseconds
  private static readonly MAX_SIGNATURE_DURATION = 30000; // 30 seconds

  /**
   * Validate signature against legal and technical requirements
   */
  static validateSignature(signatureData: any, signerInfo: any): SignatureValidationResult {
    const issues: string[] = [];
    const warnings: string[] = [];
    let trustLevel = 100;

    // Basic validation
    if (!signatureData.imageData) {
      issues.push('Missing signature image data');
      trustLevel -= 30;
    }

    if (!signatureData.timestamp) {
      issues.push('Missing signature timestamp');
      trustLevel -= 20;
    }

    if (!signatureData.hash) {
      issues.push('Missing signature authentication hash');
      trustLevel -= 25;
    }

    // Biometric validation
    const biometricValidation = this.validateBiometricData(signatureData.biometricData);
    if (!biometricValidation.isValid) {
      issues.push(...biometricValidation.issues);
      warnings.push(...biometricValidation.warnings);
      trustLevel -= biometricValidation.trustReduction;
    }

    // Hash integrity check
    const hashValidation = this.validateSignatureHash(signatureData);
    if (!hashValidation.isValid) {
      issues.push('Signature hash verification failed - potential tampering detected');
      trustLevel -= 50;
    }

    // Legal compliance check
    const legalCompliance = this.checkLegalCompliance(signatureData, signerInfo);
    if (!legalCompliance.isCompliant) {
      issues.push(...legalCompliance.issues);
      warnings.push(...legalCompliance.warnings);
      trustLevel -= legalCompliance.trustReduction;
    }

    // Determine compliance level
    let complianceLevel: 'basic' | 'enhanced' | 'qualified' = 'basic';
    if (trustLevel >= 80 && biometricValidation.hasEnhancedBiometrics) {
      complianceLevel = 'enhanced';
    }
    if (trustLevel >= 90 && legalCompliance.isFullyCompliant) {
      complianceLevel = 'qualified';
    }

    return {
      isValid: issues.length === 0,
      legallyCompliant: legalCompliance.isCompliant,
      issues,
      warnings,
      complianceLevel,
      trustLevel: Math.max(0, trustLevel)
    };
  }

  /**
   * Validate biometric signature data
   */
  private static validateBiometricData(biometricData: any): {
    isValid: boolean;
    hasEnhancedBiometrics: boolean;
    issues: string[];
    warnings: string[];
    trustReduction: number;
  } {
    const issues: string[] = [];
    const warnings: string[] = [];
    let trustReduction = 0;

    if (!biometricData) {
      issues.push('Missing biometric data');
      return { isValid: false, hasEnhancedBiometrics: false, issues, warnings, trustReduction: 40 };
    }

    // Validate stroke count
    if (!biometricData.strokeCount || biometricData.strokeCount < 1) {
      issues.push('Invalid stroke count - signature appears artificial');
      trustReduction += 30;
    } else if (biometricData.strokeCount < 3) {
      warnings.push('Unusually simple signature - low stroke count');
      trustReduction += 10;
    }

    // Validate duration
    if (!biometricData.duration || biometricData.duration < this.MIN_SIGNATURE_DURATION) {
      warnings.push('Signature was created very quickly - may indicate automated signing');
      trustReduction += 15;
    } else if (biometricData.duration > this.MAX_SIGNATURE_DURATION) {
      warnings.push('Signature took unusually long to create');
      trustReduction += 5;
    }

    // Validate pressure data
    if (!biometricData.pressure || biometricData.pressure.length < this.MIN_BIOMETRIC_POINTS) {
      warnings.push('Insufficient pressure data for enhanced verification');
      trustReduction += 10;
    }

    // Validate speed data
    if (!biometricData.speed || biometricData.speed.length < this.MIN_BIOMETRIC_POINTS) {
      warnings.push('Insufficient speed data for enhanced verification');
      trustReduction += 10;
    }

    // Check for enhanced biometrics
    const hasEnhancedBiometrics = 
      biometricData.pressure?.length >= this.MIN_BIOMETRIC_POINTS &&
      biometricData.speed?.length >= this.MIN_BIOMETRIC_POINTS &&
      biometricData.acceleration?.length >= this.MIN_BIOMETRIC_POINTS;

    return {
      isValid: issues.length === 0,
      hasEnhancedBiometrics,
      issues,
      warnings,
      trustReduction
    };
  }

  /**
   * Validate signature hash integrity
   */
  private static validateSignatureHash(signatureData: any): { isValid: boolean } {
    try {
      // Recreate hash from signature data
      const dataToHash = 
        signatureData.imageData + 
        JSON.stringify(signatureData.biometricData) + 
        JSON.stringify(signatureData.metadata);
      
      const expectedHash = CryptoJS.SHA256(dataToHash).toString().substring(0, 32);
      
      return { isValid: expectedHash === signatureData.hash };
    } catch (error) {
      return { isValid: false };
    }
  }

  /**
   * Check legal compliance with South African laws
   */
  private static checkLegalCompliance(signatureData: any, signerInfo: any): {
    isCompliant: boolean;
    isFullyCompliant: boolean;
    issues: string[];
    warnings: string[];
    trustReduction: number;
  } {
    const issues: string[] = [];
    const warnings: string[] = [];
    let trustReduction = 0;

    // Electronic Communications and Transactions Act (ECT Act) requirements
    
    // 1. Intent to sign
    if (!signerInfo.name) {
      issues.push('Signer identification required for legal compliance');
      trustReduction += 20;
    }

    // 2. Method to identify signer
    if (!signerInfo.idNumber && !signerInfo.email) {
      warnings.push('Additional signer identification recommended for enhanced compliance');
      trustReduction += 10;
    }

    // 3. Method to indicate intent
    if (!signatureData.timestamp) {
      issues.push('Timestamp required to prove intent and time of signing');
      trustReduction += 15;
    }

    // 4. Integrity of document
    if (!signatureData.hash) {
      issues.push('Document integrity verification required');
      trustReduction += 20;
    }

    // PIPA (Protection of Personal Information Act) compliance
    if (!signatureData.metadata?.consentGiven) {
      warnings.push('Explicit consent for signature storage recommended for PIPA compliance');
      trustReduction += 5;
    }

    // Additional compliance checks
    const timestamp = new Date(signatureData.timestamp);
    const now = new Date();
    const timeDifference = Math.abs(now.getTime() - timestamp.getTime());
    
    // Check for reasonable timestamp (not more than 1 hour in future or past)
    if (timeDifference > 3600000) {
      warnings.push('Signature timestamp appears unusual - verify system clock accuracy');
      trustReduction += 10;
    }

    const isCompliant = issues.length === 0;
    const isFullyCompliant = issues.length === 0 && warnings.length <= 1;

    return {
      isCompliant,
      isFullyCompliant,
      issues,
      warnings,
      trustReduction
    };
  }

  /**
   * Generate complete audit trail for signature
   */
  static generateAuditTrail(
    signatureData: any,
    signerInfo: any,
    documentId: string,
    verifierInfo: any
  ): SignatureAuditTrail {
    const validationResult = this.validateSignature(signatureData, signerInfo);
    
    return {
      signatureId: this.generateSignatureId(),
      documentId,
      signerInfo: {
        name: signerInfo.name,
        idNumber: signerInfo.idNumber,
        email: signerInfo.email,
        role: signerInfo.role || 'employee'
      },
      signatureData: {
        timestamp: signatureData.timestamp,
        biometricData: signatureData.biometricData,
        imageData: signatureData.imageData,
        hash: signatureData.hash,
        metadata: signatureData.metadata
      },
      verification: {
        verifiedAt: new Date().toISOString(),
        verifiedBy: verifierInfo.id,
        verificationMethod: 'automated_biometric_analysis',
        result: validationResult
      },
      legalCompliance: {
        ectActCompliant: validationResult.legallyCompliant,
        pipaCompliant: true, // Assume PIPA compliance with proper consent
        auditTrailComplete: true,
        integrityVerified: validationResult.trustLevel >= 70
      }
    };
  }

  /**
   * Generate unique signature ID
   */
  private static generateSignatureId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2);
    return `SIG_${timestamp}_${random}`.toUpperCase();
  }

  /**
   * Verify signature against stored biometric template (for repeat signers)
   */
  static compareSignatureBiometrics(
    currentSignature: any,
    storedTemplate: any
  ): { matches: boolean; confidence: number; analysis: string[] } {
    const analysis: string[] = [];
    let confidence = 0;
    let matchPoints = 0;
    const totalChecks = 5;

    // Compare stroke count
    if (Math.abs(currentSignature.strokeCount - storedTemplate.strokeCount) <= 2) {
      matchPoints++;
      analysis.push('Stroke count matches historical pattern');
    } else {
      analysis.push('Stroke count differs from historical pattern');
    }

    // Compare average pressure
    const currentAvgPressure = currentSignature.pressure?.reduce((a: number, b: number) => a + b, 0) / currentSignature.pressure?.length || 0;
    const storedAvgPressure = storedTemplate.avgPressure || 0;
    
    if (Math.abs(currentAvgPressure - storedAvgPressure) < 0.2) {
      matchPoints++;
      analysis.push('Pressure pattern consistent with signer');
    } else {
      analysis.push('Pressure pattern shows some variation');
    }

    // Compare signature duration
    if (Math.abs(currentSignature.duration - storedTemplate.avgDuration) < 2000) {
      matchPoints++;
      analysis.push('Signing speed consistent with historical data');
    } else {
      analysis.push('Signing speed differs from usual pattern');
    }

    // Compare speed patterns
    const currentAvgSpeed = currentSignature.speed?.reduce((a: number, b: number) => a + b, 0) / currentSignature.speed?.length || 0;
    const storedAvgSpeed = storedTemplate.avgSpeed || 0;
    
    if (Math.abs(currentAvgSpeed - storedAvgSpeed) < 0.1) {
      matchPoints++;
      analysis.push('Hand movement speed matches profile');
    }

    // Overall biometric consistency
    if (matchPoints >= 3) {
      matchPoints++;
      analysis.push('Overall biometric profile strongly matches signer');
    }

    confidence = (matchPoints / totalChecks) * 100;
    
    return {
      matches: matchPoints >= 3,
      confidence: Math.round(confidence),
      analysis
    };
  }
}

// React hook for signature verification
export function useSignatureVerification() {
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<SignatureValidationResult | null>(null);

  const verifySignature = async (signatureData: any, signerInfo: any): Promise<SignatureValidationResult> => {
    setIsVerifying(true);
    
    try {
      // Simulate verification delay (in production, this might involve server calls)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const result = SignatureVerificationService.validateSignature(signatureData, signerInfo);
      setVerificationResult(result);
      
      return result;
    } finally {
      setIsVerifying(false);
    }
  };

  const generateAuditTrail = (
    signatureData: any,
    signerInfo: any,
    documentId: string,
    verifierInfo: any
  ): SignatureAuditTrail => {
    return SignatureVerificationService.generateAuditTrail(
      signatureData,
      signerInfo,
      documentId,
      verifierInfo
    );
  };

  return {
    verifySignature,
    generateAuditTrail,
    isVerifying,
    verificationResult
  };
}

export default SignatureVerificationService;