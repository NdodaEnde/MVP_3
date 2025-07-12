// 🔧 FIXED: EnhancedDeclarationsSection.tsx - Updated to use correct hook import

import React, { useState, useRef, useEffect } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { DigitalSignaturePad, SignaturePadRef } from '@/components/ElectronicSignature';

// 🔧 FIXED: Import the hook from the correct location
import { useSignatureVerification } from '@/hooks/useSignatureVerification';
import { SignatureVerificationService } from '@/utils/signature-verification';

import { 
  PenTool,
  CheckCircle2,
  AlertTriangle,
  Shield,
  FileText,
  User,
  Calendar,
  Lock,
  Eye,
  Download,
  Verified,
  Clock,
  Info
} from 'lucide-react';

interface EnhancedDeclarationsSectionProps {
  form: UseFormReturn<any>;
  examinationType: string;
  onDataChange?: (data: any) => void;
}

interface ConsentItem {
  key: string;
  title: string;
  description: string;
  required: boolean;
  category: 'legal' | 'medical' | 'privacy' | 'information';
  legalBasis?: string;
}

export const EnhancedDeclarationsSection: React.FC<EnhancedDeclarationsSectionProps> = ({
  form,
  examinationType,
  onDataChange
}) => {
  const [signatureDialogOpen, setSignatureDialogOpen] = useState(false);
  const [consentProgress, setConsentProgress] = useState(0);
  const [signatureVerified, setSignatureVerified] = useState(false);
  const [auditTrail, setAuditTrail] = useState(null);
  
  const signaturePadRef = useRef<SignaturePadRef>(null);
  
  // 🔧 FIXED: Use the correct hook
  const { verifySignature, generateAuditTrail, isVerifying, verificationResult } = useSignatureVerification();

  // Watch form values for changes
  const watchedValues = form.watch('declarations_and_signatures');
  const signerName = form.watch('patient_demographics.personal_info.first_names') + ' ' + 
                    form.watch('patient_demographics.personal_info.surname');
  const signerIdNumber = form.watch('patient_demographics.personal_info.id_number');

  useEffect(() => {
    onDataChange?.(watchedValues);
    calculateConsentProgress();
  }, [watchedValues, onDataChange]);

  const consentItems: ConsentItem[] = [
    {
      key: 'information_correct',
      title: 'Information Accuracy Declaration',
      description: 'I declare that all information provided in this questionnaire is correct and complete to the best of my knowledge.',
      required: true,
      category: 'legal',
      legalBasis: 'ECT Act Section 13 - Data integrity requirements'
    },
    {
      key: 'no_misleading_information',
      title: 'No Misleading Information Declaration',
      description: 'I confirm that I have not provided any misleading or false information in this medical questionnaire.',
      required: true,
      category: 'legal',
      legalBasis: 'Medical Schemes Act - Fraudulent misrepresentation'
    },
    {
      key: 'consent_to_medical_examination',
      title: 'Consent to Medical Examination',
      description: 'I hereby consent to undergo the medical examination and related tests as required for this occupational health assessment.',
      required: true,
      category: 'medical',
      legalBasis: 'OHSA Section 7 - Medical examination consent'
    },
    {
      key: 'consent_to_information_sharing',
      title: 'Consent to Information Sharing',
      description: 'I consent to the sharing of my medical examination results with my employer for occupational health and safety purposes, as required by law.',
      required: true,
      category: 'privacy',
      legalBasis: 'POPIA Section 11 - Consent to processing'
    },
    {
      key: 'understanding_of_rights',
      title: 'Understanding of Rights',
      description: 'I understand my rights regarding this medical examination and the use of my personal and medical information.',
      required: true,
      category: 'privacy',
      legalBasis: 'POPIA Section 18 - Data subject rights'
    },
    {
      key: 'consent_to_data_retention',
      title: 'Consent to Data Retention',
      description: 'I understand and consent to the retention of my medical records for the period required by law (minimum 5 years).',
      required: false,
      category: 'information',
      legalBasis: 'POPIA Section 14 - Retention and restriction'
    }
  ];

  const calculateConsentProgress = () => {
    const totalRequired = consentItems.filter(item => item.required).length;
    const completedRequired = consentItems.filter(item => 
      item.required && watchedValues?.employee_declaration?.[item.key]
    ).length;
    
    const progress = totalRequired > 0 ? (completedRequired / totalRequired) * 100 : 0;
    setConsentProgress(progress);
  };

  const handleSignatureCapture = async (signatureData: any) => {
    try {
      // Store signature data in form
      form.setValue('declarations_and_signatures.employee_declaration.employee_signature', signatureData.imageData);
      form.setValue('declarations_and_signatures.employee_declaration.signature_metadata', signatureData);
      form.setValue('declarations_and_signatures.employee_declaration.employee_signature_date', new Date().toISOString().split('T')[0]);

      // Verify signature
      const signerInfo = {
        name: signerName,
        idNumber: signerIdNumber,
        role: 'employee'
      };

      const verification = await verifySignature(signatureData, signerInfo);
      setSignatureVerified(verification.isValid && verification.legallyCompliant);

      // Generate audit trail
      const trail = generateAuditTrail(
        signatureData,
        signerInfo,
        form.watch('metadata.questionnaire_id') || 'QUEST_' + Date.now(),
        { id: 'system_auto', name: 'Automated Verification System' }
      );
      setAuditTrail(trail);

      // Store audit trail in form
      form.setValue('declarations_and_signatures.signature_audit_trail', trail);

      setSignatureDialogOpen(false);
    } catch (error) {
      console.error('Signature capture failed:', error);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'legal': return <Shield className="h-4 w-4 text-blue-500" />;
      case 'medical': return <FileText className="h-4 w-4 text-green-500" />;
      case 'privacy': return <Lock className="h-4 w-4 text-purple-500" />;
      case 'information': return <Info className="h-4 w-4 text-orange-500" />;
      default: return <CheckCircle2 className="h-4 w-4 text-gray-500" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'legal': return 'border-blue-200 bg-blue-50';
      case 'medical': return 'border-green-200 bg-green-50';
      case 'privacy': return 'border-purple-200 bg-purple-50';
      case 'information': return 'border-orange-200 bg-orange-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  const canProceed = () => {
    const requiredConsents = consentItems.filter(item => item.required);
    const completedConsents = requiredConsents.filter(item => 
      watchedValues?.employee_declaration?.[item.key]
    );
    
    const hasRequiredName = form.watch('declarations_and_signatures.employee_declaration.employee_name')?.trim();
    
    return completedConsents.length === requiredConsents.length && hasRequiredName;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <PenTool className="h-5 w-5" />
            Declarations and Electronic Signatures
          </h3>
          <p className="text-sm text-muted-foreground">
            Review and agree to the declarations, then provide your electronic signature
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Progress value={consentProgress} className="w-24" />
          <span className="text-sm font-medium">{Math.round(consentProgress)}%</span>
        </div>
      </div>

      {/* Consent Progress */}
      <Card className="border-blue-200 bg-blue-50/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Legal Declarations & Consent
          </CardTitle>
          <CardDescription>
            All required declarations must be acknowledged before proceeding
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {consentItems.map((item) => (
            <div
              key={item.key}
              className={`p-4 rounded-lg border ${getCategoryColor(item.category)}`}
            >
              <FormField
                control={form.control}
                name={`declarations_and_signatures.employee_declaration.${item.key}`}
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="mt-1"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none flex-1">
                      <FormLabel className="flex items-center gap-2 text-sm font-medium">
                        {getCategoryIcon(item.category)}
                        {item.title}
                        {item.required && <Badge variant="destructive" className="text-xs">Required</Badge>}
                      </FormLabel>
                      <FormDescription className="text-xs">
                        {item.description}
                      </FormDescription>
                      {item.legalBasis && (
                        <p className="text-xs text-muted-foreground italic">
                          Legal basis: {item.legalBasis}
                        </p>
                      )}
                    </div>
                  </FormItem>
                )}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Employee Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4" />
            Employee Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField
            control={form.control}
            name="declarations_and_signatures.employee_declaration.employee_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name (as it appears on your ID) *</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Enter your full legal name" 
                    {...field}
                    className="text-base"
                  />
                </FormControl>
                <FormDescription>
                  This name will be associated with your electronic signature
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      {/* Electronic Signature */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <PenTool className="h-4 w-4" />
            Electronic Signature
          </CardTitle>
          <CardDescription>
            Provide your electronic signature to complete the questionnaire
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!form.watch('declarations_and_signatures.employee_declaration.employee_signature') ? (
            <div className="text-center py-6">
              <Dialog open={signatureDialogOpen} onOpenChange={setSignatureDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    size="lg" 
                    disabled={!canProceed()}
                    className="min-w-48"
                  >
                    <PenTool className="h-4 w-4 mr-2" />
                    Sign Electronically
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <PenTool className="h-5 w-5" />
                      Electronic Signature Capture
                    </DialogTitle>
                    <DialogDescription>
                      Please sign in the area below. This signature will be legally binding and include biometric verification.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="mt-4">
                    <DigitalSignaturePad
                      ref={signaturePadRef}
                      width={600}
                      height={250}
                      signerName={signerName}
                      onSignatureCapture={handleSignatureCapture}
                      className="border rounded-lg"
                    />
                  </div>
                </DialogContent>
              </Dialog>
              
              {!canProceed() && (
                <Alert className="mt-4 border-yellow-200 bg-yellow-50">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-yellow-700">
                    Please complete all required declarations and provide your full name before signing.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Signature Verification Status */}
              {verificationResult && (
                <Alert className={`${
                  verificationResult.isValid && verificationResult.legallyCompliant
                    ? 'border-green-200 bg-green-50'
                    : 'border-yellow-200 bg-yellow-50'
                }`}>
                  <Shield className="h-4 w-4" />
                  <AlertTitle className={
                    verificationResult.isValid && verificationResult.legallyCompliant
                      ? 'text-green-800'
                      : 'text-yellow-800'
                  }>
                    Signature Verification: {verificationResult.complianceLevel.toUpperCase()} Level
                  </AlertTitle>
                  <AlertDescription className={
                    verificationResult.isValid && verificationResult.legallyCompliant
                      ? 'text-green-700'
                      : 'text-yellow-700'
                  }>
                    Trust Level: {verificationResult.trustLevel}% | 
                    Legal Compliance: {verificationResult.legallyCompliant ? '✓ Compliant' : '⚠ Issues Found'}
                  </AlertDescription>
                </Alert>
              )}

              {/* Signature Display */}
              <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Verified className="h-5 w-5 text-green-600" />
                    <span className="font-medium">Electronic Signature Captured</span>
                  </div>
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Signed
                  </Badge>
                </div>
                
                <div className="bg-white border rounded-lg p-4 mb-4">
                  <img 
                    src={form.watch('declarations_and_signatures.employee_declaration.employee_signature')}
                    alt="Electronic Signature"
                    className="max-h-24 mx-auto"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Signed by:</span>
                    <p className="text-muted-foreground">
                      {form.watch('declarations_and_signatures.employee_declaration.employee_name')}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium">Date:</span>
                    <p className="text-muted-foreground">
                      {form.watch('declarations_and_signatures.employee_declaration.employee_signature_date')}
                    </p>
                  </div>
                </div>
                
                {auditTrail && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Lock className="h-4 w-4" />
                      <span>Signature ID: {auditTrail.signatureId}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Re-sign Option */}
              <div className="flex justify-center">
                <Button
                  variant="outline"
                  onClick={() => {
                    form.setValue('declarations_and_signatures.employee_declaration.employee_signature', '');
                    form.setValue('declarations_and_signatures.employee_declaration.signature_metadata', null);
                    setSignatureVerified(false);
                    setAuditTrail(null);
                  }}
                  className="text-sm"
                >
                  <PenTool className="h-4 w-4 mr-2" />
                  Sign Again
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Legal Notice */}
      <Alert className="border-blue-200 bg-blue-50">
        <Info className="h-4 w-4" />
        <AlertTitle>Legal Notice</AlertTitle>
        <AlertDescription>
          Your electronic signature has the same legal validity as a handwritten signature in accordance with 
          the Electronic Communications and Transactions Act, 2002. This document will be stored securely 
          and may be used for legal and regulatory purposes.
        </AlertDescription>
      </Alert>

      {/* Verification Issues */}
      {verificationResult && verificationResult.issues.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Signature Verification Issues</AlertTitle>
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1">
              {verificationResult.issues.map((issue, index) => (
                <li key={index}>{issue}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Processing Status */}
      {isVerifying && (
        <Alert>
          <Clock className="h-4 w-4 animate-spin" />
          <AlertTitle>Verifying Signature</AlertTitle>
          <AlertDescription>
            Please wait while we verify your electronic signature and generate the audit trail...
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};