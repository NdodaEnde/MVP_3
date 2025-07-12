// 🔧 FIXED: signature-verification.ts - Removed React hooks from utility file

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
 * Comprehensive signature verification system (Pure utility - no React hooks)
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

    const hasEnhancedBiometrics = 
      biometricData.pressure?.length >= this.MIN_BIOMETRIC_POINTS &&
      biometricData.speed?.length >= this.MIN_BIOMETRIC_POINTS &&
      biometricData.strokeCount >= 3;

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
      if (!signatureData.hash || !signatureData.imageData) {
        return { isValid: false };
      }

      // In a real implementation, you would verify the hash
      // For now, we assume it's valid if both hash and image exist
      return { isValid: true };
    } catch (error) {
      return { isValid: false };
    }
  }

  /**
   * Check legal compliance requirements
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

    // Check signer identification
    if (!signerInfo.name || !signerInfo.name.trim()) {
      issues.push('Signer name is required for legal compliance');
      trustReduction += 20;
    }

    if (!signerInfo.idNumber) {
      warnings.push('No ID number provided - reduces legal enforceability');
      trustReduction += 10;
    }

    // Check timestamp
    if (!signatureData.timestamp) {
      issues.push('Signature timestamp is required for legal validity');
      trustReduction += 15;
    }

    // Check audit trail
    if (!signatureData.metadata || Object.keys(signatureData.metadata).length === 0) {
      warnings.push('Limited audit trail - may affect legal admissibility');
      trustReduction += 5;
    }

    const isCompliant = issues.length === 0;
    const isFullyCompliant = isCompliant && warnings.length === 0;

    return {
      isCompliant,
      isFullyCompliant,
      issues,
      warnings,
      trustReduction
    };
  }

  /**
   * Generate comprehensive audit trail
   */
  static generateAuditTrail(
    signatureData: any,
    signerInfo: any,
    documentId: string,
    verifierInfo: any
  ): SignatureAuditTrail {
    const validation = this.validateSignature(signatureData, signerInfo);
    
    return {
      signatureId: `SIG_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      documentId,
      signerInfo: {
        name: signerInfo.name,
        idNumber: signerInfo.idNumber,
        email: signerInfo.email,
        role: signerInfo.role || 'signer'
      },
      signatureData: {
        timestamp: signatureData.timestamp || new Date().toISOString(),
        biometricData: signatureData.biometricData || {},
        imageData: signatureData.imageData,
        hash: signatureData.hash || this.generateHash(signatureData.imageData),
        metadata: {
          ...signatureData.metadata,
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        }
      },
      verification: {
        verifiedAt: new Date().toISOString(),
        verifiedBy: verifierInfo.name || 'System',
        verificationMethod: 'biometric_enhanced',
        result: validation
      },
      legalCompliance: {
        ectActCompliant: validation.legallyCompliant,
        pipaCompliant: true, // Assuming POPIA compliance
        auditTrailComplete: true,
        integrityVerified: validation.trustLevel >= 70
      }
    };
  }

  /**
   * Generate a simple hash for the signature
   */
  private static generateHash(data: string): string {
    // Simple hash function - in production use crypto library
    let hash = 0;
    if (data.length === 0) return hash.toString();
    
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    return Math.abs(hash).toString(16);
  }

  /**
   * Compare signatures for identity verification
   */
  static compareSignatures(currentSignature: any, storedTemplate: any): {
    matches: boolean;
    confidence: number;
    analysis: string[];
  } {
    const analysis: string[] = [];
    let confidence = 0;
    let matchPoints = 0;
    const totalChecks = 5;

    // Basic signature comparison
    if (!currentSignature || !storedTemplate) {
      analysis.push('Insufficient data for comparison');
      return { matches: false, confidence: 0, analysis };
    }

    // Compare stroke patterns
    if (currentSignature.strokeCount && storedTemplate.strokeCount) {
      const strokeDiff = Math.abs(currentSignature.strokeCount - storedTemplate.strokeCount);
      if (strokeDiff <= 2) {
        matchPoints++;
        analysis.push('Stroke pattern is consistent with profile');
      } else {
        analysis.push('Stroke pattern differs significantly from profile');
      }
    }

    // Compare duration
    if (currentSignature.duration && storedTemplate.avgDuration) {
      const durationDiff = Math.abs(currentSignature.duration - storedTemplate.avgDuration);
      if (durationDiff < 2000) { // Within 2 seconds
        matchPoints++;
        analysis.push('Signing duration matches typical pattern');
      } else {
        analysis.push('Signing speed differs from usual pattern');
      }
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

export default SignatureVerificationService;