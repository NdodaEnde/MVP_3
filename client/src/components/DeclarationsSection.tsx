// client/src/components/DeclarationsSection.tsx
import React, { useState, useRef, useEffect } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { 
  PenTool,
  CheckCircle2,
  AlertTriangle,
  Shield,
  FileText,
  User,
  Calendar,
  Signature,
  Lock,
  Eye
} from 'lucide-react';

// For signature capture - you would install react-signature-canvas
// import SignatureCanvas from 'react-signature-canvas';

interface DeclarationsSectionProps {
  form: UseFormReturn<any>;
  examinationType: string;
  onDataChange?: (data: any) => void;
}

// Simple signature canvas placeholder component
const SignatureCanvas = ({ onEnd, onBegin, ref: canvasRef, ...props }: any) => {
  const canvasRefInternal = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (canvasRef) {
      canvasRef.current = canvasRefInternal.current;
    }
  }, [canvasRef]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRefInternal.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setIsDrawing(true);
    setLastPos({ x, y });
    onBegin?.();
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRefInternal.current) return;
    
    const canvas = canvasRefInternal.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    ctx.beginPath();
    ctx.moveTo(lastPos.x, lastPos.y);
    ctx.lineTo(x, y);
    ctx.stroke();
    
    setLastPos({ x, y });
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    onEnd?.();
  };

  return (
    <canvas
      ref={canvasRefInternal}
      width={props.width || 400}
      height={props.height || 200}
      style={{ border: '1px solid #ccc', cursor: 'crosshair', ...props.style }}
      onMouseDown={startDrawing}
      onMouseMove={draw}
      onMouseUp={stopDrawing}
      onMouseLeave={stopDrawing}
    />
  );
};

const DigitalSignature: React.FC<{
  label: string;
  required?: boolean;
  onSignature: (dataURL: string) => void;
  value?: string;
}> = ({ label, required = true, onSignature, value }) => {
  const sigCanvasRef = useRef<any>(null);
  const [hasSignature, setHasSignature] = useState(!!value);

  const clearSignature = () => {
    if (sigCanvasRef.current) {
      const canvas = sigCanvasRef.current;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    setHasSignature(false);
    onSignature('');
  };

  const saveSignature = () => {
    if (sigCanvasRef.current) {
      const dataURL = sigCanvasRef.current.toDataURL();
      setHasSignature(true);
      onSignature(dataURL);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-base font-medium">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        {hasSignature && (
          <Badge variant="default" className="bg-green-100 text-green-800">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Signed
          </Badge>
        )}
      </div>
      
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50">
        <SignatureCanvas
          ref={sigCanvasRef}
          onEnd={saveSignature}
          width={400}
          height={150}
          style={{ width: '100%', height: '150px', background: 'white', borderRadius: '4px' }}
        />
        
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-gray-600">
            Please sign in the box above using your mouse or touch device
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={clearSignature}
          >
            Clear Signature
          </Button>
        </div>
      </div>

      {hasSignature && (
        <div className="mt-4">
          <p className="text-sm text-green-600 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Signature captured successfully
          </p>
        </div>
      )}
    </div>
  );
};

export const DeclarationsSection: React.FC<DeclarationsSectionProps> = ({
  form,
  examinationType,
  onDataChange
}) => {
  const [consentGiven, setConsentGiven] = useState(false);
  const [declarationsComplete, setDeclarationsComplete] = useState(false);

  // Watch form values for changes
  const watchedValues = form.watch('declarations_and_signatures');

  useEffect(() => {
    onDataChange?.(watchedValues);
    checkCompletionStatus();
  }, [watchedValues, onDataChange]);

  const checkCompletionStatus = () => {
    const declarations = watchedValues?.employee_declaration || {};
    const complete = 
      declarations.information_correct &&
      declarations.no_misleading_information &&
      declarations.employee_name &&
      declarations.employee_signature;
    
    setDeclarationsComplete(complete);
  };

  const declarationStatements = [
    {
      key: 'information_correct',
      text: 'I declare that the information provided in this questionnaire is correct and complete to the best of my knowledge.',
      critical: true
    },
    {
      key: 'no_misleading_information',
      text: 'I confirm that I have not provided any misleading or false information.',
      critical: true
    },
    {
      key: 'understand_purpose',
      text: 'I understand that this medical information is being collected for occupational health and safety purposes.',
      critical: false
    },
    {
      key: 'consent_to_medical_examination',
      text: 'I consent to undergo the required medical examination and tests as determined by the occupational health practitioner.',
      critical: true
    },
    {
      key: 'consent_to_information_sharing',
      text: 'I consent to the sharing of relevant medical fitness information with my employer, limited to fitness for work and any necessary restrictions.',
      critical: true
    },
    {
      key: 'understand_confidentiality',
      text: 'I understand that detailed medical information will remain confidential and will only be shared as required by law or for occupational health purposes.',
      critical: false
    }
  ];

  const privacyStatements = [
    'Your personal and medical information is collected in terms of the Occupational Health and Safety Act.',
    'Medical details will remain confidential between you and the occupational health practitioner.',
    'Only fitness determinations and work restrictions will be communicated to your employer.',
    'You have the right to access and correct your personal information.',
    'Information may be retained as required by law and company policy.'
  ];

  return (
    <div className="space-y-6">
      {/* Information Notice */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-500" />
            Important Information
          </CardTitle>
          <CardDescription>
            Please read this information carefully before proceeding
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="border-blue-200 bg-blue-50">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Purpose of Medical Examination</AlertTitle>
            <AlertDescription className="space-y-2">
              <p>
                This occupational health examination is conducted to:
              </p>
              <ul className="list-disc list-inside space-y-1 mt-2">
                <li>Determine your fitness for the specific work requirements</li>
                <li>Identify any health risks related to your work environment</li>
                <li>Ensure workplace safety for you and your colleagues</li>
                <li>Comply with occupational health and safety legislation</li>
                <li>Provide appropriate health surveillance as required</li>
              </ul>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Privacy and Confidentiality */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-green-500" />
            Privacy and Confidentiality
          </CardTitle>
          <CardDescription>
            How your information will be used and protected
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {privacyStatements.map((statement, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-medium text-green-600">{index + 1}</span>
                </div>
                <p className="text-sm text-gray-700">{statement}</p>
              </div>
            ))}
          </div>
          
          <Separator className="my-4" />
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <Eye className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-800">What will be shared with your employer:</h4>
                <ul className="text-sm text-yellow-700 mt-1 space-y-1">
                  <li>• Fitness determination (Fit/Fit with restrictions/Unfit)</li>
                  <li>• Specific work restrictions if applicable</li>
                  <li>• Recommended review dates</li>
                  <li>• Certificate of fitness validity period</li>
                </ul>
                <p className="text-sm text-yellow-700 mt-2 font-medium">
                  Detailed medical information will NOT be shared with your employer.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Employee Declarations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-purple-500" />
            Employee Declaration and Consent
          </CardTitle>
          <CardDescription>
            Please read each statement carefully and confirm your agreement
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            {declarationStatements.map((statement) => (
              <FormField
                key={statement.key}
                control={form.control}
                name={`declarations_and_signatures.employee_declaration.${statement.key}`}
                render={({ field }) => (
                  <FormItem className={`flex flex-row items-start space-x-3 space-y-0 p-4 rounded-lg border ${
                    statement.critical ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-gray-50'
                  }`}>
                    <FormControl>
                      <Checkbox
                        checked={field.value || false}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className={`text-sm font-medium cursor-pointer ${
                        statement.critical ? 'text-red-800' : 'text-gray-800'
                      }`}>
                        {statement.text}
                        {statement.critical && <span className="text-red-500 ml-1">*</span>}
                      </FormLabel>
                      {statement.critical && (
                        <FormDescription className="text-red-600">
                          This declaration is required to proceed
                        </FormDescription>
                      )}
                    </div>
                  </FormItem>
                )}
              />
            ))}
          </div>

          <Separator />

          {/* Employee Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="declarations_and_signatures.employee_declaration.employee_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name (as per ID document) *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Enter your full legal name"
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
                  <FormLabel>Date</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="date"
                      value={field.value || new Date().toISOString().split('T')[0]}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Digital Signature */}
          <div>
            <DigitalSignature
              label="Employee Signature"
              onSignature={(signature) => 
                form.setValue('declarations_and_signatures.employee_declaration.employee_signature', signature)
              }
              value={form.watch('declarations_and_signatures.employee_declaration.employee_signature')}
              required={true}
            />
          </div>
        </CardContent>
      </Card>

      {/* Health Practitioner Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-green-500" />
            Health Practitioner Review
          </CardTitle>
          <CardDescription>
            To be completed by the attending occupational health practitioner
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle className="text-green-800">For Official Use Only</AlertTitle>
              <AlertDescription className="text-green-700">
                This section will be completed by the occupational health practitioner during your examination.
                You do not need to fill in any information in this section.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 opacity-50">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-2">
                  Practitioner Name
                </label>
                <Input disabled placeholder="To be completed by practitioner" />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-2">
                  Practice Number
                </label>
                <Input disabled placeholder="To be completed by practitioner" />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-2">
                  Review Date
                </label>
                <Input disabled type="date" />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-2">
                  Review Time
                </label>
                <Input disabled type="time" />
              </div>
            </div>

            <div className="opacity-50">
              <label className="block text-sm font-medium text-gray-500 mb-2">
                Practitioner Comments
              </label>
              <textarea
                disabled
                rows={4}
                className="w-full p-3 border border-gray-300 rounded-md bg-gray-100"
                placeholder="Clinical findings, recommendations, and fitness determination rationale will be documented here by the health practitioner..."
              />
            </div>

            <div className="opacity-50">
              <label className="block text-sm font-medium text-gray-500 mb-2">
                Practitioner Digital Signature
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 bg-gray-100 text-center">
                <Signature className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Digital signature will be captured during examination</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Completion Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-blue-500" />
            Questionnaire Completion Status
          </CardTitle>
          <CardDescription>
            Review your completion status before submitting
          </CardDescription>
        </CardHeader>
        <CardContent>
          {declarationsComplete ? (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle className="text-green-800">Ready for Submission</AlertTitle>
              <AlertDescription className="text-green-700">
                All required declarations have been completed and your digital signature has been captured.
                You may now submit your questionnaire.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="border-yellow-200 bg-yellow-50">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle className="text-yellow-800">Incomplete Declarations</AlertTitle>
              <AlertDescription className="text-yellow-700">
                Please complete all required declarations and provide your digital signature before submitting.
              </AlertDescription>
            </Alert>
          )}

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              {declarationsComplete ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
              )}
              <span className="text-sm font-medium">
                Employee Declarations: {declarationsComplete ? 'Complete' : 'Incomplete'}
              </span>
            </div>
            
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <span className="text-sm font-medium">
                Privacy Notice: Acknowledged
              </span>
            </div>
          </div>

          <Separator className="my-6" />

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 mb-2">Next Steps:</h4>
            <ol className="text-sm text-blue-700 space-y-1">
              <li>1. Submit your completed questionnaire</li>
              <li>2. Proceed to the next station for vital signs measurement</li>
              <li>3. Complete any required medical tests</li>
              <li>4. Meet with the occupational health practitioner for review</li>
              <li>5. Receive your certificate of fitness</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};