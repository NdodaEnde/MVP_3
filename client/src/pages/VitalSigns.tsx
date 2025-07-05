import * as z from 'zod';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
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
  Scale
} from 'lucide-react';

const vitalsSchema = z.object({
  patientId: z.string().min(1, 'Patient selection is required'),
  height: z.number().min(1, 'Height is required'),
  weight: z.number().min(1, 'Weight is required'),
  systolic: z.number().min(1, 'Systolic BP is required'),
  diastolic: z.number().min(1, 'Diastolic BP is required'),
  pulse: z.number().min(1, 'Pulse is required'),
  temperature: z.number().min(1, 'Temperature is required'),
  notes: z.string().optional()
});

type VitalsFormData = z.infer<typeof vitalsSchema>;

export function VitalSignsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [previousVitals, setPreviousVitals] = useState<VitalSigns[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<VitalsFormData>({
    resolver: zodResolver(vitalsSchema),
    defaultValues: {
      patientId: '',
      height: 0,
      weight: 0,
      systolic: 0,
      diastolic: 0,
      pulse: 0,
      temperature: 0,
      notes: ''
    }
  });

  useEffect(() => {
    fetchPatients();
  }, []);

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

  const onSubmit = async (data: VitalsFormData) => {
    setIsSubmitting(true);
    try {
      const vitalsData = {
        patientId: data.patientId,
        height: data.height,
        weight: data.weight,
        bloodPressure: {
          systolic: data.systolic,
          diastolic: data.diastolic
        },
        pulse: data.pulse,
        temperature: data.temperature,
        notes: data.notes
      };

      await saveVitalSigns(vitalsData);
      toast({
        title: "Success",
        description: "Vital signs recorded successfully",
      });
      
      form.reset();
      setSelectedPatient(null);
      setPreviousVitals([]);
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

  const calculateBMI = (height: number, weight: number) => {
    if (height > 0 && weight > 0) {
      return (weight / Math.pow(height / 100, 2)).toFixed(1);
    }
    return '0';
  };

  const getBMICategory = (bmi: number) => {
    if (bmi < 18.5) return { category: 'Underweight', color: 'text-blue-600' };
    if (bmi < 25) return { category: 'Normal', color: 'text-green-600' };
    if (bmi < 30) return { category: 'Overweight', color: 'text-yellow-600' };
    return { category: 'Obese', color: 'text-red-600' };
  };

  const getBPCategory = (systolic: number, diastolic: number) => {
    if (systolic < 120 && diastolic < 80) return { category: 'Normal', color: 'text-green-600' };
    if (systolic < 130 && diastolic < 80) return { category: 'Elevated', color: 'text-yellow-600' };
    if (systolic < 140 || diastolic < 90) return { category: 'Stage 1 Hypertension', color: 'text-orange-600' };
    return { category: 'Stage 2 Hypertension', color: 'text-red-600' };
  };

  const currentBMI = parseFloat(calculateBMI(form.watch('height'), form.watch('weight')));
  const bmiInfo = getBMICategory(currentBMI);
  const bpInfo = getBPCategory(form.watch('systolic'), form.watch('diastolic'));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg">
          <Activity className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Vital Signs</h1>
          <p className="text-muted-foreground">
            Record patient vital signs and measurements
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
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
                  <p>Employer: {selectedPatient.employer}</p>
                  <Badge variant="outline">
                    {selectedPatient.examinationType.replace('-', ' ')}
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
                      <p>BP: {previousVitals[0].bloodPressure.systolic}/{previousVitals[0].bloodPressure.diastolic}</p>
                      <p>BMI: {previousVitals[0].bmi}</p>
                    </>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Vitals Form */}
        <div className="md:col-span-2">
          <Card className="bg-gradient-to-br from-white to-purple-50/30 border-purple-200">
            <CardHeader>
              <CardTitle>Record Vital Signs</CardTitle>
              <CardDescription>
                Enter patient measurements and vital signs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Physical Measurements */}
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="height"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Ruler className="h-4 w-4" />
                            Height (cm)
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="175"
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
                      name="weight"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Scale className="h-4 w-4" />
                            Weight (kg)
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="70"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* BMI Display */}
                  {currentBMI > 0 && (
                    <div className="p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">BMI: {currentBMI}</span>
                        <Badge className={bmiInfo.color}>
                          {bmiInfo.category}
                        </Badge>
                      </div>
                    </div>
                  )}

                  {/* Blood Pressure */}
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="systolic"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Heart className="h-4 w-4" />
                            Systolic BP (mmHg)
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="120"
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
                      name="diastolic"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Diastolic BP (mmHg)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="80"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* BP Category Display */}
                  {form.watch('systolic') > 0 && form.watch('diastolic') > 0 && (
                    <div className="p-4 bg-gradient-to-r from-red-50 to-yellow-50 rounded-lg border">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">
                          Blood Pressure: {form.watch('systolic')}/{form.watch('diastolic')}
                        </span>
                        <Badge className={bpInfo.color}>
                          {bpInfo.category}
                        </Badge>
                      </div>
                    </div>
                  )}

                  {/* Other Vitals */}
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="pulse"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Heart className="h-4 w-4" />
                            Pulse (bpm)
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="72"
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
                      name="temperature"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Thermometer className="h-4 w-4" />
                            Temperature (°C)
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.1"
                              placeholder="36.5"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Notes */}
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Clinical Notes</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Any observations or notes about the patient's condition..."
                            className="min-h-20"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
                    disabled={isSubmitting || !selectedPatient}
                  >
                    {isSubmitting ? 'Recording...' : 'Record Vital Signs'}
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