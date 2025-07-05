import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getPatients } from '@/api/patients';
import { getQuestionnaireByPatient } from '@/api/questionnaires';
import { getPatientVitals } from '@/api/vitals';
import { getPatientTests } from '@/api/tests';
import { useToast } from '@/hooks/useToast';
import {
  User, Calendar, Phone, Mail, MapPin, Building, FileText, Heart, Activity, TestTube,
  Eye, Ear, Wind, Shield, Award, Clock, AlertTriangle, CheckCircle, ArrowLeft,
  Download, Printer, History, Thermometer, Scale, Stethoscope, Search, Filter,
  TrendingUp, TrendingDown, Minus, Bell, AlertCircle, Info, XCircle, Target,
  BarChart, LineChart, Calendar as CalendarIcon, FileCheck, Zap
} from 'lucide-react';

// Enhanced interfaces optimized for extracted data
interface ExtractedQuestionnaireData {
  document_classification: string;
  confidence_score: number;
  employee_info: {
    first_name: string;
    last_name: string;
    initials: string;
    full_name: string;
    id_number: string;
    date_of_birth: string;
    marital_status: string;
    company_name: string;
    department: string;
    job_title: string;
  };
  medical_history: {
    heart_disease_high_bp: boolean;
    epilepsy_convulsions: boolean;
    glaucoma_blindness: boolean;
    diabetes_family: boolean;
    family_deaths_before_60: boolean;
    bleeding_rectum: boolean;
    kidney_stones_blood_urine: boolean;
    sugar_protein_urine: boolean;
    prostate_gynecological: boolean;
    blood_thyroid_disorder: boolean;
    malignant_tumours_cancer: boolean;
    tuberculosis_pneumonia: boolean;
  };
  vital_signs: {
    height_cm: number;
    weight_kg: number;
    bmi: number;
    blood_pressure_systolic: number;
    blood_pressure_diastolic: number;
    blood_pressure_reading: string;
    pulse_rate: number;
    temperature_celsius: number;
  };
  working_heights_assessment: {
    advised_not_work_height: boolean;
    serious_occupational_accident: boolean;
    fear_heights_enclosed_spaces: boolean;
    fits_seizures_epilepsy: boolean;
    suicide_thoughts_attempts: boolean;
    mental_health_professional: boolean;
    thoughts_not_own: boolean;
    substance_abuse_problem: boolean;
    other_problems_affecting_work: boolean;
    informed_safety_requirements: boolean;
    chronic_diseases: boolean;
    additional_comments: string;
  };
  urinalysis_results: {
    blood_present: boolean;
    protein_present: boolean;
    glucose_present: boolean;
    trace_elements: string;
  };
  lab_values: {
    random_glucose_mmol: number;
    random_cholesterol_mmol: number;
    clinical_notes: string;
  };
  extraction_metadata: {
    processing_time: number;
    model_used: string;
    extraction_method: string;
    fallback_used: boolean;
  };
}

interface ClinicalAlert {
  id: string;
  type: 'critical' | 'warning' | 'info' | 'success';
  severity: 'high' | 'medium' | 'low';
  title: string;
  message: string;
  recommendations: string[];
  source: string;
  timestamp: string;
  dismissed: boolean;
}

interface HealthTrend {
  date: string;
  value: number;
  status: 'normal' | 'elevated' | 'high' | 'low';
}

interface ComprehensivePatientData {
  patient: PatientData;
  extractedData: ExtractedQuestionnaireData[];
  vitals: VitalSignsData[];
  tests: TestResultData[];
  alerts: ClinicalAlert[];
  trends: {
    bmi: HealthTrend[];
    bloodPressure: HealthTrend[];
    fitnessStatus: Array<{ date: string; status: string; restrictions: string[] }>;
  };
  compliance: {
    overdue: Array<{ test: string; dueDate: string; priority: string }>;
    upcoming: Array<{ test: string; dueDate: string; type: string }>;
    completed: Array<{ test: string; completedDate: string; result: string }>;
  };
}

// Your existing interfaces (keeping compatibility)
interface PatientData {
  _id: string;
  firstName: string;
  surname: string;
  name?: string;
  idNumber: string;
  age: number;
  phone: string;
  email: string;
  employerName: string;
  employer?: string;
  position: string;
  department: string;
  status: string;
  examinations: any[];
  examinationType?: string;
}

interface VitalSignsData {
  _id: string;
  patientId: string;
  examination: string;
  recordedBy: string;
  recordedAt: string;
  measurements: {
    height_cm: number;
    weight_kg: number;
    bmi: number;
    blood_pressure: { systolic: number; diastolic: number };
    pulse_rate: number;
    temperature_celsius: number;
    respiratory_rate: number;
    oxygen_saturation: number;
  };
  physical_examination: {
    vision: { left_eye: string; right_eye: string; color_vision: string; glasses_required: boolean };
    hearing: { left_ear: string; right_ear: string; hearing_aid_required: boolean };
    general_appearance: string;
    cardiovascular: string;
    respiratory: string;
    neurological: string;
  };
  notes: string;
  abnormalities: string[];
  status: string;
}

interface TestResultData {
  _id: string;
  patientId: string;
  examination: string;
  testType: string;
  testName: string;
  performedBy: string;
  performedAt: string;
  results: any;
  interpretation: string;
  status: string;
  attachments?: string[];
  notes: string;
}

export function PatientEHR() {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  
  // Core state
  const [patient, setPatient] = useState<PatientData | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedQuestionnaireData[]>([]);
  const [vitals, setVitals] = useState<VitalSignsData[]>([]);
  const [tests, setTests] = useState<TestResultData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Enhanced state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [alerts, setAlerts] = useState<ClinicalAlert[]>([]);
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());
  const [showTrends, setShowTrends] = useState(false);
  
  const { toast } = useToast();

  useEffect(() => {
    if (patientId) {
      fetchAllPatientData();
    }
  }, [patientId]);

  // Generate clinical alerts from extracted data
  const generateClinicalAlerts = (data: ExtractedQuestionnaireData[]): ClinicalAlert[] => {
    const alerts: ClinicalAlert[] = [];
    
    data.forEach((extraction, index) => {
      const timestamp = new Date().toISOString();
      
      // Blood pressure alerts
      if (extraction.vital_signs?.blood_pressure_systolic > 140 || extraction.vital_signs?.blood_pressure_diastolic > 90) {
        alerts.push({
          id: `bp-${index}`,
          type: 'critical',
          severity: 'high',
          title: 'Hypertension Detected',
          message: `Blood pressure ${extraction.vital_signs.blood_pressure_systolic}/${extraction.vital_signs.blood_pressure_diastolic} mmHg exceeds normal limits`,
          recommendations: [
            'Schedule follow-up within 1 month',
            'Consider lifestyle modifications',
            'Monitor for end-organ damage',
            'Annual cardiovascular assessment required'
          ],
          source: 'Vital Signs Assessment',
          timestamp,
          dismissed: false
        });
      }
      
      // BMI alerts
      if (extraction.vital_signs?.bmi >= 30) {
        alerts.push({
          id: `bmi-${index}`,
          type: 'warning',
          severity: 'medium',
          title: 'Obesity Detected',
          message: `BMI ${extraction.vital_signs.bmi} indicates obesity`,
          recommendations: [
            'Nutritional counseling',
            'Exercise program recommendation',
            'Diabetes screening',
            'Sleep apnea evaluation'
          ],
          source: 'Physical Measurements',
          timestamp,
          dismissed: false
        });
      }
      
      // Heights work safety alerts
      if (extraction.working_heights_assessment?.fits_seizures_epilepsy || 
          extraction.working_heights_assessment?.fear_heights_enclosed_spaces) {
        alerts.push({
          id: `heights-${index}`,
          type: 'critical',
          severity: 'high',
          title: 'Heights Work Restriction Required',
          message: 'Medical conditions identified that contraindicate working at heights',
          recommendations: [
            'Restrict all heights work activities',
            'Neurology consultation if seizure history',
            'Occupational therapy assessment',
            'Alternative work assignments required'
          ],
          source: 'Working at Heights Assessment',
          timestamp,
          dismissed: false
        });
      }
      
      // Lab result alerts
      if (extraction.urinalysis_results?.blood_present) {
        alerts.push({
          id: `urine-${index}`,
          type: 'warning',
          severity: 'medium',
          title: 'Abnormal Urinalysis',
          message: 'Blood detected in urine sample',
          recommendations: [
            'Nephrology consultation',
            'Repeat urinalysis in 2 weeks',
            'Kidney function assessment',
            'Exclude urological pathology'
          ],
          source: 'Laboratory Results',
          timestamp,
          dismissed: false
        });
      }
      
      // Glucose alerts
      if (extraction.lab_values?.random_glucose_mmol > 7.8) {
        alerts.push({
          id: `glucose-${index}`,
          type: 'warning',
          severity: 'high',
          title: 'Elevated Blood Glucose',
          message: `Random glucose ${extraction.lab_values.random_glucose_mmol} mmol/L above normal range`,
          recommendations: [
            'Fasting glucose test',
            'HbA1c assessment',
            'Diabetes screening',
            'Endocrinology referral if confirmed'
          ],
          source: 'Laboratory Results',
          timestamp,
          dismissed: false
        });
      }
      
      // Medical history alerts
      if (extraction.medical_history?.heart_disease_high_bp) {
        alerts.push({
          id: `cardiac-${index}`,
          type: 'info',
          severity: 'medium',
          title: 'Cardiac History Noted',
          message: 'Previous heart disease or hypertension reported',
          recommendations: [
            'Annual cardiac assessment',
            'Exercise stress testing',
            'Medication compliance monitoring',
            'Regular BP monitoring'
          ],
          source: 'Medical History',
          timestamp,
          dismissed: false
        });
      }
    });
    
    return alerts;
  };

  const fetchAllPatientData = async () => {
    try {
      // Fetch traditional data
      const [patientsResponse, questionnairesResponse, vitalsResponse, testsResponse] = await Promise.all([
        getPatients().catch(() => ({ patients: [] })),
        getQuestionnaireByPatient(patientId!).catch(() => ({ questionnaires: [] })),
        getPatientVitals(patientId!).catch(() => ({ vitals: [] })),
        getPatientTests(patientId!).catch(() => ({ tests: [] }))
      ]);

      // Set traditional data
      const patientData = (patientsResponse as any).patients.find((p: any) => p._id === patientId);
      setPatient(patientData || null);
      setVitals((vitalsResponse as any).vitals || []);
      setTests((testsResponse as any).tests || []);

      // Simulate extracted questionnaire data (replace with actual API call)
      const mockExtractedData: ExtractedQuestionnaireData[] = [
        {
          document_classification: "pre-employment questionnaire",
          confidence_score: 0.88,
          employee_info: {
            first_name: "ERIC THABISO",
            last_name: "MUKHOLA",
            initials: "ET",
            full_name: "ERIC THABISO MUKHOLA",
            id_number: "8803036501087",
            date_of_birth: "1988-03-03",
            marital_status: "Married",
            company_name: "WOLF Wasser",
            department: "BUSINESS DEV",
            job_title: "GM"
          },
          medical_history: {
            heart_disease_high_bp: false,
            epilepsy_convulsions: false,
            glaucoma_blindness: false,
            diabetes_family: false,
            family_deaths_before_60: false,
            bleeding_rectum: false,
            kidney_stones_blood_urine: false,
            sugar_protein_urine: false,
            prostate_gynecological: false,
            blood_thyroid_disorder: false,
            malignant_tumours_cancer: false,
            tuberculosis_pneumonia: false
          },
          vital_signs: {
            height_cm: 172,
            weight_kg: 88,
            bmi: 29.75,
            blood_pressure_systolic: 145, // Elevated for alert demonstration
            blood_pressure_diastolic: 95,  // Elevated for alert demonstration
            blood_pressure_reading: "145/95",
            pulse_rate: 80,
            temperature_celsius: 36.5
          },
          working_heights_assessment: {
            advised_not_work_height: false,
            serious_occupational_accident: false,
            fear_heights_enclosed_spaces: false,
            fits_seizures_epilepsy: false,
            suicide_thoughts_attempts: false,
            mental_health_professional: false,
            thoughts_not_own: false,
            substance_abuse_problem: false,
            other_problems_affecting_work: false,
            informed_safety_requirements: true,
            chronic_diseases: false,
            additional_comments: "Hypertension requires monitoring"
          },
          urinalysis_results: {
            blood_present: true, // Abnormal for alert demonstration
            protein_present: false,
            glucose_present: false,
            trace_elements: "Trace RBC"
          },
          lab_values: {
            random_glucose_mmol: 5.6,
            random_cholesterol_mmol: null,
            clinical_notes: "Glucose within normal limits"
          },
          extraction_metadata: {
            processing_time: 67.38,
            model_used: "PreEmploymentQuestionnaire",
            extraction_method: "enhanced_with_proven_serialization",
            fallback_used: false
          }
        }
      ];

      setExtractedData(mockExtractedData);

      // Generate and set clinical alerts
      const generatedAlerts = generateClinicalAlerts(mockExtractedData);
      setAlerts(generatedAlerts);

    } catch (error) {
      console.error('Error fetching patient data:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch patient data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Enhanced utility functions
  const getPatientName = (patient: PatientData) => {
    return patient.name || `${patient.firstName} ${patient.surname}`;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'checked-in': 'bg-blue-100 text-blue-800',
      'questionnaire': 'bg-yellow-100 text-yellow-800',
      'nurse': 'bg-purple-100 text-purple-800',
      'technician': 'bg-orange-100 text-orange-800',
      'doctor': 'bg-red-100 text-red-800',
      'completed': 'bg-green-100 text-green-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getBPStatus = (systolic: number, diastolic: number) => {
    if (systolic >= 140 || diastolic >= 90) return { status: 'High', color: 'text-red-600', icon: TrendingUp };
    if (systolic >= 130 || diastolic >= 80) return { status: 'Elevated', color: 'text-yellow-600', icon: TrendingUp };
    return { status: 'Normal', color: 'text-green-600', icon: Minus };
  };

  const getBMIStatus = (bmi: number) => {
    if (bmi >= 30) return { status: 'Obese', color: 'text-red-600', icon: TrendingUp };
    if (bmi >= 25) return { status: 'Overweight', color: 'text-yellow-600', icon: TrendingUp };
    if (bmi >= 18.5) return { status: 'Normal', color: 'text-green-600', icon: Minus };
    return { status: 'Underweight', color: 'text-blue-600', icon: TrendingDown };
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'critical': return <AlertTriangle className="h-4 w-4" />;
      case 'warning': return <AlertCircle className="h-4 w-4" />;
      case 'info': return <Info className="h-4 w-4" />;
      case 'success': return <CheckCircle className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'critical': return 'bg-red-50 text-red-800 border-red-200';
      case 'warning': return 'bg-yellow-50 text-yellow-800 border-yellow-200';
      case 'info': return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'success': return 'bg-green-50 text-green-800 border-green-200';
      default: return 'bg-gray-50 text-gray-800 border-gray-200';
    }
  };

  const dismissAlert = (alertId: string) => {
    setDismissedAlerts(prev => new Set([...prev, alertId]));
  };

  // Filter alerts based on search and type
  const filteredAlerts = alerts.filter(alert => {
    if (dismissedAlerts.has(alert.id)) return false;
    if (filterType !== 'all' && alert.type !== filterType) return false;
    if (searchQuery && !alert.title.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !alert.message.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  // Enhanced data processing
  const latestExtractedData = extractedData[0]; // Most recent extraction
  const hasHighRiskConditions = latestExtractedData?.working_heights_assessment?.fits_seizures_epilepsy || 
                               latestExtractedData?.medical_history?.heart_disease_high_bp;

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-muted rounded w-48 mb-2"></div>
        <div className="h-4 bg-muted rounded w-96"></div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1,2,3,4].map(i => <div key={i} className="h-24 bg-muted rounded"></div>)}
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => navigate('/patients')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Patients
          </Button>
        </div>
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Patient Not Found</AlertTitle>
          <AlertDescription>The requested patient could not be found.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Header with Search */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => navigate('/patients')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {latestExtractedData?.employee_info?.full_name || getPatientName(patient)}
            </h1>
            <p className="text-muted-foreground">Electronic Health Record</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <Input
              placeholder="Search records..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-64"
            />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-32">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="warning">Warning</SelectItem>
              <SelectItem value="info">Info</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline">
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
        </div>
      </div>

      {/* Clinical Alerts Section */}
      {filteredAlerts.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Clinical Alerts ({filteredAlerts.length})
            </h3>
            <Button variant="ghost" size="sm" onClick={() => setDismissedAlerts(new Set(alerts.map(a => a.id)))}>
              Dismiss All
            </Button>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {filteredAlerts.map((alert) => (
              <Alert key={alert.id} className={getAlertColor(alert.type)}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-2">
                    {getAlertIcon(alert.type)}
                    <div className="flex-1">
                      <AlertTitle className="text-sm font-medium">{alert.title}</AlertTitle>
                      <AlertDescription className="text-xs mt-1">{alert.message}</AlertDescription>
                      <div className="mt-2">
                        <p className="text-xs font-medium mb-1">Recommendations:</p>
                        <ul className="text-xs space-y-1">
                          {alert.recommendations.slice(0, 2).map((rec, idx) => (
                            <li key={idx} className="flex items-start gap-1">
                              <Target className="h-3 w-3 mt-0.5 flex-shrink-0" />
                              {rec}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => dismissAlert(alert.id)}>
                    <XCircle className="h-4 w-4" />
                  </Button>
                </div>
              </Alert>
            ))}
          </div>
        </div>
      )}

      {/* Enhanced Patient Information Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Patient Information
            </span>
            {latestExtractedData && (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  <Zap className="h-3 w-3 mr-1" />
                  AI Extracted ({Math.round(latestExtractedData.confidence_score * 100)}% confidence)
                </Badge>
                <Badge variant={hasHighRiskConditions ? "destructive" : "default"}>
                  {hasHighRiskConditions ? "High Risk" : "Standard Risk"}
                </Badge>
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">ID Number</Label>
              <p className="text-lg font-semibold">
                {latestExtractedData?.employee_info?.id_number || patient.idNumber}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Date of Birth</Label>
              <p className="text-lg font-semibold">
                {latestExtractedData?.employee_info?.date_of_birth ? 
                  new Date(latestExtractedData.employee_info.date_of_birth).toLocaleDateString() : 
                  `${patient.age} years`}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Marital Status</Label>
              <p className="text-lg font-semibold">
                {latestExtractedData?.employee_info?.marital_status || 'Not specified'}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Current Status</Label>
              <Badge className={getStatusColor(patient.status)}>
                {patient.status.replace('-', ' ').toUpperCase()}
              </Badge>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Position</Label>
              <p className="font-medium">
                {latestExtractedData?.employee_info?.job_title || patient.position}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Department</Label>
              <p className="font-medium">
                {latestExtractedData?.employee_info?.department || patient.department}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Employer</Label>
              <div className="flex items-center gap-1">
                <Building className="h-4 w-4" />
                {latestExtractedData?.employee_info?.company_name || patient.employer || patient.employerName}
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Contact</Label>
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-sm">
                  <Phone className="h-3 w-3" />
                  {patient.phone}
                </div>
                <div className="flex items-center gap-1 text-sm">
                  <Mail className="h-3 w-3" />
                  {patient.email}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Overview Cards with AI Data */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Health Score</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {latestExtractedData ? Math.round(latestExtractedData.confidence_score * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              AI extraction confidence
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">BMI Status</CardTitle>
            <Scale className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {latestExtractedData?.vital_signs && (
              <>
                <div className="text-2xl font-bold">
                  {latestExtractedData.vital_signs.bmi}
                </div>
                <p className={`text-xs font-medium ${getBMIStatus(latestExtractedData.vital_signs.bmi).color}`}>
                  {getBMIStatus(latestExtractedData.vital_signs.bmi).status}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Blood Pressure</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {latestExtractedData?.vital_signs && (
              <>
                <div className="text-lg font-bold">
                  {latestExtractedData.vital_signs.blood_pressure_reading}
                </div>
                <p className={`text-xs font-medium ${getBPStatus(latestExtractedData.vital_signs.blood_pressure_systolic, latestExtractedData.vital_signs.blood_pressure_diastolic).color}`}>
                  {getBPStatus(latestExtractedData.vital_signs.blood_pressure_systolic, latestExtractedData.vital_signs.blood_pressure_diastolic).status}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Heights Clearance</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {latestExtractedData?.working_heights_assessment?.informed_safety_requirements && 
               !latestExtractedData?.working_heights_assessment?.fits_seizures_epilepsy ? 
               <CheckCircle className="h-8 w-8 text-green-600" /> : 
               <XCircle className="h-8 w-8 text-red-600" />}
            </div>
            <p className="text-xs text-muted-foreground">
              {latestExtractedData?.working_heights_assessment?.informed_safety_requirements && 
               !latestExtractedData?.working_heights_assessment?.fits_seizures_epilepsy ? 
               'Cleared' : 'Restricted'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {filteredAlerts.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Require attention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="extracted">AI Extracted</TabsTrigger>
          <TabsTrigger value="vitals">Vital Signs</TabsTrigger>
          <TabsTrigger value="tests">Test Results</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest examinations and AI extractions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {latestExtractedData && (
                    <div className="flex items-center gap-4 p-4 border rounded-lg">
                      <Zap className="h-5 w-5 text-blue-500" />
                      <div className="flex-1">
                        <div className="font-medium">AI Data Extraction</div>
                        <p className="text-sm text-muted-foreground">
                          {latestExtractedData.document_classification} • {Math.round(latestExtractedData.confidence_score * 100)}% confidence
                        </p>
                      </div>
                      <Badge variant="default">Complete</Badge>
                    </div>
                  )}
                  {extractedData.length === 0 && (
                    <p className="text-gray-500 text-center py-8">No recent AI extractions</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Health Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Health Summary</CardTitle>
                <CardDescription>Key health indicators from AI extraction</CardDescription>
              </CardHeader>
              <CardContent>
                {latestExtractedData ? (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Medical Conditions</span>
                      <Badge variant="secondary">
                        {Object.values(latestExtractedData.medical_history).filter(Boolean).length} conditions
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Safety Clearances</span>
                      <Badge variant={latestExtractedData.working_heights_assessment.informed_safety_requirements ? "default" : "destructive"}>
                        {latestExtractedData.working_heights_assessment.informed_safety_requirements ? "Cleared" : "Restricted"}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Lab Results</span>
                      <Badge variant={latestExtractedData.urinalysis_results.blood_present ? "destructive" : "default"}>
                        {latestExtractedData.urinalysis_results.blood_present ? "Abnormal" : "Normal"}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Vital Signs</span>
                      <Badge variant={latestExtractedData.vital_signs.blood_pressure_systolic > 140 ? "destructive" : "default"}>
                        {latestExtractedData.vital_signs.blood_pressure_systolic > 140 ? "Elevated" : "Normal"}
                      </Badge>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No health data available</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* AI Extracted Data Tab */}
        <TabsContent value="extracted" className="space-y-6">
          {latestExtractedData ? (
            <div className="space-y-6">
              {/* Extraction Metadata */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    AI Extraction Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Document Type</Label>
                      <p className="font-medium">{latestExtractedData.document_classification}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Confidence Score</Label>
                      <p className="font-medium text-green-600">
                        {Math.round(latestExtractedData.confidence_score * 100)}%
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Model Used</Label>
                      <p className="font-medium">{latestExtractedData.extraction_metadata.model_used}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Processing Time</Label>
                      <p className="font-medium">{latestExtractedData.extraction_metadata.processing_time.toFixed(2)}s</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Medical History */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Medical History Assessment
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {Object.entries(latestExtractedData.medical_history).map(([condition, value]) => (
                      <div key={condition} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm font-medium capitalize">
                          {condition.replace(/_/g, ' ')}
                        </span>
                        <Badge variant={value ? "destructive" : "secondary"}>
                          {value ? "Yes" : "No"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Working at Heights Assessment */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Working at Heights Assessment
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      {Object.entries(latestExtractedData.working_heights_assessment)
                        .filter(([key]) => key !== 'additional_comments')
                        .map(([assessment, value]) => (
                        <div key={assessment} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="text-sm font-medium capitalize">
                            {assessment.replace(/_/g, ' ')}
                          </span>
                          <Badge variant={typeof value === 'boolean' ? (value ? "default" : "secondary") : "outline"}>
                            {typeof value === 'boolean' ? (value ? "Yes" : "No") : value}
                          </Badge>
                        </div>
                      ))}
                    </div>
                    {latestExtractedData.working_heights_assessment.additional_comments && (
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <Label className="text-sm font-medium text-blue-800">Additional Comments</Label>
                        <p className="text-sm text-blue-700 mt-1">
                          {latestExtractedData.working_heights_assessment.additional_comments}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Lab Results */}
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TestTube className="h-5 w-5" />
                      Urinalysis Results
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(latestExtractedData.urinalysis_results).map(([test, result]) => (
                        <div key={test} className="flex items-center justify-between">
                          <span className="text-sm font-medium capitalize">
                            {test.replace(/_/g, ' ')}
                          </span>
                          <Badge variant={
                            typeof result === 'boolean' ? 
                              (result ? "destructive" : "default") : 
                              "outline"
                          }>
                            {typeof result === 'boolean' ? (result ? "Present" : "Absent") : result}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      Laboratory Values
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Random Glucose</span>
                        <Badge variant={latestExtractedData.lab_values.random_glucose_mmol > 7.8 ? "destructive" : "default"}>
                          {latestExtractedData.lab_values.random_glucose_mmol} mmol/L
                        </Badge>
                      </div>
                      {latestExtractedData.lab_values.clinical_notes && (
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <Label className="text-sm font-medium">Clinical Notes</Label>
                          <p className="text-sm text-gray-700 mt-1">
                            {latestExtractedData.lab_values.clinical_notes}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Zap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No AI Extracted Data</h3>
                <p className="text-gray-600">No questionnaire data has been processed through AI extraction yet.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Enhanced Vital Signs Tab */}
        <TabsContent value="vitals" className="space-y-6">
          {/* AI Extracted Vitals */}
          {latestExtractedData?.vital_signs && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  AI Extracted Vital Signs
                </CardTitle>
                <CardDescription>
                  Automatically extracted from questionnaire with {Math.round(latestExtractedData.confidence_score * 100)}% confidence
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {/* Physical Measurements */}
                  <div className="space-y-4">
                    <h4 className="font-medium flex items-center gap-2">
                      <Scale className="h-4 w-4" />
                      Physical Measurements
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Height:</span>
                        <span className="font-medium">{latestExtractedData.vital_signs.height_cm} cm</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Weight:</span>
                        <span className="font-medium">{latestExtractedData.vital_signs.weight_kg} kg</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">BMI:</span>
                        <div className="flex items-center gap-2">
                          <span className={`font-medium ${getBMIStatus(latestExtractedData.vital_signs.bmi).color}`}>
                            {latestExtractedData.vital_signs.bmi}
                          </span>
                          <Badge variant={latestExtractedData.vital_signs.bmi >= 25 ? "destructive" : "default"} className="text-xs">
                            {getBMIStatus(latestExtractedData.vital_signs.bmi).status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Vital Signs */}
                  <div className="space-y-4">
                    <h4 className="font-medium flex items-center gap-2">
                      <Heart className="h-4 w-4" />
                      Cardiovascular
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Blood Pressure:</span>
                        <div className="flex items-center gap-2">
                          <span className={`font-medium ${getBPStatus(latestExtractedData.vital_signs.blood_pressure_systolic, latestExtractedData.vital_signs.blood_pressure_diastolic).color}`}>
                            {latestExtractedData.vital_signs.blood_pressure_reading}
                          </span>
                          <Badge variant={latestExtractedData.vital_signs.blood_pressure_systolic > 130 ? "destructive" : "default"} className="text-xs">
                            {getBPStatus(latestExtractedData.vital_signs.blood_pressure_systolic, latestExtractedData.vital_signs.blood_pressure_diastolic).status}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Pulse Rate:</span>
                        <span className="font-medium">{latestExtractedData.vital_signs.pulse_rate} bpm</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Temperature:</span>
                        <span className="font-medium">{latestExtractedData.vital_signs.temperature_celsius}°C</span>
                      </div>
                    </div>
                  </div>

                  {/* Health Trends */}
                  <div className="space-y-4">
                    <h4 className="font-medium flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Health Indicators
                    </h4>
                    <div className="space-y-3">
                      <div className="p-3 bg-green-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-green-800">Overall Status</span>
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        </div>
                        <p className="text-xs text-green-700 mt-1">
                          {latestExtractedData.vital_signs.blood_pressure_systolic > 140 ? 
                            "Requires monitoring" : "Within acceptable ranges"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Traditional Vitals (existing functionality) */}
          {vitals.length > 0 ? (
            vitals.map((vital) => (
              <Card key={vital._id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Clinical Vital Signs - {new Date(vital.recordedAt).toLocaleDateString()}</span>
                    <Badge variant={vital.status === 'normal' ? 'default' : 'destructive'}>
                      {vital.status}
                    </Badge>
                  </CardTitle>
                  <CardDescription>Recorded by {vital.recordedBy}</CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Your existing vital signs display code */}
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <div className="space-y-4">
                      <h4 className="font-medium flex items-center gap-2">
                        <Scale className="h-4 w-4" />
                        Physical Measurements
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Height:</span>
                          <span className="font-medium">{vital.measurements.height_cm} cm</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Weight:</span>
                          <span className="font-medium">{vital.measurements.weight_kg} kg</span>
                        </div>
                        <div className="flex justify-between">
                          <span>BMI:</span>
                          <span className={`font-medium ${getBMIStatus(vital.measurements.bmi).color}`}>
                            {vital.measurements.bmi} ({getBMIStatus(vital.measurements.bmi).status})
                          </span>
                        </div>
                      </div>
                    </div>
                    {/* Rest of your existing vital signs code */}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            !latestExtractedData?.vital_signs && (
              <Card>
                <CardContent className="text-center py-12">
                  <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Vital Signs</h3>
                  <p className="text-gray-600">No vital signs have been recorded for this patient yet.</p>
                </CardContent>
              </Card>
            )
          )}
        </TabsContent>

        {/* Timeline Tab - New Feature */}
        <TabsContent value="timeline" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Health Timeline
              </CardTitle>
              <CardDescription>Longitudinal view of health events and trends</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {latestExtractedData && (
                  <div className="flex items-start gap-4 pb-4 border-b">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">AI Questionnaire Extraction</h4>
                        <span className="text-sm text-muted-foreground">Recent</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Pre-employment questionnaire processed with {Math.round(latestExtractedData.confidence_score * 100)}% confidence
                      </p>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">
                          BMI: {latestExtractedData.vital_signs?.bmi}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          BP: {latestExtractedData.vital_signs?.blood_pressure_reading}
                        </Badge>
                        <Badge variant={latestExtractedData.working_heights_assessment?.informed_safety_requirements ? "default" : "destructive"} className="text-xs">
                          Heights: {latestExtractedData.working_heights_assessment?.informed_safety_requirements ? "Cleared" : "Restricted"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                )}
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-8 w-8 mx-auto mb-2" />
                  <p>Additional timeline entries will appear as more data is collected</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Compliance Tab - New Feature */}
        <TabsContent value="compliance" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileCheck className="h-5 w-5" />
                  Pending Requirements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4 text-yellow-600" />
                      <span className="text-sm font-medium">Vision Screening</span>
                    </div>
                    <Badge variant="secondary">Due Soon</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Ear className="h-4 w-4 text-yellow-600" />
                      <span className="text-sm font-medium">Audiometry</span>
                    </div>
                    <Badge variant="secondary">Due Soon</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Wind className="h-4 w-4 text-yellow-600" />
                      <span className="text-sm font-medium">Lung Function</span>
                    </div>
                    <Badge variant="secondary">Due Soon</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Completed Assessments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium">Health Questionnaire</span>
                    </div>
                    <Badge variant="default">Complete</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium">Heights Assessment</span>
                    </div>
                    <Badge variant="default">Complete</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Reports Tab - New Feature */}
        <TabsContent value="reports" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart className="h-5 w-5" />
                Health Reports & Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <BarChart className="h-12 w-12 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Reports Coming Soon</h3>
                <p>Comprehensive health reports and analytics will be available here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Keep your existing tests tab */}
        <TabsContent value="tests" className="space-y-6">
          {tests.length > 0 ? (
            tests.map((test) => (
              <Card key={test._id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{test.testName}</span>
                    <div className="flex items-center gap-2">
                      {test.status === 'normal' ? 
                        <CheckCircle className="h-4 w-4 text-green-600" /> : 
                        <AlertTriangle className="h-4 w-4 text-red-600" />}
                      <Badge variant={test.status === 'normal' ? 'default' : 'destructive'}>
                        {test.status}
                      </Badge>
                    </div>
                  </CardTitle>
                  <CardDescription>
                    Performed by {test.performedBy} on {new Date(test.performedAt).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Results:</h4>
                      <div className="bg-muted p-3 rounded-lg">
                        <pre className="text-sm whitespace-pre-wrap">
                          {JSON.stringify(test.results, null, 2)}
                        </pre>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Interpretation:</h4>
                      <p className="text-sm">{test.interpretation}</p>
                    </div>
                    {test.notes && (
                      <div>
                        <h4 className="font-medium mb-2">Notes:</h4>
                        <p className="text-sm text-muted-foreground">{test.notes}</p>
                      </div>
                    )}
                    {test.attachments && test.attachments.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">Attachments:</h4>
                        <div className="flex flex-wrap gap-2">
                          {test.attachments.map((attachment, idx) => (
                            <Badge key={idx} variant="outline" className="cursor-pointer">
                              <FileText className="h-3 w-3 mr-1" />
                              {attachment}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <TestTube className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Test Results</h3>
                <p className="text-gray-600">No test results have been recorded for this patient yet.</p>
                <div className="mt-6">
                  <p className="text-sm text-muted-foreground mb-4">Future test integrations will include:</p>
                  <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">
                    <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                      <Eye className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-800">Vision Tests</span>
                    </div>
                    <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                      <Ear className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-800">Audiometry</span>
                    </div>
                    <div className="flex items-center gap-2 p-3 bg-purple-50 rounded-lg">
                      <Wind className="h-4 w-4 text-purple-600" />
                      <span className="text-sm font-medium text-purple-800">Lung Function</span>
                    </div>
                    <div className="flex items-center gap-2 p-3 bg-orange-50 rounded-lg">
                      <Activity className="h-4 w-4 text-orange-600" />
                      <span className="text-sm font-medium text-orange-800">X-Ray Results</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Enhanced Footer with Quick Actions */}
      <div className="flex items-center justify-between pt-6 border-t">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>Last updated: {latestExtractedData ? 'Recently' : 'No recent activity'}</span>
          <Separator orientation="vertical" className="h-4" />
          <span>Data source: {latestExtractedData ? 'AI Extraction + Clinical' : 'Clinical Only'}</span>
          <Separator orientation="vertical" className="h-4" />
          <span>Alerts: {filteredAlerts.length} active</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <History className="h-4 w-4 mr-2" />
            View History
          </Button>
          <Button variant="outline" size="sm">
            <FileText className="h-4 w-4 mr-2" />
            Generate Report
          </Button>
          <Button size="sm">
            <Award className="h-4 w-4 mr-2" />
            Generate Certificate
          </Button>
        </div>
      </div>
    </div>
  );
}