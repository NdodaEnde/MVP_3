// src/components/admin/StaffAdminInterface.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/useToast';
import {
  Users, User, Search, Plus, FileText, Activity, Clock, 
  CheckCircle, AlertTriangle, Filter, RefreshCw, Download,
  Eye, Edit, Send, Save, Bell, TrendingUp, Calendar,
  Stethoscope, Building, Phone, Mail, MapPin
} from 'lucide-react';

import { SharedQuestionnaireForm } from '@/components/shared/SharedQuestionnaireForm';
import { getPatients, updatePatientStatus } from '@/api/patients';
import { questionnaireService } from '@/services/questionnaireService';
import type { QuestionnaireFormData } from '@/schemas/questionnaire-schema';

// 🔧 Patient Interface
interface Patient {
  _id: string;
  firstName: string;
  surname: string;
  idNumber: string;
  age: number;
  gender: string;
  employerName: string;
  position: string;
  examinationType: string;
  status: 'checked_in' | 'questionnaire' | 'in_progress' | 'completed';
  checkInTime: string;
  questionnaireProgress?: number;
  medicalAlerts?: string[];
  lastActivity?: string;
}

// 🔧 Staff User Interface
interface StaffUser {
  id: string;
  name: string;
  role: 'receptionist' | 'nurse' | 'doctor' | 'admin';
  department: string;
}

// 🔧 Main Staff Interface Component
interface StaffAdminInterfaceProps {
  // Enhanced props for responsive behavior
  deviceType?: 'mobile' | 'tablet' | 'desktop';
  showModeSwitch?: boolean;
}

export const StaffAdminInterface: React.FC<StaffAdminInterfaceProps> = ({
  deviceType = 'desktop',
  showModeSwitch = false
}) => {
  // 📊 State Management
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  
  // 🎨 Responsive Design Classes
  const getResponsiveClasses = () => {
    const baseClasses = "space-y-6";
    if (deviceType === 'tablet') {
      return `${baseClasses} tablet-staff-mode px-2 py-2`;
    }
    return baseClasses;
  };
  
  const getCardClasses = () => {
    if (deviceType === 'tablet') {
      return "shadow-lg hover:shadow-xl transition-shadow";
    }
    return "";
  };
  
  const getGridClasses = () => {
    if (deviceType === 'tablet') {
      return "grid-cols-1 md:grid-cols-2 gap-4";
    }
    return "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6";
  };
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [staffUser] = useState<StaffUser>({
    id: 'staff_001',
    name: 'Sarah Johnson',
    role: 'receptionist',
    department: 'Front Desk'
  });
  
  // 📊 Form Management
  const [questionnaireData, setQuestionnaireData] = useState<Partial<QuestionnaireFormData> | null>(null);
  const [showValidationOverride, setShowValidationOverride] = useState(false);
  const [overrideReason, setOverrideReason] = useState('');
  
  const { toast } = useToast();

  // 🔧 Load Patients
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        setLoading(true);
        const response = await getPatients({ 
          status: statusFilter === 'all' ? undefined : statusFilter 
        });
        setPatients(response.patients || []);
      } catch (error) {
        console.error('Failed to load patients:', error);
        toast({
          title: "Error",
          description: "Failed to load patient list",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPatients();
  }, [statusFilter, toast]);

  // 🔧 Filtered Patients
  const filteredPatients = useMemo(() => {
    return patients.filter(patient => {
      const matchesSearch = searchTerm === '' || 
        patient.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.surname.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.idNumber.includes(searchTerm) ||
        patient.employerName.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || patient.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [patients, searchTerm, statusFilter]);

  // 🔧 Patient Selection
  const handlePatientSelect = async (patient: Patient) => {
    setSelectedPatient(patient);
    setActiveTab('questionnaire');
    
    try {
      // Load existing questionnaire data if any
      const existingData = await questionnaireService.getQuestionnaireByPatient(patient._id);
      if (existingData) {
        setQuestionnaireData(existingData);
      } else {
        // Initialize new questionnaire with patient data
        setQuestionnaireData({
          patient_demographics: {
            personal_info: {
              first_names: patient.firstName,
              surname: patient.surname,
              id_number: patient.idNumber,
              age: patient.age,
              gender: patient.gender as any
            },
            employment_info: {
              company_name: patient.employerName,
              position: patient.position,
              employment_type: patient.examinationType as any
            }
          }
        });
      }
    } catch (error) {
      console.error('Failed to load questionnaire data:', error);
    }
  };

  // 🔧 Questionnaire Handlers
  const handleAutoSave = async (data: Partial<QuestionnaireFormData>) => {
    if (!selectedPatient) return;
    
    try {
      await questionnaireService.saveDraft({
        ...data,
        patient_id: selectedPatient._id,
        metadata: {
          ...data.metadata,
          staff_member_id: staffUser.id,
          last_saved: new Date().toISOString(),
          completion_method: 'staff_assisted'
        }
      });
      
      // Update patient progress
      const progress = data.system_data?.completion_score || 0;
      setPatients(prev => prev.map(p => 
        p._id === selectedPatient._id 
          ? { ...p, questionnaireProgress: progress, lastActivity: new Date().toLocaleTimeString() }
          : p
      ));
      
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  };

  const handleQuestionnaireSubmit = async (data: QuestionnaireFormData) => {
    if (!selectedPatient) return;
    
    try {
      const result = await questionnaireService.submitQuestionnaire({
        ...data,
        patient_id: selectedPatient._id,
        metadata: {
          ...data.metadata,
          staff_member_id: staffUser.id,
          submission_timestamp: new Date().toISOString(),
          completion_method: 'staff_assisted',
          validation_overrides: overrideReason ? [overrideReason] : []
        }
      });
      
      if (result.success) {
        // Update patient status
        await updatePatientStatus(selectedPatient._id, 'completed');
        
        // Update local state
        setPatients(prev => prev.map(p => 
          p._id === selectedPatient._id 
            ? { 
                ...p, 
                status: 'completed', 
                questionnaireProgress: 100,
                medicalAlerts: result.medicalAlerts,
                lastActivity: new Date().toLocaleTimeString()
              }
            : p
        ));
        
        toast({
          title: "Questionnaire Completed",
          description: `Successfully submitted questionnaire for ${selectedPatient.firstName} ${selectedPatient.surname}`,
        });
        
        // Reset form
        setSelectedPatient(null);
        setQuestionnaireData(null);
        setActiveTab('dashboard');
        
      } else {
        throw new Error(result.message || 'Submission failed');
      }
      
    } catch (error) {
      console.error('Submission failed:', error);
      toast({
        title: "Submission Failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    }
  };

  // 🔧 Validation Override Handler
  const handleValidationOverride = (reason: string) => {
    setOverrideReason(reason);
    setShowValidationOverride(false);
    
    toast({
      title: "Validation Override Applied",
      description: `Reason: ${reason}`,
      variant: "default",
    });
  };

  // 🔧 Manual Station Handoff
  const handleManualHandoff = async (stationId: string) => {
    if (!selectedPatient) return;
    
    try {
      await questionnaireService.updatePatientWorkflow(selectedPatient._id, {
        current_station: stationId,
        previous_station: 'questionnaire',
        status: 'in_progress',
        handoff_time: new Date().toISOString(),
        staff_initiated: true,
        staff_member_id: staffUser.id
      });
      
      toast({
        title: "Patient Handoff Successful",
        description: `${selectedPatient.firstName} has been moved to ${stationId.replace('_', ' ')} station`,
      });
      
      // Update patient status
      setPatients(prev => prev.map(p => 
        p._id === selectedPatient._id 
          ? { ...p, status: 'in_progress', lastActivity: new Date().toLocaleTimeString() }
          : p
      ));
      
    } catch (error) {
      console.error('Handoff failed:', error);
      toast({
        title: "Handoff Failed",
        description: "Please try again or contact technical support",
        variant: "destructive",
      });
    }
  };

  return (
    <div className={`min-h-screen bg-gray-50 ${deviceType === 'tablet' ? 'p-2' : 'p-6'}`}>
      <div className={`max-w-7xl mx-auto ${getResponsiveClasses()}`}>
        
        {/* 📊 Header */}
        <Card className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-white/20 rounded-lg">
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Questionnaire Management</h1>
                  <p className="text-blue-100">
                    Welcome back, {staffUser.name} • {staffUser.role.charAt(0).toUpperCase() + staffUser.role.slice(1)}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <Badge variant="secondary" className="bg-white/20 text-white">
                  <Bell className="h-4 w-4 mr-1" />
                  {filteredPatients.filter(p => p.status === 'questionnaire').length} pending
                </Badge>
                <Button variant="secondary" size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 🔄 Main Interface Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="patients" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Patient Queue
            </TabsTrigger>
            <TabsTrigger value="questionnaire" className="flex items-center gap-2" disabled={!selectedPatient}>
              <FileText className="h-4 w-4" />
              Questionnaire
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* 📊 Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            <DashboardOverview patients={patients} staffUser={staffUser} />
          </TabsContent>

          {/* 👥 Patient Queue Tab */}
          <TabsContent value="patients" className="space-y-6">
            <PatientQueueManagement
              patients={filteredPatients}
              loading={loading}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              onPatientSelect={handlePatientSelect}
              onManualHandoff={handleManualHandoff}
            />
          </TabsContent>

          {/* 📋 Questionnaire Tab */}
          <TabsContent value="questionnaire" className="space-y-6">
            {selectedPatient ? (
              <QuestionnaireManagement
                patient={selectedPatient}
                staffUser={staffUser}
                initialData={questionnaireData}
                onAutoSave={handleAutoSave}
                onSubmit={handleQuestionnaireSubmit}
                onValidationOverride={handleValidationOverride}
                showValidationOverride={showValidationOverride}
                setShowValidationOverride={setShowValidationOverride}
              />
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-500 mb-2">No Patient Selected</h3>
                  <p className="text-gray-400">Please select a patient from the queue to manage their questionnaire</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* 📈 Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <AnalyticsDashboard patients={patients} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

// 📊 Dashboard Overview Component
const DashboardOverview: React.FC<{
  patients: Patient[];
  staffUser: StaffUser;
}> = ({ patients, staffUser }) => {
  const stats = useMemo(() => {
    const total = patients.length;
    const pending = patients.filter(p => p.status === 'questionnaire').length;
    const inProgress = patients.filter(p => p.status === 'in_progress').length;
    const completed = patients.filter(p => p.status === 'completed').length;
    const withAlerts = patients.filter(p => p.medicalAlerts && p.medicalAlerts.length > 0).length;
    
    return { total, pending, inProgress, completed, withAlerts };
  }, [patients]);

  return (
    <div className="space-y-6">
      
      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-gray-600">Total Patients</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold">{stats.pending}</p>
                <p className="text-sm text-gray-600">Pending Queue</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{stats.inProgress}</p>
                <p className="text-sm text-gray-600">In Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{stats.completed}</p>
                <p className="text-sm text-gray-600">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-2xl font-bold">{stats.withAlerts}</p>
                <p className="text-sm text-gray-600">Medical Alerts</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {patients.slice(0, 5).map((patient) => (
              <div key={patient._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <User className="h-8 w-8 text-gray-400" />
                  <div>
                    <p className="font-medium">{patient.firstName} {patient.surname}</p>
                    <p className="text-sm text-gray-600">{patient.employerName} • {patient.position}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={
                    patient.status === 'completed' ? 'default' :
                    patient.status === 'in_progress' ? 'secondary' : 'outline'
                  }>
                    {patient.status.replace('_', ' ')}
                  </Badge>
                  <span className="text-sm text-gray-500">{patient.lastActivity || 'Just now'}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// 👥 Patient Queue Management Component
const PatientQueueManagement: React.FC<{
  patients: Patient[];
  loading: boolean;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  onPatientSelect: (patient: Patient) => void;
  onManualHandoff: (stationId: string) => void;
}> = ({ 
  patients, 
  loading, 
  searchTerm, 
  setSearchTerm, 
  statusFilter, 
  setStatusFilter, 
  onPatientSelect,
  onManualHandoff 
}) => {
  return (
    <div className="space-y-6">
      
      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by name, ID, or company..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="checked_in">Checked In</SelectItem>
                <SelectItem value="questionnaire">Questionnaire Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              More Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Patient List */}
      <Card>
        <CardHeader>
          <CardTitle>Patient Queue ({patients.length})</CardTitle>
          <CardDescription>
            Manage patient questionnaires and workflow progression
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse bg-gray-100 h-20 rounded-lg"></div>
              ))}
            </div>
          ) : patients.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-500 mb-2">No Patients Found</h3>
              <p className="text-gray-400">No patients match your current filters</p>
            </div>
          ) : (
            <div className="space-y-3">
              {patients.map((patient) => (
                <PatientQueueItem
                  key={patient._id}
                  patient={patient}
                  onSelect={() => onPatientSelect(patient)}
                  onHandoff={onManualHandoff}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// 👤 Patient Queue Item Component (simplified for brevity)
const PatientQueueItem: React.FC<{
  patient: Patient;
  onSelect: () => void;
  onHandoff: (stationId: string) => void;
}> = ({ patient, onSelect, onHandoff }) => {
  return (
    <div className="p-4 rounded-lg border-2 hover:shadow-md transition-all border-gray-200 bg-white">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-full flex items-center justify-center bg-gray-100">
            <User className="h-6 w-6 text-gray-600" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">{patient.firstName} {patient.surname}</h3>
            <p className="text-sm text-gray-600">{patient.employerName} • {patient.position}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={onSelect} size="sm">
            <Edit className="h-4 w-4 mr-2" />
            Manage
          </Button>
        </div>
      </div>
    </div>
  );
};

// 📋 Questionnaire Management Component (simplified for brevity)
const QuestionnaireManagement: React.FC<{
  patient: Patient;
  staffUser: StaffUser;
  initialData: Partial<QuestionnaireFormData> | null;
  onAutoSave: (data: Partial<QuestionnaireFormData>) => Promise<void>;
  onSubmit: (data: QuestionnaireFormData) => Promise<void>;
  onValidationOverride: (reason: string) => void;
  showValidationOverride: boolean;
  setShowValidationOverride: (show: boolean) => void;
}> = ({ 
  patient, 
  staffUser, 
  initialData, 
  onAutoSave, 
  onSubmit 
}) => {
  return (
    <div className="space-y-6">
      
      {/* Patient Context Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <User className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-blue-900">
                  Assisting: {patient.firstName} {patient.surname}
                </h2>
                <div className="flex items-center space-x-4 text-sm text-blue-700">
                  <span>ID: {patient.idNumber}</span>
                  <span>•</span>
                  <span>{patient.employerName}</span>
                  <span>•</span>
                  <span>{patient.examinationType.replace('_', ' ')}</span>
                </div>
              </div>
            </div>
            
            <div className="text-right text-sm text-blue-700">
              <p>Staff: {staffUser.name}</p>
              <p>Role: {staffUser.role}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Shared Questionnaire Form */}
      <SharedQuestionnaireForm
        patientId={patient._id}
        examinationType={patient.examinationType as any}
        mode="desktop"
        initialData={initialData}
        onSave={onAutoSave}
        onSubmit={onSubmit}
        autoSave={true}
        autoSaveInterval={15000}
        showProgress={true}
        enableOffline={false}
        staffMode={true}
        staffMemberId={staffUser.id}
        allowValidationOverrides={true}
      />
    </div>
  );
};

// 📈 Analytics Dashboard Component (simplified for brevity)
const AnalyticsDashboard: React.FC<{
  patients: Patient[];
}> = ({ patients }) => {
  const analytics = useMemo(() => {
    const totalCompleted = patients.filter(p => p.status === 'completed').length;
    const avgCompletionTime = 12; // Mock data
    const alertRate = patients.filter(p => p.medicalAlerts?.length).length / patients.length * 100;
    
    return { totalCompleted, avgCompletionTime, alertRate };
  }, [patients]);

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Completion Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {Math.round((analytics.totalCompleted / patients.length) * 100)}%
            </div>
            <p className="text-sm text-gray-600">
              {analytics.totalCompleted} of {patients.length} completed today
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              Avg. Completion Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {analytics.avgCompletionTime} min
            </div>
            <p className="text-sm text-gray-600">
              2 minutes faster than last week
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Alert Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">
              {Math.round(analytics.alertRate)}%
            </div>
            <p className="text-sm text-gray-600">
              Medical alerts requiring follow-up
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StaffAdminInterface;