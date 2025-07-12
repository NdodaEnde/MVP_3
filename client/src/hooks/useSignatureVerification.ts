// hooks/useSignatureVerification.ts - React hook for signature verification
import { useState } from 'react';
import { SignatureVerificationService, SignatureValidationResult, SignatureAuditTrail } from '../utils/signature-verification';

/**
 * React hook for signature verification functionality
 * This hook provides state management and async operations for signature verification
 */
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

  const compareSignatures = (currentSignature: any, storedTemplate: any) => {
    return SignatureVerificationService.compareSignatures(currentSignature, storedTemplate);
  };

  const clearVerificationResult = () => {
    setVerificationResult(null);
  };

  return {
    verifySignature,
    generateAuditTrail,
    compareSignatures,
    clearVerificationResult,
    isVerifying,
    verificationResult
  };
}