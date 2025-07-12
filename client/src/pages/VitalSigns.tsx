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
import { saveVitalSigns, getPatientVitals } from '@/api/vitals';
import { useToast } from '@/hooks/useToast';
import { Patient, VitalSigns } from '@/types';
import {
  Activity,
  User,
  Heart,
  Thermometer,
  Ruler,
  Scale,
  Droplets,
  Calculator,
  AlertTriangle,
  Info,
  Stethoscope,
  Timer,
  CheckCircle
} from 'lucide-react';

// Enhanced schema for vital signs only (from page 3 of the medical form)
const vitalSignsSchema = z.object({
  patientId: z.string().min(1, 'Patient selection is required'),
  
  // Physical Measurements
  height: z.number().min(50, 'Height must be at least 50cm').max(250, 'Height must be less than 250cm'),
  weight: z.number().min(20, 'Weight must be at least 20kg').max(300, 'Weight must be less than 300kg'),
  temperature: z.number().min(30, 'Temperature must be realistic').max(45, 'Temperature must be realistic').optional(),
  
  // Weight Change Assessment (from paper form)
  weightChange: z.object({
    hasChanged: z.enum(['yes', 'no']).optional(),
    reason: z.string().optional()
  }).optional(),
  
  // Cardiovascular
  pulseRate: z.number().min(30, 'Pulse must be at least 30bpm').max(200, 'Pulse must be less than 200bpm'),
  bloodPressure: z.object({
    systolic: z.number().min(60, 'Systolic must be at least 60mmHg').max(250, 'Systolic must be less than 250mmHg'),
    diastolic: z.number().min(40, 'Diastolic must be at least 40mmHg').max(150, 'Diastolic must be less than 150mmHg'),
    patientPosition: z.string().optional(),
    repeatSystolic: z.number().optional(),
    repeatDiastolic: z.number().optional(),
    abnormalReason: z.enum(['not_responding_treatment', 'never_diagnosed', 'defaulted_treatment']).optional(),
    otherReason: z.string().optional()
  }),
  
  // Urinalysis (from paper form)
  urinalysis: z.object({
    blood: z.enum(['yes', 'no']).optional(),
    protein: z.enum(['yes', 'no']).optional(),
    glucose: z.enum(['yes', 'no']).optional()
  }).optional(),
  
  // Additional Lab Values
  randomGlucose: z.number().optional(),
  randomCholesterol: z.number().optional(),
  abnormalGlucoseReason: z.enum(['not_responding_treatment', 'never_diagnosed', 'defaulted_treatment']).optional(),
  
  // Clinical Notes
  additionalNotes: z.string().optional(),
  
  // Nurse Signature only (from page 3)
  nurseSignature: z.object({
    name: z.string().min(1, 'Nurse name is required'),
    registrationNumber: z.string().optional(),
    digitalSignature: z.object({
      imageData: z.string().min(1, 'Digital signature is required'),
      timestamp: z.string(),
      hash: z.string(),
      biometricData: z.object({
        strokeCount: z.number(),
        duration: z.number(),
        pressure: z.array(z.number()),
        speed: z.array(z.number()),
        acceleration: z.array(z.number())
      }),
      metadata: z.object({
        deviceInfo: z.string(),
        browserInfo: z.string()
      })
    })
  })
});

type VitalSignsFormData = z.infer<typeof vitalSignsSchema>;

function VitalSignsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [previousVitals, setPreviousVitals] = useState<VitalSigns[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bmi, setBmi] = useState<number | null>(null);
  const [bpRepeatRequired, setBpRepeatRequired] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const signaturePadRef = useRef<SignaturePadRef>(null);
  const { toast } = useToast();

  const form = useForm<VitalSignsFormData>({
    resolver: zodResolver(vitalSignsSchema),
    defaultValues: {
      patientId: '',
      height: 0,
      weight: 0,
      temperature: 0,
      weightChange: {
        hasChanged: undefined,
        reason: ''
      },
      pulseRate: 0,
      bloodPressure: {
        systolic: 0,
        diastolic: 0,
        patientPosition: '',
        repeatSystolic: 0,
        repeatDiastolic: 0
      },
      urinalysis: {
        blood: undefined,
        protein: undefined,
        glucose: undefined
      },
      randomGlucose: 0,
      randomCholesterol: 0,
      additionalNotes: '',
      nurseSignature: {
        name: '',
        registrationNumber: '',
        digitalSignature: {
          imageData: '',
          timestamp: '',
          hash: '',
          biometricData: {
            strokeCount: 0,
            duration: 0,
            pressure: [],
            speed: [],
            acceleration: []
          },
          metadata: {
            deviceInfo: '',
            browserInfo: ''
          }
        }
      }
    }
  });

  // Watch height and weight for BMI calculation
  const height = form.watch('height');
  const weight = form.watch('weight');
  const systolic = form.watch('bloodPressure.systolic');
  const diastolic = form.watch('bloodPressure.diastolic');

  useEffect(() => {
    fetchPatients();
  }, []);

  // Calculate BMI when height and weight change
  useEffect(() => {
    if (height && weight && height > 0) {
      const heightInMeters = height / 100;
      const calculatedBmi = weight / (heightInMeters * heightInMeters);
      setBmi(Math.round(calculatedBmi * 10) / 10);
    }
  }, [height, weight]);

  // Check if BP repeat is required
  useEffect(() => {
    if (systolic && diastolic) {
      const requiresRepeat = systolic > 140 || diastolic > 90;
      setBpRepeatRequired(requiresRepeat);
      if (!requiresRepeat) {
        form.setValue('bloodPressure.repeatSystolic', 0);
        form.setValue('bloodPressure.repeatDiastolic', 0);
      }
    }
  }, [systolic, diastolic, form]);

  const fetchPatients = async () => {
    try {
      const response = await getPatients({ status: 'nurse' });
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
        const response = await getPatientVitals(patientId);
        setPreviousVitals((response as any).vitals);
      } catch (error) {
        console.log('No previous vitals found');
      }
    }
  };

  const onSubmit = async (data: VitalSignsFormData) => {
    // Validate signature before submission
    if (!hasSignature || !data.nurseSignature.digitalSignature.imageData) {
      toast({
        title: "Signature Required",
        description: "Please provide a digital signature before submitting.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const vitalsData = {
        patientId: data.patientId,
        height: data.height,
        weight: data.weight,
        bmi: bmi,
        temperature: data.temperature,
        weightChange: data.weightChange,
        pulseRate: data.pulseRate,
        bloodPressure: data.bloodPressure,
        urinalysis: data.urinalysis,
        randomGlucose: data.randomGlucose,
        randomCholesterol: data.randomCholesterol,
        abnormalGlucoseReason: data.abnormalGlucoseReason,
        additionalNotes: data.additionalNotes,
        nurseSignature: data.nurseSignature,
        completedAt: new Date().toISOString()
      };

      await saveVitalSigns(vitalsData);
      toast({
        title: "Success",
        description: "Vital signs recorded successfully",
      });
      
      form.reset();
      setSelectedPatient(null);
      setPreviousVitals([]);
      setBmi(null);
      setHasSignature(false);
      signaturePadRef.current?.clear();
      fetchPatients();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save vital signs",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getBmiCategory = (bmi: number) => {
    if (bmi < 18.5) return { category: 'Underweight', color: 'text-blue-600' };
    if (bmi < 25) return { category: 'Normal', color: 'text-green-600' };
    if (bmi < 30) return { category: 'Overweight', color: 'text-yellow-600' };
    return { category: 'Obese', color: 'text-red-600' };
  };

  const getBpCategory = (sys: number, dia: number) => {
    if (sys >= 140 || dia >= 90) return { category: 'High', color: 'text-red-600' };
    if (sys >= 130 || dia >= 85) return { category: 'Elevated', color: 'text-yellow-600' };
    return { category: 'Normal', color: 'text-green-600' };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gradient-to-br from-green-500 to-blue-600 rounded-lg">
          <Stethoscope className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Vital Signs & Physical Measurements</h1>
          <p className="text-muted-foreground">
            Record physical measurements, vital signs, and basic laboratory assessments (Nurse Station)
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
              Choose a patient from the nurse queue
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
              <div className="mt-4 p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border">
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

            {previousVitals.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium mb-2">Previous Vitals</h4>
                <div className="text-sm space-y-1">
                  {previousVitals[0] && (
                    <>
                      <p>Height: {previousVitals[0].height}cm</p>
                      <p>Weight: {previousVitals[0].weight}kg</p>
                      <p>BP: {previousVitals[0].bloodPressure?.systolic}/{previousVitals[0].bloodPressure?.diastolic}</p>
                      <p>BMI: {previousVitals[0].bmi}</p>
                    </>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Main Form */}
        <div className="md:col-span-3">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              {/* Physical Measurements */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Ruler className="h-5 w-5 text-blue-500" />
                    Physical Measurements
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <FormField
                      control={form.control}
                      name="height"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Ruler className="h-4 w-4" />
                            Height (CM) *
                          </FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="number" 
                              placeholder="170"
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="weight"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Scale className="h-4 w-4" />
                            Weight (Kg) *
                          </FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="number" 
                              placeholder="70"
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="space-y-2">
                      <FormLabel className="flex items-center gap-2">
                        <Calculator className="h-4 w-4" />
                        BMI
                      </FormLabel>
                      <div className="p-3 border rounded-md bg-gray-50">
                        {bmi ? (
                          <div>
                            <span className="text-lg font-semibold">{bmi}</span>
                            <span className={`ml-2 text-sm ${getBmiCategory(bmi).color}`}>
                              ({getBmiCategory(bmi).category})
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400">Enter height & weight</span>
                        )}
                      </div>
                    </div>

                    <FormField
                      control={form.control}
                      name="temperature"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Thermometer className="h-4 w-4" />
                            Temperature (°C)
                          </FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="number" 
                              step="0.1"
                              placeholder="36.5"
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Weight Change Question from Paper Form */}
                  <div className="p-4 border rounded-lg bg-blue-50">
                    <FormField
                      control={form.control}
                      name="weightChange.hasChanged"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-medium">
                            Has the weight changed by more than 5kg in the past year?
                          </FormLabel>
                          <FormControl>
                            <RadioGroup
                              value={field.value}
                              onValueChange={field.onChange}
                              className="flex gap-6 mt-2"
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
                    
                    {form.watch('weightChange.hasChanged') === 'yes' && (
                      <FormField
                        control={form.control}
                        name="weightChange.reason"
                        render={({ field }) => (
                          <FormItem className="mt-4">
                            <FormLabel>If so, state a reason:</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Reason for weight change..." />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Cardiovascular Assessment */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="h-5 w-5 text-red-500" />
                    Cardiovascular Assessment
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="pulseRate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Activity className="h-4 w-4" />
                            Pulse Rate (per min) *
                          </FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="number" 
                              placeholder="72"
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="bloodPressure.patientPosition"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Patient Position</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              placeholder="e.g., sitting, standing, lying"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Blood Pressure */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="bloodPressure.systolic"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>BP Systolic *</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="number" 
                              placeholder="120"
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="bloodPressure.diastolic"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>BP Diastolic *</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="number" 
                              placeholder="80"
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* BP Status Display */}
                  {systolic && diastolic && (
                    <div className="p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">Blood Pressure Status:</span>
                        <span className={`font-medium ${getBpCategory(systolic, diastolic).color}`}>
                          {getBpCategory(systolic, diastolic).category}
                        </span>
                        {(systolic > 140 || diastolic > 90) && (
                          <Badge variant="destructive" className="ml-2">
                            Requires Repeat
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {/* BP Repeat Section */}
                  {bpRepeatRequired && (
                    <div className="p-4 border border-red-200 rounded-lg bg-red-50">
                      <Alert className="mb-4">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          If BP &gt; 140/90, please repeat after 5 minutes
                        </AlertDescription>
                      </Alert>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="bloodPressure.repeatSystolic"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Repeat Systolic</FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  type="number" 
                                  placeholder="120"
                                  onChange={(e) => field.onChange(Number(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="bloodPressure.repeatDiastolic"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Repeat Diastolic</FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  type="number" 
                                  placeholder="80"
                                  onChange={(e) => field.onChange(Number(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="bloodPressure.abnormalReason"
                        render={({ field }) => (
                          <FormItem className="mt-4">
                            <FormLabel>Abnormal BP due to:</FormLabel>
                            <FormControl>
                              <RadioGroup
                                value={field.value}
                                onValueChange={field.onChange}
                              >
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="not_responding_treatment" />
                                  <label>Not responding to treatment</label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="never_diagnosed" />
                                  <label>Never diagnosed</label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="defaulted_treatment" />
                                  <label>Defaulted treatment</label>
                                </div>
                              </RadioGroup>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="bloodPressure.otherReason"
                        render={({ field }) => (
                          <FormItem className="mt-4">
                            <FormLabel>Other reason:</FormLabel>
                            <FormControl>
                              <Textarea 
                                {...field} 
                                placeholder="Specify other reasons..."
                                className="min-h-[80px]"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Urinalysis from Paper Form */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Droplets className="h-5 w-5 text-blue-500" />
                    Urinalysis
                  </CardTitle>
                  <CardDescription>
                    Are any of the following present in the urine?
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FormField
                      control={form.control}
                      name="urinalysis.blood"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-medium">Blood</FormLabel>
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
                      name="urinalysis.protein"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-medium">Protein</FormLabel>
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
                      name="urinalysis.glucose"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-medium">Glucose</FormLabel>
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
                  </div>

                  {/* Additional Lab Values */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                    <FormField
                      control={form.control}
                      name="randomGlucose"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Random Glucose (mmol/L)</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="number" 
                              step="0.1"
                              placeholder="5.6"
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="randomCholesterol"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Random Cholesterol (mmol/L)</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="number" 
                              step="0.1"
                              placeholder="4.5"
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Abnormal Glucose Reason */}
                  <FormField
                    control={form.control}
                    name="abnormalGlucoseReason"
                    render={({ field }) => (
                      <FormItem className="mt-4">
                        <FormLabel>Abnormal Glucose due to:</FormLabel>
                        <FormControl>
                          <RadioGroup
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="not_responding_treatment" />
                              <label>Not responding to treatment</label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="never_diagnosed" />
                              <label>Never diagnosed</label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="defaulted_treatment" />
                              <label>Defaulted treatment</label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Clinical Notes */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Info className="h-5 w-5 text-gray-500" />
                    Clinical Notes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="additionalNotes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Additional Clinical Notes</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            placeholder="Any additional observations or notes..."
                            className="min-h-[100px]"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Nurse Signature */}
              <Card className="border-blue-200 bg-blue-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5 text-blue-600" />
                    Nurse Signature & Certification
                  </CardTitle>
                  <CardDescription>
                    Complete nurse details and provide digital signature to certify vital signs accuracy
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="nurseSignature.name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nurse Name *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Full name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="nurseSignature.registrationNumber"
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

                  {/* Digital Signature Pad */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <FormLabel className="text-base font-medium">Digital Signature *</FormLabel>
                      {hasSignature && (
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Signed
                        </Badge>
                      )}
                    </div>
                    
                    <DigitalSignaturePad
                      ref={signaturePadRef}
                      width={500}
                      height={150}
                      signerName={form.watch('nurseSignature.name') || 'Nurse'}
                      onSignatureCapture={(signatureData) => {
                        form.setValue('nurseSignature.digitalSignature', {
                          imageData: signatureData.imageData,
                          timestamp: signatureData.timestamp,
                          hash: signatureData.hash,
                          biometricData: {
                            strokeCount: signatureData.biometricData.strokeCount,
                            duration: signatureData.biometricData.duration,
                            pressure: signatureData.biometricData.pressure,
                            speed: signatureData.biometricData.speed,
                            acceleration: signatureData.biometricData.acceleration
                          },
                          metadata: {
                            deviceInfo: signatureData.metadata.deviceInfo,
                            browserInfo: signatureData.metadata.browserInfo
                          }
                        });
                        setHasSignature(true);
                      }}
                      onSignatureChange={setHasSignature}
                      className="w-full"
                    />
                    
                    <Alert className="border-blue-200 bg-blue-50">
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        By providing your digital signature, you certify that all vital signs and measurements 
                        were recorded accurately and in accordance with professional nursing standards.
                      </AlertDescription>
                    </Alert>
                  </div>
                </CardContent>
              </Card>

              {/* Submit Button */}
              <div className="flex justify-end pt-6">
                <Button 
                  type="submit" 
                  disabled={isSubmitting || !selectedPatient || !hasSignature}
                  className="min-w-[200px] bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700"
                >
                  {isSubmitting ? (
                    <>
                      <Timer className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Complete Vital Signs Assessment
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
export default VitalSignsPage;
export { VitalSignsPage };