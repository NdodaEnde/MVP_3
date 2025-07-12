import React, { useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
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
  Shield
} from 'lucide-react';

interface EnhancedMedicalHistorySectionProps {
  form: UseFormReturn<any>;
}

interface MedicalCondition {
  key: string;
  label: string;
  category: string;
  critical?: boolean;
  description?: string;
  icon?: React.ElementType;
}

export const EnhancedMedicalHistorySection: React.FC<EnhancedMedicalHistorySectionProps> = ({
  form
}) => {
  const [expandedSections, setExpandedSections] = useState({
    current: true,
    respiratory: true,
    occupational: true,
    medications: false,
    family: false
  });

  const medicalConditions: MedicalCondition[] = [
    { 
      key: 'heartDisease', 
      label: 'Heart disease or heart problems', 
      category: 'cardiovascular',
      critical: true,
      description: 'Including hypertension, coronary artery disease, heart failure, or arrhythmias',
      icon: Heart
    },
    { 
      key: 'epilepsy', 
      label: 'Epilepsy, seizures, or convulsions', 
      category: 'neurological',
      critical: true,
      description: 'Any history of seizure disorders or unexplained loss of consciousness',
      icon: Brain
    },
    { 
      key: 'glaucoma', 
      label: 'Glaucoma, vision problems, or blindness', 
      category: 'vision',
      description: 'Including cataracts, macular degeneration, or significant vision impairment',
      icon: Eye
    },
    { 
      key: 'diabetes', 
      label: 'Diabetes or other endocrine disorders', 
      category: 'metabolic',
      critical: true,
      description: 'Type 1 or Type 2 diabetes, thyroid disorders, or other hormonal conditions',
      icon: Activity
    },
    { 
      key: 'hospitalAdmission', 
      label: 'Hospital admission in the last 5 years', 
      category: 'general',
      description: 'Any significant hospitalization or emergency department visits',
      icon: Stethoscope
    },
    { 
      key: 'smoker', 
      label: 'Current smoker or tobacco use', 
      category: 'lifestyle',
      description: 'Including cigarettes, cigars, pipe tobacco, or other tobacco products',
      icon: Factory
    },
    { 
      key: 'headaches', 
      label: 'Frequent headaches or migraines', 
      category: 'neurological',
      description: 'Recurring headaches that interfere with daily activities',
      icon: Brain
    },
    { 
      key: 'dizziness', 
      label: 'Dizziness or fainting spells', 
      category: 'neurological',
      description: 'Episodes of dizziness, vertigo, or loss of consciousness',
      icon: Brain
    },
    { 
      key: 'allergies', 
      label: 'Known allergies or allergic reactions', 
      category: 'general',
      description: 'Food allergies, drug allergies, or environmental allergies',
      icon: Shield
    },
    { 
      key: 'asthma', 
      label: 'Asthma or breathing problems', 
      category: 'respiratory',
      description: 'Including occupational asthma or exercise-induced asthma',
      icon: Stethoscope
    },
    { 
      key: 'backProblems', 
      label: 'Back, spine, or musculoskeletal problems', 
      category: 'musculoskeletal',
      description: 'Including chronic back pain, herniated discs, or joint problems',
      icon: Activity
    },
    { 
      key: 'medication', 
      label: 'Currently taking chronic medication', 
      category: 'general',
      description: 'Any medications taken regularly, including supplements',
      icon: Pill
    }
  ];

  const getCategoryIcon = (category: string) => {
    const iconMap: Record<string, React.ElementType> = {
      cardiovascular: Heart,
      neurological: Brain,
      vision: Eye,
      metabolic: Activity,
      respiratory: Stethoscope,
      lifestyle: Factory,
      musculoskeletal: Activity,
      general: Info
    };
    return iconMap[category] || Info;
  };

  const getCategoryColor = (category: string) => {
    const colorMap: Record<string, string> = {
      cardiovascular: 'text-red-500 bg-red-50 border-red-200',
      neurological: 'text-purple-500 bg-purple-50 border-purple-200',
      vision: 'text-blue-500 bg-blue-50 border-blue-200',
      metabolic: 'text-green-500 bg-green-50 border-green-200',
      respiratory: 'text-sky-500 bg-sky-50 border-sky-200',
      lifestyle: 'text-orange-500 bg-orange-50 border-orange-200',
      musculoskeletal: 'text-indigo-500 bg-indigo-50 border-indigo-200',
      general: 'text-gray-500 bg-gray-50 border-gray-200'
    };
    return colorMap[category] || colorMap.general;
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const EnhancedMedicalConditionCheckbox: React.FC<{
    condition: MedicalCondition;
    fieldName: string;
  }> = ({ condition, fieldName }) => {
    const IconComponent = condition.icon || getCategoryIcon(condition.category);
    const colorClass = getCategoryColor(condition.category);
    const fieldValue = form.watch(fieldName);

    return (
      <div className={`p-4 rounded-lg border transition-all ${
        fieldValue 
          ? condition.critical 
            ? 'border-red-300 bg-red-50' 
            : colorClass
          : 'border-gray-200 bg-white hover:bg-gray-50'
      }`}>
        <FormField
          control={form.control}
          name={fieldName}
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value || false}
                  onCheckedChange={field.onChange}
                  className={fieldValue && condition.critical ? 'border-red-400' : ''}
                />
              </FormControl>
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <IconComponent className={`h-4 w-4 ${
                    fieldValue && condition.critical ? 'text-red-500' : 'text-gray-600'
                  }`} />
                  <FormLabel className={`text-sm leading-none cursor-pointer ${
                    condition.critical ? 'font-medium' : ''
                  }`}>
                    {condition.label}
                  </FormLabel>
                  {condition.critical && (
                    <Badge variant="destructive" className="text-xs">
                      Critical
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-xs capitalize">
                    {condition.category}
                  </Badge>
                </div>
                
                {condition.description && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-1 cursor-help">
                          <Info className="h-3 w-3 text-gray-400" />
                          <span className="text-xs text-gray-500">More info</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs text-sm">{condition.description}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}

                {fieldValue && condition.critical && (
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

  const renderCurrentConditionsSection = () => (
    <Card className="border-red-100">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-red-500" />
            <CardTitle className="text-lg">Current Medical Conditions</CardTitle>
            <Badge variant="secondary">Required</Badge>
          </div>
          <CollapsibleTrigger onClick={() => toggleSection('current')}>
            {expandedSections.current ? 
              <ChevronUp className="h-4 w-4" /> : 
              <ChevronDown className="h-4 w-4" />
            }
          </CollapsibleTrigger>
        </div>
        <CardDescription>
          Please indicate if you currently have or have ever had any of the following conditions.
          Select all that apply.
        </CardDescription>
      </CardHeader>
      
      <Collapsible open={expandedSections.current}>
        <CollapsibleContent>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {medicalConditions.map((condition) => (
                <EnhancedMedicalConditionCheckbox
                  key={condition.key}
                  condition={condition}
                  fieldName={`medicalHistory.${condition.key}`}
                />
              ))}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );

  const renderOccupationalSection = () => (
    <Card className="border-orange-100">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Factory className="h-5 w-5 text-orange-500" />
            <CardTitle className="text-lg">Occupational Health & Safety</CardTitle>
            <Badge variant="secondary">Required</Badge>
          </div>
          <CollapsibleTrigger onClick={() => toggleSection('occupational')}>
            {expandedSections.occupational ? 
              <ChevronUp className="h-4 w-4" /> : 
              <ChevronDown className="h-4 w-4" />
            }
          </CollapsibleTrigger>
        </div>
        <CardDescription>
          Information about workplace exposures and occupational health factors
        </CardDescription>
      </CardHeader>
      
      <Collapsible open={expandedSections.occupational}>
        <CollapsibleContent>
          <CardContent className="space-y-6">
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
                      <FormLabel className="text-sm font-normal flex items-center gap-2">
                        <Factory className="h-4 w-4 text-orange-500" />
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
                      <FormLabel className="text-sm font-normal flex items-center gap-2">
                        <Factory className="h-4 w-4 text-orange-500" />
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
                      <FormLabel className="text-sm font-normal flex items-center gap-2">
                        <Factory className="h-4 w-4 text-orange-500" />
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
                      <FormLabel className="text-sm font-normal flex items-center gap-2">
                        <Factory className="h-4 w-4 text-orange-500" />
                        Excessive noise exposure
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="occupationalHistory.heatExposure"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-sm font-normal flex items-center gap-2">
                        <Factory className="h-4 w-4 text-orange-500" />
                        Regular exposure to extreme heat
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );

  const renderFitnessSection = () => (
    <Card className="border-green-100">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-green-500" />
          <CardTitle className="text-lg">Fitness & Exercise</CardTitle>
        </div>
        <CardDescription>
          Information about your physical fitness and exercise habits
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
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
                <FormLabel className="text-sm font-normal flex items-center gap-2">
                  <Activity className="h-4 w-4 text-green-500" />
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
                <FormLabel className="text-sm font-normal flex items-center gap-2">
                  <Activity className="h-4 w-4 text-green-500" />
                  Regular exercise routine
                </FormLabel>
              </div>
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Enhanced Medical History</h2>
        <p className="text-gray-600">
          Complete medical history assessment with enhanced interface
        </p>
      </div>

      {renderCurrentConditionsSection()}
      {renderOccupationalSection()}
      {renderFitnessSection()}

      {/* Summary Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          All information provided will be kept strictly confidential and used only for medical assessment purposes. 
          Please ensure all information is accurate and complete.
        </AlertDescription>
      </Alert>
    </div>
  );
};