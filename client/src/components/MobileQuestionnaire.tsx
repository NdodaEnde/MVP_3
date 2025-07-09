import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  AlertTriangle, 
  CheckCircle, 
  Wifi, 
  WifiOff, 
  Save, 
  Send, 
  User, 
  FileText, 
  Activity, 
  Shield, 
  Clock, 
  PenTool, 
  Stethoscope,
  Bell,
  Flag,
  ArrowRight,
  Timer,
  Users,
  RefreshCw,
  Heart,
  Eye,
  Award,
  UserCheck,
  Zap,
  Database,
  Smartphone,
  Monitor
} from 'lucide-react';

// Main Integration Component - Connects Questionnaire to Workflow System
export default function QuestionnaireWorkflowIntegration() {
  const [activeView, setActiveView] = useState('questionnaire'); // questionnaire, workflow, dashboard
  const [connectionStatus, setConnectionStatus] = useState('connected');
  const [workflowData, setWorkflowData] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [currentPatient, setCurrentPatient] = useState(null);

  // Initialize workflow integration
  useEffect(() => {
    initializeWorkflowSystem();
    setupRealTimeConnections();
  }, []);

  const initializeWorkflowSystem = () => {
    // Simulate patient selection for demo
    setCurrentPatient({
      id: 'patient_001',
      name: 'Eric Mukhela',
      idNumber: '8903030050109',
      company: 'Wolf Wadley',
      position: 'GM',
      examination_type: 'periodical',
      startTime: new Date()
    });

    // Initialize workflow state
    setWorkflowData({
      currentStation: 'questionnaire',
      stations: ['questionnaire', 'vitals', 'tests', 'review', 'certificate'],
      progress: 0,
      alerts: [],
      estimatedCompletion: '45 minutes'
    });
  };

  const setupRealTimeConnections = () => {
    // Simulate real-time updates
    const interval = setInterval(() => {
      // Simulate notifications
      if (Math.random() > 0.95) {
        const newNotification = {
          id: `notif_${Date.now()}`,
          type: 'system',
          message: 'Workflow system updated',
          timestamp: new Date(),
          read: false
        };
        setNotifications(prev => [newNotification, ...prev.slice(0, 4)]);
      }
    }, 5000);

    return () => clearInterval(interval);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* System Status Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Collar Medical Workflow</h1>
                  <p className="text-sm text-gray-600">Complete Digital Integration System</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <Button
                  variant={activeView === 'questionnaire' ? 'default' : 'outline'}
                  onClick={() => setActiveView('questionnaire')}
                  className="flex items-center gap-2"
                >
                  <FileText className="h-4 w-4" />
                  Questionnaire
                </Button>
                <Button
                  variant={activeView === 'workflow' ? 'default' : 'outline'}
                  onClick={() => setActiveView('workflow')}
                  className="flex items-center gap-2"
                >
                  <Activity className="h-4 w-4" />
                  Workflow Manager
                </Button>
                <Button
                  variant={activeView === 'dashboard' ? 'default' : 'outline'}
                  onClick={() => setActiveView('dashboard')}
                  className="flex items-center gap-2"
                >
                  <Monitor className="h-4 w-4" />
                  Dashboard
                </Button>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
                connectionStatus === 'connected' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {connectionStatus === 'connected' ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
                {connectionStatus === 'connected' ? 'Real-time Sync' : 'Offline Mode'}
              </div>
              
              <Badge variant="outline" className="flex items-center gap-1">
                <Bell className="h-3 w-3" />
                {notifications.filter(n => !n.read).length} alerts
              </Badge>
              
              {currentPatient && (
                <Badge className="bg-blue-100 text-blue-800">
                  {currentPatient.name} - {currentPatient.examination_type}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto p-6">
        {activeView === 'questionnaire' && (
          <IntegratedQuestionnaireView 
            patient={currentPatient}
            workflowData={workflowData}
            setWorkflowData={setWorkflowData}
            setNotifications={setNotifications}
            connectionStatus={connectionStatus}
          />
        )}
        
        {activeView === 'workflow' && (
          <WorkflowManagerView
            currentPatient={currentPatient}
            workflowData={workflowData}
            notifications={notifications}
            setNotifications={setNotifications}
          />
        )}
        
        {activeView === 'dashboard' && (
          <SystemDashboardView
            notifications={notifications}
            workflowData={workflowData}
            connectionStatus={connectionStatus}
          />
        )}
      </div>
    </div>
  );
}

// Integrated Questionnaire with Real-time Workflow Connection
function IntegratedQuestionnaireView({ patient, workflowData, setWorkflowData, setNotifications, connectionStatus }) {
  const [currentSection, setCurrentSection] = useState(0);
  const [formData, setFormData] = useState({
    workflow_metadata: {
      patient_id: patient?.id || '',
      session_id: `session_${Date.now()}`,
      start_time: new Date().toISOString(),
      examination_type: patient?.examination_type || 'pre_employment',
      staff_member: 'Reception Staff',
      station: 'questionnaire'
    },
    personal_info: {
      initials: '',
      first_names: '',
      surname: '',
      id_number: '',
      date_of_birth: '',
      marital_status: '',
      position: patient?.position || '',
      department: '',
      company: patient?.company || ''
    },
    medical_history: {
      heart_disease_high_bp: null,
      epilepsy_convulsions: null,
      glaucoma_blindness: null,
      family_mellitus_diabetes: null,
      family_deaths_before_60: null,
      bleeding_from_rectum: null,
      kidney_stones_blood_urine: null,
      sugar_protein_urine: null,
      prostate_gynaecological_problems: null,
      blood_thyroid_disorder: null,
      malignant_tumours_cancer: null
    },
    physical_examination: {
      height: '',
      weight: '',
      pulse_rate: '',
      bp_systolic: '',
      bp_diastolic: '',
      urinalysis: {
        blood: null,
        protein: null,
        glucose: null
      }
    },
    working_at_heights: {
      q1_advised_not_work_height: null,
      q2_serious_accident: null,
      q3_fear_heights_spaces: null,
      q4_fits_seizures: null,
      q5_suicide_thoughts: null,
      q6_mental_health_professional: null,
      q7_thoughts_spirits: null,
      q8_substance_abuse: null,
      q9_other_problems: null,
      q10_informed_tasks: null,
      q11_chronic_diseases: null,
      q12_additional_comments: ''
    },
    employee_declaration: {
      information_correct: false,
      signature: '',
      date: ''
    }
  });

  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [medicalAlerts, setMedicalAlerts] = useState([]);
  const [submissionStatus, setSubmissionStatus] = useState('idle');
  const [autoSaveStatus, setAutoSaveStatus] = useState('saved');

  // 🔧 COMPREHENSIVE DEBUG FUNCTIONS
  const comprehensiveDebug = () => {
    console.log('=== COMPREHENSIVE QUESTIONNAIRE DEBUG ===');
    console.log('Current completion percentage:', completionPercentage);
    
    let totalFields = 0;
    let completedFields = 0;
    
    // 1. PERSONAL INFO
    const personalRequired = ['first_names', 'surname', 'id_number', 'marital_status', 'position'];
    totalFields += personalRequired.length;
    const personalCompleted = personalRequired.filter(field => formData.personal_info?.[field]);
    completedFields += personalCompleted.length;
    console.log(`1. PERSONAL INFO: ${personalCompleted.length}/${personalRequired.length}`);
    const personalMissing = personalRequired.filter(field => !formData.personal_info?.[field]);
    if (personalMissing.length > 0) console.log('   Missing:', personalMissing);
    
    // 2. MEDICAL HISTORY
    const medicalQuestions = Object.keys(formData.medical_history || {});
    totalFields += medicalQuestions.length;
    const medicalCompleted = medicalQuestions.filter(q => formData.medical_history[q] !== null);
    completedFields += medicalCompleted.length;
    console.log(`2. MEDICAL HISTORY: ${medicalCompleted.length}/${medicalQuestions.length}`);
    const medicalMissing = medicalQuestions.filter(q => formData.medical_history[q] === null);
    if (medicalMissing.length > 0) console.log('   Missing:', medicalMissing);
    
    // 3. PHYSICAL EXAMINATION
    const physicalRequired = ['height', 'weight', 'pulse_rate', 'bp_systolic', 'bp_diastolic'];
    totalFields += physicalRequired.length;
    const physicalCompleted = physicalRequired.filter(field => formData.physical_examination?.[field]);
    completedFields += physicalCompleted.length;
    console.log(`3. PHYSICAL EXAM: ${physicalCompleted.length}/${physicalRequired.length}`);
    const physicalMissing = physicalRequired.filter(field => !formData.physical_examination?.[field]);
    if (physicalMissing.length > 0) console.log('   Missing:', physicalMissing);
    
    // 4. URINALYSIS (part of physical exam but tracked separately)
    const urinalysis = formData.physical_examination?.urinalysis || {};
    console.log('4. URINALYSIS VALUES:');
    console.log('   Blood:', urinalysis.blood);
    console.log('   Protein:', urinalysis.protein);
    console.log('   Glucose:', urinalysis.glucose);
    
    // 5. DECLARATION
    totalFields += 2; // checkbox + signature
    let declarationCompleted = 0;
    if (formData.employee_declaration?.information_correct) declarationCompleted += 1;
    if (formData.employee_declaration?.signature) declarationCompleted += 1;
    completedFields += declarationCompleted;
    console.log(`5. DECLARATION: ${declarationCompleted}/2`);
    console.log('   Checkbox:', formData.employee_declaration?.information_correct);
    console.log('   Signature:', formData.employee_declaration?.signature ? 'Present' : 'Missing');
    
    // SUMMARY
    console.log(`\nTOTAL CALCULATION: ${completedFields}/${totalFields} = ${Math.round((completedFields/totalFields)*100)}%`);
    console.log('=== END COMPREHENSIVE DEBUG ===');
  };

  const debugCompletion = () => {
    console.log('=== DEBUGGING QUESTIONNAIRE COMPLETION ===');
    console.log('Current completion percentage:', completionPercentage);
    
    // Check Medical History
    const medicalQuestions = Object.keys(formData.medical_history || {});
    const medicalMissing = medicalQuestions.filter(q => 
      formData.medical_history[q] === null || formData.medical_history[q] === undefined
    );
    console.log('Medical History - Missing (null/undefined):', medicalMissing);
    
    // Check Urinalysis
    const urinalysis = formData.physical_examination?.urinalysis || {};
    const urinalysisMissing = ['blood', 'protein', 'glucose'].filter(field =>
      urinalysis[field] === null || urinalysis[field] === undefined
    );
    console.log('Urinalysis - Missing (null/undefined):', urinalysisMissing);
    
    console.log('=== END DEBUG ===');
  };

  const autoFixCompletion = () => {
    // Fix medical history null values
    const fixedMedical = { ...formData.medical_history };
    Object.keys(fixedMedical).forEach(key => {
      if (fixedMedical[key] === null || fixedMedical[key] === undefined) {
        fixedMedical[key] = false;
      }
    });
    
    // Fix urinalysis null values
    const fixedUrinalysis = {
      blood: formData.physical_examination?.urinalysis?.blood ?? false,
      protein: formData.physical_examination?.urinalysis?.protein ?? false,
      glucose: formData.physical_examination?.urinalysis?.glucose ?? false
    };
    
    // Update form data
    updateFormData('medical_history', fixedMedical);
    updateFormData('physical_examination.urinalysis', fixedUrinalysis);
    
    console.log('Auto-fix complete!');
  };

  const sections = [
    { id: 'personal', title: 'Personal Info', icon: <User className="h-4 w-4" />, required: true },
    { id: 'medical', title: 'Medical History', icon: <Activity className="h-4 w-4" />, required: true },
    { id: 'physical', title: 'Physical Exam', icon: <Stethoscope className="h-4 w-4" />, required: true },
    { id: 'heights', title: 'Working at Heights', icon: <Shield className="h-4 w-4" />, required: false },
    { id: 'declaration', title: 'Declaration', icon: <PenTool className="h-4 w-4" />, required: true }
  ];

  // Real-time form monitoring and auto-save
  useEffect(() => {
    const saveInterval = setInterval(() => {
      if (connectionStatus === 'connected') {
        autoSaveToWorkflow();
      } else {
        saveToLocalStorage();
      }
    }, 10000); // Auto-save every 10 seconds

    return () => clearInterval(saveInterval);
  }, [formData, connectionStatus]);

  // Medical alert detection
  useEffect(() => {
    const alerts = detectMedicalAlerts(formData);
    setMedicalAlerts(alerts);
    
    // Update workflow data with alerts
    setWorkflowData(prev => ({
      ...prev,
      alerts: alerts,
      riskLevel: alerts.some(a => a.severity === 'critical') ? 'critical' :
                 alerts.some(a => a.severity === 'high') ? 'high' : 'normal'
    }));
  }, [formData.medical_history, formData.working_at_heights]);

  // Completion percentage calculation
  useEffect(() => {
    const completion = calculateCompletionPercentage(formData);
    setCompletionPercentage(completion);
    
    // Update workflow progress
    setWorkflowData(prev => ({
      ...prev,
      progress: completion,
      currentStationProgress: completion
    }));
  }, [formData]);

  const autoSaveToWorkflow = async () => {
    setAutoSaveStatus('saving');
    try {
      if (!patient?._id) {
        console.warn('No patient ID available for auto-save');
        setAutoSaveStatus('saved');
        return;
      }

      const response = await fetch(`/api/questionnaires/draft`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          patient_id: patient._id,
          patient_demographics: formData,
          medical_history: formData.medical_history,
          physical_examination: formData.physical_exam,
          working_at_heights_assessment: formData.working_at_heights,
          declarations_and_signatures: {
            employee_declaration: formData.employee_declaration
          },
          metadata: {
            examination_type: patient.examinationType || 'pre_employment',
            current_section: getCurrentSectionName(),
            last_saved: new Date().toISOString()
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        // Update completion percentage from backend
        setCompletionPercentage(data.completionPercentage);
        
        // Update workflow progress with backend data
        setWorkflowData(prev => ({
          ...prev,
          progress: data.completionPercentage,
          currentStationProgress: data.completionPercentage,
          lastSaved: data.lastSaved
        }));
        
        // Add success notification
        setNotifications(prev => [{
          id: `auto_save_${Date.now()}`,
          type: 'auto_save',
          message: `Questionnaire auto-saved - ${data.completionPercentage}% complete`,
          timestamp: new Date(),
          read: false
        }, ...prev.slice(0, 4)]);
        
        setAutoSaveStatus('saved');
      } else {
        throw new Error('Failed to auto-save to backend');
      }
    } catch (error) {
      console.error('Auto-save error:', error);
      // Fallback to local storage
      saveToLocalStorage();
      setAutoSaveStatus('error');
    }
  };

  const getCurrentSectionName = () => {
    const sectionNames = ['personal_info', 'medical_history', 'physical_exam', 'working_at_heights', 'declarations_and_signatures'];
    return sectionNames[currentSection] || 'unknown';
  };

  const saveToLocalStorage = () => {
    try {
      localStorage.setItem(`questionnaire_${patient?.id}`, JSON.stringify({
        formData,
        timestamp: new Date().toISOString(),
        completionPercentage,
        medicalAlerts
      }));
      setAutoSaveStatus('saved');
    } catch (error) {
      setAutoSaveStatus('error');
    }
  };

  const detectMedicalAlerts = (data) => {
    const alerts = [];
    const medical = data.medical_history || {};
    const heights = data.working_at_heights || {};

    if (medical.heart_disease_high_bp === true) {
      alerts.push({
        type: 'medical_condition',
        severity: 'high',
        condition: 'heart_disease_high_bp',
        message: 'Heart disease or high blood pressure',
        instructions: 'Monitor BP carefully during vitals',
        station_impact: 'vitals'
      });
    }

    if (medical.epilepsy_convulsions === true) {
      alerts.push({
        type: 'medical_condition',
        severity: 'critical',
        condition: 'epilepsy_convulsions',
        message: 'Epilepsy or convulsions history',
        instructions: 'Safety precautions required',
        station_impact: 'all_stations'
      });
    }

    if (heights.q3_fear_heights_spaces === true) {
      alerts.push({
        type: 'safety_concern',
        severity: 'high',
        condition: 'fear_of_heights',
        message: 'Fear of heights reported',
        instructions: 'Height work assessment required',
        station_impact: 'review'
      });
    }

    if (heights.q4_fits_seizures === true) {
      alerts.push({
        type: 'safety_concern',
        severity: 'critical',
        condition: 'seizure_history',
        message: 'Seizure history - heights restriction',
        instructions: 'CRITICAL: Not suitable for working at heights',
        station_impact: 'review'
      });
    }

    return alerts;
  };

  const calculateCompletionPercentage = (data) => {
    let totalFields = 0;
    let completedFields = 0;

    // Personal info
    const personalRequired = ['first_names', 'surname', 'id_number', 'marital_status', 'position'];
    totalFields += personalRequired.length;
    completedFields += personalRequired.filter(field => data.personal_info?.[field]).length;

    // Medical history
    const medicalQuestions = Object.keys(data.medical_history);
    totalFields += medicalQuestions.length;
    completedFields += medicalQuestions.filter(q => data.medical_history[q] !== null).length;

    // Physical examination
    const physicalRequired = ['height', 'weight', 'pulse_rate', 'bp_systolic', 'bp_diastolic'];
    totalFields += physicalRequired.length;
    completedFields += physicalRequired.filter(field => data.physical_examination?.[field]).length;

    // Declaration
    totalFields += 2;
    if (data.employee_declaration?.information_correct) completedFields += 1;
    if (data.employee_declaration?.signature) completedFields += 1;

    return Math.round((completedFields / Math.max(totalFields, 1)) * 100);
  };

  const handleCompleteQuestionnaire = async () => {
    if (completionPercentage < 100) {
      setNotifications(prev => [{
        id: `incomplete_${Date.now()}`,
        type: 'error',
        message: 'Questionnaire incomplete - please complete all required sections',
        timestamp: new Date(),
        read: false
      }, ...prev]);
      return;
    }

    setSubmissionStatus('submitting');

    try {
      // Submit the completed questionnaire using our API
      const submitResponse = await fetch(`/api/questionnaires/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          patient_id: patient._id,
          patient_demographics: formData,
          medical_history: formData.medical_history,
          physical_examination: formData.physical_exam,
          working_at_heights_assessment: formData.working_at_heights,
          declarations_and_signatures: {
            employee_declaration: formData.employee_declaration
          },
          metadata: {
            examination_type: patient.examinationType || 'pre_employment',
            submission_timestamp: new Date().toISOString(),
            completion_time: Math.round((Date.now() - new Date(formData.workflow_metadata.start_time).getTime()) / 1000 / 60)
          }
        })
      });

      if (!submitResponse.ok) {
        throw new Error('Failed to submit questionnaire');
      }

      const submitData = await submitResponse.json();
      
      // Check if submission was successful
      if (!submitData.success) {
        setNotifications(prev => [{
          id: `submission_failed_${Date.now()}`,
          type: 'error',
          message: `Submission failed: ${submitData.message}`,
          timestamp: new Date(),
          read: false
        }, ...prev]);
        setSubmissionStatus('error');
        return;
      }

      // Successful submission - use the data returned from our API
      const nextStation = submitData.nextStation || 'vitals';
      const medicalAlerts = submitData.medicalAlerts || [];
      const questionnaireId = submitData.questionnaireId;

      // Update workflow status with real backend data
      setWorkflowData(prev => ({
        ...prev,
        currentStation: nextStation,
        questionnaire_completed: true,
        handoff_time: new Date().toISOString(),
        progress: 100,
        medical_alerts: medicalAlerts,
        questionnaire_id: questionnaireId
      }));

      // Create success notification with medical alerts
      const alertsMessage = medicalAlerts.length > 0 
        ? ` (${medicalAlerts.length} medical alerts)`
        : '';

      setNotifications(prev => [{
        id: `handoff_success_${Date.now()}`,
        type: 'handoff_success',
        message: `${patient.firstName} ${patient.surname} - Questionnaire completed successfully, transferred to ${nextStation} station${alertsMessage}`,
        timestamp: new Date(),
        read: false,
        priority: medicalAlerts.some(a => a.includes('CRITICAL') || a.includes('URGENT')) ? 'high' : 'normal',
        patient_data: { 
          nextStation,
          medicalAlerts,
          questionnaireId,
          requiresReview: submitData.requiresReview
        }
      }, ...prev]);

      setSubmissionStatus('completed');

      // Auto-switch to workflow view to show handoff
      setTimeout(() => {
        setActiveView('workflow');
      }, 1500);

    } catch (error) {
      console.error('Station handoff error:', error);
      setSubmissionStatus('error');
      setNotifications(prev => [{
        id: `error_${Date.now()}`,
        type: 'error',
        message: `Failed to complete station handoff: ${error.message}`,
        timestamp: new Date(),
        read: false
      }, ...prev]);
    }
  };

  const updateFormData = (path, value) => {
    setFormData(prev => {
      const newData = { ...prev };
      const keys = path.split('.');
      let current = newData;
      
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) current[keys[i]] = {};
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      return newData;
    });
  };

  return (
    <div className="space-y-6">
      {/* Questionnaire Header with Real-time Status */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                Digital Medical Questionnaire
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                {patient?.name} - {patient?.examination_type} | Station: Questionnaire
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded ${
                autoSaveStatus === 'saved' ? 'bg-green-100 text-green-800' :
                autoSaveStatus === 'saving' ? 'bg-blue-100 text-blue-800' :
                'bg-red-100 text-red-800'
              }`}>
                {autoSaveStatus === 'saving' ? (
                  <RefreshCw className="h-3 w-3 animate-spin" />
                ) : autoSaveStatus === 'saved' ? (
                  <CheckCircle className="h-3 w-3" />
                ) : (
                  <AlertTriangle className="h-3 w-3" />
                )}
                {autoSaveStatus === 'saving' ? 'Saving...' : 
                 autoSaveStatus === 'saved' ? 'Auto-saved' : 'Save Error'}
              </div>
              <Badge variant="outline">
                {completionPercentage}% Complete
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                <Timer className="h-3 w-3" />
                {Math.round((Date.now() - new Date(formData.workflow_metadata.start_time).getTime()) / 60000)} min
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={completionPercentage} className="h-3" />
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>Started at {new Date(formData.workflow_metadata.start_time).toLocaleTimeString()}</span>
            <span>{completionPercentage}% completed</span>
            <span>Target: &lt;15 minutes</span>
          </div>
        </CardContent>
      </Card>

      {/* Medical Alerts Panel */}
      {medicalAlerts.length > 0 && (
        <Alert className="border-orange-200 bg-orange-50">
          <Flag className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <div className="flex items-center justify-between">
              <span className="font-medium">Medical Alerts Detected ({medicalAlerts.length})</span>
              <Badge variant="destructive" className="text-xs">
                Requires attention at next stations
              </Badge>
            </div>
            <div className="mt-2 space-y-1">
              {medicalAlerts.map((alert, index) => (
                <div key={index} className="text-sm flex items-start gap-2">
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    alert.severity === 'critical' ? 'bg-red-500' :
                    alert.severity === 'high' ? 'bg-orange-500' : 'bg-yellow-500'
                  }`}></div>
                  <div>
                    <span className="font-medium">{alert.message}</span>
                    <span className="text-orange-700"> → {alert.instructions}</span>
                  </div>
                </div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Section Navigation */}
      <Card>
        <CardContent className="p-0">
          <div className="flex overflow-x-auto">
            {sections.map((section, index) => (
              <button
                key={section.id}
                onClick={() => setCurrentSection(index)}
                className={`flex-shrink-0 flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors min-w-[160px] ${
                  currentSection === index
                    ? 'border-blue-500 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {section.icon}
                <span>{section.title}</span>
                {section.required && <span className="text-red-500 text-xs">*</span>}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Form Sections */}
      <Card>
        <CardContent className="p-6">
          {currentSection === 0 && (
            <PersonalInfoSection 
              formData={formData.personal_info} 
              updateFormData={updateFormData}
              patient={patient}
            />
          )}
          {currentSection === 1 && (
            <MedicalHistorySection 
              formData={formData.medical_history} 
              updateFormData={updateFormData}
            />
          )}
          {currentSection === 2 && (
            <PhysicalExamSection 
              formData={formData.physical_examination} 
              updateFormData={updateFormData}
            />
          )}
          {currentSection === 3 && (
            <WorkingAtHeightsSection 
              formData={formData.working_at_heights} 
              updateFormData={updateFormData}
            />
          )}
          {currentSection === 4 && (
            <DeclarationSection 
              formData={formData.employee_declaration} 
              updateFormData={updateFormData}
            />
          )}
        </CardContent>
      </Card>

      {/* Navigation and Submission */}
      <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
        <Button
          variant="outline"
          onClick={() => setCurrentSection(Math.max(0, currentSection - 1))}
          disabled={currentSection === 0 || submissionStatus === 'submitting'}
          className="min-h-[48px] px-6"
        >
          Previous Section
        </Button>

        {/* 🔧 DEBUG BUTTONS */}
        <div className="flex gap-2">
          <Button 
            onClick={debugCompletion} 
            variant="outline" 
            className="bg-yellow-100 min-h-[48px] px-4"
          >
            🔍 Quick Debug
          </Button>
          <Button 
            onClick={comprehensiveDebug} 
            variant="outline" 
            className="bg-blue-100 min-h-[48px] px-4"
          >
            🔬 Full Debug
          </Button>
          <Button 
            onClick={autoFixCompletion} 
            variant="outline" 
            className="bg-green-100 min-h-[48px] px-4"
          >
            🔧 Fix
          </Button>
        </div>

        {currentSection === sections.length - 1 ? (
          <Button
            onClick={handleCompleteQuestionnaire}
            className={`min-h-[48px] px-8 ${
              submissionStatus === 'completed' ? 'bg-green-600 hover:bg-green-700' :
              submissionStatus === 'submitting' ? 'bg-blue-600' :
              'bg-green-600 hover:bg-green-700'
            }`}
            disabled={completionPercentage < 100 || submissionStatus === 'submitting'}
          >
            {submissionStatus === 'submitting' ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Completing & Transferring...
              </>
            ) : submissionStatus === 'completed' ? (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Completed - Ready for Vitals
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Complete & Transfer to Vitals
              </>
            )}
          </Button>
        ) : (
          <Button
            onClick={() => setCurrentSection(Math.min(sections.length - 1, currentSection + 1))}
            className="min-h-[48px] px-6"
            disabled={submissionStatus === 'submitting'}
          >
            Next Section
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
}

// Workflow Manager View showing real-time patient flow
function WorkflowManagerView({ currentPatient, workflowData, notifications, setNotifications }) {
  const [stationStatus, setStationStatus] = useState({
    questionnaire: { active: 1, queue: 0, avgTime: '12 min', status: 'active' },
    vitals: { active: 0, queue: 1, avgTime: '15 min', status: 'ready' },
    tests: { active: 0, queue: 0, avgTime: '25 min', status: 'ready' },
    review: { active: 0, queue: 0, avgTime: '10 min', status: 'ready' },
    certificate: { active: 0, queue: 0, avgTime: '5 min', status: 'ready' }
  });

  const stations = [
    { id: 'questionnaire', name: 'Questionnaire', icon: <FileText className="h-5 w-5" />, staff: 'Reception' },
    { id: 'vitals', name: 'Vital Signs', icon: <Heart className="h-5 w-5" />, staff: 'Nurse' },
    { id: 'tests', name: 'Medical Tests', icon: <Activity className="h-5 w-5" />, staff: 'Technician' },
    { id: 'review', name: 'Medical Review', icon: <Stethoscope className="h-5 w-5" />, staff: 'Doctor' },
    { id: 'certificate', name: 'Certificate', icon: <Award className="h-5 w-5" />, staff: 'Admin' }
  ];

  const handleStationHandoff = (fromStation, toStation, patientData) => {
    // Update station status
    setStationStatus(prev => ({
      ...prev,
      [fromStation]: { ...prev[fromStation], active: prev[fromStation].active - 1 },
      [toStation]: { ...prev[toStation], queue: prev[toStation].queue + 1 }
    }));

    // Create notification
    setNotifications(prev => [{
      id: `handoff_${Date.now()}`,
      type: 'handoff',
      message: `Patient ${patientData.name} transferred from ${fromStation} to ${toStation}`,
      timestamp: new Date(),
      read: false,
      patient_data: patientData
    }, ...prev]);
  };

  return (
    <div className="space-y-6">
      {/* Real-time Station Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-600" />
            Real-time Station Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {stations.map((station) => {
              const status = stationStatus[station.id];
              const isCurrentStation = workflowData?.currentStation === station.id;
              
              return (
                <div key={station.id} className={`p-4 rounded-lg border-2 transition-all ${
                  isCurrentStation ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'
                }`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {station.icon}
                      <span className="font-medium text-sm">{station.name}</span>
                    </div>
                    <div className={`w-3 h-3 rounded-full ${
                      status.status === 'active' ? 'bg-green-500' :
                      status.status === 'ready' ? 'bg-blue-500' : 'bg-gray-500'
                    }`}></div>
                  </div>
                  
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Active:</span>
                      <span className="font-medium">{status.active}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Queue:</span>
                      <span className="font-medium">{status.queue}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Avg Time:</span>
                      <span className="font-medium">{status.avgTime}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Staff:</span>
                      <span className="font-medium">{station.staff}</span>
                    </div>
                  </div>
                  
                  {isCurrentStation && (
                    <div className="mt-3 p-2 bg-blue-100 rounded text-xs text-blue-800 text-center">
                      Current Station
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Patient Flow Visualization */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-green-600" />
            Current Patient Flow
          </CardTitle>
        </CardHeader>
        <CardContent>
          {currentPatient && (
            <div className="p-4 border rounded-lg bg-gradient-to-r from-white to-blue-50">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                    {currentPatient.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg">{currentPatient.name}</h4>
                    <p className="text-sm text-gray-600">{currentPatient.company} - {currentPatient.position}</p>
                    <p className="text-xs text-gray-500">
                      Started {Math.round((Date.now() - currentPatient.startTime.getTime()) / 60000)} minutes ago
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge className="bg-green-100 text-green-800">
                    {currentPatient.examination_type.replace('_', ' ')}
                  </Badge>
                  {workflowData?.progress && (
                    <div className="text-right">
                      <div className="text-sm font-medium">{workflowData.progress}% Complete</div>
                      <Progress value={workflowData.progress} className="w-32 h-2" />
                    </div>
                  )}
                </div>
              </div>

              {/* Station Progress Flow */}
              <div className="flex items-center justify-between mb-4">
                {stations.map((station, index) => {
                  const isActive = workflowData?.currentStation === station.id;
                  const isCompleted = stations.findIndex(s => s.id === workflowData?.currentStation) > index;
                  
                  return (
                    <React.Fragment key={station.id}>
                      <div className={`flex flex-col items-center gap-2 ${
                        isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-400'
                      }`}>
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 ${
                          isActive ? 'border-blue-500 bg-blue-100' :
                          isCompleted ? 'border-green-500 bg-green-100' :
                          'border-gray-300 bg-gray-100'
                        }`}>
                          {station.icon}
                        </div>
                        <span className="text-xs font-medium">{station.name}</span>
                        {isCompleted && <CheckCircle className="h-4 w-4 text-green-500" />}
                        {isActive && <Clock className="h-4 w-4 text-blue-500" />}
                      </div>
                      {index < stations.length - 1 && (
                        <div className={`flex-1 h-1 mx-2 rounded ${
                          isCompleted ? 'bg-green-500' : 'bg-gray-300'
                        }`}></div>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>

              {/* Medical Alerts for Workflow */}
              {workflowData?.alerts && workflowData.alerts.length > 0 && (
                <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded">
                  <div className="flex items-center gap-2 mb-2">
                    <Flag className="h-4 w-4 text-orange-600" />
                    <span className="font-medium text-orange-800 text-sm">
                      Workflow Alerts ({workflowData.alerts.length})
                    </span>
                  </div>
                  <div className="space-y-1">
                    {workflowData.alerts.map((alert, index) => (
                      <div key={index} className="text-xs text-orange-700 flex items-start gap-2">
                        <div className={`w-2 h-2 rounded-full mt-1 ${
                          alert.severity === 'critical' ? 'bg-red-500' :
                          alert.severity === 'high' ? 'bg-orange-500' : 'bg-yellow-500'
                        }`}></div>
                        <div>
                          <span className="font-medium">{alert.message}</span>
                          <span className="text-orange-600"> → Impact: {alert.station_impact}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button size="sm" variant="outline">
                  <Eye className="h-4 w-4 mr-1" />
                  View Details
                </Button>
                
                {workflowData?.questionnaire_completed && (
                  <Button 
                    size="sm" 
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => handleStationHandoff('questionnaire', 'vitals', currentPatient)}
                  >
                    <ArrowRight className="h-4 w-4 mr-1" />
                    Transfer to Vitals
                  </Button>
                )}
                
                <Button size="sm" variant="outline">
                  <Bell className="h-4 w-4 mr-1" />
                  Notify Next Station
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Live Notifications Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-orange-600" />
            Live Workflow Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {notifications.slice(0, 10).map((notification) => (
              <div
                key={notification.id}
                className={`p-3 rounded-lg border transition-all ${
                  notification.read 
                    ? 'border-gray-200 bg-gray-50 opacity-70' 
                    : notification.type === 'handoff_success'
                    ? 'border-green-200 bg-green-50'
                    : notification.type === 'error'
                    ? 'border-red-200 bg-red-50'
                    : 'border-blue-200 bg-blue-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      notification.type === 'handoff_success' ? 'bg-green-500' :
                      notification.type === 'error' ? 'bg-red-500' :
                      notification.type === 'auto_save' ? 'bg-blue-500' :
                      'bg-orange-500'
                    }`}></div>
                    <div>
                      <p className="text-sm font-medium">{notification.message}</p>
                      <p className="text-xs text-gray-600">
                        {notification.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <Badge variant={notification.type === 'error' ? 'destructive' : 'default'} className="text-xs">
                    {notification.type.replace('_', ' ')}
                  </Badge>
                </div>
                
                {notification.patient_data && (
                  <div className="mt-2 p-2 bg-white rounded border text-xs">
                    <div className="grid grid-cols-2 gap-2">
                      <div>Priority: {notification.patient_data.priority || 'Normal'}</div>
                      <div>Next Station: {notification.patient_data.next_station || 'N/A'}</div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// System Dashboard showing overall metrics and performance
function SystemDashboardView({ notifications, workflowData, connectionStatus }) {
  const [metrics, setMetrics] = useState({
    todayStats: {
      totalPatients: 24,
      completed: 18,
      inProgress: 6,
      avgCompletionTime: '42 minutes',
      alertsGenerated: 7
    },
    performance: {
      systemUptime: '99.8%',
      avgQuestionnaireTime: '12 minutes',
      handoffSuccessRate: '98%',
      dataAccuracy: '99.2%'
    },
    stationMetrics: {
      questionnaire: { throughput: '5.2/hour', efficiency: '95%' },
      vitals: { throughput: '4.8/hour', efficiency: '92%' },
      tests: { throughput: '2.1/hour', efficiency: '89%' },
      review: { throughput: '6.1/hour', efficiency: '97%' },
      certificate: { throughput: '12.4/hour', efficiency: '99%' }
    }
  });

  return (
    <div className="space-y-6">
      {/* System Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Patients Today</p>
                <p className="text-3xl font-bold text-green-600">{metrics.todayStats.totalPatients}</p>
                <p className="text-xs text-gray-500">{metrics.todayStats.completed} completed</p>
              </div>
              <Users className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Completion</p>
                <p className="text-3xl font-bold text-blue-600">{metrics.todayStats.avgCompletionTime}</p>
                <p className="text-xs text-gray-500">Target: &lt;45 min</p>
              </div>
              <Timer className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Medical Alerts</p>
                <p className="text-3xl font-bold text-orange-600">{metrics.todayStats.alertsGenerated}</p>
                <p className="text-xs text-gray-500">Flagged today</p>
              </div>
              <Flag className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">System Status</p>
                <p className="text-3xl font-bold text-purple-600">{metrics.performance.systemUptime}</p>
                <p className="text-xs text-gray-500">Uptime</p>
              </div>
              <Database className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            System Performance Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-4">Workflow Performance</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Questionnaire Completion Rate</span>
                  <div className="flex items-center gap-2">
                    <Progress value={95} className="w-24 h-2" />
                    <span className="text-sm font-medium">95%</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Handoff Success Rate</span>
                  <div className="flex items-center gap-2">
                    <Progress value={98} className="w-24 h-2" />
                    <span className="text-sm font-medium">{metrics.performance.handoffSuccessRate}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Data Accuracy</span>
                  <div className="flex items-center gap-2">
                    <Progress value={99} className="w-24 h-2" />
                    <span className="text-sm font-medium">{metrics.performance.dataAccuracy}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Average Processing Time</span>
                  <span className="text-sm font-medium">{metrics.performance.avgQuestionnaireTime}</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Station Efficiency</h4>
              <div className="space-y-3">
                {Object.entries(metrics.stationMetrics).map(([station, data]) => (
                  <div key={station} className="flex justify-between items-center">
                    <span className="text-sm capitalize">{station.replace('_', ' ')}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-600">{data.throughput}</span>
                      <div className="flex items-center gap-1">
                        <Progress value={parseInt(data.efficiency)} className="w-16 h-2" />
                        <span className="text-xs font-medium">{data.efficiency}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Integration Health */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Integration Health Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-4">
              <h4 className="font-semibold">Database Connections</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Patient Database</span>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span>Connected</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Workflow Engine</span>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span>Active</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Notification Service</span>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span>Online</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold">API Performance</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Response Time</span>
                  <span className="font-medium">145ms</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Success Rate</span>
                  <span className="font-medium text-green-600">99.2%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Requests/Hour</span>
                  <span className="font-medium">1,247</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold">Device Status</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Reception Tablets</span>
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4 text-green-500" />
                    <span>3/3 Online</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Workstation PCs</span>
                  <div className="flex items-center gap-2">
                    <Monitor className="h-4 w-4 text-green-500" />
                    <span>5/5 Active</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Network Status</span>
                  <div className="flex items-center gap-2">
                    <Wifi className="h-4 w-4 text-green-500" />
                    <span>Stable</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity Feed */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent System Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {notifications.slice(0, 8).map((notification, index) => (
              <div key={notification.id} className="flex items-center gap-3 p-2 rounded border-l-2 border-l-blue-200 bg-blue-50">
                <div className={`w-2 h-2 rounded-full ${
                  notification.type === 'handoff_success' ? 'bg-green-500' :
                  notification.type === 'error' ? 'bg-red-500' :
                  'bg-blue-500'
                }`}></div>
                <div className="flex-1">
                  <p className="text-sm">{notification.message}</p>
                  <p className="text-xs text-gray-600">{notification.timestamp.toLocaleString()}</p>
                </div>
                <Badge variant="outline" className="text-xs">
                  {notification.type.replace('_', ' ')}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Form Section Components
function PersonalInfoSection({ formData, updateFormData, patient }) {
  const handleIdChange = (value) => {
    updateFormData('personal_info.id_number', value);
    
    if (value.length === 13) {
      // Extract date of birth from SA ID
      const year = parseInt(value.substring(0, 2));
      const month = value.substring(2, 4);
      const day = value.substring(4, 6);
      const fullYear = year > 20 ? 1900 + year : 2000 + year;
      
      updateFormData('personal_info.date_of_birth', `${fullYear}-${month}-${day}`);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="first_names">First Names *</Label>
            <Input
              id="first_names"
              value={formData.first_names || ''}
              onChange={(e) => updateFormData('personal_info.first_names', e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="surname">Surname *</Label>
            <Input
              id="surname"
              value={formData.surname || ''}
              onChange={(e) => updateFormData('personal_info.surname', e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="id_number">SA ID Number *</Label>
            <Input
              id="id_number"
              value={formData.id_number || ''}
              onChange={(e) => handleIdChange(e.target.value)}
              placeholder="8903030050109"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="date_of_birth">Date of Birth</Label>
            <Input
              id="date_of_birth"
              type="date"
              value={formData.date_of_birth || ''}
              onChange={(e) => updateFormData('personal_info.date_of_birth', e.target.value)}
              className="mt-1"
              readOnly
            />
          </div>
          <div>
            <Label htmlFor="marital_status">Marital Status *</Label>
            <RadioGroup 
              value={formData.marital_status || ''} 
              onValueChange={(value) => updateFormData('personal_info.marital_status', value)}
              className="mt-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="single" id="single" />
                <Label htmlFor="single">Single</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="married" id="married" />
                <Label htmlFor="married">Married</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="divorced" id="divorced" />
                <Label htmlFor="divorced">Divorced</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="widowed" id="widowed" />
                <Label htmlFor="widowed">Widowed</Label>
              </div>
            </RadioGroup>
          </div>
          <div>
            <Label htmlFor="position">Position *</Label>
            <Input
              id="position"
              value={formData.position || patient?.position || ''}
              onChange={(e) => updateFormData('personal_info.position', e.target.value)}
              className="mt-1"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function MedicalHistorySection({ formData, updateFormData }) {
  const medicalQuestions = [
    { key: 'heart_disease_high_bp', text: 'Do you have heart disease or high blood pressure?' },
    { key: 'epilepsy_convulsions', text: 'Do you have epilepsy or convulsions?' },
    { key: 'glaucoma_blindness', text: 'Do you have glaucoma or any form of blindness?' },
    { key: 'family_mellitus_diabetes', text: 'Is there a family history of diabetes mellitus?' },
    { key: 'family_deaths_before_60', text: 'Any family deaths before age 60?' },
    { key: 'bleeding_from_rectum', text: 'Have you had bleeding from the rectum?' },
    { key: 'kidney_stones_blood_urine', text: 'Have you had kidney stones or blood in urine?' },
    { key: 'sugar_protein_urine', text: 'Have you had sugar or protein in urine?' },
    { key: 'prostate_gynaecological_problems', text: 'Do you have prostate or gynaecological problems?' },
    { key: 'blood_thyroid_disorder', text: 'Do you have blood or thyroid disorder?' },
    { key: 'malignant_tumours_cancer', text: 'Have you had malignant tumours or cancer?' }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Medical History</h3>
        <div className="space-y-4">
          {medicalQuestions.map((question) => (
            <div key={question.key} className="p-4 border rounded-lg">
              <Label className="text-sm font-medium mb-3 block">{question.text}</Label>
              <RadioGroup 
                value={formData[question.key]?.toString() || ''} 
                onValueChange={(value) => updateFormData(`medical_history.${question.key}`, value === 'true')}
                className="flex gap-6"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="true" id={`${question.key}_yes`} />
                  <Label htmlFor={`${question.key}_yes`}>Yes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="false" id={`${question.key}_no`} />
                  <Label htmlFor={`${question.key}_no`}>No</Label>
                </div>
              </RadioGroup>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PhysicalExamSection({ formData, updateFormData }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Physical Examination</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="height">Height (cm) *</Label>
            <Input
              id="height"
              type="number"
              value={formData.height || ''}
              onChange={(e) => updateFormData('physical_examination.height', e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="weight">Weight (kg) *</Label>
            <Input
              id="weight"
              type="number"
              value={formData.weight || ''}
              onChange={(e) => updateFormData('physical_examination.weight', e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="pulse_rate">Pulse Rate *</Label>
            <Input
              id="pulse_rate"
              type="number"
              value={formData.pulse_rate || ''}
              onChange={(e) => updateFormData('physical_examination.pulse_rate', e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="bp_systolic">Blood Pressure - Systolic *</Label>
            <Input
              id="bp_systolic"
              type="number"
              value={formData.bp_systolic || ''}
              onChange={(e) => updateFormData('physical_examination.bp_systolic', e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="bp_diastolic">Blood Pressure - Diastolic *</Label>
            <Input
              id="bp_diastolic"
              type="number"
              value={formData.bp_diastolic || ''}
              onChange={(e) => updateFormData('physical_examination.bp_diastolic', e.target.value)}
              className="mt-1"
            />
          </div>
        </div>

        <div className="mt-6">
          <h4 className="font-medium mb-3">Urinalysis</h4>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label className="text-sm">Blood</Label>
              <RadioGroup 
                value={formData.urinalysis?.blood?.toString() || ''} 
                onValueChange={(value) => updateFormData('physical_examination.urinalysis.blood', value === 'true')}
                className="mt-1"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="true" id="blood_pos" />
                  <Label htmlFor="blood_pos">Positive</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="false" id="blood_neg" />
                  <Label htmlFor="blood_neg">Negative</Label>
                </div>
              </RadioGroup>
            </div>
            <div>
              <Label className="text-sm">Protein</Label>
              <RadioGroup 
                value={formData.urinalysis?.protein?.toString() || ''} 
                onValueChange={(value) => updateFormData('physical_examination.urinalysis.protein', value === 'true')}
                className="mt-1"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="true" id="protein_pos" />
                  <Label htmlFor="protein_pos">Positive</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="false" id="protein_neg" />
                  <Label htmlFor="protein_neg">Negative</Label>
                </div>
              </RadioGroup>
            </div>
            <div>
              <Label className="text-sm">Glucose</Label>
              <RadioGroup 
                value={formData.urinalysis?.glucose?.toString() || ''} 
                onValueChange={(value) => updateFormData('physical_examination.urinalysis.glucose', value === 'true')}
                className="mt-1"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="true" id="glucose_pos" />
                  <Label htmlFor="glucose_pos">Positive</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="false" id="glucose_neg" />
                  <Label htmlFor="glucose_neg">Negative</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function WorkingAtHeightsSection({ formData, updateFormData }) {
  const heightsQuestions = [
    { key: 'q1_advised_not_work_height', text: 'Have you ever been advised not to work at heights?' },
    { key: 'q2_serious_accident', text: 'Have you ever had a serious accident?' },
    { key: 'q3_fear_heights_spaces', text: 'Do you have a fear of heights or confined spaces?' },
    { key: 'q4_fits_seizures', text: 'Have you ever had fits, seizures, or blackouts?' },
    { key: 'q5_suicide_thoughts', text: 'Have you ever had thoughts of suicide or self-harm?' },
    { key: 'q6_mental_health_professional', text: 'Have you ever consulted a mental health professional?' }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Working at Heights Assessment</h3>
        <div className="space-y-4">
          {heightsQuestions.map((question) => (
            <div key={question.key} className="p-4 border rounded-lg">
              <Label className="text-sm font-medium mb-3 block">{question.text}</Label>
              <RadioGroup 
                value={formData[question.key]?.toString() || ''} 
                onValueChange={(value) => updateFormData(`working_at_heights.${question.key}`, value === 'true')}
                className="flex gap-6"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="true" id={`${question.key}_yes`} />
                  <Label htmlFor={`${question.key}_yes`}>Yes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="false" id={`${question.key}_no`} />
                  <Label htmlFor={`${question.key}_no`}>No</Label>
                </div>
              </RadioGroup>
            </div>
          ))}

          <div>
            <Label htmlFor="additional_comments">Additional Comments</Label>
            <Textarea
              id="additional_comments"
              value={formData.q12_additional_comments || ''}
              onChange={(e) => updateFormData('working_at_heights.q12_additional_comments', e.target.value)}
              placeholder="Any additional information relevant to working at heights..."
              className="mt-1"
              rows={3}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function DeclarationSection({ formData, updateFormData }) {
  const [signatureData, setSignatureData] = useState('');

  const handleSignatureChange = (signature) => {
    setSignatureData(signature);
    updateFormData('employee_declaration.signature', signature);
    updateFormData('employee_declaration.date', new Date().toISOString().split('T')[0]);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Employee Declaration</h3>
        
        <div className="p-4 border rounded-lg bg-gray-50 mb-6">
          <p className="text-sm text-gray-700 leading-relaxed">
            I declare that the information I have provided in this questionnaire is true and complete to the best of my knowledge. 
            I understand that any false or misleading information may result in the rejection of my application or termination of employment. 
            I consent to the medical examination and understand that the results may be used to determine my fitness for work.
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="information_correct"
              checked={formData.information_correct || false}
              onCheckedChange={(checked) => updateFormData('employee_declaration.information_correct', checked)}
            />
            <Label htmlFor="information_correct" className="text-sm">
              I confirm that all information provided is correct and complete *
            </Label>
          </div>

          <div>
            <Label className="text-sm font-medium">Digital Signature *</Label>
            <div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <PenTool className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600 mb-4">Click to sign electronically</p>
              <Button 
                variant="outline" 
                onClick={() => {
                  const signature = prompt('Please type your full name for digital signature:');
                  if (signature) {
                    handleSignatureChange(`${signature} - ${new Date().toLocaleString()}`);
                  }
                }}
              >
                <PenTool className="h-4 w-4 mr-2" />
                Add Digital Signature
              </Button>
              {formData.signature && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
                  <p className="text-sm text-green-800">
                    <CheckCircle className="h-4 w-4 inline mr-1" />
                    Signed: {formData.signature}
                  </p>
                </div>
              )}
            </div>
          </div>

          {formData.date && (
            <div>
              <Label className="text-sm font-medium">Date Signed</Label>
              <Input
                type="date"
                value={formData.date}
                readOnly
                className="mt-1 bg-gray-50"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}