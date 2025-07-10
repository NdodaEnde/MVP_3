import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/useToast';
import { DraftCertificateData, DraftCertificateGenerator } from '@/services/certificateGenerator';
import {
  Stethoscope,
  FileText,
  Eye,
  Stamp,
  AlertTriangle,
  CheckCircle,
  ClipboardCheck,
  Download,
  Save,
  User
} from 'lucide-react';

interface DoctorCertificateReviewProps {
  patientId: string;
  patientName: string;
  onCertificateGenerated?: (certificateData: any) => void;
}

export function DoctorCertificateReview({ 
  patientId, 
  patientName, 
  onCertificateGenerated 
}: DoctorCertificateReviewProps) {
  const [draftCertificate, setDraftCertificate] = useState<DraftCertificateData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentTab, setCurrentTab] = useState('patient-data');
  const { toast } = useToast();

  // Doctor's review form state
  const [fitnessStatus, setFitnessStatus] = useState<string>('');
  const [restrictions, setRestrictions] = useState<string[]>([]);
  const [newRestriction, setNewRestriction] = useState('');
  const [referralActions, setReferralActions] = useState({
    heights: false,
    dustExposure: false,
    motorisedEquipment: false,
    wearHearingProtection: false,
    confinedSpaces: false,
    chemicalExposure: false,
    wearSpectacles: false,
    remainOnTreatment: false
  });
  const [doctorComments, setDoctorComments] = useState('');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [practitionerName, setPractitionerName] = useState('Dr. M Mphuthi');
  const [practiceNumber, setPracticeNumber] = useState('0404160');

  useEffect(() => {
    loadDraftCertificate();
  }, [patientId]);

  const loadDraftCertificate = async () => {
    try {
      setIsLoading(true);
      const draft = await DraftCertificateGenerator.generateDraftCertificate(patientId);
      setDraftCertificate(draft);
    } catch (error) {
      console.error('Error loading draft certificate:', error);
      toast({
        title: "Error",
        description: "Failed to load patient medical data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addRestriction = () => {
    if (newRestriction.trim() && !restrictions.includes(newRestriction.trim())) {
      setRestrictions([...restrictions, newRestriction.trim()]);
      setNewRestriction('');
    }
  };

  const removeRestriction = (index: number) => {
    setRestrictions(restrictions.filter((_, i) => i !== index));
  };

  const handleReferralActionChange = (action: string, checked: boolean) => {
    setReferralActions(prev => ({
      ...prev,
      [action]: checked
    }));
  };

  const validateDoctorReview = (): boolean => {
    if (!fitnessStatus) {
      toast({
        title: "Validation Error",
        description: "Please select a fitness status",
        variant: "destructive",
      });
      return false;
    }

    if (!practitionerName.trim()) {
      toast({
        title: "Validation Error", 
        description: "Practitioner name is required",
        variant: "destructive",
      });
      return false;
    }

    if (!practiceNumber.trim()) {
      toast({
        title: "Validation Error",
        description: "Practice number is required", 
        variant: "destructive",
      });
      return false;
    }

    if (fitnessStatus !== 'fit' && restrictions.length === 0 && !doctorComments.trim()) {
      toast({
        title: "Validation Error",
        description: "Please provide restrictions or comments for non-fit status",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const saveDoctorReview = () => {
    if (!validateDoctorReview() || !draftCertificate) return;

    // Update draft certificate with doctor's review
    const updatedDraft = {
      ...draftCertificate,
      doctorReview: {
        ...draftCertificate.doctorReview,
        fitnessStatus: fitnessStatus as any,
        restrictions,
        referralActions,
        doctorComments,
        clinicalNotes,
        practitionerName,
        practiceNumber,
        dateReviewed: new Date().toISOString().split('T')[0],
        approved: false
      }
    };

    setDraftCertificate(updatedDraft);

    toast({
      title: "Review Saved",
      description: "Medical review has been saved successfully",
    });
  };

  const finalizeCertificate = async () => {
    if (!validateDoctorReview() || !draftCertificate) return;

    setIsGenerating(true);

    try {
      // First save the current review
      saveDoctorReview();

      // Then finalize the certificate
      const finalCertificateBuffer = await DraftCertificateGenerator.finalizeCertificate(
        draftCertificate,
        {
          practitionerName,
          practiceNumber,
          digitalSignature: `Dr. ${practitionerName}`,
          officialStamp: 'Official Medical Stamp'
        }
      );

      // Download the final certificate
      const blob = new Blob([finalCertificateBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Certificate_of_Fitness_${patientName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Certificate Generated",
        description: `Certificate of Fitness for ${patientName} has been generated and signed`,
      });

      if (onCertificateGenerated) {
        onCertificateGenerated(draftCertificate);
      }

    } catch (error) {
      console.error('Error finalizing certificate:', error);
      toast({
        title: "Error",
        description: "Failed to generate final certificate",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading patient medical data...</p>
        </CardContent>
      </Card>
    );
  }

  if (!draftCertificate) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Unable to load patient medical data. Please ensure all examination steps are completed.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Stethoscope className="h-6 w-6" />
            Medical Review & Certificate Generation
          </CardTitle>
          <CardDescription>
            Patient: <strong>{patientName}</strong> | ID: {draftCertificate.patientInfo.idNumber}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Tabs for different sections */}
      <Tabs value={currentTab} onValueChange={setCurrentTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="patient-data">Patient Data</TabsTrigger>
          <TabsTrigger value="test-results">Test Results</TabsTrigger>
          <TabsTrigger value="medical-review">Medical Review</TabsTrigger>
          <TabsTrigger value="certificate">Final Certificate</TabsTrigger>
        </TabsList>

        {/* Patient Data Tab */}
        <TabsContent value="patient-data">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Patient Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Patient Name</Label>
                  <p className="font-medium">{draftCertificate.patientInfo.initials} {draftCertificate.patientInfo.surname}</p>
                </div>
                <div>
                  <Label>ID Number</Label>
                  <p className="font-medium">{draftCertificate.patientInfo.idNumber}</p>
                </div>
                <div>
                  <Label>Company</Label>
                  <p className="font-medium">{draftCertificate.patientInfo.companyName}</p>
                </div>
                <div>
                  <Label>Examination Type</Label>
                  <Badge className="capitalize">
                    {draftCertificate.patientInfo.examinationType.replace('-', ' ')}
                  </Badge>
                </div>
              </div>

              {/* Medical History Summary */}
              <div className="mt-6">
                <Label>Significant Medical Conditions</Label>
                <div className="mt-2">
                  {draftCertificate.medicalHistorySummary.significantConditions.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {draftCertificate.medicalHistorySummary.significantConditions.map((condition, index) => (
                        <Badge key={index} variant="outline">{condition}</Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No significant conditions reported</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Test Results Tab */}
        <TabsContent value="test-results">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardCheck className="h-5 w-5" />
                Medical Test Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="p-3 border rounded-lg">
                    <Label>Vital Signs</Label>
                    <p className="text-sm text-muted-foreground">
                      BP: {draftCertificate.medicalTestResults.vitalSigns.bloodPressure}<br />
                      Pulse: {draftCertificate.medicalTestResults.vitalSigns.pulse}<br />
                      BMI: {draftCertificate.medicalTestResults.vitalSigns.bmi}
                    </p>
                  </div>
                  
                  <div className="p-3 border rounded-lg">
                    <Label>Vision Test</Label>
                    <p className="text-sm text-muted-foreground">
                      {draftCertificate.medicalTestResults.vision.results}
                    </p>
                  </div>
                  
                  <div className="p-3 border rounded-lg">
                    <Label>Hearing Test</Label>
                    <p className="text-sm text-muted-foreground">
                      {draftCertificate.medicalTestResults.hearing.results}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="p-3 border rounded-lg">
                    <Label>Lung Function</Label>
                    <p className="text-sm text-muted-foreground">
                      {draftCertificate.medicalTestResults.lungFunction.results}
                    </p>
                  </div>
                  
                  <div className="p-3 border rounded-lg">
                    <Label>Drug Screen</Label>
                    <p className="text-sm text-muted-foreground">
                      {draftCertificate.medicalTestResults.drugScreen.results}
                    </p>
                  </div>
                  
                  <div className="p-3 border rounded-lg">
                    <Label>Working at Heights</Label>
                    <p className="text-sm text-muted-foreground">
                      {draftCertificate.medicalTestResults.workingAtHeights.results}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Medical Review Tab - Doctor Input */}
        <TabsContent value="medical-review">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Stethoscope className="h-5 w-5" />
                Doctor's Medical Review
              </CardTitle>
              <CardDescription>
                Complete your medical assessment and fitness determination
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Fitness Status */}
              <div>
                <Label>Fitness Status *</Label>
                <Select value={fitnessStatus} onValueChange={setFitnessStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select fitness status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fit">FIT</SelectItem>
                    <SelectItem value="fit-with-restriction">Fit with Restriction</SelectItem>
                    <SelectItem value="fit-with-condition">Fit with Condition</SelectItem>
                    <SelectItem value="temporary-unfit">Temporary Unfit</SelectItem>
                    <SelectItem value="unfit">UNFIT</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Restrictions */}
              <div>
                <Label>Work Restrictions</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    placeholder="Add restriction..."
                    value={newRestriction}
                    onChange={(e) => setNewRestriction(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addRestriction()}
                  />
                  <Button onClick={addRestriction} variant="outline">Add</Button>
                </div>
                <div className="space-y-2">
                  {restrictions.map((restriction, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm">{restriction}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeRestriction(index)}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Referral Actions */}
              <div>
                <Label>Referral Actions Required</Label>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  {Object.entries(referralActions).map(([key, value]) => (
                    <div key={key} className="flex items-center space-x-2">
                      <Checkbox
                        id={key}
                        checked={value}
                        onCheckedChange={(checked) => handleReferralActionChange(key, !!checked)}
                      />
                      <Label htmlFor={key} className="text-sm capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Doctor's Comments */}
              <div>
                <Label>Medical Comments</Label>
                <Textarea
                  placeholder="Enter your medical comments and recommendations..."
                  value={doctorComments}
                  onChange={(e) => setDoctorComments(e.target.value)}
                  rows={4}
                />
              </div>

              {/* Clinical Notes */}
              <div>
                <Label>Clinical Notes (Internal)</Label>
                <Textarea
                  placeholder="Internal clinical notes (not printed on certificate)..."
                  value={clinicalNotes}
                  onChange={(e) => setClinicalNotes(e.target.value)}
                  rows={3}
                />
              </div>

              {/* Practitioner Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Practitioner Name *</Label>
                  <Input
                    value={practitionerName}
                    onChange={(e) => setPractitionerName(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Practice Number *</Label>
                  <Input
                    value={practiceNumber}
                    onChange={(e) => setPracticeNumber(e.target.value)}
                  />
                </div>
              </div>

              {/* Save Review Button */}
              <Button onClick={saveDoctorReview} className="w-full">
                <Save className="h-4 w-4 mr-2" />
                Save Medical Review
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Final Certificate Tab */}
        <TabsContent value="certificate">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Generate Final Certificate
              </CardTitle>
              <CardDescription>
                Review and generate the official Certificate of Fitness
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Certificate Status */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2">Certificate Status</h4>
                {fitnessStatus ? (
                  <div className="space-y-2">
                    <Badge className="capitalize">
                      {fitnessStatus.replace('-', ' ')}
                    </Badge>
                    {restrictions.length > 0 && (
                      <div>
                        <p className="text-sm font-medium">Restrictions:</p>
                        <ul className="text-sm text-muted-foreground list-disc list-inside">
                          {restrictions.map((restriction, index) => (
                            <li key={index}>{restriction}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {doctorComments && (
                      <div>
                        <p className="text-sm font-medium">Comments:</p>
                        <p className="text-sm text-muted-foreground">{doctorComments}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Please complete the medical review before generating the certificate.
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              {/* Generate Certificate Button */}
              <Button
                onClick={finalizeCertificate}
                disabled={!fitnessStatus || isGenerating}
                className="w-full"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Generating Certificate...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Generate & Sign Certificate
                  </>
                )}
              </Button>

              <div className="text-sm text-muted-foreground text-center">
                <Stamp className="h-4 w-4 inline mr-1" />
                The certificate will be digitally signed and stamped upon generation
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default DoctorCertificateReview;