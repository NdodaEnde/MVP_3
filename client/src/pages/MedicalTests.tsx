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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { getPatients } from '@/api/patients';
import { saveTestResults, getPatientTests } from '@/api/tests';
import { useToast } from '@/hooks/useToast';
import { Patient, TestResults } from '@/types';
import {
  TestTube,
  Eye,
  Ear,
  Heart,
  FlaskConical,
  Camera,
  User,
  CheckCircle,
  AlertTriangle,
  Activity
} from 'lucide-react';

const testSchema = z.object({
  patientId: z.string().min(1, 'Patient selection is required'),
  vision: z.object({
    leftEye: z.string().optional(),
    rightEye: z.string().optional(),
    colorVision: z.boolean().optional(),
    restrictions: z.string().optional()
  }).optional(),
  hearing: z.object({
    leftEar: z.number().optional(),
    rightEar: z.number().optional(),
    restrictions: z.string().optional()
  }).optional(),
  lungFunction: z.object({
    fev1: z.number().optional(),
    fvc: z.number().optional(),
    peakFlow: z.number().optional()
  }).optional(),
  drugScreen: z.object({
    result: z.enum(['negative', 'positive', 'pending']).optional(),
    substances: z.array(z.string()).optional()
  }).optional(),
  xray: z.object({
    result: z.string().optional(),
    abnormalities: z.string().optional(),
    imageUrl: z.string().optional()
  }).optional()
});

type TestFormData = z.infer<typeof testSchema>;

export function MedicalTests() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [previousTests, setPreviousTests] = useState<TestResults[]>([]);
  const [activeTab, setActiveTab] = useState('vision');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<TestFormData>({
    resolver: zodResolver(testSchema),
    defaultValues: {
      patientId: '',
      vision: {
        leftEye: '',
        rightEye: '',
        colorVision: true,
        restrictions: ''
      },
      hearing: {
        leftEar: 0,
        rightEar: 0,
        restrictions: ''
      },
      lungFunction: {
        fev1: 0,
        fvc: 0,
        peakFlow: 0
      },
      drugScreen: {
        result: 'pending',
        substances: []
      },
      xray: {
        result: '',
        abnormalities: '',
        imageUrl: ''
      }
    }
  });

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const response = await getPatients({ status: 'technician' });
      setPatients((response as any).patients);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load patients",
        variant: "destructive",
      });
    }
  };

  const handlePatientSelect = async (patientId: string) => {
    const patient = patients.find(p => p._id === patientId);
    setSelectedPatient(patient || null);
    form.setValue('patientId', patientId);

    if (patient) {
      try {
        const response = await getPatientTests(patientId);
        setPreviousTests((response as any).testResults);
      } catch (error) {
        console.log('No previous tests found');
      }
    }
  };

  const onSubmit = async (data: TestFormData) => {
    setIsSubmitting(true);
    try {
      const testData = {
        patientId: data.patientId,
        ...(data.vision && Object.keys(data.vision).some(key => data.vision![key as keyof typeof data.vision]) && { vision: data.vision }),
        ...(data.hearing && Object.keys(data.hearing).some(key => data.hearing![key as keyof typeof data.hearing]) && { hearing: data.hearing }),
        ...(data.lungFunction && Object.keys(data.lungFunction).some(key => data.lungFunction![key as keyof typeof data.lungFunction]) && { lungFunction: data.lungFunction }),
        ...(data.drugScreen && Object.keys(data.drugScreen).some(key => data.drugScreen![key as keyof typeof data.drugScreen]) && { drugScreen: data.drugScreen }),
        ...(data.xray && Object.keys(data.xray).some(key => data.xray![key as keyof typeof data.xray]) && { xray: data.xray })
      };

      await saveTestResults(testData);
      toast({
        title: "Success",
        description: "Test results saved successfully",
      });

      form.reset();
      setSelectedPatient(null);
      setPreviousTests([]);
      fetchPatients();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save test results",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getVisionCategory = (vision: string) => {
    if (vision === '20/20') return { category: 'Perfect', color: 'text-green-600' };
    if (vision.includes('20/25') || vision.includes('20/30')) return { category: 'Good', color: 'text-blue-600' };
    if (vision.includes('20/40') || vision.includes('20/50')) return { category: 'Fair', color: 'text-yellow-600' };
    return { category: 'Poor', color: 'text-red-600' };
  };

  const getHearingCategory = (threshold: number) => {
    if (threshold <= 25) return { category: 'Normal', color: 'text-green-600' };
    if (threshold <= 40) return { category: 'Mild Loss', color: 'text-yellow-600' };
    if (threshold <= 70) return { category: 'Moderate Loss', color: 'text-orange-600' };
    return { category: 'Severe Loss', color: 'text-red-600' };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg">
          <TestTube className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Medical Tests</h1>
          <p className="text-muted-foreground">
            Record specialized test results for occupational health examinations
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
              Choose a patient from the technician queue
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
              <div className="mt-4 p-4 bg-gradient-to-br from-orange-50 to-red-50 rounded-lg border">
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

            {previousTests.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium mb-2">Previous Tests</h4>
                <div className="text-sm space-y-1">
                  {previousTests[0] && (
                    <>
                      {previousTests[0].vision && (
                        <p>Vision: {previousTests[0].vision.leftEye}/{previousTests[0].vision.rightEye}</p>
                      )}
                      {previousTests[0].hearing && (
                        <p>Hearing: {previousTests[0].hearing.leftEar}dB/{previousTests[0].hearing.rightEar}dB</p>
                      )}
                      {previousTests[0].drugScreen && (
                        <p>Drug Screen: {previousTests[0].drugScreen.result}</p>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Test Forms */}
        <div className="md:col-span-3">
          <Card className="bg-gradient-to-br from-white to-orange-50/30 border-orange-200">
            <CardHeader>
              <CardTitle>Medical Test Results</CardTitle>
              <CardDescription>
                Record specialized test results for the selected patient
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-5">
                      <TabsTrigger value="vision" className="flex items-center gap-2">
                        <Eye className="h-4 w-4" />
                        Vision
                      </TabsTrigger>
                      <TabsTrigger value="hearing" className="flex items-center gap-2">
                        <Ear className="h-4 w-4" />
                        Hearing
                      </TabsTrigger>
                      <TabsTrigger value="lung" className="flex items-center gap-2">
                        <Heart className="h-4 w-4" />
                        Lung Function
                      </TabsTrigger>
                      <TabsTrigger value="drug" className="flex items-center gap-2">
                        <FlaskConical className="h-4 w-4" />
                        Drug Screen
                      </TabsTrigger>
                      <TabsTrigger value="xray" className="flex items-center gap-2">
                        <Camera className="h-4 w-4" />
                        X-Ray
                      </TabsTrigger>
                    </TabsList>

                    {/* Vision Testing */}
                    <TabsContent value="vision" className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="vision.leftEye"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Left Eye Visual Acuity</FormLabel>
                              <FormControl>
                                <Input placeholder="20/20" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="vision.rightEye"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Right Eye Visual Acuity</FormLabel>
                              <FormControl>
                                <Input placeholder="20/20" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="vision.colorVision"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Color Vision Test</FormLabel>
                            <Select onValueChange={(value) => field.onChange(value === 'true')}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select result" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="true">Normal</SelectItem>
                                <SelectItem value="false">Deficient</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="vision.restrictions"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Vision Restrictions</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Any vision-related work restrictions..."
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </TabsContent>

                    {/* Hearing Testing */}
                    <TabsContent value="hearing" className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="hearing.leftEar"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Left Ear Threshold (dB)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder="25"
                                  {...field}
                                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="hearing.rightEar"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Right Ear Threshold (dB)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder="25"
                                  {...field}
                                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="hearing.restrictions"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Hearing Restrictions</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Any hearing-related work restrictions..."
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </TabsContent>

                    {/* Lung Function Testing */}
                    <TabsContent value="lung" className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-3">
                        <FormField
                          control={form.control}
                          name="lungFunction.fev1"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>FEV1 (L)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.1"
                                  placeholder="3.2"
                                  {...field}
                                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="lungFunction.fvc"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>FVC (L)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.1"
                                  placeholder="4.1"
                                  {...field}
                                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="lungFunction.peakFlow"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Peak Flow (L/min)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder="450"
                                  {...field}
                                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </TabsContent>

                    {/* Drug Screening */}
                    <TabsContent value="drug" className="space-y-4">
                      <FormField
                        control={form.control}
                        name="drugScreen.result"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Drug Screen Result</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select result" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="negative">
                                  <div className="flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                    Negative
                                  </div>
                                </SelectItem>
                                <SelectItem value="positive">
                                  <div className="flex items-center gap-2">
                                    <AlertTriangle className="h-4 w-4 text-red-600" />
                                    Positive
                                  </div>
                                </SelectItem>
                                <SelectItem value="pending">
                                  <div className="flex items-center gap-2">
                                    <Activity className="h-4 w-4 text-yellow-600" />
                                    Pending
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </TabsContent>

                    {/* X-Ray Results */}
                    <TabsContent value="xray" className="space-y-4">
                      <FormField
                        control={form.control}
                        name="xray.result"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>X-Ray Results</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Normal chest X-ray, no abnormalities detected..."
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="xray.abnormalities"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Abnormalities (if any)</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Describe any abnormalities found..."
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </TabsContent>
                  </Tabs>

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700"
                    disabled={isSubmitting || !selectedPatient}
                  >
                    {isSubmitting ? 'Saving...' : 'Save Test Results'}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}