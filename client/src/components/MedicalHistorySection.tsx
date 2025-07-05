import React, { useState, useEffect } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  Users
} from 'lucide-react';
import { MedicalConditionCheckbox } from './MedicalConditionCheckbox';
import { ExaminationType } from '@/utils/examination-types';

interface MedicalHistorySectionProps {
  form: UseFormReturn<any>;
  examinationType: ExaminationType;
  onDataChange?: (data: any) => void;
}

export const MedicalHistorySection: React.FC<MedicalHistorySectionProps> = ({
  form,
  examinationType,
  onDataChange
}) => {
  const [expandedSections, setExpandedSections] = useState({
    current: true,
    respiratory: true,
    occupational: true,
    medications: false,
    family: false
  });

  // Watch form values for changes
  const watchedValues = form.watch('medical_history');

  useEffect(() => {
    onDataChange?.(watchedValues);
  }, [watchedValues, onDataChange]);

  const medicalConditions = [
    { 
      key: 'heart_disease_high_bp', 
      label: 'Heart disease or high blood pressure', 
      category: 'cardiovascular',
      critical: true,
      description: 'Including hypertension, coronary artery disease, heart failure, or arrhythmias',
      requiresDetails: true
    },
    { 
      key: 'epilepsy_convulsions', 
      label: 'Epilepsy, seizures, or convulsions', 
      category: 'neurological',
      critical: true,
      description: 'Any history of seizure disorders or unexplained loss of consciousness',
      requiresDetails: true
    },
    { 
      key: 'glaucoma_blindness', 
      label: 'Glaucoma, vision problems, or blindness', 
      category: 'vision',
      description: 'Including cataracts, macular degeneration, or significant vision impairment',
      requiresDetails: true
    },
    { 
      key: 'diabetes_endocrine', 
      label: 'Diabetes or other endocrine disorders', 
      category: 'metabolic',
      critical: true,
      description: 'Type 1 or Type 2 diabetes, thyroid disorders, or other hormonal conditions',
      requiresDetails: true
    },
    { 
      key: 'kidney_disease', 
      label: 'Kidney disease or dysfunction', 
      category: 'urological',
      description: 'Including chronic kidney disease, kidney stones, or dialysis',
      requiresDetails: true
    },
    { 
      key: 'liver_disease', 
      label: 'Liver disease or dysfunction', 
      category: 'gastrointestinal',
      description: 'Including hepatitis, cirrhosis, or elevated liver enzymes',
      requiresDetails: true
    },
    { 
      key: 'mental_health_conditions', 
      label: 'Mental health conditions', 
      category: 'neurological',
      description: 'Including depression, anxiety, bipolar disorder, or other psychiatric conditions',
      requiresDetails: true
    },
    { 
      key: 'blood_disorders', 
      label: 'Blood disorders or clotting problems', 
      category: 'cardiovascular',
      description: 'Including anemia, bleeding disorders, or blood clotting issues',
      requiresDetails: true
    },
    { 
      key: 'cancer_tumors', 
      label: 'Cancer or malignant tumors', 
      category: 'oncological',
      critical: true,
      description: 'Any history of cancer, including current treatment or remission',
      requiresDetails: true
    },
    { 
      key: 'autoimmune_conditions', 
      label: 'Autoimmune or inflammatory conditions', 
      category: 'general',
      description: 'Including rheumatoid arthritis, lupus, or inflammatory bowel disease',
      requiresDetails: true
    }
  ];

  const respiratoryConditions = [
    { 
      key: 'tuberculosis_pneumonia', 
      label: 'Tuberculosis or pneumonia',
      critical: true,
      description: 'Including active or latent TB, recurring pneumonia',
      requiresDetails: true
    },
    { 
      key: 'chest_discomfort_palpitations', 
      label: 'Chest discomfort or heart palpitations',
      description: 'Including chest pain, irregular heartbeat, or shortness of breath',
      requiresDetails: true
    },
    { 
      key: 'asthma_allergies', 
      label: 'Asthma or severe allergies',
      description: 'Including occupational asthma or severe allergic reactions',
      requiresDetails: true
    },
    { 
      key: 'chronic_cough', 
      label: 'Chronic cough or sputum production',
      description: 'Persistent cough lasting more than 8 weeks',
      requiresDetails: true
    },
    { 
      key: 'breathing_difficulties', 
      label: 'Breathing difficulties or wheezing',
      description: 'Including shortness of breath during normal activities',
      requiresDetails: true
    },
    { 
      key: 'lung_disease', 
      label: 'Chronic lung disease',
      critical: true,
      description: 'Including COPD, pulmonary fibrosis, or other lung conditions',
      requiresDetails: true
    }
  ];

  const occupationalHealthItems = [
    { 
      key: 'noise_exposure', 
      label: 'Regular exposure to loud noise',
      description: 'Work environments with noise levels above 85 dB'
    },
    { 
      key: 'heat_exposure', 
      label: 'Regular exposure to extreme heat',
      description: 'Work in hot environments or with heat-generating equipment'
    },
    { 
      key: 'chemical_exposure', 
      label: 'Exposure to chemicals or toxins',
      description: 'Including solvents, pesticides, or industrial chemicals'
    },
    { 
      key: 'dust_exposure', 
      label: 'Exposure to dust or particulates',
      description: 'Including silica, asbestos, or other airborne particles'
    },
    { 
      key: 'radiation_exposure', 
      label: 'Exposure to radiation',
      description: 'Including X-rays, nuclear materials, or UV radiation'
    },
    { 
      key: 'vibration_exposure', 
      label: 'Exposure to whole-body or hand-arm vibration',
      description: 'From machinery, vehicles, or power tools'
    },
    { 
      key: 'previous_occupational_injuries', 
      label: 'Previous work-related injuries',
      requiresDetails: true,
      description: 'Any injuries sustained in the workplace'
    }
  ];

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const renderCurrentConditionsSection = () => (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-red-500" />
            <CardTitle>Current Medical Conditions</CardTitle>
            <Badge variant="secondary">Required</Badge>
          </div>
          <Collapsible>
            <CollapsibleTrigger onClick={() => toggleSection('current')}>
              {expandedSections.current ? 
                <ChevronUp className="h-4 w-4" /> : 
                <ChevronDown className="h-4 w-4" />
              }
            </CollapsibleTrigger>
          </Collapsible>
        </div>
        <CardDescription>
          Please indicate if you currently have or have ever had any of the following conditions.
          Select all that apply and provide details where requested.
        </CardDescription>
      </CardHeader>
      
      <Collapsible open={expandedSections.current}>
        <CollapsibleContent>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {medicalConditions.map((condition) => (
                <MedicalConditionCheckbox
                  key={condition.key}
                  form={form}
                  name={`medical_history.current_conditions.${condition.key}`}
                  label={condition.label}
                  category={condition.category}
                  critical={condition.critical}
                  description={condition.description}
                  requiresDetails={condition.requiresDetails}
                />
              ))}
            </div>

            <Separator className="my-6" />

            <FormField
              control={form.control}
              name="medical_history.current_conditions.other_conditions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Other medical conditions not listed above</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Please describe any other medical conditions, surgeries, or ongoing health issues..."
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );

  const renderRespiratorySection = () => (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5 text-blue-500" />
            <CardTitle>Respiratory & Cardiovascular Health</CardTitle>
            <Badge variant="secondary">Required</Badge>
          </div>
          <Collapsible>
            <CollapsibleTrigger onClick={() => toggleSection('respiratory')}>
              {expandedSections.respiratory ? 
                <ChevronUp className="h-4 w-4" /> : 
                <ChevronDown className="h-4 w-4" />
              }
            </CollapsibleTrigger>
          </Collapsible>
        </div>
        <CardDescription>
          Information about your respiratory and cardiovascular health history
        </CardDescription>
      </CardHeader>
      
      <Collapsible open={expandedSections.respiratory}>
        <CollapsibleContent>
          <CardContent>
            <div className="space-y-4">
              {respiratoryConditions.map((condition) => (
                <MedicalConditionCheckbox
                  key={condition.key}
                  form={form}
                  name={`medical_history.respiratory_conditions.${condition.key}`}
                  label={condition.label}
                  category="respiratory"
                  critical={condition.critical}
                  description={condition.description}
                  requiresDetails={condition.requiresDetails}
                />
              ))}
            </div>

            <Separator className="my-6" />

            <FormField
              control={form.control}
              name="medical_history.respiratory_conditions.other_respiratory"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Other respiratory or cardiovascular conditions</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Please describe any other breathing, heart, or circulation problems..."
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );

  const renderOccupationalHealthSection = () => (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Factory className="h-5 w-5 text-orange-500" />
            <CardTitle>Occupational Health & Safety</CardTitle>
            <Badge variant="secondary">Required</Badge>
          </div>
          <Collapsible>
            <CollapsibleTrigger onClick={() => toggleSection('occupational')}>
              {expandedSections.occupational ? 
                <ChevronUp className="h-4 w-4" /> : 
                <ChevronDown className="h-4 w-4" />
              }
            </CollapsibleTrigger>
          </Collapsible>
        </div>
        <CardDescription>
          Information about workplace exposures and occupational health factors
        </CardDescription>
      </CardHeader>
      
      <Collapsible open={expandedSections.occupational}>
        <CollapsibleContent>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              {occupationalHealthItems.map((item) => (
                <MedicalConditionCheckbox
                  key={item.key}
                  form={form}
                  name={`medical_history.occupational_health.${item.key}`}
                  label={item.label}
                  category="general"
                  description={item.description}
                  requiresDetails={item.requiresDetails}
                />
              ))}
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="medical_history.occupational_health.fitness_status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current fitness status for work *</FormLabel>
                    <FormControl>
                      <select
                        {...field}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select fitness status</option>
                        <option value="fit">Fit for all duties</option>
                        <option value="fit_with_restrictions">Fit with restrictions</option>
                        <option value="unfit">Unfit for work</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="medical_history.occupational_health.exercise_frequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Exercise frequency</FormLabel>
                    <FormControl>
                      <select
                        {...field}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select frequency</option>
                        <option value="daily">Daily</option>
                        <option value="few_times_week">Few times per week</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="rarely">Rarely</option>
                        <option value="never">Never</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4">
              <MedicalConditionCheckbox
                form={form}
                name="medical_history.occupational_health.competitive_sport"
                label="Do you participate in competitive sports?"
                category="general"
                requiresDetails={true}
              />

              <MedicalConditionCheckbox
                form={form}
                name="medical_history.occupational_health.regular_exercise"
                label="Do you exercise regularly?"
                category="general"
              />
            </div>

            {form.watch('medical_history.occupational_health.injury_details') && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Previous occupational injuries may require additional assessment during the medical examination.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );

  const renderMedicationSection = () => (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Pill className="h-5 w-5 text-green-500" />
            <CardTitle>Current Medications & Allergies</CardTitle>
          </div>
          <Collapsible>
            <CollapsibleTrigger onClick={() => toggleSection('medications')}>
              {expandedSections.medications ? 
                <ChevronUp className="h-4 w-4" /> : 
                <ChevronDown className="h-4 w-4" />
              }
            </CollapsibleTrigger>
          </Collapsible>
        </div>
        <CardDescription>
          Information about medications, supplements, and allergies
        </CardDescription>
      </CardHeader>
      
      <Collapsible open={expandedSections.medications}>
        <CollapsibleContent>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="medical_history.medication_history.current_medications"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current medications and supplements</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="List all current medications including dosage, frequency, and reason for taking. Include over-the-counter medications and supplements..."
                      rows={4}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="medical_history.medication_history.allergies"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Known allergies and reactions</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="List any known allergies to medications, foods, or environmental factors. Include the type of reaction experienced..."
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="medical_history.medication_history.previous_reactions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Previous adverse drug reactions</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Describe any previous adverse reactions to medications or medical treatments..."
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );

  const renderFamilyHistorySection = () => (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-purple-500" />
            <CardTitle>Family Medical History</CardTitle>
          </div>
          <Collapsible>
            <CollapsibleTrigger onClick={() => toggleSection('family')}>
              {expandedSections.family ? 
                <ChevronUp className="h-4 w-4" /> : 
                <ChevronDown className="h-4 w-4" />
              }
            </CollapsibleTrigger>
          </Collapsible>
        </div>
        <CardDescription>
          Information about hereditary conditions and family health history
        </CardDescription>
      </CardHeader>
      
      <Collapsible open={expandedSections.family}>
        <CollapsibleContent>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <MedicalConditionCheckbox
                form={form}
                name="medical_history.family_history.cardiovascular_disease"
                label="Heart disease or stroke in family"
                category="cardiovascular"
                description="Parents, siblings, or children with heart disease before age 65"
              />

              <MedicalConditionCheckbox
                form={form}
                name="medical_history.family_history.diabetes"
                label="Diabetes in family"
                category="metabolic"
                description="Type 1 or Type 2 diabetes in immediate family"
              />

              <MedicalConditionCheckbox
                form={form}
                name="medical_history.family_history.cancer"
                label="Cancer in family"
                category="oncological"
                description="Any cancer in immediate family members"
              />

              <MedicalConditionCheckbox
                form={form}
                name="medical_history.family_history.mental_health"
                label="Mental health conditions in family"
                category="neurological"
                description="Depression, anxiety, or other psychiatric conditions"
              />
            </div>

            <FormField
              control={form.control}
              name="medical_history.family_history.hereditary_conditions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Other hereditary conditions</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="List any other hereditary conditions or genetic disorders in your family..."
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="medical_history.family_history.other_significant"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Other significant family health history</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Any other significant health conditions or early deaths in your family..."
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Medical History</h2>
        <p className="text-gray-600">
          Complete medical history assessment for {examinationType.replace(/_/g, ' ')} examination
        </p>
      </div>

      {renderCurrentConditionsSection()}
      {renderRespiratorySection()}
      {renderOccupationalHealthSection()}
      {renderMedicationSection()}
      {renderFamilyHistorySection()}

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