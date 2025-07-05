import React, { useState, useEffect } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  Clock,
  Calendar,
  TrendingUp,
  Activity,
  Briefcase,
  Users,
  Pill,
  AlertTriangle,
  Info,
  FileText,
  Stethoscope
} from 'lucide-react';

interface PeriodicHealthHistorySectionProps {
  form: UseFormReturn<any>;
  onDataChange?: (data: any) => void;
}

export const PeriodicHealthHistorySection: React.FC<PeriodicHealthHistorySectionProps> = ({
  form,
  onDataChange
}) => {
  const [lastExaminationDate, setLastExaminationDate] = useState('');
  const [timeElapsed, setTimeElapsed] = useState('');

  // Watch form values for changes
  const watchedValues = form.watch('periodic_health_history');

  useEffect(() => {
    onDataChange?.(watchedValues);
  }, [watchedValues, onDataChange]);

  // Calculate time since last examination
  useEffect(() => {
    const lastExamDate = form.watch('periodic_health_history.previous_examination_results.last_examination_date');
    if (lastExamDate) {
      const today = new Date();
      const examDate = new Date(lastExamDate);
      const diffTime = Math.abs(today.getTime() - examDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const diffMonths = Math.floor(diffDays / 30);
      const diffYears = Math.floor(diffDays / 365);

      if (diffYears > 0) {
        setTimeElapsed(`${diffYears} year${diffYears > 1 ? 's' : ''} ago`);
      } else if (diffMonths > 0) {
        setTimeElapsed(`${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`);
      } else {
        setTimeElapsed(`${diffDays} day${diffDays > 1 ? 's' : ''} ago`);
      }
    } else {
      setTimeElapsed('');
    }
  }, [form.watch('periodic_health_history.previous_examination_results.last_examination_date')]);

  const renderPreviousExaminationInfo = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-blue-500" />
          Previous Examination Information
        </CardTitle>
        <CardDescription>
          Information about your last occupational health examination
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="periodic_health_history.previous_examination_results.last_examination_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date of last examination</FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    {...field}
                    max={new Date().toISOString().split('T')[0]}
                  />
                </FormControl>
                {timeElapsed && (
                  <FormDescription className="text-blue-600">
                    {timeElapsed}
                  </FormDescription>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="periodic_health_history.previous_examination_results.last_examination_outcome"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Outcome of last examination</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select outcome" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="fit">Fit for work</SelectItem>
                    <SelectItem value="fit_with_restrictions">Fit with restrictions</SelectItem>
                    <SelectItem value="unfit">Unfit for work</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {form.watch('periodic_health_history.previous_examination_results.last_examination_outcome') === 'fit_with_restrictions' && (
          <FormField
            control={form.control}
            name="periodic_health_history.previous_examination_results.restrictions_previously_imposed"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Previous restrictions imposed</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="Describe any work restrictions that were previously imposed..."
                    rows={3}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <div className="flex items-center space-x-2">
          <FormField
            control={form.control}
            name="periodic_health_history.previous_examination_results.follow_up_required"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <input
                    type="checkbox"
                    checked={field.value || false}
                    onChange={field.onChange}
                    className="mt-1"
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>
                    Follow-up examination was recommended
                  </FormLabel>
                </div>
              </FormItem>
            )}
          />
        </div>
      </CardContent>
    </Card>
  );

  const renderHealthChangesSinceLastExam = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-green-500" />
          Health Changes Since Last Examination
          <Badge variant="secondary">Required</Badge>
        </CardTitle>
        <CardDescription>
          Please provide detailed information about any health changes since your last examination
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <FormField
          control={form.control}
          name="periodic_health_history.since_last_examination.illness_injury_treatment"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <Stethoscope className="h-4 w-4" />
                Illness, injury, or medical treatment
              </FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Describe any illness, injury, medical treatment, hospitalizations, or surgeries since your last examination. Include dates and outcomes where possible..."
                  rows={4}
                />
              </FormControl>
              <FormDescription>
                Include any emergency room visits, specialist consultations, or ongoing medical treatments
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="periodic_health_history.since_last_examination.family_history_changes"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Changes in family medical history
              </FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Report any new family medical conditions, deaths, or diagnoses that may be relevant to your health (parents, siblings, children)..."
                  rows={3}
                />
              </FormControl>
              <FormDescription>
                Include new diagnoses of heart disease, cancer, diabetes, or other hereditary conditions
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="periodic_health_history.since_last_examination.occupational_risk_profile_changes"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Changes in occupational risk profile
              </FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Describe any changes in your job responsibilities, work environment, exposure risks, or workplace hazards since your last examination..."
                  rows={3}
                />
              </FormControl>
              <FormDescription>
                Include new chemical exposures, noise levels, physical demands, or safety risks
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="periodic_health_history.since_last_examination.current_medications"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <Pill className="h-4 w-4" />
                Current medications and supplements
              </FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="List all current medications, dosages, frequency, and reasons for taking. Include prescription drugs, over-the-counter medications, vitamins, and supplements..."
                  rows={4}
                />
              </FormControl>
              <FormDescription>
                Include any changes to medications since your last examination
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="periodic_health_history.since_last_examination.lifestyle_changes"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Lifestyle changes
              </FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Describe any significant lifestyle changes such as diet, exercise, smoking, alcohol consumption, sleep patterns, or stress levels..."
                  rows={3}
                />
              </FormControl>
              <FormDescription>
                Include both positive and negative lifestyle changes
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="periodic_health_history.since_last_examination.new_symptoms"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                New symptoms or health concerns
              </FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Report any new symptoms, health concerns, or changes in your physical or mental well-being since your last examination..."
                  rows={3}
                />
              </FormControl>
              <FormDescription>
                Include symptoms that may seem unrelated to work but could affect your fitness for duty
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );

  const renderGeneralAppearanceAssessment = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-purple-500" />
          General Health Assessment
        </CardTitle>
        <CardDescription>
          Overall health and well-being evaluation
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <FormField
          control={form.control}
          name="periodic_health_history.appearance_comment"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Self-assessment of current health status</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Describe how you feel about your current health status, energy levels, and overall well-being compared to your last examination..."
                  rows={4}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="periodic_health_history.current_fitness_level"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Current fitness level</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select fitness level" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="excellent">Excellent - Better than last exam</SelectItem>
                    <SelectItem value="good">Good - Similar to last exam</SelectItem>
                    <SelectItem value="fair">Fair - Somewhat declined</SelectItem>
                    <SelectItem value="poor">Poor - Significantly declined</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="periodic_health_history.work_performance_impact"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Impact on work performance</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select impact level" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">No impact on work performance</SelectItem>
                    <SelectItem value="minimal">Minimal impact</SelectItem>
                    <SelectItem value="moderate">Moderate impact</SelectItem>
                    <SelectItem value="significant">Significant impact</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </CardContent>
    </Card>
  );

  const renderWarningAlerts = () => {
    const hasSignificantChanges = form.watch('periodic_health_history.since_last_examination.illness_injury_treatment') ||
                                 form.watch('periodic_health_history.since_last_examination.new_symptoms') ||
                                 form.watch('periodic_health_history.work_performance_impact') === 'significant';

    if (hasSignificantChanges) {
      return (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Significant health changes detected. This information will be carefully reviewed during your medical examination and may require additional assessment or follow-up.
          </AlertDescription>
        </Alert>
      );
    }

    const hasTimeGap = timeElapsed && (timeElapsed.includes('year') || timeElapsed.includes('month'));
    if (hasTimeGap) {
      return (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Extended time since last examination noted. Please ensure all health information is complete and up-to-date.
          </AlertDescription>
        </Alert>
      );
    }

    return null;
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold flex items-center justify-center gap-2">
          <Clock className="h-6 w-6 text-green-500" />
          Periodic Health History
        </h2>
        <p className="text-gray-600">
          Health changes and updates since your last occupational health examination
        </p>
      </div>

      {renderPreviousExaminationInfo()}
      {renderHealthChangesSinceLastExam()}
      {renderGeneralAppearanceAssessment()}
      {renderWarningAlerts()}

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          This periodic health assessment helps track changes in your health status over time. Please be thorough and honest in your responses, as this information is crucial for maintaining your occupational health and safety.
        </AlertDescription>
      </Alert>
    </div>
  );
};