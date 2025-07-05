// components/EnhancedDeclarationsSection.tsx
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
import { useSignatureVerification, SignatureVerificationService } from '@/utils/signature-verification';
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
      legalBasis: 'Occupational Health and Safety Act, Section 8'
    },
    {
      key: 'no_misleading_information',
      title: 'Truth and Honesty Declaration',
      description: 'I confirm that I have not provided any misleading, false, or deliberately omitted information.',
      required: true,
      category: 'legal',
      legalBasis: 'Electronic Communications and Transactions Act, Section 13'
    },
    {
      key: 'understand_purpose',
      title: 'Purpose Understanding',
      description: 'I understand that this medical information is being collected for occupational health and safety purposes.',
      required: true,
      category: 'information',
      legalBasis: 'POPIA Section 18 - Purpose specification'
    },
    {
      key: 'consent_to_medical_examination',
      title: 'Medical Examination Consent',
      description: 'I consent to undergo the required medical examination and tests as determined by the occupational health practitioner.',
      required: true,
      category: 'medical',
      legalBasis: 'National Health Act, Section 7'
    },
    {
      key: 'consent_to_information_sharing',
      title: 'Information Sharing Consent',
      description: 'I consent to the sharing of relevant medical fitness information with my employer, limited to fitness for work and necessary restrictions only.',
      required: true,
      category: 'privacy',
      legalBasis: 'POPIA Section 11 - Consent'
    },
    {
      key: 'understand_confidentiality',
      title: 'Confidentiality Understanding',
      description: 'I understand that detailed medical information will remain confidential and will only be shared as required by law or for occupational health purposes.',
      required: false,
      category: 'privacy',
      legalBasis: 'POPIA Section 19 - Information security'
    },
    {
      key: 'right_to_withdraw',
      title: 'Right to Withdraw Consent',
      description: 'I understand my right to withdraw consent for non-essential information sharing at any time.',
      required: false,
      category: 'privacy',
      legalBasis: 'POPIA Section 11(2) - Withdrawal of consent'
    },
    {
      key: 'data_retention_understanding',
      title: 'Data Retention Understanding',
      description: 'I understand that my medical information will be retained as required by law and company policy.',
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
    
    return completedConsents.length === requiredConsents.length &&
           watchedValues?.employee_declaration?.employee_name &&
           signatureVerified;
  };

  return (
    <div className="space-y-6">
      {/* Legal Framework Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-500" />
            Legal Framework and Compliance
          </CardTitle>
          <CardDescription>
            This declaration is governed by South African legislation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium">Applicable Legislation:</h4>
              <ul className="text-sm space-y-1 text-gray-600">
                <li>• Occupational Health and Safety Act (85 of 1993)</li>
                <li>• Electronic Communications and Transactions Act (25 of 2002)</li>
                <li>• Protection of Personal Information Act (4 of 2013)</li>
                <li>• National Health Act (61 of 2003)</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Your Rights:</h4>
              <ul className="text-sm space-y-1 text-gray-600">
                <li>• Right to access your personal information</li>
                <li>• Right to correct inaccurate information</li>
                <li>• Right to withdraw consent (where applicable)</li>
                <li>• Right to lodge complaints with the Information Regulator</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Consent Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              Consent Progress
            </span>
            <Badge variant={consentProgress === 100 ? "default" : "secondary"}>
              {Math.round(consentProgress)}% Complete
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={consentProgress} className="h-3 mb-4" />
          <p className="text-sm text-gray-600">
            Please review and confirm all required declarations below
          </p>
        </CardContent>
      </Card>

      {/* Detailed Consent Items */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Declarations and Consent</CardTitle>
          <CardDescription>
            Please read each declaration carefully and confirm your agreement
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {consentItems.map((item) => (
            <FormField
              key={item.key}
              control={form.control}
              name={`declarations_and_signatures.employee_declaration.${item.key}`}
              render={({ field }) => (
                <div className={`p-4 rounded-lg border ${getCategoryColor(item.category)}`}>
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value || false}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-2 flex-1">
                      <div className="flex items-start justify-between">
                        <FormLabel className="text-sm font-medium cursor-pointer flex items-center gap-2">
                          {getCategoryIcon(item.category)}
                          {item.title}
                          {item.required && <span className="text-red-500">*</span>}
                        </FormLabel>
                        <Badge variant="outline" className="text-xs">
                          {item.category}
                        </Badge>
                      </div>
                      
                      <FormDescription className="text-sm">
                        {item.description}
                      </FormDescription>
                      
                      {item.legalBasis && (
                        <p className="text-xs text-gray-500 italic">
                          Legal basis: {item.legalBasis}
                        </p>
                      )}
                    </div>
                  </FormItem>
                </div>
              )}
            />
          ))}
        </CardContent>
      </Card>

      {/* Signer Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-purple-500" />
            Signer Information
          </CardTitle>
          <CardDescription>
            Confirm your identity for the electronic signature
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="declarations_and_signatures.employee_declaration.employee_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Legal Name *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Enter your full legal name as per ID document"
                    />
                  </FormControl>
                  <FormDescription>
                    Must match your South African ID document
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="declarations_and_signatures.employee_declaration.employee_signature_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Signature Date</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="date"
                      value={field.value || new Date().toISOString().split('T')[0]}
                      readOnly
                    />
                  </FormControl>
                  <FormDescription>
                    Date when signature is captured
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">ID Number (from form)</label>
              <Input value={signerIdNumber || ''} disabled className="bg-gray-50" />
              <p className="text-xs text-gray-500 mt-1">Automatically populated from demographics</p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700">Examination Type</label>
              <Input value={examinationType.replace('_', ' ')} disabled className="bg-gray-50" />
              <p className="text-xs text-gray-500 mt-1">Type of medical examination</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Electronic Signature */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PenTool className="h-5 w-5 text-green-500" />
            Electronic Signature
            {signatureVerified && (
              <Badge className="bg-green-100 text-green-800">
                <Verified className="h-3 w-3 mr-1" />
                Verified
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Legally binding electronic signature as per ECT Act
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!watchedValues?.employee_declaration?.employee_signature ? (
            <div className="text-center py-8">
              <PenTool className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to Sign</h3>
              <p className="text-gray-600 mb-6">
                Please provide your electronic signature to complete the declaration
              </p>
              
              <Dialog open={signatureDialogOpen} onOpenChange={setSignatureDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    size="lg" 
                    disabled={!canProceed() || !signerName.trim()}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <PenTool className="h-5 w-5 mr-2" />
                    Provide Electronic Signature
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl">
                  <DialogHeader>
                    <DialogTitle>Electronic Signature Capture</DialogTitle>
                    <DialogDescription>
                      Please sign below using your mouse, stylus, or finger. 
                      This signature will be legally binding and include biometric verification.
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
                    Legal Compliance: {verificationResult.legallyCompliant ? 'Compliant' : 'Issues Detected'}
                    {verificationResult.warnings.length > 0 && (
                      <div className="mt-2">
                        <p className="font-medium">Warnings:</p>
                        <ul className="list-disc list-inside">
                          {verificationResult.warnings.map((warning, index) => (
                            <li key={index} className="text-xs">{warning}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              {/* Signature Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Signature Details
                  </h4>
                  <div className="text-sm space-y-1">
                    <p><strong>Signer:</strong> {signerName}</p>
                    <p><strong>Date:</strong> {watchedValues?.employee_declaration?.employee_signature_date}</p>
                    <p><strong>Time:</strong> {new Date(watchedValues?.employee_declaration?.signature_metadata?.timestamp).toLocaleTimeString()}</p>
                    <p><strong>Method:</strong> Electronic signature with biometric data</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium flex items-center gap-2">
                    <Verified className="h-4 w-4" />
                    Authentication
                  </h4>
                  <div className="text-sm space-y-1">
                    <p><strong>Hash:</strong> <span className="font-mono text-xs">{watchedValues?.employee_declaration?.signature_metadata?.hash?.substring(0, 16)}...</span></p>
                    <p><strong>Biometric Strokes:</strong> {watchedValues?.employee_declaration?.signature_metadata?.biometricData?.strokeCount}</p>
                    <p><strong>Compliance:</strong> ECT Act & POPIA Compliant</p>
                    <p><strong>Status:</strong> <span className="text-green-600 font-medium">Legally Binding</span></p>
                  </div>
                </div>
              </div>

              {/* Re-sign option */}
              <div className="pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    form.setValue('declarations_and_signatures.employee_declaration.employee_signature', '');
                    form.setValue('declarations_and_signatures.employee_declaration.signature_metadata', null);
                    setSignatureVerified(false);
                    setSignatureDialogOpen(true);
                  }}
                >
                  <PenTool className="h-4 w-4 mr-2" />
                  Provide New Signature
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Completion Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-blue-500" />
            Declaration Completion Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          {canProceed() ? (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle className="text-green-800">Declarations Complete</AlertTitle>
              <AlertDescription className="text-green-700">
                All required declarations have been confirmed and your electronic signature has been 
                captured with legal compliance verification. Your questionnaire is ready for submission.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="border-yellow-200 bg-yellow-50">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle className="text-yellow-800">Declarations Incomplete</AlertTitle>
              <AlertDescription className="text-yellow-700">
                Please complete all required declarations and provide your electronic signature before proceeding.
                <div className="mt-2 space-y-1">
                  {consentItems.filter(item => item.required && !watchedValues?.employee_declaration?.[item.key]).map(item => (
                    <p key={item.key} className="text-xs">• {item.title}</p>
                  ))}
                  {!watchedValues?.employee_declaration?.employee_signature && (
                    <p className="text-xs">• Electronic signature required</p>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Next Steps */}
          {canProceed() && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2">Next Steps:</h4>
              <ol className="text-sm text-blue-700 space-y-1">
                <li>1. Submit your completed questionnaire</li>
                <li>2. Proceed to vital signs measurement station</li>
                <li>3. Complete required medical tests</li>
                <li>4. Meet with occupational health practitioner</li>
                <li>5. Receive your certificate of fitness</li>
              </ol>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};