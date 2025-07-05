import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { getPatients } from '@/api/patients';
import { getPatientVitals } from '@/api/vitals';
import { getPatientTests } from '@/api/tests';
import { generateCertificate, getCertificates } from '@/api/certificates';
import { useToast } from '@/hooks/useToast';
import { Patient, VitalSigns, TestResults, Certificate } from '@/types';
import {
  Award,
  User,
  FileText,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Eye,
  Download,
  Send,
  Clock,
  Activity,
  Heart,
  TestTube,
  Stethoscope,
  Search,
  Filter
} from 'lucide-react';

const certificateSchema = z.object({
  patientId: z.string().min(1, 'Patient selection is required'),
  status: z.enum(['fit', 'fit-with-restrictions', 'unfit']),
  restrictions: z.array(z.string()).optional(),
  recommendations: z.string().optional(),
  validUntil: z.string().min(1, 'Valid until date is required')
});

type CertificateFormData = z.infer<typeof certificateSchema>;

export function CertificateManagement() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patientVitals, setPatientVitals] = useState<VitalSigns[]>([]);
  const [patientTests, setPatientTests] = useState<TestResults[]>([]);
  const [activeTab, setActiveTab] = useState('review');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { toast } = useToast();

  const form = useForm<CertificateFormData>({
    resolver: zodResolver(certificateSchema),
    defaultValues: {
      patientId: '',
      status: 'fit',
      restrictions: [],
      recommendations: '',
      validUntil: ''
    }
  });

  useEffect(() => {
    fetchPatients();
    fetchCertificates();
  }, []);

  const fetchPatients = async () => {
    try {
      const response = await getPatients({ status: 'doctor' });
      setPatients((response as any).patients);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load patients",
        variant: "destructive",
      });
    }
  };

  const fetchCertificates = async () => {
    try {
      const response = await getCertificates({
        status: statusFilter === 'all' ? undefined : statusFilter
      });
      setCertificates((response as any).certificates);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load certificates",
        variant: "destructive",
      });
    }
  };

  const handlePatientSelect = async (patientId: string) => {
    const patient = patients.find(p => p._id === patientId);
    setSelectedPatient(patient || null);
    form.setValue('patientId', patientId);

    // Set default valid until date (1 year from now)
    const validUntil = new Date();
    validUntil.setFullYear(validUntil.getFullYear() + 1);
    form.setValue('validUntil', validUntil.toISOString().split('T')[0]);

    if (patient) {
      try {
        const [vitalsResponse, testsResponse] = await Promise.all([
          getPatientVitals(patientId),
          getPatientTests(patientId)
        ]);
        setPatientVitals((vitalsResponse as any).vitals);
        setPatientTests((testsResponse as any).testResults);
      } catch (error) {
        console.log('No previous data found');
      }
    }
  };

  const onSubmit = async (data: CertificateFormData) => {
    setIsSubmitting(true);
    try {
      const certificateData = {
        patientId: data.patientId,
        status: data.status,
        restrictions: data.restrictions || [],
        recommendations: data.recommendations,
        validUntil: data.validUntil
      };

      await generateCertificate(certificateData);
      toast({
        title: "Success",
        description: "Certificate generated successfully",
      });

      form.reset();
      setSelectedPatient(null);
      setPatientVitals([]);
      setPatientTests([]);
      fetchPatients();
      fetchCertificates();
      setActiveTab('certificates');
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate certificate",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'fit':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'fit-with-restrictions':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'unfit':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'fit':
        return 'bg-green-100 text-green-800';
      case 'fit-with-restrictions':
        return 'bg-yellow-100 text-yellow-800';
      case 'unfit':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getBPStatus = (systolic: number, diastolic: number) => {
    if (systolic >= 140 || diastolic >= 90) return 'high';
    if (systolic >= 130 || diastolic >= 80) return 'elevated';
    return 'normal';
  };

  const filteredCertificates = certificates.filter(cert => {
    const patient = patients.find(p => p._id === cert.patientId);
    const matchesSearch = patient?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         patient?.employer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || cert.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gradient-to-br from-green-500 to-blue-600 rounded-lg">
          <Award className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Certificate Management</h1>
          <p className="text-muted-foreground">
            Review patient data and generate digital certificates of fitness
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="review" className="flex items-center gap-2">
            <Stethoscope className="h-4 w-4" />
            Medical Review
          </TabsTrigger>
          <TabsTrigger value="certificates" className="flex items-center gap-2">
            <Award className="h-4 w-4" />
            Certificates
          </TabsTrigger>
        </TabsList>

        {/* Medical Review Tab */}
        <TabsContent value="review" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-4">
            {/* Patient Selection */}
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Select Patient
                </CardTitle>
                <CardDescription>
                  Choose a patient ready for certificate generation
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
                  <div className="mt-4 p-4 bg-gradient-to-br from-green-50 to-blue-50 rounded-lg border">
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
              </CardContent>
            </Card>

            {/* Patient Data Review */}
            <div className="md:col-span-2">
              {selectedPatient ? (
                <Card className="bg-gradient-to-br from-white to-green-50/30 border-green-200">
                  <CardHeader>
                    <CardTitle>Medical Data Review</CardTitle>
                    <CardDescription>
                      Complete medical examination data for {selectedPatient.name}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-96">
                      <div className="space-y-6">
                        {/* Vital Signs */}
                        {patientVitals.length > 0 && (
                          <div>
                            <h4 className="font-medium flex items-center gap-2 mb-3">
                              <Heart className="h-4 w-4" />
                              Vital Signs
                            </h4>
                            <div className="grid gap-3 md:grid-cols-2 text-sm">
                              <div className="p-3 bg-white rounded-lg border">
                                <span className="text-muted-foreground">Height/Weight:</span>
                                <p className="font-medium">
                                  {patientVitals[0].height}cm / {patientVitals[0].weight}kg
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  BMI: {patientVitals[0].bmi}
                                </p>
                              </div>
                              <div className="p-3 bg-white rounded-lg border">
                                <span className="text-muted-foreground">Blood Pressure:</span>
                                <p className="font-medium">
                                  {patientVitals[0].bloodPressure.systolic}/{patientVitals[0].bloodPressure.diastolic} mmHg
                                </p>
                                <Badge className={
                                  getBPStatus(patientVitals[0].bloodPressure.systolic, patientVitals[0].bloodPressure.diastolic) === 'high' ? 'bg-red-100 text-red-800' :
                                  getBPStatus(patientVitals[0].bloodPressure.systolic, patientVitals[0].bloodPressure.diastolic) === 'elevated' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-green-100 text-green-800'
                                }>
                                  {getBPStatus(patientVitals[0].bloodPressure.systolic, patientVitals[0].bloodPressure.diastolic)}
                                </Badge>
                              </div>
                              <div className="p-3 bg-white rounded-lg border">
                                <span className="text-muted-foreground">Pulse:</span>
                                <p className="font-medium">{patientVitals[0].pulse} bpm</p>
                              </div>
                              <div className="p-3 bg-white rounded-lg border">
                                <span className="text-muted-foreground">Temperature:</span>
                                <p className="font-medium">{patientVitals[0].temperature}°C</p>
                              </div>
                            </div>
                            {patientVitals[0].notes && (
                              <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                                <span className="text-sm font-medium">Nurse Notes:</span>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {patientVitals[0].notes}
                                </p>
                              </div>
                            )}
                          </div>
                        )}

                        <Separator />

                        {/* Test Results */}
                        {patientTests.length > 0 && (
                          <div>
                            <h4 className="font-medium flex items-center gap-2 mb-3">
                              <TestTube className="h-4 w-4" />
                              Test Results
                            </h4>
                            <div className="space-y-3">
                              {patientTests[0].vision && (
                                <div className="p-3 bg-white rounded-lg border">
                                  <span className="font-medium">Vision Test:</span>
                                  <div className="mt-2 grid gap-2 md:grid-cols-2 text-sm">
                                    <p>Left Eye: {patientTests[0].vision.leftEye}</p>
                                    <p>Right Eye: {patientTests[0].vision.rightEye}</p>
                                    <p>Color Vision: {patientTests[0].vision.colorVision ? 'Normal' : 'Deficient'}</p>
                                    {patientTests[0].vision.restrictions && (
                                      <p className="col-span-2 text-muted-foreground">
                                        Restrictions: {patientTests[0].vision.restrictions}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              )}

                              {patientTests[0].hearing && (
                                <div className="p-3 bg-white rounded-lg border">
                                  <span className="font-medium">Hearing Test:</span>
                                  <div className="mt-2 grid gap-2 md:grid-cols-2 text-sm">
                                    <p>Left Ear: {patientTests[0].hearing.leftEar}dB</p>
                                    <p>Right Ear: {patientTests[0].hearing.rightEar}dB</p>
                                    {patientTests[0].hearing.restrictions && (
                                      <p className="col-span-2 text-muted-foreground">
                                        Restrictions: {patientTests[0].hearing.restrictions}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              )}

                              {patientTests[0].lungFunction && (
                                <div className="p-3 bg-white rounded-lg border">
                                  <span className="font-medium">Lung Function:</span>
                                  <div className="mt-2 grid gap-2 md:grid-cols-3 text-sm">
                                    <p>FEV1: {patientTests[0].lungFunction.fev1}L</p>
                                    <p>FVC: {patientTests[0].lungFunction.fvc}L</p>
                                    <p>Peak Flow: {patientTests[0].lungFunction.peakFlow}L/min</p>
                                  </div>
                                </div>
                              )}

                              {patientTests[0].drugScreen && (
                                <div className="p-3 bg-white rounded-lg border">
                                  <span className="font-medium">Drug Screen:</span>
                                  <div className="mt-2 flex items-center gap-2">
                                    <Badge className={
                                      patientTests[0].drugScreen.result === 'negative' ? 'bg-green-100 text-green-800' :
                                      patientTests[0].drugScreen.result === 'positive' ? 'bg-red-100 text-red-800' :
                                      'bg-yellow-100 text-yellow-800'
                                    }>
                                      {patientTests[0].drugScreen.result}
                                    </Badge>
                                  </div>
                                </div>
                              )}

                              {patientTests[0].xray && (
                                <div className="p-3 bg-white rounded-lg border">
                                  <span className="font-medium">X-Ray Results:</span>
                                  <p className="mt-2 text-sm">{patientTests[0].xray.result}</p>
                                  {patientTests[0].xray.abnormalities && (
                                    <p className="mt-1 text-sm text-muted-foreground">
                                      Abnormalities: {patientTests[0].xray.abnormalities}
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              ) : (
                <Card className="bg-gradient-to-br from-white to-gray-50/30">
                  <CardContent className="flex items-center justify-center h-96">
                    <div className="text-center">
                      <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">Select a patient to review medical data</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Certificate Generation Form */}
            <div className="md:col-span-1">
              <Card className="bg-gradient-to-br from-white to-blue-50/30 border-blue-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Generate Certificate
                  </CardTitle>
                  <CardDescription>
                    Create fitness certificate based on medical review
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Fitness Status</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="fit">
                                  <div className="flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                    Fit for Duty
                                  </div>
                                </SelectItem>
                                <SelectItem value="fit-with-restrictions">
                                  <div className="flex items-center gap-2">
                                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                                    Fit with Restrictions
                                  </div>
                                </SelectItem>
                                <SelectItem value="unfit">
                                  <div className="flex items-center gap-2">
                                    <XCircle className="h-4 w-4 text-red-600" />
                                    Unfit for Duty
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="recommendations"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Medical Recommendations</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Enter medical recommendations..."
                                className="min-h-20"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="validUntil"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Valid Until</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button
                        type="submit"
                        className="w-full bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700"
                        disabled={isSubmitting || !selectedPatient}
                      >
                        {isSubmitting ? 'Generating...' : 'Generate Certificate'}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Certificates Tab */}
        <TabsContent value="certificates" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Search & Filter</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 flex-wrap">
                <div className="flex-1 min-w-64">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by patient name or employer..."
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
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="fit">Fit for Duty</SelectItem>
                    <SelectItem value="fit-with-restrictions">Fit with Restrictions</SelectItem>
                    <SelectItem value="unfit">Unfit for Duty</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={fetchCertificates} variant="outline">
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Certificates Table */}
          <Card>
            <CardHeader>
              <CardTitle>Generated Certificates ({filteredCertificates.length})</CardTitle>
              <CardDescription>
                All issued certificates of fitness
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient</TableHead>
                    <TableHead>Employer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Valid Until</TableHead>
                    <TableHead>Issued</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCertificates.map((certificate) => {
                    const patient = patients.find(p => p._id === certificate.patientId);
                    return (
                      <TableRow key={certificate._id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{patient?.name || 'Unknown'}</div>
                            <div className="text-sm text-muted-foreground">
                              ID: {patient?.idNumber}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{patient?.employer}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(certificate.status)}
                            <Badge className={getStatusColor(certificate.status)}>
                              {certificate.status.replace('-', ' ')}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          {new Date(certificate.validUntil).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {new Date(certificate.issuedAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Send className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}