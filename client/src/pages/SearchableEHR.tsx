import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { getPatients } from '@/api/patients';
import { getQuestionnaireByPatient } from '@/api/questionnaires';
import { getPatientVitals } from '@/api/vitals';
import { getPatientTests } from '@/api/tests';
import { useToast } from '@/hooks/useToast';
import { Patient } from '@/types';
import {
  Search,
  Filter,
  Download,
  Eye,
  Calendar,
  Building,
  FileText,
  Activity,
  TestTube,
  TrendingUp,
  Users,
  BarChart3,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Printer,
  RefreshCw,
  MoreHorizontal
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface SearchFilters {
  searchTerm: string;
  employer: string;
  examinationType: string;
  status: string;
  dateRange: {
    from: Date | undefined;
    to: Date | undefined;
  };
  ageRange: {
    min: string;
    max: string;
  };
  medicalConditions: string[];
  riskLevel: string;
}

interface PatientRecord extends Patient {
  lastExamination: string;
  totalExaminations: number;
  riskFlags: string[];
  complianceStatus: 'compliant' | 'overdue' | 'upcoming';
  lastVitals?: any;
  lastTests?: any;
}

export function SearchableEHR() {
  const navigate = useNavigate();
  const [allPatients, setAllPatients] = useState<PatientRecord[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<PatientRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeView, setActiveView] = useState('list');
  const [selectedPatients, setSelectedPatients] = useState<string[]>([]);
  const { toast } = useToast();

  const [filters, setFilters] = useState<SearchFilters>({
    searchTerm: '',
    employer: 'all',
    examinationType: 'all',
    status: 'all',
    dateRange: {
      from: undefined,
      to: undefined
    },
    ageRange: {
      min: '',
      max: ''
    },
    medicalConditions: [],
    riskLevel: 'all'
  });

  const [statistics, setStatistics] = useState({
    totalPatients: 0,
    activeExaminations: 0,
    completedThisMonth: 0,
    overdueExaminations: 0,
    highRiskPatients: 0,
    averageAge: 0,
    topEmployers: [] as { name: string; count: number }[],
    examinationTypes: [] as { type: string; count: number }[]
  });

  useEffect(() => {
    fetchAllPatientData();
  }, []);

  useEffect(() => {
    applyFilters();
    calculateStatistics();
  }, [filters, allPatients]);

  const fetchAllPatientData = async () => {
    setLoading(true);
    try {
      // Fetch all patients regardless of status
      const response = await getPatients({});
      const patients = (response as any).patients || [];

      // Enhance patient data with additional information
      const enhancedPatients = await Promise.all(
        patients.map(async (patient: Patient) => {
          try {
            // Fetch additional data for each patient
            const [vitalsResponse, testsResponse, questionnaireResponse] = await Promise.all([
              getPatientVitals(patient._id).catch(() => ({ vitals: [] })),
              getPatientTests(patient._id).catch(() => ({ tests: [] })),
              getQuestionnaireByPatient(patient._id).catch(() => ({ questionnaires: [] }))
            ]);

            const vitals = (vitalsResponse as any).vitals || [];
            const tests = (testsResponse as any).tests || [];
            const questionnaires = (questionnaireResponse as any).questionnaires || [];

            // Calculate risk flags
            const riskFlags = calculateRiskFlags(vitals, tests, questionnaires);

            // Determine compliance status
            const complianceStatus = calculateComplianceStatus(patient, questionnaires);

            return {
              ...patient,
              lastExamination: questionnaires.length > 0 ? questionnaires[0].completedAt : 'N/A',
              totalExaminations: questionnaires.length,
              riskFlags,
              complianceStatus,
              lastVitals: vitals.length > 0 ? vitals[0] : null,
              lastTests: tests.length > 0 ? tests[0] : null
            } as PatientRecord;
          } catch (error) {
            console.error(`Error fetching data for patient ${patient._id}:`, error);
            return {
              ...patient,
              lastExamination: 'N/A',
              totalExaminations: 0,
              riskFlags: [],
              complianceStatus: 'unknown',
              lastVitals: null,
              lastTests: null
            } as PatientRecord;
          }
        })
      );

      setAllPatients(enhancedPatients);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load patient data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateRiskFlags = (vitals: any[], tests: any[], questionnaires: any[]) => {
    const flags: string[] = [];

    // Analyze latest vitals
    if (vitals.length > 0) {
      const latest = vitals[0];
      if (latest.measurements) {
        if (latest.measurements.blood_pressure?.systolic >= 140) {
          flags.push('High Blood Pressure');
        }
        if (latest.measurements.bmi >= 30) {
          flags.push('Obesity');
        }
        if (latest.measurements.pulse_rate > 100 || latest.measurements.pulse_rate < 60) {
          flags.push('Abnormal Heart Rate');
        }
      }
    }

    // Analyze test results
    if (tests.length > 0) {
      const latest = tests[0];
      if (latest.status === 'abnormal') {
        flags.push('Abnormal Test Results');
      }
    }

    // Analyze questionnaires for medical history
    if (questionnaires.length > 0) {
      const latest = questionnaires[0];
      if (latest.medical_history?.current_conditions) {
        const conditions = latest.medical_history.current_conditions;
        if (conditions.heart_disease_high_bp) flags.push('Heart Disease History');
        if (conditions.family_mellitus_diabetes) flags.push('Diabetes Family History');
        if (conditions.epilepsy_convulsions) flags.push('Epilepsy History');
      }
    }

    return flags;
  };

  const calculateComplianceStatus = (patient: Patient, questionnaires: any[]) => {
    if (questionnaires.length === 0) return 'overdue';
    
    const lastExam = new Date(questionnaires[0].completedAt);
    const now = new Date();
    const monthsDiff = (now.getTime() - lastExam.getTime()) / (1000 * 60 * 60 * 24 * 30);

    // Assume annual examinations are required
    if (monthsDiff > 12) return 'overdue';
    if (monthsDiff > 10) return 'upcoming';
    return 'compliant';
  };

  const applyFilters = () => {
    let filtered = [...allPatients];

    // Text search
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(patient => 
        patient.name?.toLowerCase().includes(term) ||
        patient.idNumber?.toLowerCase().includes(term) ||
        patient.employer?.toLowerCase().includes(term) ||
        patient.employerName?.toLowerCase().includes(term) ||
        patient.position?.toLowerCase().includes(term) ||
        patient.department?.toLowerCase().includes(term)
      );
    }

    // Employer filter
    if (filters.employer !== 'all') {
      filtered = filtered.filter(patient => 
        patient.employer === filters.employer || patient.employerName === filters.employer
      );
    }

    // Examination type filter
    if (filters.examinationType !== 'all') {
      filtered = filtered.filter(patient => patient.examinationType === filters.examinationType);
    }

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(patient => patient.status === filters.status);
    }

    // Risk level filter
    if (filters.riskLevel !== 'all') {
      filtered = filtered.filter(patient => {
        const riskCount = patient.riskFlags.length;
        switch (filters.riskLevel) {
          case 'high': return riskCount >= 3;
          case 'medium': return riskCount >= 1 && riskCount < 3;
          case 'low': return riskCount === 0;
          default: return true;
        }
      });
    }

    // Age range filter
    if (filters.ageRange.min || filters.ageRange.max) {
      filtered = filtered.filter(patient => {
        const age = patient.age;
        const min = filters.ageRange.min ? parseInt(filters.ageRange.min) : 0;
        const max = filters.ageRange.max ? parseInt(filters.ageRange.max) : 150;
        return age >= min && age <= max;
      });
    }

    // Date range filter
    if (filters.dateRange.from || filters.dateRange.to) {
      filtered = filtered.filter(patient => {
        if (patient.lastExamination === 'N/A') return false;
        const examDate = new Date(patient.lastExamination);
        if (filters.dateRange.from && examDate < filters.dateRange.from) return false;
        if (filters.dateRange.to && examDate > filters.dateRange.to) return false;
        return true;
      });
    }

    setFilteredPatients(filtered);
  };

  const calculateStatistics = () => {
    const total = allPatients.length;
    const active = allPatients.filter(p => ['checked-in', 'questionnaire', 'nurse', 'technician', 'doctor'].includes(p.status)).length;
    const completed = allPatients.filter(p => p.status === 'completed').length;
    const overdue = allPatients.filter(p => p.complianceStatus === 'overdue').length;
    const highRisk = allPatients.filter(p => p.riskFlags.length >= 3).length;
    const avgAge = total > 0 ? Math.round(allPatients.reduce((sum, p) => sum + p.age, 0) / total) : 0;

    // Top employers
    const employerCounts = allPatients.reduce((acc, patient) => {
      const employer = patient.employer || patient.employerName || 'Unknown';
      acc[employer] = (acc[employer] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topEmployers = Object.entries(employerCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    // Examination types
    const examTypeCounts = allPatients.reduce((acc, patient) => {
      const type = patient.examinationType || 'Unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const examinationTypes = Object.entries(examTypeCounts)
      .sort(([,a], [,b]) => b - a)
      .map(([type, count]) => ({ type, count }));

    setStatistics({
      totalPatients: total,
      activeExaminations: active,
      completedThisMonth: completed,
      overdueExaminations: overdue,
      highRiskPatients: highRisk,
      averageAge: avgAge,
      topEmployers,
      examinationTypes
    });
  };

  const getComplianceColor = (status: string) => {
    switch (status) {
      case 'compliant': return 'bg-green-100 text-green-800';
      case 'upcoming': return 'bg-yellow-100 text-yellow-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRiskLevel = (flags: string[]) => {
    if (flags.length >= 3) return { level: 'High', color: 'bg-red-100 text-red-800' };
    if (flags.length >= 1) return { level: 'Medium', color: 'bg-yellow-100 text-yellow-800' };
    return { level: 'Low', color: 'bg-green-100 text-green-800' };
  };

  const exportData = () => {
    const csvData = filteredPatients.map(patient => ({
      Name: patient.name || `${patient.firstName} ${patient.surname}`,
      ID: patient.idNumber,
      Age: patient.age,
      Employer: patient.employer || patient.employerName,
      Position: patient.position,
      Status: patient.status,
      'Last Examination': patient.lastExamination,
      'Risk Flags': patient.riskFlags.join('; '),
      'Compliance Status': patient.complianceStatus
    }));

    const csv = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `patient_records_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearFilters = () => {
    setFilters({
      searchTerm: '',
      employer: 'all',
      examinationType: 'all',
      status: 'all',
      dateRange: { from: undefined, to: undefined },
      ageRange: { min: '', max: '' },
      medicalConditions: [],
      riskLevel: 'all'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
            <FileText className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Patient EHR Database</h1>
            <p className="text-muted-foreground">
              Comprehensive search and analysis of all patient records
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={fetchAllPatientData} variant="outline" disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={exportData} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Statistics Dashboard */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.totalPatients}</div>
            <p className="text-xs text-muted-foreground">
              All registered patients
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Examinations</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.activeExaminations}</div>
            <p className="text-xs text-muted-foreground">
              Currently in workflow
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Risk Patients</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.highRiskPatients}</div>
            <p className="text-xs text-muted-foreground">
              Require attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Examinations</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.overdueExaminations}</div>
            <p className="text-xs text-muted-foreground">
              Need scheduling
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeView} onValueChange={setActiveView}>
        <TabsList>
          <TabsTrigger value="list">Patient List</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          {/* Advanced Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Advanced Search & Filters
              </CardTitle>
              <CardDescription>
                Search and filter patient records using multiple criteria
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {/* Search Term */}
                <div className="space-y-2">
                  <Label>Search</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Name, ID, employer..."
                      value={filters.searchTerm}
                      onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Employer Filter */}
                <div className="space-y-2">
                  <Label>Employer</Label>
                  <Select value={filters.employer} onValueChange={(value) => setFilters({ ...filters, employer: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="All employers" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Employers</SelectItem>
                      {statistics.topEmployers.map((employer) => (
                        <SelectItem key={employer.name} value={employer.name}>
                          {employer.name} ({employer.count})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Examination Type */}
                <div className="space-y-2">
                  <Label>Examination Type</Label>
                  <Select value={filters.examinationType} onValueChange={(value) => setFilters({ ...filters, examinationType: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="All types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="pre-employment">Pre-employment</SelectItem>
                      <SelectItem value="periodic">Periodic</SelectItem>
                      <SelectItem value="return-to-work">Return to Work</SelectItem>
                      <SelectItem value="exit">Exit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Risk Level */}
                <div className="space-y-2">
                  <Label>Risk Level</Label>
                  <Select value={filters.riskLevel} onValueChange={(value) => setFilters({ ...filters, riskLevel: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="All risk levels" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Risk Levels</SelectItem>
                      <SelectItem value="high">High Risk</SelectItem>
                      <SelectItem value="medium">Medium Risk</SelectItem>
                      <SelectItem value="low">Low Risk</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                {/* Age Range */}
                <div className="space-y-2">
                  <Label>Age Range</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Min"
                      type="number"
                      value={filters.ageRange.min}
                      onChange={(e) => setFilters({ ...filters, ageRange: { ...filters.ageRange, min: e.target.value }})}
                    />
                    <Input
                      placeholder="Max"
                      type="number"
                      value={filters.ageRange.max}
                      onChange={(e) => setFilters({ ...filters, ageRange: { ...filters.ageRange, max: e.target.value }})}
                    />
                  </div>
                </div>

                {/* Status Filter */}
                <div className="space-y-2">
                  <Label>Current Status</Label>
                  <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="checked-in">Checked In</SelectItem>
                      <SelectItem value="questionnaire">Questionnaire</SelectItem>
                      <SelectItem value="nurse">Nurse Station</SelectItem>
                      <SelectItem value="technician">Technician</SelectItem>
                      <SelectItem value="doctor">Doctor Review</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Clear Filters */}
                <div className="space-y-2">
                  <Label>&nbsp;</Label>
                  <Button onClick={clearFilters} variant="outline" className="w-full">
                    Clear All Filters
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Results Summary */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {filteredPatients.length} of {allPatients.length} patients
                </p>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    {filteredPatients.filter(p => p.riskFlags.length >= 3).length} High Risk
                  </Badge>
                  <Badge variant="outline">
                    {filteredPatients.filter(p => p.complianceStatus === 'overdue').length} Overdue
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Patient Records Table */}
          <Card>
            <CardHeader>
              <CardTitle>Patient Records</CardTitle>
              <CardDescription>
                Comprehensive list of all patient records with key information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient</TableHead>
                    <TableHead>Employer</TableHead>
                    <TableHead>Last Examination</TableHead>
                    <TableHead>Risk Level</TableHead>
                    <TableHead>Compliance</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <div className="flex items-center justify-center">
                          <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                          Loading patient records...
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredPatients.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No patients found matching your criteria
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPatients.map((patient) => {
                      const risk = getRiskLevel(patient.riskFlags);
                      return (
                        <TableRow key={patient._id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">
                                {patient.name || `${patient.firstName} ${patient.surname}`}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                ID: {patient.idNumber} • Age: {patient.age}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {patient.position} • {patient.department}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Building className="h-4 w-4 text-muted-foreground" />
                              {patient.employer || patient.employerName}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              {patient.lastExamination === 'N/A' ? 'Never' : new Date(patient.lastExamination).toLocaleDateString()}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {patient.totalExaminations} total exams
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={risk.color}>{risk.level}</Badge>
                            {patient.riskFlags.length > 0 && (
                              <div className="text-xs text-muted-foreground mt-1">
                                {patient.riskFlags.slice(0, 2).join(', ')}
                                {patient.riskFlags.length > 2 && '...'}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge className={getComplianceColor(patient.complianceStatus)}>
                              {patient.complianceStatus}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{patient.status}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => navigate(`/patient-ehr/${patient._id}`)}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View EHR
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuItem>
                                    <FileText className="mr-2 h-4 w-4" />
                                    View History
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <TrendingUp className="mr-2 h-4 w-4" />
                                    View Trends
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <Printer className="mr-2 h-4 w-4" />
                                    Print Record
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem>
                                    Schedule Follow-up
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          {/* Analytics Dashboard */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Top Employers */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Top Employers
                </CardTitle>
                <CardDescription>
                  Organizations with most patients
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {statistics.topEmployers.map((employer, index) => (
                    <div key={employer.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{index + 1}</Badge>
                        <span className="font-medium">{employer.name}</span>
                      </div>
                      <Badge>{employer.count} patients</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Examination Types */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TestTube className="h-5 w-5" />
                  Examination Types
                </CardTitle>
                <CardDescription>
                  Distribution of examination types
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {statistics.examinationTypes.map((exam, index) => (
                    <div key={exam.type} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{index + 1}</Badge>
                        <span className="font-medium capitalize">{exam.type.replace('-', ' ')}</span>
                      </div>
                      <Badge>{exam.count} exams</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Risk Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Risk Distribution
                </CardTitle>
                <CardDescription>
                  Patient risk level breakdown
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { level: 'High Risk', count: allPatients.filter(p => p.riskFlags.length >= 3).length, color: 'bg-red-100 text-red-800' },
                    { level: 'Medium Risk', count: allPatients.filter(p => p.riskFlags.length >= 1 && p.riskFlags.length < 3).length, color: 'bg-yellow-100 text-yellow-800' },
                    { level: 'Low Risk', count: allPatients.filter(p => p.riskFlags.length === 0).length, color: 'bg-green-100 text-green-800' }
                  ].map((risk) => (
                    <div key={risk.level} className="flex items-center justify-between">
                      <span className="font-medium">{risk.level}</span>
                      <div className="flex items-center gap-2">
                        <Badge className={risk.color}>{risk.count} patients</Badge>
                        <span className="text-sm text-muted-foreground">
                          ({statistics.totalPatients > 0 ? Math.round((risk.count / statistics.totalPatients) * 100) : 0}%)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Compliance Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Compliance Status
                </CardTitle>
                <CardDescription>
                  Examination compliance overview
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { status: 'Compliant', count: allPatients.filter(p => p.complianceStatus === 'compliant').length, color: 'bg-green-100 text-green-800' },
                    { status: 'Upcoming', count: allPatients.filter(p => p.complianceStatus === 'upcoming').length, color: 'bg-yellow-100 text-yellow-800' },
                    { status: 'Overdue', count: allPatients.filter(p => p.complianceStatus === 'overdue').length, color: 'bg-red-100 text-red-800' }
                  ].map((compliance) => (
                    <div key={compliance.status} className="flex items-center justify-between">
                      <span className="font-medium">{compliance.status}</span>
                      <div className="flex items-center gap-2">
                        <Badge className={compliance.color}>{compliance.count} patients</Badge>
                        <span className="text-sm text-muted-foreground">
                          ({statistics.totalPatients > 0 ? Math.round((compliance.count / statistics.totalPatients) * 100) : 0}%)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Additional Analytics */}
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Average Age</CardTitle>
                <CardDescription>Patient age demographics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{statistics.averageAge} years</div>
                <p className="text-sm text-muted-foreground mt-2">
                  Age range: {Math.min(...allPatients.map(p => p.age))} - {Math.max(...allPatients.map(p => p.age))} years
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Common Risk Factors</CardTitle>
                <CardDescription>Most frequent medical alerts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {(() => {
                    const riskCounts = allPatients
                      .flatMap(p => p.riskFlags)
                      .reduce((acc, flag) => {
                        acc[flag] = (acc[flag] || 0) + 1;
                        return acc;
                      }, {} as Record<string, number>);
                    
                    return Object.entries(riskCounts)
                      .sort(([,a], [,b]) => b - a)
                      .slice(0, 5)
                      .map(([flag, count]) => (
                        <div key={flag} className="flex items-center justify-between text-sm">
                          <span>{flag}</span>
                          <Badge variant="outline">{count}</Badge>
                        </div>
                      ));
                  })()}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Health</CardTitle>
                <CardDescription>Overall metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Active Workflow</span>
                    <Badge variant="outline">
                      {Math.round((statistics.activeExaminations / statistics.totalPatients) * 100)}%
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>High Risk Rate</span>
                    <Badge variant="outline" className="bg-red-50 text-red-700">
                      {Math.round((statistics.highRiskPatients / statistics.totalPatients) * 100)}%
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Overdue Rate</span>
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                      {Math.round((statistics.overdueExaminations / statistics.totalPatients) * 100)}%
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Action Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Actionable Insights
              </CardTitle>
              <CardDescription>
                Key recommendations based on current data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <h4 className="font-medium flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    High Priority Actions
                  </h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    {statistics.overdueExaminations > 0 && (
                      <li>• Schedule {statistics.overdueExaminations} overdue examinations</li>
                    )}
                    {statistics.highRiskPatients > 0 && (
                      <li>• Review {statistics.highRiskPatients} high-risk patients</li>
                    )}
                    {allPatients.filter(p => p.complianceStatus === 'upcoming').length > 0 && (
                      <li>• Contact {allPatients.filter(p => p.complianceStatus === 'upcoming').length} patients for upcoming renewals</li>
                    )}
                  </ul>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-blue-500" />
                    Optimization Opportunities
                  </h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• Implement preventive care programs for high-risk groups</li>
                    <li>• Automate reminder systems for compliance</li>
                    <li>• Develop employer-specific health initiatives</li>
                    <li>• Create risk-based examination protocols</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}