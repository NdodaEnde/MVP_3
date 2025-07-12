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

interface WorkingQuestionnaireDeclarationProps {
  form: UseFormReturn<any>;
}

interface ConsentItem {
  key: string;
  title: string;
  description: string;
  required: boolean;
  category: 'legal' | 'medical' | 'privacy' | 'information';
  legalBasis?: string;
}

// Simple signature canvas component
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

export const WorkingQuestionnaireDeclaration: React.FC<WorkingQuestionnaireDeclarationProps> = ({
  form
}) => {
  const [signatureDialogOpen, setSignatureDialogOpen] = useState(false);
  const [consentProgress, setConsentProgress] = useState(0);
  
  const signaturePadRef = useRef<any>(null);

  // Watch form values for changes
  const watchedValues = form.watch('declaration');

  useEffect(() => {
    calculateConsentProgress();
  }, [watchedValues]);

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
    }
  ];

  const calculateConsentProgress = () => {
    const totalRequired = consentItems.filter(item => item.required).length;
    const completedRequired = consentItems.filter(item => 
      item.required && watchedValues?.[item.key]
    ).length;
    
    const progress = totalRequired > 0 ? (completedRequired / totalRequired) * 100 : 0;
    setConsentProgress(progress);
  };

  const handleSignatureCapture = async () => {
    if (signaturePadRef.current) {
      const dataURL = signaturePadRef.current.toDataURL();
      form.setValue('declaration.signature', dataURL);
      form.setValue('declaration.date', new Date().toISOString().split('T')[0]);
      setSignatureDialogOpen(false);
    }
  };

  const clearSignature = () => {
    if (signaturePadRef.current) {
      const canvas = signaturePadRef.current;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    form.setValue('declaration.signature', '');
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
      watchedValues?.[item.key]
    );
    
    return completedConsents.length === requiredConsents.length;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <PenTool className="h-5 w-5" />
            Enhanced Declarations and Electronic Signatures
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
                name={`declaration.${item.key}`}
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
          {!form.watch('declaration.signature') ? (
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
                      Please sign in the area below. This signature will be legally binding.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="mt-4">
                    <SignatureCanvas
                      ref={signaturePadRef}
                      width={600}
                      height={250}
                      onEnd={handleSignatureCapture}
                      style={{ border: '1px solid #ccc', borderRadius: '8px', background: 'white' }}
                    />
                    <div className="flex justify-between mt-4">
                      <Button variant="outline" onClick={clearSignature}>
                        Clear
                      </Button>
                      <Button onClick={handleSignatureCapture}>
                        Save Signature
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              
              {!canProceed() && (
                <Alert className="mt-4 border-yellow-200 bg-yellow-50">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-yellow-700">
                    Please complete all required declarations before signing.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          ) : (
            <div className="space-y-4">
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
                    src={form.watch('declaration.signature')}
                    alt="Electronic Signature"
                    className="max-h-24 mx-auto"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Signed by:</span>
                    <p className="text-muted-foreground">
                      {form.watch('personalHistory.firstNames')} {form.watch('personalHistory.surname')}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium">Date:</span>
                    <p className="text-muted-foreground">
                      {form.watch('declaration.date')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Re-sign Option */}
              <div className="flex justify-center">
                <Button
                  variant="outline"
                  onClick={() => {
                    form.setValue('declaration.signature', '');
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
    </div>
  );
};