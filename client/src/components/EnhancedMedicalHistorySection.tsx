import React, { useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { 
  Heart, 
  Activity, 
  Brain,
  Eye,
  Stethoscope,
  Factory,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Info,
  Pill,
  Users,
  Shield,
  Mountain,
  FileText
} from 'lucide-react';

interface ComprehensiveMedicalHistoryProps {
  form: UseFormReturn<any>;
}

// Complete medical questions from the paper form
const medicalQuestions = [
  // Questions 1-27 (Main medical history)
  { id: 1, question: "Heart disease or high blood pressure", category: "cardiovascular", critical: true },
  { id: 2, question: "Epilepsy or convulsions", category: "neurological", critical: true },
  { id: 3, question: "Glaucoma or blindness", category: "vision", critical: true },
  { id: 4, question: "Family Mellitus (Sugar sickness)", category: "metabolic", critical: true },
  { id: 5, question: "Family deaths before 60 years of age", category: "family" },
  { id: 6, question: "Refused life insurance", category: "general" },
  { id: 7, question: "Refused a driving licence", category: "general" },
  { id: 8, question: "Admitted to hospital (for any reason)", category: "general" },
  { id: 9, question: "A smoker", category: "lifestyle", critical: true },
  { id: 10, question: "Frequent or severe headaches", category: "neurological" },
  { id: 11, question: "Dizziness or unsteadiness", category: "neurological" },
  { id: 12, question: "Unconsciousness (for any reason)", category: "neurological", critical: true },
  { id: 13, question: "Head injury or concussion", category: "neurological" },
  { id: 14, question: "Epilepsy or fits of any kind", category: "neurological", critical: true },
  { id: 15, question: "Any other neurological disorder", category: "neurological" },
  { id: 16, question: "Any mental/Psychological disorder", category: "mental" },
  { id: 17, question: "Eye or vision trouble (except for glasses)", category: "vision" },
  { id: 18, question: "Hearing or speech disorders", category: "hearing" },
  { id: 19, question: "Hay fever or allergy", category: "respiratory" },
  { id: 20, question: "Asthma or lung disease", category: "respiratory", critical: true },
  { id: 21, question: "Collapsed lung (pneumonia)", category: "respiratory", critical: true },
  { id: 22, question: "Bleeding from the rectum", category: "gastrointestinal" },
  { id: 23, question: "Kidney stones or blood in the urine (including Bilharzia)", category: "urological" },
  { id: 24, question: "Sugar or protein in the urine", category: "urological" },
  { id: 25, question: "Prostate/Gynaecological problems", category: "reproductive" },
  { id: 26, question: "Any blood or thyroid disorder", category: "endocrine" },
  { id: 27, question: "Malignant tumours cancer or radiotherapy", category: "oncological", critical: true },
  
  // Questions 28-43 (Additional medical history)
  { id: 28, question: "Weight loss (without dieting)", category: "general" },
  { id: 29, question: "Sexually transmitted disease", category: "reproductive" },
  { id: 30, question: "Other illness or injuries", category: "general" },
  { id: 31, question: "Allergies: Penicillin etc.", category: "allergies" },
  { id: 32, question: "Back problems, joint or bone disease", category: "musculoskeletal" },
  { id: 33, question: "Varicose veins, piles", category: "vascular" },
  { id: 34, question: "Skin disease", category: "dermatological" },
  { id: 36, question: "Had any physical abnormalities", category: "general" },
  { id: 37, question: "Had any surgical operations done", category: "surgical" },
  { id: 38, question: "Abused alcohol", category: "substance", critical: true },
  { id: 39, question: "Abused drugs or substances", category: "substance", critical: true },
  { id: 40, question: "Used any medication", category: "medication" },
  
  // Occupational History (41-43)
  { id: 41, question: "Asbestos exposure", category: "occupational", critical: true },
  { id: 42, question: "Mine or underground work", category: "occupational", critical: true },
  { id: 43, question: "Chemical exposure", category: "occupational", critical: true }
];

// Working at Heights questions from the paper form
const workingAtHeightsQuestions = [
  { id: 1, question: "Have you ever been advised NOT to work at height?" },
  { id: 2, question: "Have you ever had a serious occupational accident or occupational diseases?" },
  { id: 3, question: "Do you have a fear of heights or fear of enclosed spaces?" },
  { id: 4, question: "Do you have, or have you ever had fits/seizures, epilepsy, blackouts, dizzy spells, or episodes of sudden weakness?" },
  { id: 5, question: "Have you ever attempted to commit suicide or have suicidal thoughts?" },
  { id: 6, question: "Have you ever seen a psychologist, psychiatrist or any other health professional for a mental health disease?" },
  { id: 7, question: "Do you often have thoughts that are not your own e.g. messages from God, the devil or evil spirits?" },
  { id: 8, question: "Do you have a substance abuse problem (alcohol/drugs)?" },
  { id: 9, question: "Are you aware of any other problems that could possibly affect your ability to safely perform expected duties and work at heights?" },
  { id: 10, question: "Have you been informed of the tasks you are expected to perform, and the safety requirements and health requirements for working at heights?" },
  { id: 11, question: "Do you have any chronic diseases e.g. diabetes or epilepsy?" }
];

export const ComprehensiveMedicalHistory: React.FC<ComprehensiveMedicalHistoryProps> = ({ form }) => {
  const [expandedSections, setExpandedSections] = useState({
    main: true,
    additional: true,
    occupational: true,
    treatment: false
  });

  const getCategoryIcon = (category: string) => {
    const iconMap: Record<string, React.ElementType> = {
      cardiovascular: Heart,
      neurological: Brain,
      vision: Eye,
      respiratory: Stethoscope,
      occupational: Factory,
      substance: AlertTriangle,
      mental: Brain,
      oncological: AlertTriangle,
      metabolic: Activity,
      lifestyle: Factory,
      general: Info
    };
    return iconMap[category] || Info;
  };

  const getCategoryColor = (category: string, critical?: boolean) => {
    if (critical) return 'border-red-300 bg-red-50';
    
    const colorMap: Record<string, string> = {
      cardiovascular: 'border-red-200 bg-red-50',
      neurological: 'border-purple-200 bg-purple-50',
      vision: 'border-blue-200 bg-blue-50',
      respiratory: 'border-cyan-200 bg-cyan-50',
      occupational: 'border-orange-200 bg-orange-50',
      substance: 'border-red-200 bg-red-50',
      mental: 'border-purple-200 bg-purple-50',
      oncological: 'border-red-200 bg-red-50',
      general: 'border-gray-200 bg-gray-50'
    };
    return colorMap[category] || 'border-gray-200 bg-gray-50';
  };

  const renderMedicalQuestion = (q: typeof medicalQuestions[0]) => {
    const IconComponent = getCategoryIcon(q.category);
    const fieldValue = form.watch(`medicalHistory.q${q.id}`);
    
    return (
      <div 
        key={q.id}
        className={`p-4 border rounded-lg transition-all ${getCategoryColor(q.category, q.critical)}`}
      >
        <FormField
          control={form.control}
          name={`medicalHistory.q${q.id}`}
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value || false}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <IconComponent className="h-4 w-4 text-gray-600" />
                  <FormLabel className="text-sm leading-none cursor-pointer font-medium">
                    {q.id}. {q.question}
                  </FormLabel>
                  {q.critical && (
                    <Badge variant="destructive" className="text-xs">
                      Critical
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-xs capitalize">
                    {q.category}
                  </Badge>
                </div>
                
                {fieldValue && q.critical && (
                  <div className="flex items-center gap-2 text-sm text-red-600 bg-red-100 p-2 rounded">
                    <AlertTriangle className="h-4 w-4" />
                    <span>This condition may require additional medical evaluation</span>
                  </div>
                )}
              </div>
            </FormItem>
          )}
        />
      </div>
    );
  };

  const renderWorkingAtHeightsQuestion = (q: typeof workingAtHeightsQuestions[0]) => {
    return (
      <div key={q.id} className="p-4 border rounded-lg bg-yellow-50 border-yellow-200">
        <FormField
          control={form.control}
          name={`workingAtHeights.q${q.id}`}
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value || false}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="flex-1">
                <FormLabel className="text-sm leading-relaxed cursor-pointer">
                  {q.id}. {q.question}
                </FormLabel>
              </div>
            </FormItem>
          )}
        />
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Comprehensive Medical History
          </CardTitle>
          <CardDescription>
            Complete the medical questionnaire based on the official medical form. Answer all questions honestly.
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="medical" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="medical" className="flex items-center gap-2">
            <Heart className="h-4 w-4" />
            Medical History
          </TabsTrigger>
          <TabsTrigger value="heights" className="flex items-center gap-2">
            <Mountain className="h-4 w-4" />
            Working at Heights
          </TabsTrigger>
          <TabsTrigger value="treatment" className="flex items-center gap-2">
            <Stethoscope className="h-4 w-4" />
            Medical Treatment
          </TabsTrigger>
        </TabsList>

        <TabsContent value="medical" className="space-y-6">
          {/* Main Medical History (Questions 1-27) */}
          <Card>
            <CardHeader 
              className="cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => setExpandedSections(prev => ({ ...prev, main: !prev.main }))}
            >
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-red-500" />
                  <span>Medical History (Questions 1-27)</span>
                  <Badge variant="secondary">Required</Badge>
                </div>
                {expandedSections.main ? 
                  <ChevronUp className="h-4 w-4" /> : 
                  <ChevronDown className="h-4 w-4" />
                }
              </CardTitle>
              <CardDescription>
                Have you ever had or do you now have any of the following conditions?
              </CardDescription>
            </CardHeader>

            {expandedSections.main && (
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {medicalQuestions.slice(0, 27).map(renderMedicalQuestion)}
                </div>
              </CardContent>
            )}
          </Card>

          {/* Additional Medical History (Questions 28-43) */}
          <Card>
            <CardHeader 
              className="cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => setExpandedSections(prev => ({ ...prev, additional: !prev.additional }))}
            >
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-blue-500" />
                  <span>Additional Medical & Occupational History (Questions 28-43)</span>
                </div>
                {expandedSections.additional ? 
                  <ChevronUp className="h-4 w-4" /> : 
                  <ChevronDown className="h-4 w-4" />
                }
              </CardTitle>
              <CardDescription>
                Additional health conditions, substance use, and occupational exposures
              </CardDescription>
            </CardHeader>

            {expandedSections.additional && (
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {medicalQuestions.slice(27).map(renderMedicalQuestion)}
                </div>
              </CardContent>
            )}
          </Card>

          {/* Comments on Abnormalities */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5 text-gray-500" />
                Comments on Abnormalities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="medicalHistory.abnormalitiesComments"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Please provide details for any "Yes" answers above</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Describe any medical conditions, treatments, or circumstances in detail..."
                        className="min-h-[120px]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="heights" className="space-y-6">
          <Card className="border-yellow-200 bg-yellow-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mountain className="h-5 w-5 text-yellow-600" />
                Working at Heights Questionnaire
                <Badge className="bg-yellow-600">Safety Critical</Badge>
              </CardTitle>
              <CardDescription>
                Answer all questions honestly. This assessment is crucial for workplace safety.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {workingAtHeightsQuestions.map(renderWorkingAtHeightsQuestion)}
                
                {/* Additional Comments */}
                <div className="mt-6">
                  <FormField
                    control={form.control}
                    name="workingAtHeights.additionalComments"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>12. Additional Comments:</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Any additional information relevant to working at heights..."
                            className="min-h-[100px]"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Examiner Declaration */}
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <FormField
                    control={form.control}
                    name="workingAtHeights.examinerExplanation"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value || false}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="text-sm">
                            <strong>Examiner Declaration:</strong> I have explained to the employee that they should notify the supervisor if, at any time, they develop a health condition that they feel may affect their ability to work at height, including the use of medicine.
                          </FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="treatment" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Stethoscope className="h-5 w-5 text-green-500" />
                Medical Treatment Within the Last Two (2) Years
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="medicalTreatment.date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="YYYY-MM-DD" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="medicalTreatment.practitioner"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name of Medical Practitioner/Specialist</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Dr. Name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="medicalTreatment.diagnosis"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Diagnosis/Reason for Treatment</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Condition or treatment reason" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div>
                <h4 className="font-medium mb-4">General Practitioner of Previous Ten Years</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="generalPractitioner.name1"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>1. Name of Medical Practitioner</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Dr. Name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="generalPractitioner.contact1"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Details</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Phone / Address" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="generalPractitioner.name2"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>2. Name of Medical Practitioner</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Dr. Name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="generalPractitioner.contact2"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Details</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Phone / Address" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Confidentiality Notice */}
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          All information provided will be kept strictly confidential and used only for medical assessment purposes. 
          Please ensure all information is accurate and complete.
        </AlertDescription>
      </Alert>
    </div>
  );
};