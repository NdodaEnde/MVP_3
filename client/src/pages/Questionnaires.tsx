import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { getPatients } from '@/api/patients';
import { createQuestionnaire, updateQuestionnaireSection, getQuestionnaireByPatient } from '@/api/questionnaires';
import { useToast } from '@/hooks/useToast';
import { Patient } from '@/types';
import {
  ClipboardList,
  User,
  Save,
  CheckCircle,
  AlertTriangle,
  FileText,
  PenTool,
  Clock,
  Shield,
  Heart,
  Briefcase,
  Activity
} from 'lucide-react';

// Import enhanced components
import { EnhancedMedicalHistorySection } from '@/components/EnhancedMedicalHistorySection';
import { WorkingQuestionnaireDeclaration } from '@/components/WorkingQuestionnaireDeclaration';

const questionnaireSchema = z.object({
  patientId: z.string().min(1, 'Patient selection is required'),
  personalHistory: z.object({
    title: z.string().min(1, 'Title is required'),
    initials: z.string().min(1, 'Initials are required'),
    surname: z.string().min(1, 'Surname is required'),
    firstNames: z.string().min(1, 'First names are required'),
    idNumber: z.string().min(1, 'ID number is required'),
    dateOfBirth: z.string().min(1, 'Date of birth is required'),
    employeeNumber: z.string().optional(),
    maritalStatus: z.string().min(1, 'Marital status is required'),
    position: z.string().min(1, 'Position is required'),
    department: z.string().min(1, 'Department is required'),
    examinationType: z.string().min(1, 'Examination type is required')
  }),
  medicalHistory: z.record(z.union([z.boolean(), z.string()])),
  occupationalHistory: z.object({
    asbestosExposure: z.boolean(),
    mineWork: z.boolean(),
    chemicalExposure: z.boolean(),
    noiseExposure: z.boolean(),
    heatExposure: z.boolean()
  }),
  fitnessStatus: z.object({
    competitiveSport: z.boolean(),
    regularExercise: z.boolean()
  }),
  declaration: z.object({
    signed: z.boolean(),
    signature: z.string().min(1, 'Signature is required'),
    date: z.string().min(1, 'Date is required')
  })
});

type QuestionnaireFormData = z.infer<typeof questionnaireSchema>;

export function Questionnaires() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [activeTab, setActiveTab] = useState('personal');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [completionProgress, setCompletionProgress] = useState(0);
  const { toast } = useToast();

  const form = useForm<QuestionnaireFormData>({
    resolver: zodResolver(questionnaireSchema),
    defaultValues: {
      patientId: '',
      personalHistory: {
        title: '',
        initials: '',
        surname: '',
        firstNames: '',
        idNumber: '',
        dateOfBirth: '',
        employeeNumber: '',
        maritalStatus: '',
        position: '',
        department: '',
        examinationType: ''
      },
      medicalHistory: {},
      occupationalHistory: {
        asbestosExposure: false,
        mineWork: false,
        chemicalExposure: false,
        noiseExposure: false,
        heatExposure: false
      },
      fitnessStatus: {
        competitiveSport: false,
        regularExercise: false
      },
      declaration: {
        signed: false,
        signature: '',
        date: new Date().toISOString().split('T')[0]
      }
    }
  });

  useEffect(() => {
    fetchPatients();
  }, []);

  // Auto-save functionality
  useEffect(() => {
    const subscription = form.watch(() => {
      if (selectedPatient) {
        autoSaveQuestionnaire();
      }
    });
    return () => subscription.unsubscribe();
  }, [selectedPatient]);

  // Calculate completion progress
  useEffect(() => {
    const values = form.getValues();
    const totalFields = 25; // Approximate number of required fields
    let completedFields = 0;

    // Count completed personal history fields
    Object.values(values.personalHistory).forEach(value => {
      if (value && value.toString().trim()) completedFields++;
    });

    // Count medical history responses
    Object.keys(values.medicalHistory).forEach(() => completedFields++);

    // Count other sections
    if (values.occupationalHistory) completedFields += 2;
    if (values.fitnessStatus) completedFields += 1;
    if (values.declaration.signed) completedFields += 2;

    setCompletionProgress(Math.min((completedFields / totalFields) * 100, 100));
  }, [form.watch()]);

  const fetchPatients = async () => {
    try {
      const response = await getPatients({ status: 'questionnaire' });
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
      // Pre-populate with patient data
      form.setValue('personalHistory.surname', patient.name.split(' ').pop() || '');
      form.setValue('personalHistory.firstNames', patient.name.split(' ').slice(0, -1).join(' '));
      form.setValue('personalHistory.idNumber', patient.idNumber);

      try {
        const response = await getPatientQuestionnaire(patientId);
        const questionnaire = (response as any).questionnaire;
        if (questionnaire && questionnaire.completed) {
          // Load existing questionnaire data
          Object.keys(questionnaire).forEach(key => {
            if (key !== '_id' && key !== 'patientId') {
              form.setValue(key as any, questionnaire[key]);
            }
          });
        }
      } catch (error) {
        console.log('No existing questionnaire found');
      }
    }
  };

  const autoSaveQuestionnaire = async () => {
    if (!selectedPatient || autoSaving) return;

    setAutoSaving(true);
    try {
      const formData = form.getValues();
      await saveQuestionnaire({
        ...formData,
        completed: false
      });
      setLastSaved(new Date());
    } catch (error) {
      console.log('Auto-save failed');
    } finally {
      setAutoSaving(false);
    }
  };

  const onSubmit = async (data: QuestionnaireFormData) => {
    setIsSubmitting(true);
    try {
      await saveQuestionnaire({
        ...data,
        completed: true
      });
      toast({
        title: "Success",
        description: "Questionnaire completed and saved successfully",
      });

      form.reset();
      setSelectedPatient(null);
      fetchPatients();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save questionnaire",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const medicalHistoryQuestions = [
    { key: 'heartDisease', label: 'Heart disease or heart problems' },
    { key: 'epilepsy', label: 'Epilepsy or seizures' },
    { key: 'glaucoma', label: 'Glaucoma or eye problems' },
    { key: 'diabetes', label: 'Diabetes' },
    { key: 'hospitalAdmission', label: 'Hospital admission in the last 5 years' },
    { key: 'smoker', label: 'Current smoker' },
    { key: 'headaches', label: 'Frequent headaches' },
    { key: 'dizziness', label: 'Dizziness or fainting spells' },
    { key: 'allergies', label: 'Known allergies' },
    { key: 'asthma', label: 'Asthma or breathing problems' },
    { key: 'backProblems', label: 'Back or spine problems' },
    { key: 'medication', label: 'Currently taking medication' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gradient-to-br from-green-500 to-teal-600 rounded-lg">
          <ClipboardList className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Medical Questionnaires</h1>
          <p className="text-muted-foreground">
            Digital medical history and occupational health questionnaires
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
              Choose a patient to complete questionnaire
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
              <div className="mt-4 p-4 bg-gradient-to-br from-green-50 to-teal-50 rounded-lg border">
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

            {/* Progress Indicator */}
            {selectedPatient && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Completion</span>
                  <span className="text-sm text-muted-foreground">
                    {Math.round(completionProgress)}%
                  </span>
                </div>
                <Progress value={completionProgress} className="h-2" />
              </div>
            )}

            {/* Auto-save Status */}
            {lastSaved && (
              <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                {autoSaving ? (
                  <>
                    <Clock className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Saved {lastSaved.toLocaleTimeString()}
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Questionnaire Form */}
        <div className="md:col-span-3">
          <Card className="bg-gradient-to-br from-white to-green-50/30 border-green-200">
            <CardHeader>
              <CardTitle>Medical History Questionnaire</CardTitle>
              <CardDescription>
                Complete the medical history and occupational health assessment
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-5">
                      <TabsTrigger value="personal" className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Personal
                      </TabsTrigger>
                      <TabsTrigger value="medical" className="flex items-center gap-2">
                        <Heart className="h-4 w-4" />
                        Medical
                      </TabsTrigger>
                      <TabsTrigger value="occupational" className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4" />
                        Occupational
                      </TabsTrigger>
                      <TabsTrigger value="fitness" className="flex items-center gap-2">
                        <Activity className="h-4 w-4" />
                        Fitness
                      </TabsTrigger>
                      <TabsTrigger value="declaration" className="flex items-center gap-2">
                        <PenTool className="h-4 w-4" />
                        Declaration
                      </TabsTrigger>
                    </TabsList>

                    {/* Personal History */}
                    <TabsContent value="personal" className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="personalHistory.title"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Title</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select title" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="Mr">Mr</SelectItem>
                                  <SelectItem value="Mrs">Mrs</SelectItem>
                                  <SelectItem value="Ms">Ms</SelectItem>
                                  <SelectItem value="Dr">Dr</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="personalHistory.initials"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Initials</FormLabel>
                              <FormControl>
                                <Input placeholder="J.S." {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="personalHistory.surname"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Surname</FormLabel>
                              <FormControl>
                                <Input placeholder="Smith" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="personalHistory.firstNames"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>First Names</FormLabel>
                              <FormControl>
                                <Input placeholder="John Samuel" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="personalHistory.idNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>ID Number</FormLabel>
                              <FormControl>
                                <Input placeholder="8501015009087" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="personalHistory.dateOfBirth"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Date of Birth</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="personalHistory.maritalStatus"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Marital Status</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select status" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="Single">Single</SelectItem>
                                  <SelectItem value="Married">Married</SelectItem>
                                  <SelectItem value="Divorced">Divorced</SelectItem>
                                  <SelectItem value="Widowed">Widowed</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="personalHistory.position"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Position</FormLabel>
                              <FormControl>
                                <Input placeholder="Mining Engineer" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </TabsContent>

                    {/* Medical History */}
                    <TabsContent value="medical" className="space-y-4">
                      <ScrollArea className="h-96">
                        <div className="space-y-4">
                          {medicalHistoryQuestions.map((question) => (
                            <FormField
                              key={question.key}
                              control={form.control}
                              name={`medicalHistory.${question.key}` as any}
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value as boolean}
                                      onCheckedChange={field.onChange}
                                    />
                                  </FormControl>
                                  <div className="space-y-1 leading-none">
                                    <FormLabel className="text-sm font-normal">
                                      {question.label}
                                    </FormLabel>
                                  </div>
                                </FormItem>
                              )}
                            />
                          ))}
                        </div>
                      </ScrollArea>
                    </TabsContent>

                    {/* Occupational History */}
                    <TabsContent value="occupational" className="space-y-4">
                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name="occupationalHistory.asbestosExposure"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel className="text-sm font-normal">
                                  Previous asbestos exposure
                                </FormLabel>
                              </div>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="occupationalHistory.mineWork"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel className="text-sm font-normal">
                                  Previous mine work experience
                                </FormLabel>
                              </div>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="occupationalHistory.chemicalExposure"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel className="text-sm font-normal">
                                  Chemical exposure in workplace
                                </FormLabel>
                              </div>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="occupationalHistory.noiseExposure"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel className="text-sm font-normal">
                                  Excessive noise exposure
                                </FormLabel>
                              </div>
                            </FormItem>
                          )}
                        />
                      </div>
                    </TabsContent>

                    {/* Fitness Status */}
                    <TabsContent value="fitness" className="space-y-4">
                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name="fitnessStatus.competitiveSport"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel className="text-sm font-normal">
                                  Participate in competitive sports
                                </FormLabel>
                              </div>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="fitnessStatus.regularExercise"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel className="text-sm font-normal">
                                  Regular exercise routine
                                </FormLabel>
                              </div>
                            </FormItem>
                          )}
                        />
                      </div>
                    </TabsContent>

                    {/* Declaration */}
                    <TabsContent value="declaration" className="space-y-4">
                      <div className="space-y-4">
                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                          <h4 className="font-medium mb-2">Declaration</h4>
                          <p className="text-sm text-muted-foreground">
                            I declare that the information provided in this questionnaire is true and complete to the best of my knowledge. I understand that any false information may result in the rejection of my application or termination of employment.
                          </p>
                        </div>

                        <FormField
                          control={form.control}
                          name="declaration.signature"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Electronic Signature</FormLabel>
                              <FormControl>
                                <Input placeholder="Type your full name as signature" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="declaration.signed"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel className="text-sm font-normal">
                                  I agree to the declaration above and confirm my electronic signature
                                </FormLabel>
                              </div>
                            </FormItem>
                          )}
                        />
                      </div>
                    </TabsContent>
                  </Tabs>

                  <div className="flex gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={autoSaveQuestionnaire}
                      disabled={!selectedPatient || autoSaving}
                    >
                      <Save className="mr-2 h-4 w-4" />
                      Save Draft
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1 bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700"
                      disabled={isSubmitting || !selectedPatient || !form.watch('declaration.signed')}
                    >
                      {isSubmitting ? 'Submitting...' : 'Complete Questionnaire'}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}