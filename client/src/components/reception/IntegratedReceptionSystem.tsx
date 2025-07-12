// src/components/reception/IntegratedReceptionSystem.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/useToast';
import {
  Search, UserPlus, Users, Tablet, QrCode, Building, 
  Clock, CheckCircle, AlertTriangle, RefreshCw, Printer,
  Scan, MapPin, Phone, Mail, Calendar, FileText
} from 'lucide-react';

// 🔧 Interface Types
interface Patient {
  id: string;
  firstName: string;
  surname: string;
  idNumber: string;
  company: string;
  position: string;
  examinationType: string;
  status: 'new' | 'returning' | 'checked_in' | 'in_progress';
  appointmentTime?: string;
  contactNumber?: string;
  email?: string;
}

interface TabletAssignment {
  tabletId: string;
  patientId: string;
  assignedAt: string;
  qrCode: string;
  status: 'assigned' | 'in_use' | 'completed';
}

interface Company {
  id: string;
  name: string;
  contactPerson: string;
  defaultExamType: string;
  employees: number;
  lastVisit: string;
}

// 🏥 Main Reception Integration Component
export const IntegratedReceptionSystem: React.FC = () => {
  // 📊 State Management
  const [activeTab, setActiveTab] = useState('checkin');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [availableTablets, setAvailableTablets] = useState<string[]>([]);
  const [tabletAssignments, setTabletAssignments] = useState<TabletAssignment[]>([]);
  const [recentPatients, setRecentPatients] = useState<Patient[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [queueStats, setQueueStats] = useState({
    total: 0,
    checked_in: 0,
    in_progress: 0,
    completed: 0,
    avg_wait_time: 0
  });

  const { toast } = useToast();

  // 🔧 Load Initial Data
  useEffect(() => {
    loadReceptionData();
    // Refresh every 30 seconds
    const interval = setInterval(loadReceptionData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadReceptionData = async () => {
    try {
      // Load available tablets
      const tabletsResponse = await fetch('/api/tablets/available');
      const tablets = await tabletsResponse.json();
      setAvailableTablets(tablets.map((t: any) => t.id));

      // Load recent patients
      const patientsResponse = await fetch('/api/patients/recent');
      const patients = await patientsResponse.json();
      setRecentPatients(patients);

      // Load companies
      const companiesResponse = await fetch('/api/companies');
      const companiesData = await companiesResponse.json();
      setCompanies(companiesData);

      // Load queue statistics
      const statsResponse = await fetch('/api/queue/stats');
      const stats = await statsResponse.json();
      setQueueStats(stats);

    } catch (error) {
      console.error('Failed to load reception data:', error);
    }
  };

  // 🔍 Patient Search
  const searchPatients = async (query: string) => {
    if (query.length < 2) return [];
    
    try {
      const response = await fetch(`/api/patients/search?q=${encodeURIComponent(query)}`);
      const results = await response.json();
      return results.patients || [];
    } catch (error) {
      console.error('Patient search failed:', error);
      return [];
    }
  };

  // 📱 Tablet Assignment
  const assignTablet = async (patient: Patient) => {
    if (availableTablets.length === 0) {
      toast({
        title: "No Tablets Available",
        description: "All tablets are currently in use. Please wait or use staff assistance.",
        variant: "destructive",
      });
      return;
    }

    try {
      const tabletId = availableTablets[0];
      const assignment = {
        tabletId,
        patientId: patient.id,
        assignedAt: new Date().toISOString(),
        qrCode: generateQRCode(patient.id, tabletId),
        status: 'assigned' as const
      };

      // Create tablet assignment
      await fetch('/api/tablets/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(assignment)
      });

      // Update local state
      setTabletAssignments(prev => [...prev, assignment]);
      setAvailableTablets(prev => prev.filter(id => id !== tabletId));

      toast({
        title: "Tablet Assigned Successfully! 📱",
        description: `${patient.firstName} can now proceed to tablet ${tabletId}`,
      });

      // Print QR code if needed
      if (confirm('Print QR code for patient?')) {
        printQRCode(assignment);
      }

    } catch (error) {
      console.error('Tablet assignment failed:', error);
      toast({
        title: "Assignment Failed",
        description: "Unable to assign tablet. Please try again.",
        variant: "destructive",
      });
    }
  };

  // 🔧 Helper Functions
  const generateQRCode = (patientId: string, tabletId: string): string => {
    return `surgiscan://questionnaire?patient=${patientId}&tablet=${tabletId}&timestamp=${Date.now()}`;
  };

  const printQRCode = (assignment: TabletAssignment) => {
    // Generate printable QR code
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head><title>Patient QR Code</title></head>
          <body style="text-align: center; padding: 50px;">
            <h2>SurgiScan Digital Questionnaire</h2>
            <div id="qrcode" style="margin: 20px;"></div>
            <p><strong>Patient ID:</strong> ${assignment.patientId}</p>
            <p><strong>Tablet:</strong> ${assignment.tabletId}</p>
            <p><strong>Scan this code with the tablet</strong></p>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* 📊 Header Dashboard */}
        <Card className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">Reception Dashboard</h1>
                <p className="text-blue-100">Streamlined patient check-in and tablet management</p>
              </div>
              
              <div className="grid grid-cols-4 gap-4 text-center">
                <div className="bg-white/20 rounded-lg p-3">
                  <div className="text-2xl font-bold">{queueStats.total}</div>
                  <div className="text-xs text-blue-100">Total Today</div>
                </div>
                <div className="bg-white/20 rounded-lg p-3">
                  <div className="text-2xl font-bold">{queueStats.checked_in}</div>
                  <div className="text-xs text-blue-100">Checked In</div>
                </div>
                <div className="bg-white/20 rounded-lg p-3">
                  <div className="text-2xl font-bold">{availableTablets.length}</div>
                  <div className="text-xs text-blue-100">Tablets Free</div>
                </div>
                <div className="bg-white/20 rounded-lg p-3">
                  <div className="text-2xl font-bold">{queueStats.avg_wait_time}m</div>
                  <div className="text-xs text-blue-100">Avg Wait</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 🔄 Main Interface Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="checkin" className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Patient Check-in
            </TabsTrigger>
            <TabsTrigger value="tablets" className="flex items-center gap-2">
              <Tablet className="h-4 w-4" />
              Tablet Management
            </TabsTrigger>
            <TabsTrigger value="queue" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Queue Monitor
            </TabsTrigger>
            <TabsTrigger value="companies" className="flex items-center gap-2">
              <Building className="h-4 w-4" />
              Companies
            </TabsTrigger>
          </TabsList>

          {/* 👤 Patient Check-in Tab */}
          <TabsContent value="checkin" className="space-y-6">
            <PatientCheckInInterface
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              selectedPatient={selectedPatient}
              setSelectedPatient={setSelectedPatient}
              onAssignTablet={assignTablet}
              companies={companies}
              searchPatients={searchPatients}
            />
          </TabsContent>

          {/* 📱 Tablet Management Tab */}
          <TabsContent value="tablets" className="space-y-6">
            <TabletManagementInterface
              availableTablets={availableTablets}
              tabletAssignments={tabletAssignments}
              onTabletRelease={(tabletId) => {
                setAvailableTablets(prev => [...prev, tabletId]);
                setTabletAssignments(prev => prev.filter(a => a.tabletId !== tabletId));
              }}
            />
          </TabsContent>

          {/* 👥 Queue Monitor Tab */}
          <TabsContent value="queue" className="space-y-6">
            <QueueMonitorInterface
              recentPatients={recentPatients}
              queueStats={queueStats}
              onRefresh={loadReceptionData}
            />
          </TabsContent>

          {/* 🏢 Companies Tab */}
          <TabsContent value="companies" className="space-y-6">
            <CompanyManagementInterface
              companies={companies}
              onCompanySelect={(company) => {
                // Pre-fill new patient form with company data
                console.log('Selected company:', company);
              }}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

// 👤 Patient Check-in Interface Component
const PatientCheckInInterface: React.FC<{
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedPatient: Patient | null;
  setSelectedPatient: (patient: Patient | null) => void;
  onAssignTablet: (patient: Patient) => void;
  companies: Company[];
  searchPatients: (query: string) => Promise<Patient[]>;
}> = ({
  searchTerm,
  setSearchTerm,
  selectedPatient,
  setSelectedPatient,
  onAssignTablet,
  companies,
  searchPatients
}) => {
  const [searchResults, setSearchResults] = useState<Patient[]>([]);
  const [isNewPatient, setIsNewPatient] = useState(false);
  const [newPatientData, setNewPatientData] = useState({
    firstName: '',
    surname: '',
    idNumber: '',
    company: '',
    position: '',
    examinationType: 'pre_employment',
    contactNumber: '',
    email: ''
  });

  // 🔍 Search Handler
  useEffect(() => {
    const performSearch = async () => {
      if (searchTerm.length >= 2) {
        const results = await searchPatients(searchTerm);
        setSearchResults(results);
      } else {
        setSearchResults([]);
      }
    };

    const debounceTimer = setTimeout(performSearch, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm, searchPatients]);

  return (
    <div className="space-y-6">
      
      {/* 🔍 Search Interface */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Patient Lookup
          </CardTitle>
          <CardDescription>
            Search by name, ID number, or company to check in existing patients
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          
          <div className="flex items-center space-x-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by name, ID, or company..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-12 text-lg"
              />
            </div>
            
            <Button
              onClick={() => setIsNewPatient(true)}
              className="h-12 px-6"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              New Patient
            </Button>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-semibold text-sm text-gray-600">Search Results</h4>
              {searchResults.map((patient) => (
                <PatientSearchResult
                  key={patient.id}
                  patient={patient}
                  onSelect={setSelectedPatient}
                  isSelected={selectedPatient?.id === patient.id}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 👤 Selected Patient Details */}
      {selectedPatient && (
        <PatientCheckInDetails
          patient={selectedPatient}
          onAssignTablet={onAssignTablet}
          onCancel={() => setSelectedPatient(null)}
        />
      )}

      {/* ➕ New Patient Registration */}
      {isNewPatient && (
        <NewPatientRegistration
          data={newPatientData}
          setData={setNewPatientData}
          companies={companies}
          onSave={async (data) => {
            // Save new patient
            const response = await fetch('/api/patients', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(data)
            });
            
            if (response.ok) {
              const newPatient = await response.json();
              setSelectedPatient(newPatient);
              setIsNewPatient(false);
            }
          }}
          onCancel={() => setIsNewPatient(false)}
        />
      )}
    </div>
  );
};

// Additional components would be implemented here...
// PatientSearchResult, PatientCheckInDetails, NewPatientRegistration, etc.

export default IntegratedReceptionSystem;