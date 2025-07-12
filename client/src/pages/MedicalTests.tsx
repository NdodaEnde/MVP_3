import * as z from 'zod';
import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import DigitalSignaturePad, { SignaturePadRef } from '@/components/ElectronicSignature/DigitalSignaturePad';
import { getPatients } from '@/api/patients';
import { saveTestResults, getPatientTests } from '@/api/tests';
import { useToast } from '@/hooks/useToast';
import { Patient, TestResults } from '@/types';
import {
  TestTube,
  Eye,
  Ear,
  Heart,
  Stethoscope,
  Camera,
  User,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Activity,
  Brain,
  Zap,
  Timer,
  FileText
} from 'lucide-react';

// Enhanced schema matching page 4 of the medical examination form
const medicalTestsSchema = z.object({
  patientId: z.string().min(1, 'Patient selection is required'),
  
  // Vision Testing (from page 4)
  vision: z.object({
    rightEye: z.object({
      far: z.string().optional(),
      near: z.string().optional()
    }).optional(),
    leftEye: z.object({
      far: z.string().optional(),
      near: z.string().optional()
    }).optional(),
    contactLenses: z.enum(['yes', 'no']).optional(),
    baseline: z.string().optional()
  }).optional(),
  
  // Audio Testing
  audio: z.object({
    plh: z.string().optional(),
    baseline: z.string().optional()
  }).optional(),
  
  // Spirometry
  spirometry: z.object({
    fvc: z.string().optional(),
    fvc1: z.string().optional(),
    fvc1_fvc_ratio: z.string().optional()
  }).optional(),
  
  // Chest X-rays
  chestXrays: z.object({
    results: z.string().optional(),
    abnormalities: z.string().optional()
  }).optional(),
  
  // Physical Examination Systems (8 systems from the form)
  physicalExamination: z.object({
    eyes: z.object({
      status: z.enum(['normal', 'abnormal']).optional(),
      comments: z.string().optional()
    }).optional(),
    earNoseThroat: z.object({
      status: z.enum(['normal', 'abnormal']).optional(),
      comments: z.string().optional()
    }).optional(),
    respiratorySystem: z.object({
      status: z.enum(['normal', 'abnormal']).optional(),
      comments: z.string().optional()
    }).optional(),
    cardiovascularSystem: z.object({
      status: z.enum(['normal', 'abnormal']).optional(),
      comments: z.string().optional()
    }).optional(),
    digestiveSystem: z.object({
      status: z.enum(['normal', 'abnormal']).optional(),
      comments: z.string().optional()
    }).optional(),
    nervousSystem: z.object({
      status: z.enum(['normal', 'abnormal']).optional(),
      comments: z.string().optional()
    }).optional(),
    musculoskeletalSystem: z.object({
      status: z.enum(['normal', 'abnormal']).optional(),
      comments: z.string().optional()
    }).optional(),
    general: z.object({
      status: z.enum(['normal', 'abnormal']).optional(),
      comments: z.string().optional()
    }).optional(),
    lymphadenopathy: z.string().optional(),
    otherFindings: z.string().optional()
  }).optional(),
  
  // Recommendations (from page 4)
  recommendations: z.object({
    fitnessStatus: z.enum(['fit', 'fit_with_restrictions', 'unfit', 'refer']).optional(),
    restrictions: z.string().optional(),
    comments: z.string().optional()
  }).optional(),
  
  // Professional Signatures (from page 4)
  signatures: z.object({
    technician: z.object({
      name: z.string().optional(),
      registrationNumber: z.string().optional(),
      digitalSignature: z.object({
        imageData: z.string().optional(),
        timestamp: z.string().optional(),
        hash: z.string().optional(),
        biometricData: z.object({
          strokeCount: z.number().optional(),
          duration: z.number().optional(),
          pressure: z.array(z.number()).optional(),
          speed: z.array(z.number()).optional(),
          acceleration: z.array(z.number()).optional()
        }).optional()
      }).optional()
    }).optional(),
    ohp: z.object({
      name: z.string().optional(),
      registrationNumber: z.string().optional(),
      digitalSignature: z.object({
        imageData: z.string().optional(),
        timestamp: z.string().optional(),
        hash: z.string().optional(),
        biometricData: z.object({
          strokeCount: z.number().optional(),
          duration: z.number().optional(),
          pressure: z.array(z.number()).optional(),
          speed: z.array(z.number()).optional(),
          acceleration: z.array(z.number()).optional()
        }).optional()
      }).optional()
    }).optional(),
    omp: z.object({
      name: z.string().min(1, 'OMP name is required'),
      registrationNumber: z.string().optional(),
      digitalSignature: z.object({
        imageData: z.string().min(1, 'OMP digital signature is required'),
        timestamp: z.string(),
        hash: z.string(),
        biometricData: z.object({
          strokeCount: z.number(),
          duration: z.number(),
          pressure: z.array(z.number()),
          speed: z.array(z.number()),
          acceleration: z.array(z.number())
        })
      })
    })
  })
});

type MedicalTestsFormData = z.infer<typeof medicalTestsSchema>;

// Physical examination systems from the paper form
const physicalExaminationSystems = [
  { id: 1, system: "Eyes, clinical abnormalities", icon: Eye, field: 'eyes' },
  { id: 2, system: "Ear, Nose, Throat including defect of hearing", icon: Ear, field: 'earNoseThroat' },
  { id: 3, system: "Respiratory System", icon: Stethoscope, field: 'respiratorySystem' },
  { id: 4, system: "Cardiovascular system including Heart size/sound", icon: Heart, field: 'cardiovascularSystem' },
  { id: 5, system: "Digestive System", icon: Activity, field: 'digestiveSystem' },
  { id: 6, system: "Nervous System", icon: Brain, field: 'nervousSystem' },
  { id: 7, system: "Musculoskeletal System", icon: Zap, field: 'musculoskeletalSystem' },
  { id: 8, system: "General", icon: User, field: 'general' }
];

function MedicalTestsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [previousTests, setPreviousTests] = useState<TestResults[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentTab, setCurrentTab] = useState('vision');
  const { toast } = useToast();

  // Signature pad refs
  const technicianSignatureRef = useRef<SignaturePadRef>(null);
  const ohpSignatureRef = useRef<SignaturePadRef>(null);
  const ompSignatureRef = useRef<SignaturePadRef>(null);

  const form = useForm<MedicalTestsFormData>({
    resolver: zodResolver(medicalTestsSchema),
    defaultValues: {
      patientId: '',
      vision: {
        rightEye: { far: '', near: '' },
        leftEye: { far: '', near: '' },
        contactLenses: undefined,
        baseline: ''
      },
      audio: {
        plh: '',
        baseline: ''
      },
      spirometry: {
        fvc: '',
        fvc1: '',
        fvc1_fvc_ratio: ''
      },
      chestXrays: {
        results: '',
        abnormalities: ''
      },
      physicalExamination: {
        eyes: { status: undefined, comments: '' },
        earNoseThroat: { status: undefined, comments: '' },
        respiratorySystem: { status: undefined, comments: '' },
        cardiovascularSystem: { status: undefined, comments: '' },
        digestiveSystem: { status: undefined, comments: '' },
        nervousSystem: { status: undefined, comments: '' },
        musculoskeletalSystem: { status: undefined, comments: '' },
        general: { status: undefined, comments: '' },
        lymphadenopathy: '',
        otherFindings: ''
      },
      recommendations: {
        fitnessStatus: undefined,
        restrictions: '',
        comments: ''
      },
      signatures: {
        technician: {
          name: '',
          registrationNumber: '',
          digitalSignature: undefined
        },
        ohp: {
          name: '',
          registrationNumber: '',
          digitalSignature: undefined
        },
        omp: {
          name: '',
          registrationNumber: '',
          digitalSignature: undefined
        }
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

  const onSubmit = async (data: MedicalTestsFormData) => {
    setIsSubmitting(true);
    try {
      // Validate required OMP signature
      if (!ompSignatureRef.current || ompSignatureRef.current.isEmpty()) {
        toast({
          title: "Signature Required",
          description: "OMP digital signature is required to complete the medical examination",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      // Save OMP signature
      const ompSignatureData = ompSignatureRef.current.save();
      if (ompSignatureData && data.signatures?.omp) {
        data.signatures.omp.digitalSignature = ompSignatureData;
      }

      // Save optional signatures if they exist
      if (technicianSignatureRef.current && !technicianSignatureRef.current.isEmpty()) {
        const techSignatureData = technicianSignatureRef.current.save();
        if (techSignatureData && data.signatures?.technician) {
          data.signatures.technician.digitalSignature = techSignatureData;
        }
      }

      if (ohpSignatureRef.current && !ohpSignatureRef.current.isEmpty()) {
        const ohpSignatureData = ohpSignatureRef.current.save();
        if (ohpSignatureData && data.signatures?.ohp) {
          data.signatures.ohp.digitalSignature = ohpSignatureData;
        }
      }

      const testData = {
        ...data,
        completedAt: new Date().toISOString()
      };

      await saveTestResults(testData);
      toast({
        title: "Success",
        description: "Medical tests and examination completed successfully",
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

  const tabs = [
    { id: 'vision', label: 'Vision Tests', icon: Eye },
    { id: 'audio-spiro', label: 'Audio & Spirometry', icon: Ear },
    { id: 'physical', label: 'Physical Examination', icon: Stethoscope },
    { id: 'recommendations', label: 'Recommendations', icon: FileText },
    { id: 'signatures', label: 'Professional Signatures', icon: User }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg">
          <TestTube className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Medical Tests & Physical Examination</h1>
          <p className="text-muted-foreground">
            Complete specialized tests and comprehensive physical examination (Technician & Medical Station)
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        {/* Patient Selection Sidebar */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Patient Information
            </CardTitle>
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
                  <p>Gender: {selectedPatient.gender}</p>
                  <p>Employer: {selectedPatient.employer}</p>
                  <Badge variant="outline">
                    {selectedPatient.examinationType?.replace('-', ' ')}
                  </Badge>
                </div>
              </div>
            )}

            {/* Navigation Tabs */}
            <div className="mt-6 space-y-2">
              <h4 className="font-medium text-sm">Test Sections</h4>
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setCurrentTab(tab.id)}
                    className={`w-full flex items-center gap-2 p-2 rounded-lg text-left transition-colors ${
                      currentTab === tab.id
                        ? 'bg-orange-100 text-orange-700 border border-orange-200'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="text-sm">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Main Form */}
        <div className="md:col-span-3">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              {/* Vision Tests Tab */}
              {currentTab === 'vision' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Eye className="h-5 w-5 text-blue-500" />
                      Vision Testing
                    </CardTitle>
                    <CardDescription>
                      Complete vision assessment including far and near vision testing
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Right Eye */}
                      <div>
                        <h4 className="font-medium mb-4">Right Eye (R)</h4>
                        <div className="space-y-4">
                          <FormField
                            control={form.control}
                            name="vision.rightEye.far"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Far</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="6/6" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="vision.rightEye.near"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Near</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="N5" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      {/* Left Eye */}
                      <div>
                        <h4 className="font-medium mb-4">Left Eye (L)</h4>
                        <div className="space-y-4">
                          <FormField
                            control={form.control}
                            name="vision.leftEye.far"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Far</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="6/6" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="vision.leftEye.near"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Near</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="N5" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      {/* Contact Lenses */}
                      <div>
                        <h4 className="font-medium mb-4">Contact Lenses Used</h4>
                        <FormField
                          control={form.control}
                          name="vision.contactLenses"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <RadioGroup
                                  value={field.value}
                                  onValueChange={field.onChange}
                                >
                                  <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="yes" />
                                    <label>Yes</label>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="no" />
                                    <label>No</label>
                                  </div>
                                </RadioGroup>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="vision.baseline"
                          render={({ field }) => (
                            <FormItem className="mt-4">
                              <FormLabel>Baseline</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Baseline measurement" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Audio & Spirometry Tab */}
              {currentTab === 'audio-spiro' && (
                <div className="space-y-6">
                  {/* Audio Testing */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Ear className="h-5 w-5 text-purple-500" />
                        Audio Testing
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="audio.plh"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>PLH</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="PLH measurement" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="audio.baseline"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Baseline</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Baseline measurement" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Spirometry */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Stethoscope className="h-5 w-5 text-cyan-500" />
                        Spirometry
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name="spirometry.fvc"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>FVC</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="FVC value" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="spirometry.fvc1"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>FVC1</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="FVC1 value" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="spirometry.fvc1_fvc_ratio"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>FVC1/FVC</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Ratio value" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Chest X-rays */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Camera className="h-5 w-5 text-green-500" />
                        Chest X-rays
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <FormField
                        control={form.control}
                        name="chestXrays.results"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>X-ray Results</FormLabel>
                            <FormControl>
                              <Textarea 
                                {...field} 
                                placeholder="Enter chest X-ray findings and interpretation..."
                                className="min-h-[100px]"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="chestXrays.abnormalities"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Abnormalities (if any)</FormLabel>
                            <FormControl>
                              <Textarea 
                                {...field} 
                                placeholder="Describe any abnormalities found..."
                                className="min-h-[80px]"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Physical Examination Tab */}
              {currentTab === 'physical' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Stethoscope className="h-5 w-5 text-indigo-500" />
                      Physical Examination - System Assessment
                    </CardTitle>
                    <CardDescription>
                      Assess each body system and mark as Normal or Abnormal. Provide comments for abnormal findings.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse border border-gray-300">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="border border-gray-300 p-3 text-left font-medium">System</th>
                            <th className="border border-gray-300 p-3 text-center font-medium">Normal</th>
                            <th className="border border-gray-300 p-3 text-center font-medium">Abnormal</th>
                            <th className="border border-gray-300 p-3 text-left font-medium">Comments</th>
                          </tr>
                        </thead>
                        <tbody>
                          {physicalExaminationSystems.map((system) => (
                            <tr key={system.id} className="hover:bg-gray-50">
                              <td className="border border-gray-300 p-3">
                                <div className="flex items-center gap-2">
                                  <system.icon className="h-4 w-4 text-gray-600" />
                                  <span className="text-sm font-medium">
                                    {system.id}. {system.system}
                                  </span>
                                </div>
                              </td>
                              <td className="border border-gray-300 p-3 text-center">
                                <FormField
                                  control={form.control}
                                  name={`physicalExamination.${system.field}.status` as any}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormControl>
                                        <RadioGroup
                                          value={field.value}
                                          onValueChange={field.onChange}
                                          className="flex justify-center"
                                        >
                                          <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="normal" />
                                            <CheckCircle className="h-4 w-4 text-green-500" />
                                          </div>
                                        </RadioGroup>
                                      </FormControl>
                                    </FormItem>
                                  )}
                                />
                              </td>
                              <td className="border border-gray-300 p-3 text-center">
                                <FormField
                                  control={form.control}
                                  name={`physicalExamination.${system.field}.status` as any}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormControl>
                                        <RadioGroup
                                          value={field.value}
                                          onValueChange={field.onChange}
                                          className="flex justify-center"
                                        >
                                          <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="abnormal" />
                                            <XCircle className="h-4 w-4 text-red-500" />
                                          </div>
                                        </RadioGroup>
                                      </FormControl>
                                    </FormItem>
                                  )}
                                />
                              </td>
                              <td className="border border-gray-300 p-3">
                                <FormField
                                  control={form.control}
                                  name={`physicalExamination.${system.field}.comments` as any}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormControl>
                                        <Input 
                                          {...field} 
                                          placeholder="Comments if abnormal..."
                                          className="text-sm"
                                        />
                                      </FormControl>
                                    </FormItem>
                                  )}
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Additional Examination Findings */}
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="physicalExamination.lymphadenopathy"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Lymphadenopathy: Inguinal, auxiliary, Cervical or other</FormLabel>
                            <FormControl>
                              <Textarea 
                                {...field} 
                                placeholder="Describe any lymph node enlargement..."
                                className="min-h-[80px]"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="physicalExamination.otherFindings"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Any other circumstances associated with the health record or physical examination 
                              which is of importance and not recorded elsewhere in this report?
                            </FormLabel>
                            <FormControl>
                              <Textarea 
                                {...field} 
                                placeholder="Describe any other significant findings..."
                                className="min-h-[100px]"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Recommendations Tab */}
              {currentTab === 'recommendations' && (
                <Card className="border-purple-200 bg-purple-50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-purple-600" />
                      Medical Recommendations
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <FormField
                      control={form.control}
                      name="recommendations.fitnessStatus"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-medium">Fitness Status</FormLabel>
                          <FormControl>
                            <RadioGroup
                              value={field.value}
                              onValueChange={field.onChange}
                              className="grid grid-cols-1 md:grid-cols-2 gap-4"
                            >
                              <div className="flex items-center space-x-2 p-3 border rounded-lg">
                                <RadioGroupItem value="fit" />
                                <label className="text-green-600 font-medium">Fit</label>
                              </div>
                              <div className="flex items-center space-x-2 p-3 border rounded-lg">
                                <RadioGroupItem value="fit_with_restrictions" />
                                <label className="text-yellow-600 font-medium">Fit with Restrictions</label>
                              </div>
                              <div className="flex items-center space-x-2 p-3 border rounded-lg">
                                <RadioGroupItem value="unfit" />
                                <label className="text-red-600 font-medium">Unfit</label>
                              </div>
                              <div className="flex items-center space-x-2 p-3 border rounded-lg">
                                <RadioGroupItem value="refer" />
                                <label className="text-blue-600 font-medium">Refer for Assessment</label>
                              </div>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="recommendations.restrictions"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Restrictions</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              placeholder="Detail any work restrictions or limitations..."
                              className="min-h-[100px]"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="recommendations.comments"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Comments</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              placeholder="Additional medical recommendations and comments..."
                              className="min-h-[100px]"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              )}

              {/* Professional Signatures Tab */}
              {currentTab === 'signatures' && (
                <div className="space-y-6">
                  {/* Technician Signature */}
                  <Card className="border-blue-200 bg-blue-50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TestTube className="h-5 w-5 text-blue-600" />
                        Technician Assessment
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="signatures.technician.name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Technician Name</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Technician full name" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="signatures.technician.registrationNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Registration Number</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Professional registration number" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="signatures.technician.name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Digital Signature</FormLabel>
                            <FormControl>
                              <DigitalSignaturePad
                                ref={technicianSignatureRef}
                                onSignatureCapture={(signatureData) => {
                                  // Signature will be handled in onSubmit
                                }}
                                signerName={field.value || 'Technician'}
                                className="w-full"
                              />
                            </FormControl>
                            <FormDescription>
                              By signing, you certify that all tests were conducted properly and results recorded accurately.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>

                  {/* OHP Signature */}
                  <Card className="border-green-200 bg-green-50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Stethoscope className="h-5 w-5 text-green-600" />
                        Occupational Health Practitioner (OHP)
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="signatures.ohp.name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>OHP Name</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Full name" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="signatures.ohp.registrationNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Registration Number</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Professional registration number" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="signatures.ohp.name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Digital Signature</FormLabel>
                            <FormControl>
                              <DigitalSignaturePad
                                ref={ohpSignatureRef}
                                onSignatureCapture={(signatureData) => {
                                  // Signature will be handled in onSubmit
                                }}
                                signerName={field.value || 'OHP'}
                                className="w-full"
                              />
                            </FormControl>
                            <FormDescription>
                              By signing, you certify your professional assessment of the examination results.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>

                  {/* OMP Signature */}
                  <Card className="border-purple-200 bg-purple-50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5 text-purple-600" />
                        Occupational Medical Practitioner (OMP)
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="signatures.omp.name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>OMP Name *</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Full name" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="signatures.omp.registrationNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Registration Number</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Professional registration number" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="signatures.omp.name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Digital Signature *</FormLabel>
                            <FormControl>
                              <DigitalSignaturePad
                                ref={ompSignatureRef}
                                onSignatureCapture={(signatureData) => {
                                  // Signature will be handled in onSubmit
                                }}
                                signerName={field.value || 'OMP'}
                                className="w-full"
                              />
                            </FormControl>
                            <FormDescription>
                              Final medical assessment and fitness determination
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex justify-end pt-6">
                <Button 
                  type="submit" 
                  disabled={isSubmitting || !selectedPatient}
                  className="min-w-[200px] bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700"
                >
                  {isSubmitting ? (
                    <>
                      <Timer className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Complete Medical Tests & Examination
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>

      {/* Information Notice */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          All medical tests must be completed and signed off by qualified personnel. 
          Ensure all equipment is calibrated and procedures follow standard protocols.
          Final OMP signature is required for completion.
        </AlertDescription>
      </Alert>
    </div>
  );
}

// Export both named and default exports for flexibility
export default MedicalTestsPage;
export { MedicalTestsPage as MedicalTests };