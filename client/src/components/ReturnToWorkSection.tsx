// client/src/components/ReturnToWorkSection.tsx
import React, { useState, useEffect } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Briefcase,
  Calendar,
  ClipboardList,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Users,
  Pill,
  Activity,
  FileText,
  Stethoscope,
  Plus,
  Trash2
} from 'lucide-react';

interface ReturnToWorkSectionProps {
  form: UseFormReturn<any>;
  onDataChange?: (data: any) => void;
}

export const ReturnToWorkSection: React.FC<ReturnToWorkSectionProps> = ({
  form,
  onDataChange
}) => {
  const [fitnessRecommendation, setFitnessRecommendation] = useState<'fit' | 'restricted' | 'unfit' | 'review'>('review');
  const [restrictions, setRestrictions] = useState<string[]>(['']);

  // Watch form values for changes
  const watchedValues = form.watch('return_to_work_surveillance');

  useEffect(() => {
    onDataChange?.(watchedValues);
    assessFitnessForWork();
  }, [watchedValues, onDataChange]);

  const assessFitnessForWork = () => {
    const data = watchedValues || {};
    
    // Calculate fitness recommendation based on responses
    let riskFactors = 0;
    
    if (!data.medical_clearance) riskFactors += 3;
    if (data.chronic_diseases?.length > 0) riskFactors += 2;
    if (data.absence_duration === '6_months_plus') riskFactors += 2;
    if (data.restrictions_required) riskFactors += 1;
    
    if (riskFactors >= 5) {
      setFitnessRecommendation('unfit');
    } else if (riskFactors >= 3) {
      setFitnessRecommendation('restricted');
    } else if (riskFactors >= 1) {
      setFitnessRecommendation('review');
    } else {
      setFitnessRecommendation('fit');
    }
  };

  const addRestriction = () => {
    setRestrictions([...restrictions, '']);
  };

  const removeRestriction = (index: number) => {
    const newRestrictions = restrictions.filter((_, i) => i !== index);
    setRestrictions(newRestrictions);
    form.setValue('return_to_work_surveillance.restriction_details', newRestrictions.filter(r => r.trim()));
  };

  const updateRestriction = (index: number, value: string) => {
    const newRestrictions = [...restrictions];
    newRestrictions[index] = value;
    setRestrictions(newRestrictions);
    form.setValue('return_to_work_surveillance.restriction_details', newRestrictions.filter(r => r.trim()));
  };

  const absenceReasons = [
    { value: 'illness', label: 'Illness/Medical condition' },
    { value: 'injury', label: 'Work-related injury' },
    { value: 'surgery', label: 'Surgery/Medical procedure' },
    { value: 'mental_health', label: 'Mental health/Stress' },
    { value: 'maternity', label: 'Maternity/Paternity leave' },
    { value: 'personal', label: 'Personal/Family reasons' },
    { value: 'other', label: 'Other (specify below)' }
  ];

  const chronicDiseases = [
    { key: 'hypertension', label: 'High blood pressure' },
    { key: 'diabetes', label: 'Diabetes' },
    { key: 'epilepsy', label: 'Epilepsy' },
    { key: 'asthma', label: 'Asthma' },
    { key: 'tuberculosis', label: 'Tuberculosis' },
    { key: 'psycho_social_problems', label: 'Psychological/Social problems' },
    { key: 'heart_disease', label: 'Heart disease' },
    { key: 'arthritis', label: 'Arthritis/Joint problems' }
  ];

  return (
    <div className="space-y-6">
      {/* Assessment Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-purple-500" />
            Return to Work Assessment
          </CardTitle>
          <CardDescription>
            This assessment ensures safe return to work after extended absence
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="border-blue-200 bg-blue-50">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Important Information</AlertTitle>
            <AlertDescription>
              This assessment is required for employees returning to work after an absence of more than 
              30 days or following a work-related injury/illness. All information will be treated confidentially.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Absence Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-orange-500" />
            Absence Information
          </CardTitle>
          <CardDescription>
            Details about your absence from work
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <FormField
            control={form.control}
            name="return_to_work_surveillance.absence_reason"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Primary reason for absence *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select the main reason for your absence" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {absenceReasons.map((reason) => (
                      <SelectItem key={reason.value} value={reason.value}>
                        {reason.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="return_to_work_surveillance.absence_duration"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Duration of absence *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select duration of absence" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="1-7_days">1-7 days</SelectItem>
                    <SelectItem value="1-4_weeks">1-4 weeks</SelectItem>
                    <SelectItem value="1-3_months">1-3 months</SelectItem>
                    <SelectItem value="3-6_months">3-6 months</SelectItem>
                    <SelectItem value="6_months_plus">More than 6 months</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="return_to_work_surveillance.absence_start_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start date of absence</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="return_to_work_surveillance.expected_return_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Expected return to work date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="return_to_work_surveillance.absence_details"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Detailed description of absence reason</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="Please provide detailed information about the reason for your absence, including any diagnoses, treatments received, or circumstances..."
                    rows={4}
                  />
                </FormControl>
                <FormDescription>
                  Include medical diagnoses, treatments, hospitalizations, or other relevant details
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      {/* Medical Clearance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5 text-green-500" />
            Medical Clearance Status
          </CardTitle>
          <CardDescription>
            Information about medical clearance for return to work
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <FormField
            control={form.control}
            name="return_to_work_surveillance.medical_clearance"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value || false}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel className="font-medium">
                    I have received medical clearance to return to work
                  </FormLabel>
                  <FormDescription>
                    Check this box only if you have written medical clearance from your treating physician
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="return_to_work_surveillance.treating_physician"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Treating physician/specialist name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Dr. Name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="return_to_work_surveillance.clearance_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date of medical clearance</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="return_to_work_surveillance.medical_restrictions"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Medical restrictions or recommendations</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="List any medical restrictions, modified duties, or recommendations from your treating physician..."
                    rows={3}
                  />
                </FormControl>
                <FormDescription>
                  Include any activity restrictions, medication effects, or workplace accommodations recommended
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      {/* Health Screening */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-blue-500" />
            Current Health Status
          </CardTitle>
          <CardDescription>
            Assessment of current health conditions and medication status
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Chronic Diseases */}
          <div>
            <FormLabel className="text-base font-medium mb-4 block">
              Current chronic medical conditions
            </FormLabel>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {chronicDiseases.map((disease) => (
                <FormField
                  key={disease.key}
                  control={form.control}
                  name={`return_to_work_surveillance.chronic_diseases.${disease.key}`}
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value || false}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="font-normal cursor-pointer">
                          {disease.label}
                        </FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
              ))}
            </div>
          </div>

          <Separator />

          {/* Medication Status */}
          <FormField
            control={form.control}
            name="return_to_work_surveillance.takes_medication"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value || false}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel className="font-medium">
                    I am currently taking medication
                  </FormLabel>
                  <FormDescription>
                    Include prescription medications, over-the-counter drugs, and supplements
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />

          {form.watch('return_to_work_surveillance.takes_medication') && (
            <FormField
              control={form.control}
              name="return_to_work_surveillance.medication_list"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current medication list</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="List all current medications with dosages and frequency (e.g., Lisinopril 10mg daily, Ibuprofen 400mg as needed)..."
                      rows={4}
                    />
                  </FormControl>
                  <FormDescription>
                    Include medication name, dosage, frequency, and reason for taking
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </CardContent>
      </Card>

      {/* Work Restrictions Assessment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-yellow-500" />
            Work Capacity Assessment
          </CardTitle>
          <CardDescription>
            Assessment of ability to perform regular job duties
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <FormField
            control={form.control}
            name="return_to_work_surveillance.restrictions_required"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value || false}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel className="font-medium">
                    I require work restrictions or accommodations
                  </FormLabel>
                  <FormDescription>
                    Check if you need any limitations on your work duties
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />

          {form.watch('return_to_work_surveillance.restrictions_required') && (
            <div className="space-y-4">
              <FormLabel className="text-base font-medium">
                Specify required restrictions or accommodations
              </FormLabel>
              {restrictions.map((restriction, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="flex-1">
                    <Input
                      value={restriction}
                      onChange={(e) => updateRestriction(index, e.target.value)}
                      placeholder="e.g., No lifting over 10kg, Modified hours, Desk duties only"
                      className="w-full"
                    />
                  </div>
                  {restrictions.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeRestriction(index)}
                      className="p-2"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              
              <Button
                type="button"
                variant="outline"
                onClick={addRestriction}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Another Restriction
              </Button>
            </div>
          )}

          <FormField
            control={form.control}
            name="return_to_work_surveillance.job_capacity_percentage"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estimated work capacity percentage</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your estimated work capacity" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="100">100% - Full capacity</SelectItem>
                    <SelectItem value="75">75% - Minor limitations</SelectItem>
                    <SelectItem value="50">50% - Moderate limitations</SelectItem>
                    <SelectItem value="25">25% - Significant limitations</SelectItem>
                    <SelectItem value="0">0% - Unable to work</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  Estimate your current ability to perform your regular job duties
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      {/* Preliminary Fitness Assessment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            Preliminary Fitness Assessment
          </CardTitle>
          <CardDescription>
            Based on the information provided
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className={`${
            fitnessRecommendation === 'fit' ? 'border-green-200 bg-green-50' :
            fitnessRecommendation === 'restricted' ? 'border-yellow-200 bg-yellow-50' :
            fitnessRecommendation === 'unfit' ? 'border-red-200 bg-red-50' :
            'border-blue-200 bg-blue-50'
          }`}>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle className={`${
              fitnessRecommendation === 'fit' ? 'text-green-800' :
              fitnessRecommendation === 'restricted' ? 'text-yellow-800' :
              fitnessRecommendation === 'unfit' ? 'text-red-800' :
              'text-blue-800'
            }`}>
              Preliminary Assessment: {
                fitnessRecommendation === 'fit' ? 'Fit for Work' :
                fitnessRecommendation === 'restricted' ? 'Fit with Restrictions' :
                fitnessRecommendation === 'unfit' ? 'Unfit for Work' :
                'Requires Medical Review'
              }
            </AlertTitle>
            <AlertDescription className={`${
              fitnessRecommendation === 'fit' ? 'text-green-700' :
              fitnessRecommendation === 'restricted' ? 'text-yellow-700' :
              fitnessRecommendation === 'unfit' ? 'text-red-700' :
              'text-blue-700'
            }`}>
              {fitnessRecommendation === 'fit' && 
                'Based on the information provided, you appear ready to return to full duties. Final determination will be made by the occupational health practitioner.'}
              {fitnessRecommendation === 'restricted' && 
                'You may be able to return to work with some restrictions. The occupational health practitioner will determine appropriate limitations.'}
              {fitnessRecommendation === 'unfit' && 
                'Based on the information provided, additional medical clearance may be required before return to work.'}
              {fitnessRecommendation === 'review' && 
                'Your case requires detailed review by the occupational health practitioner to determine fitness for work.'}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
};