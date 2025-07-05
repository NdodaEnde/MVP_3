import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getPatients, updatePatientStatus } from '@/api/patients';
import { useToast } from '@/hooks/useToast';
import { Patient } from '@/types';
import {
  Users,
  Search,
  Filter,
  Clock,
  ArrowRight,
  Eye,
  Edit,
  MoreHorizontal,
  FileText
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const statusColors = {
  'checked-in': 'bg-blue-100 text-blue-800',
  'questionnaire': 'bg-yellow-100 text-yellow-800',
  'nurse': 'bg-purple-100 text-purple-800',
  'technician': 'bg-orange-100 text-orange-800',
  'doctor': 'bg-red-100 text-red-800',
  'completed': 'bg-green-100 text-green-800'
};

const statusLabels = {
  'checked-in': 'Checked In',
  'questionnaire': 'Questionnaire',
  'nurse': 'Nurse Station',
  'technician': 'Technician',
  'doctor': 'Doctor Review',
  'completed': 'Completed'
};

export function PatientQueue() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { toast } = useToast();

  useEffect(() => {
    fetchPatients();
  }, [statusFilter]);

  const fetchPatients = async () => {
    try {
      const response = await getPatients({
        status: statusFilter === 'all' ? undefined : statusFilter
      });
      setPatients((response as any).patients);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load patients",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (patientId: string, newStatus: string) => {
    try {
      await updatePatientStatus(patientId, newStatus);
      toast({
        title: "Success",
        description: "Patient status updated successfully",
      });
      fetchPatients();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update patient status",
        variant: "destructive",
      });
    }
  };

  // FIXED: Safe filtering with proper null/undefined checks
  const filteredPatients = patients.filter(patient => {
    if (!patient) return false;
    
    const searchLower = searchTerm.toLowerCase();
    
    // Safe property access with fallbacks
    const name = patient.name || `${patient.firstName || ''} ${patient.surname || ''}`.trim();
    const idNumber = patient.idNumber || '';
    const employer = patient.employer || patient.employerName || '';
    
    return (
      name.toLowerCase().includes(searchLower) ||
      idNumber.includes(searchTerm) ||
      employer.toLowerCase().includes(searchLower)
    );
  });

  const getNextStatus = (currentStatus: string) => {
    const statusFlow = ['checked-in', 'questionnaire', 'nurse', 'technician', 'doctor', 'completed'];
    const currentIndex = statusFlow.indexOf(currentStatus);
    return currentIndex < statusFlow.length - 1 ? statusFlow[currentIndex + 1] : currentStatus;
  };

  const getWaitTime = (updatedAt: string) => {
    if (!updatedAt) return 0;
    const now = new Date();
    const updated = new Date(updatedAt);
    const diffMinutes = Math.floor((now.getTime() - updated.getTime()) / (1000 * 60));
    return Math.max(0, diffMinutes);
  };

  // Safe display helpers
  const getPatientName = (patient: any) => {
    return patient.name || `${patient.firstName || ''} ${patient.surname || ''}`.trim() || 'Unknown Patient';
  };

  const getPatientEmployer = (patient: any) => {
    return patient.employer || patient.employerName || 'Unknown Employer';
  };

  const getExaminationType = (patient: any) => {
    return patient.examinationType || 'Standard';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-48 mb-2"></div>
          <div className="h-4 bg-muted rounded w-96"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
          <Users className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Patient Queue</h1>
          <p className="text-muted-foreground">
            Monitor and manage patient flow through examination stations
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters & Search</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, ID, or employer..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filter by status" />
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
        </CardContent>
      </Card>

      {/* Patient Table */}
      <Card>
        <CardHeader>
          <CardTitle>Current Patients ({filteredPatients.length})</CardTitle>
          <CardDescription>
            Real-time view of all patients in the examination workflow
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient</TableHead>
                <TableHead>Employer</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Wait Time</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPatients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    {loading ? "Loading patients..." : "No patients found"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredPatients.map((patient) => (
                  <TableRow key={patient._id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{getPatientName(patient)}</div>
                        <div className="text-sm text-muted-foreground">
                          ID: {patient.idNumber || 'N/A'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getPatientEmployer(patient)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {getExaminationType(patient).replace('-', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[patient.status] || 'bg-gray-100 text-gray-800'}>
                        {statusLabels[patient.status] || patient.status || 'Unknown'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {getWaitTime(patient.updatedAt)}m
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {patient.status !== 'completed' && (
                          <Button
                            size="sm"
                            onClick={() => handleStatusUpdate(patient._id, getNextStatus(patient.status))}
                            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                          >
                            <ArrowRight className="h-4 w-4 mr-1" />
                            Next
                          </Button>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => navigate(`/patient-ehr/${patient._id}`)}>
                              <FileText className="mr-2 h-4 w-4" />
                              View EHR
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Patient
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600">
                              Remove from Queue
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}