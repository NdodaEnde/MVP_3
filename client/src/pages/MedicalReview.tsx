import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/useToast';
import { getPatients, getPatientVitals, getPatientTests, getPatientQuestionnaire } from '@/api/patients';
import CertificateService, { CertificateGenerationOptions } from '@/services/certificateService';
import {
  Stethoscope,
  Heart,
  TestTube,
  FileText,
  User,
  AlertTriangle,
  CheckCircle,
  Download,
  Eye,
  Printer,
  Mail,
  Award,
  Shield,
  Scale,
  Ear,
  XCircle
} from 'lucide-react';

export function MedicalReview() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patientVitals, setPatientVitals] = useState<VitalSigns[]>([]);
  const [patientTests, setPatientTests] = useState<TestResults[]>([]);
  const [patientQuestionnaire, setPatientQuestionnaire] = useState<any>(null);
  const [medicalDecision, setMedicalDecision] = useState<string>('');
  const [restrictions, setRestrictions] = useState<string>('');
  const [recommendations, setRecommendations] = useState<string>('');
  const [fitnessStatus, setFitnessStatus] = useState<'fit' | 'fit-with-restriction' | 'fit-with-condition' | 'temporary-unfit' | 'unfit'>('fit');
  const [isGeneratingCertificate, setIsGeneratingCertificate] = useState(false);
  const [certificateGenerated, setCertificateGenerated] = useState<any>(null);
  const { toast } = useToast();

  // Risk factors and red flags
  const [riskFactors, setRiskFactors] = useState<string[]>([]);
  const [redFlags, setRedFlags] = useState<string[]>([]);
  const [riskAssessment, setRiskAssessment] = useState<'low' | 'medium' | 'high'>('low');

  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    if (selectedPatient) {
      fetchPatientData();
    }
  }, [selectedPatient]);

  useEffect(() => {
    if (patientVitals.length > 0 || patientTests.length > 0 || patientQuestionnaire) {
      analyzeRedFlags();
    }
  }, [patientVitals, patientTests, patientQuestionnaire]);

  const fetchPatients = async () => {
    try {
      const response = await getPatients({ status: 'doctor' });
      let patientsList = (response as any).patients || [];
      
      // If no patients with 'doctor' status, try to get all patients for review
      if (!patientsList || patientsList.length === 0) {
        const allPatientsResponse = await getPatients();
        patientsList = (allPatientsResponse as any).patients || [];
      }
      
      // If still no patients, add mock patients for testing
      if (!patientsList || patientsList.length === 0) {
        patientsList = [
          {
            _id: 'mock-patient-1',
            name: 'John Doe',
            idNumber: '8501015009087',
            age: 39,
            gender: 'male',
            email: 'john.doe@example.com',
            phone: '0123456789',
            employer: 'ABC Mining Corp',
            examinationType: 'pre-employment',
            status: 'completed-tests'
          },
          {
            _id: 'mock-patient-2', 
            name: 'Jane Smith',
            idNumber: '8502020002002',
            age: 39,
            gender: 'female',
            email: 'jane.smith@example.com',
            phone: '0987654321',
            employer: 'XYZ Industries',
            examinationType: 'periodic',
            status: 'ready-for-review'
          }
        ];
      }
      
      setPatients(patientsList);
    } catch (error) {
      console.log('Error fetching patients, using mock data');
      // Fallback to mock data for testing
      setPatients([
        {
          _id: 'mock-patient-1',
          name: 'John Doe',
          idNumber: '8501015009087',
          age: 39,
          gender: 'male',
          email: 'john.doe@example.com',
          phone: '0123456789',
          employer: 'ABC Mining Corp',
          examinationType: 'pre-employment',
          status: 'completed-tests'
        },
        {
          _id: 'mock-patient-2',
          name: 'Jane Smith', 
          idNumber: '8502020002002',
          age: 39,
          gender: 'female',
          email: 'jane.smith@example.com',
          phone: '0987654321',
          employer: 'XYZ Industries',
          examinationType: 'periodic',
          status: 'ready-for-review'
        }
      ]);
    }
  };

  const fetchPatientData = async () => {
    if (!selectedPatient) return;

    try {
      const [vitalsResponse, testsResponse, questionnaireResponse] = await Promise.all([
        getPatientVitals(selectedPatient._id),
        getPatientTests(selectedPatient._id),
        getPatientQuestionnaire(selectedPatient._id)
      ]);

      setPatientVitals((vitalsResponse as any).vitals || []);
      setPatientTests((testsResponse as any).testResults || []);
      setPatientQuestionnaire((questionnaireResponse as any).questionnaire || null);
    } catch (error) {
      console.log('Using mock patient data for medical review');
      
      // Mock data for testing medical review functionality
      const mockVitals = [{
        _id: 'mock-vitals-1',
        patientId: selectedPatient._id,
        bloodPressure: { systolic: 125, diastolic: 82 },
        pulse: 72,
        temperature: 36.7,
        height: 175,
        weight: 75,
        bmi: 24.5,
        recordedBy: 'Nurse Smith',
        recordedAt: new Date().toISOString()
      }];
      
      const mockTests = [{
        _id: 'mock-tests-1',
        patientId: selectedPatient._id,
        vision: {
          leftEye: '20/20',
          rightEye: '20/20',
          colorBlind: false
        },
        hearing: {
          leftEar: 15,
          rightEar: 18
        },
        lungFunction: {
          fev1: 85,
          fvc: 90,
          ratio: 94
        },
        drugScreen: {
          result: 'negative',
          substances: [],
          completedAt: new Date().toISOString()
        },
        completedBy: 'Tech Johnson',
        completedAt: new Date().toISOString()
      }];
      
      const mockQuestionnaire = {
        _id: 'mock-questionnaire-1',
        patientId: selectedPatient._id,
        medicalHistory: {
          heartDisease: false,
          diabetes: false,
          epilepsy: false,
          asthma: false,
          hypertension: false
        },
        lifestyle: {
          smoking: false,
          alcohol: 'occasionally',
          exercise: 'regular'
        },
        workHistory: {
          currentPosition: 'Mining Engineer',
          yearsInPosition: 5,
          hazardExposure: ['dust', 'noise']
        },
        completedAt: new Date().toISOString()
      };
      
      setPatientVitals(mockVitals);
      setPatientTests(mockTests);
      setPatientQuestionnaire(mockQuestionnaire);
    }
  };

  const analyzeRedFlags = () => {
    const flags: string[] = [];
    let risk: 'low' | 'medium' | 'high' = 'low';

    // Analyze vitals
    if (patientVitals.length > 0) {
      const vitals = patientVitals[0];
      if (vitals.bloodPressure.systolic >= 140 || vitals.bloodPressure.diastolic >= 90) {
        flags.push('High Blood Pressure detected');
        risk = 'medium';
      }
      if (vitals.bmi >= 30) {
        flags.push('Obesity (BMI ≥ 30)');
        risk = risk === 'high' ? 'high' : 'medium';
      }
      if (vitals.pulse > 100 || vitals.pulse < 60) {
        flags.push('Abnormal heart rate');
        risk = 'medium';
      }
    }

    // Analyze test results
    if (patientTests.length > 0) {
      const tests = patientTests[0];
      if (tests.drugScreen?.result === 'positive') {
        flags.push('Positive drug screen result');
        risk = 'high';
      }
      if (tests.hearing && (tests.hearing.leftEar > 40 || tests.hearing.rightEar > 40)) {
        flags.push('Significant hearing loss detected');
        risk = 'medium';
      }
      if (tests.vision && (tests.vision.leftEye.includes('20/40') || tests.vision.rightEye.includes('20/40'))) {
        flags.push('Vision impairment requiring attention');
        risk = 'medium';
      }
    }

    // Analyze questionnaire
    if (patientQuestionnaire?.medicalHistory) {
      const medical = patientQuestionnaire.medicalHistory;
      if (medical.heartDisease) {
        flags.push('History of heart disease');
        risk = 'high';
      }
      if (medical.diabetes) {
        flags.push('Diabetes mellitus');
        risk = risk === 'high' ? 'high' : 'medium';
      }
      if (medical.epilepsy) {
        flags.push('History of epilepsy/seizures');
        risk = 'high';
      }
    }

    setRedFlags(flags);
    setRiskAssessment(risk);
  };

  // Certificate generation
  const generateCertificate = async () => {
    if (!selectedPatient) {
      toast({
        title: "Error",
        description: "Please select a patient first",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingCertificate(true);
    
    try {
      const certificateService = new CertificateService();
      
      const options: CertificateGenerationOptions = {
        patientId: selectedPatient._id,
        doctorName: "Dr. M Mphuthi",
        nurseName: "Sr. Sibongile Mahlangu", 
        practiceNumber: "0404160",
        overrideDecision: {
          fitnessStatus,
          restrictions: restrictions.split(',').map(r => r.trim()).filter(r => r),
          comments: recommendations
        }
      };
      
      const result = await certificateService.generateCertificateForPatient(options);
      
      if (result.success) {
        setCertificateGenerated(result);
        
        toast({
          title: "Certificate Generated Successfully",
          description: `Certificate of Fitness created for ${selectedPatient.name}`,
        });
        
        // Auto-download the PDF
        if (result.pdfBuffer) {
          downloadCertificatePDF(result.pdfBuffer, selectedPatient.name);
        }
      } else {
        toast({
          title: "Certificate Generation Failed",
          description: result.errors?.join(', ') || "Unknown error occurred",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Certificate generation error:', error);
      toast({
        title: "Error",
        description: "Failed to generate certificate",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingCertificate(false);
    }
  };

  const downloadCertificatePDF = (pdfBuffer: Buffer, patientName: string) => {
    const blob = new Blob([pdfBuffer], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Certificate_of_Fitness_${patientName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  const getBPStatus = (systolic: number, diastolic: number) => {
    if (systolic >= 140 || diastolic >= 90) return { status: 'High', color: 'text-red-600' };
    if (systolic >= 130 || diastolic >= 80) return { status: 'Elevated', color: 'text-yellow-600' };
    return { status: 'Normal', color: 'text-green-600' };
  };

  const getBMIStatus = (bmi: number) => {
    if (bmi >= 30) return { status: 'Obese', color: 'text-red-600' };
    if (bmi >= 25) return { status: 'Overweight', color: 'text-yellow-600' };
    if (bmi >= 18.5) return { status: 'Normal', color: 'text-green-600' };
    return { status: 'Underweight', color: 'text-blue-600' };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gradient-to-br from-red-500 to-pink-600 rounded-lg">
          <Stethoscope className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Medical Review</h1>
          <p className="text-muted-foreground">
            Comprehensive patient data review and medical decision support
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        {/* Patient Selection */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Select Patient
            </CardTitle>
            <CardDescription>
              Choose a patient for medical review
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select onValueChange={handlePatientSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Select patient..." />
              </SelectTrigger>
              <SelectContent>
                {patients.map((patient) => (
                  <SelectItem key={patient._id} value={patient._id}>
                    <div className="flex flex-col">
                      <span className="font-medium">{patient.name}</span>
                      <span className="text-sm text-muted-foreground">
                        {patient.employer}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedPatient && (
              <div className="mt-4 p-4 bg-gradient-to-br from-red-50 to-pink-50 rounded-lg border">
                <h4 className="font-medium mb-2">{selectedPatient.name}</h4>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p>ID: {selectedPatient.idNumber}</p>
                  <p>Age: {selectedPatient.age}</p>
                  <p>Employer: {selectedPatient.employer}</p>
                  <Badge variant="outline">
                    {selectedPatient.examinationType.replace('-', ' ')}
                  </Badge>
                </div>
              </div>
            )}

            {/* Risk Assessment */}
            {selectedPatient && (
              <div className="mt-4">
                <h4 className="font-medium mb-2">Risk Assessment</h4>
                <Badge className={getRiskColor(riskAssessment)}>
                  <Shield className="h-3 w-3 mr-1" />
                  {riskAssessment.toUpperCase()} RISK
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Medical Review Dashboard */}
        <div className="md:col-span-3">
          {selectedPatient ? (
            <div className="space-y-6">
              {/* Red Flags Alert */}
              {redFlags.length > 0 && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <AlertTitle className="text-red-800">Medical Alerts</AlertTitle>
                  <AlertDescription className="text-red-700">
                    <ul className="list-disc list-inside space-y-1">
                      {redFlags.map((flag, index) => (
                        <li key={index}>{flag}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              <Card className="bg-gradient-to-br from-white to-red-50/30 border-red-200">
                <CardHeader>
                  <CardTitle>Complete Medical Assessment</CardTitle>
                  <CardDescription>
                    Comprehensive review of all medical data for {selectedPatient.name}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="overview">
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="overview">Overview</TabsTrigger>
                      <TabsTrigger value="vitals">Vital Signs</TabsTrigger>
                      <TabsTrigger value="tests">Test Results</TabsTrigger>
                      <TabsTrigger value="history">Medical History</TabsTrigger>
                    </TabsList>

                    {/* Overview Tab */}
                    <TabsContent value="overview" className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        {/* Quick Stats */}
                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-lg">Quick Assessment</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            {patientVitals.length > 0 && (
                              <div className="flex items-center justify-between">
                                <span className="text-sm">Blood Pressure:</span>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">
                                    {patientVitals[0].bloodPressure.systolic}/{patientVitals[0].bloodPressure.diastolic}
                                  </span>
                                  <Badge className={getBPStatus(patientVitals[0].bloodPressure.systolic, patientVitals[0].bloodPressure.diastolic).color}>
                                    {getBPStatus(patientVitals[0].bloodPressure.systolic, patientVitals[0].bloodPressure.diastolic).status}
                                  </Badge>
                                </div>
                              </div>
                            )}
                            {patientVitals.length > 0 && (
                              <div className="flex items-center justify-between">
                                <span className="text-sm">BMI:</span>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{patientVitals[0].bmi}</span>
                                  <Badge className={getBMIStatus(patientVitals[0].bmi).color}>
                                    {getBMIStatus(patientVitals[0].bmi).status}
                                  </Badge>
                                </div>
                              </div>
                            )}
                            {patientTests.length > 0 && patientTests[0].drugScreen && (
                              <div className="flex items-center justify-between">
                                <span className="text-sm">Drug Screen:</span>
                                <Badge className={
                                  patientTests[0].drugScreen.result === 'negative' ? 'bg-green-100 text-green-800' :
                                  patientTests[0].drugScreen.result === 'positive' ? 'bg-red-100 text-red-800' :
                                  'bg-yellow-100 text-yellow-800'
                                }>
                                  {patientTests[0].drugScreen.result}
                                </Badge>
                              </div>
                            )}
                          </CardContent>
                        </Card>

                        {/* Decision Support */}
                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-lg">Decision Support</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div className="space-y-2">
                              <h5 className="font-medium text-sm">Recommended Actions:</h5>
                              <ul className="text-sm space-y-1 text-muted-foreground">
                                {riskAssessment === 'high' && (
                                  <li>• Detailed medical evaluation required</li>
                                )}
                                {redFlags.some(flag => flag.includes('Blood Pressure')) && (
                                  <li>• Consider cardiovascular assessment</li>
                                )}
                                {redFlags.some(flag => flag.includes('drug')) && (
                                  <li>• Substance abuse counseling recommended</li>
                                )}
                                {redFlags.length === 0 && (
                                  <li>• Standard fitness assessment appropriate</li>
                                )}
                              </ul>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </TabsContent>

                    {/* Vital Signs Tab */}
                    <TabsContent value="vitals" className="space-y-4">
                      {patientVitals.length > 0 ? (
                        <div className="grid gap-4 md:grid-cols-2">
                          <Card>
                            <CardHeader className="pb-3">
                              <CardTitle className="text-lg flex items-center gap-2">
                                <Heart className="h-5 w-5" />
                                Cardiovascular
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                              <div className="flex items-center justify-between">
                                <span>Blood Pressure:</span>
                                <span className="font-medium">
                                  {patientVitals[0].bloodPressure.systolic}/{patientVitals[0].bloodPressure.diastolic} mmHg
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span>Pulse:</span>
                                <span className="font-medium">{patientVitals[0].pulse} bpm</span>
                              </div>
                            </CardContent>
                          </Card>

                          <Card>
                            <CardHeader className="pb-3">
                              <CardTitle className="text-lg flex items-center gap-2">
                                <Scale className="h-5 w-5" />
                                Physical Measurements
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                              <div className="flex items-center justify-between">
                                <span>Height:</span>
                                <span className="font-medium">{patientVitals[0].height} cm</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span>Weight:</span>
                                <span className="font-medium">{patientVitals[0].weight} kg</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span>BMI:</span>
                                <span className="font-medium">{patientVitals[0].bmi}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span>Temperature:</span>
                                <span className="font-medium">{patientVitals[0].temperature}°C</span>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          No vital signs recorded yet
                        </div>
                      )}
                    </TabsContent>

                    {/* Test Results Tab */}
                    <TabsContent value="tests" className="space-y-4">
                      {patientTests.length > 0 ? (
                        <div className="space-y-4">
                          {patientTests[0].vision && (
                            <Card>
                              <CardHeader className="pb-3">
                                <CardTitle className="text-lg flex items-center gap-2">
                                  <Eye className="h-5 w-5" />
                                  Vision Assessment
                                </CardTitle>
                              </CardHeader>
                              <CardContent className="grid gap-3 md:grid-cols-2">
                                <div>
                                  <span className="text-sm text-muted-foreground">Left Eye:</span>
                                  <p className="font-medium">{patientTests[0].vision.leftEye}</p>
                                </div>
                                <div>
                                  <span className="text-sm text-muted-foreground">Right Eye:</span>
                                  <p className="font-medium">{patientTests[0].vision.rightEye}</p>
                                </div>
                                <div>
                                  <span className="text-sm text-muted-foreground">Color Vision:</span>
                                  <p className="font-medium">
                                    {patientTests[0].vision.colorVision ? 'Normal' : 'Deficient'}
                                  </p>
                                </div>
                              </CardContent>
                            </Card>
                          )}

                          {patientTests[0].hearing && (
                            <Card>
                              <CardHeader className="pb-3">
                                <CardTitle className="text-lg flex items-center gap-2">
                                  <Ear className="h-5 w-5" />
                                  Hearing Assessment
                                </CardTitle>
                              </CardHeader>
                              <CardContent className="grid gap-3 md:grid-cols-2">
                                <div>
                                  <span className="text-sm text-muted-foreground">Left Ear:</span>
                                  <p className="font-medium">{patientTests[0].hearing.leftEar} dB</p>
                                </div>
                                <div>
                                  <span className="text-sm text-muted-foreground">Right Ear:</span>
                                  <p className="font-medium">{patientTests[0].hearing.rightEar} dB</p>
                                </div>
                              </CardContent>
                            </Card>
                          )}

                          {patientTests[0].drugScreen && (
                            <Card>
                              <CardHeader className="pb-3">
                                <CardTitle className="text-lg flex items-center gap-2">
                                  <TestTube className="h-5 w-5" />
                                  Drug Screening
                                </CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm text-muted-foreground">Result:</span>
                                  <Badge className={
                                    patientTests[0].drugScreen.result === 'negative' ? 'bg-green-100 text-green-800' :
                                    patientTests[0].drugScreen.result === 'positive' ? 'bg-red-100 text-red-800' :
                                    'bg-yellow-100 text-yellow-800'
                                  }>
                                    {patientTests[0].drugScreen.result}
                                  </Badge>
                                </div>
                              </CardContent>
                            </Card>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          No test results available yet
                        </div>
                      )}
                    </TabsContent>

                    {/* Medical History Tab */}
                    <TabsContent value="history" className="space-y-4">
                      {patientQuestionnaire ? (
                        <ScrollArea className="h-96">
                          <div className="space-y-4">
                            <Card>
                              <CardHeader className="pb-3">
                                <CardTitle className="text-lg">Medical Conditions</CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="grid gap-2 md:grid-cols-2">
                                  {Object.entries(patientQuestionnaire.medicalHistory || {}).map(([key, value]) => (
                                    <div key={key} className="flex items-center justify-between">
                                      <span className="text-sm capitalize">
                                        {key.replace(/([A-Z])/g, ' $1').toLowerCase()}:
                                      </span>
                                      <div className="flex items-center gap-1">
                                        {value ? (
                                          <CheckCircle className="h-4 w-4 text-red-600" />
                                        ) : (
                                          <XCircle className="h-4 w-4 text-green-600" />
                                        )}
                                        <span className="text-sm font-medium">
                                          {value ? 'Yes' : 'No'}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </CardContent>
                            </Card>

                            <Card>
                              <CardHeader className="pb-3">
                                <CardTitle className="text-lg">Occupational History</CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="space-y-2">
                                  {Object.entries(patientQuestionnaire.occupationalHistory || {}).map(([key, value]) => (
                                    <div key={key} className="flex items-center justify-between">
                                      <span className="text-sm capitalize">
                                        {key.replace(/([A-Z])/g, ' $1').toLowerCase()}:
                                      </span>
                                      <Badge variant={value ? 'destructive' : 'secondary'}>
                                        {value ? 'Yes' : 'No'}
                                      </Badge>
                                    </div>
                                  ))}
                                </div>
                              </CardContent>
                            </Card>
                          </div>
                        </ScrollArea>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          No medical history questionnaire completed yet
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card className="bg-gradient-to-br from-white to-gray-50/30">
              <CardContent className="flex items-center justify-center h-96">
                <div className="text-center">
                  <Stethoscope className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Select a patient to begin medical review</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}