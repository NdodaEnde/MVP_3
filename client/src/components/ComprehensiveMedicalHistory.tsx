import React, { useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { 
  Heart,
  Activity,
  Brain,
  Eye,
  Pill,
  Users,
  AlertTriangle,
  Info,
  ChevronDown,
  Stethoscope,
  Zap
} from 'lucide-react';

interface ComprehensiveMedicalHistoryProps {
  form: UseFormReturn<any>;
  examinationType?: 'pre_employment' | 'periodic' | 'baseline' | 'transfer' | 'exit' | 'working_at_heights' | 'return_to_work';
}

// Medical conditions from the questionnaire form
const medicalConditions = [
  { key: 'heart_disease_high_bp', label: 'Heart disease or high blood pressure', category: 'cardiovascular' },
  { key: 'epilepsy_convulsions', label: 'Epilepsy or convulsions', category: 'neurological' },
  { key: 'glaucoma_blindness', label: 'Glaucoma or blindness', category: 'vision' },
  { key: 'diabetes_family', label: 'Family Mellitus (Sugar sickness)', category: 'endocrine' },
  { key: 'family_deaths_before_60', label: 'Family deaths before 60 years of age', category: 'family' },
  { key: 'bleeding_rectum', label: 'Bleeding from the rectum', category: 'gastrointestinal' },
  { key: 'kidney_stones_blood_urine', label: 'Kidney stones or blood in the urine (including Bilharzia)', category: 'urological' },
  { key: 'sugar_protein_urine', label: 'Sugar or protein in the urine', category: 'urological' },
  { key: 'prostate_gynecological', label: 'Prostate/Gynaecological problems', category: 'reproductive' },
  { key: 'blood_thyroid_disorder', label: 'Any blood or thyroid disorder', category: 'endocrine' },
  { key: 'malignant_tumours_cancer', label: 'Malignant tumours cancer or radiotherapy', category: 'oncological' },
  { key: 'tuberculosis_pneumonia', label: 'Tuberculosis, pneumonia', category: 'respiratory' },
];

const additionalConditions = [
  { key: 'refused_insurance', label: 'Refused life insurance', category: 'general' },
  { key: 'weight_loss', label: 'Weight loss (without dieting)', category: 'general' },
  { key: 'refused_driving_licence', label: 'Refused a driving licence', category: 'general' },
  { key: 'sexually_transmitted_disease', label: 'Sexually transmitted disease', category: 'reproductive' },
  { key: 'admitted_hospital', label: 'Admitted to hospital (for any reason)', category: 'general' },
  { key: 'other_illness_injuries', label: 'Other illness or injuries', category: 'general' },
  { key: 'smoker', label: 'A smoker', category: 'lifestyle' },
  { key: 'allergies', label: 'Allergies: Penicillin etc.', category: 'allergies' },
  { key: 'frequent_headaches', label: 'Frequent or severe headaches', category: 'neurological' },
  { key: 'back_problems', label: 'Back problems, joint or bone disease', category: 'musculoskeletal' },
  { key: 'dizziness', label: 'Dizziness or unsteadiness', category: 'neurological' },
  { key: 'varicose_veins', label: 'Varicose veins, piles', category: 'vascular' },
  { key: 'unconsciousness', label: 'Unconsciousness (for any reason)', category: 'neurological' },
  { key: 'skin_disease', label: 'Skin disease', category: 'dermatological' },
  { key: 'head_injury', label: 'Head injury or concussion', category: 'neurological' },
  { key: 'physical_abnormalities', label: 'Had any physical abnormalities', category: 'general' },
  { key: 'epilepsy_fits', label: 'Epilepsy or fits of any kind', category: 'neurological' },
  { key: 'surgical_operations', label: 'Had any surgical operations done', category: 'surgical' },
  { key: 'neurological_disorder', label: 'Any other neurological disorder', category: 'neurological' },
  { key: 'alcohol_abuse', label: 'Abused alcohol', category: 'substance' },
  { key: 'mental_psychological', label: 'Any mental/Psychological disorder', category: 'mental' },
  { key: 'drug_abuse', label: 'Abused drugs or substances', category: 'substance' },
  { key: 'eye_vision_trouble', label: 'Eye or vision trouble (except for glasses)', category: 'vision' },
  { key: 'medication_use', label: 'Used any medication', category: 'medication' },
  { key: 'hearing_speech', label: 'Hearing or speech disorders', category: 'hearing' },
  { key: 'hay_fever', label: 'Hay fever or allergy', category: 'allergies' },
  { key: 'asthma_lung', label: 'Asthma or lung disease', category: 'respiratory' },
  { key: 'collapsed_lung', label: 'Collapsed lung (pneumonia)', category: 'respiratory' }
];

const occupationalHistory = [
  { key: 'asbestos_exposure', label: 'Asbestos exposure', category: 'occupational' },
  { key: 'mine_underground', label: 'Mine or underground work', category: 'occupational' },
  { key: 'chemical_exposure', label: 'Chemical exposure', category: 'occupational' }
];

interface MedicalConditionCheckboxProps {
  form: UseFormReturn<any>;
  name: string;
  label: string;
  category: string;
  description?: string;
}

const MedicalConditionCheckbox: React.FC<MedicalConditionCheckboxProps> = ({ 
  form, 
  name, 
  label, 
  category, 
  description 
}) => {
  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      cardiovascular: 'text-red-600',
      neurological: 'text-purple-600',
      respiratory: 'text-blue-600',
      endocrine: 'text-green-600',
      general: 'text-gray-600',
      reproductive: 'text-pink-600',
      occupational: 'text-orange-600',
      substance: 'text-red-700',
      mental: 'text-indigo-600'
    };
    return colors[category] || 'text-gray-600';
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, React.ReactNode> = {
      cardiovascular: <Heart className="h-4 w-4" />,
      neurological: <Brain className="h-4 w-4" />,
      respiratory: <Stethoscope className="h-4 w-4" />,
      vision: <Eye className="h-4 w-4" />,
      general: <Activity className="h-4 w-4" />,
      occupational: <Zap className="h-4 w-4" />
    };
    return icons[category] || <Stethoscope className="h-4 w-4" />;
  };

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-3 border rounded-lg hover:bg-gray-50">
          <FormControl>
            <RadioGroup
              value={field.value === true ? 'yes' : field.value === false ? 'no' : undefined}
              onValueChange={(value) => field.onChange(value === 'yes')}
              className="flex gap-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yes" />
                <label className="text-sm text-green-600 font-medium">Yes</label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" />
                <label className="text-sm text-red-600 font-medium">No</label>
              </div>
            </RadioGroup>
          </FormControl>
          <div className="flex-1">
            <FormLabel className="flex items-center gap-2 text-sm font-medium">
              <span className={getCategoryColor(category)}>
                {getCategoryIcon(category)}
              </span>
              {label}
            </FormLabel>
            {description && (
              <FormDescription className="text-xs text-gray-500 mt-1">
                {description}
              </FormDescription>
            )}
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export const ComprehensiveMedicalHistory: React.FC<ComprehensiveMedicalHistoryProps> = ({ 
  form, 
  examinationType = 'pre_employment' 
}) => {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    primary: true,
    additional: false,
    occupational: false,
    treatment: false
  });

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const renderPrimaryConditions = () => (
    <Collapsible open={openSections.primary} onOpenChange={() => toggleSection('primary')}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-gray-50">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-red-500" />
                Primary Medical History
              </div>
              <ChevronDown className={`h-4 w-4 transition-transform ${openSections.primary ? 'rotate-180' : ''}`} />
            </CardTitle>
            <CardDescription>
              Have you ever had or do you now have any of the following conditions?
            </CardDescription>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
              {medicalConditions.map((condition) => (
                <MedicalConditionCheckbox
                  key={condition.key}
                  form={form}
                  name={`medical_history.${condition.key}`}
                  label={condition.label}
                  category={condition.category}
                />
              ))}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );

  const renderAdditionalConditions = () => (
    <Collapsible open={openSections.additional} onOpenChange={() => toggleSection('additional')}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-gray-50">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Stethoscope className="h-5 w-5 text-blue-500" />
                Additional Medical History
              </div>
              <ChevronDown className={`h-4 w-4 transition-transform ${openSections.additional ? 'rotate-180' : ''}`} />
            </CardTitle>
            <CardDescription>
              Additional health conditions and lifestyle factors
            </CardDescription>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
              {additionalConditions.map((condition) => (
                <MedicalConditionCheckbox
                  key={condition.key}
                  form={form}
                  name={`medical_history.${condition.key}`}
                  label={condition.label}
                  category={condition.category}
                />
              ))}
            </div>

            {/* Comments on Abnormalities */}
            <FormField
              control={form.control}
              name="medical_history.abnormalities_comments"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Comments on Abnormalities</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Please provide details about any conditions marked as 'Yes'..."
                      rows={4}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );

  const renderOccupationalHistory = () => (
    <Collapsible open={openSections.occupational} onOpenChange={() => toggleSection('occupational')}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-gray-50">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-orange-500" />
                Occupational History
              </div>
              <ChevronDown className={`h-4 w-4 transition-transform ${openSections.occupational ? 'rotate-180' : ''}`} />
            </CardTitle>
            <CardDescription>
              Work-related exposures and occupational health history
            </CardDescription>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
              {occupationalHistory.map((condition) => (
                <MedicalConditionCheckbox
                  key={condition.key}
                  form={form}
                  name={`medical_history.${condition.key}`}
                  label={condition.label}
                  category={condition.category}
                />
              ))}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );

  const renderTreatmentHistory = () => (
    <Collapsible open={openSections.treatment} onOpenChange={() => toggleSection('treatment')}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-gray-50">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Pill className="h-5 w-5 text-green-500" />
                Medical Treatment History
              </div>
              <ChevronDown className={`h-4 w-4 transition-transform ${openSections.treatment ? 'rotate-180' : ''}`} />
            </CardTitle>
            <CardDescription>
              Recent medical treatments and healthcare providers
            </CardDescription>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="space-y-6">
            {/* Medical Treatment within Last 2 Years */}
            <div>
              <h4 className="font-medium mb-4">Medical Treatment within the Last Two (2) Years</h4>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-300 p-2 text-left">Date</th>
                      <th className="border border-gray-300 p-2 text-left">Name of Medical Practitioner and Medical Specialist</th>
                      <th className="border border-gray-300 p-2 text-left">Diagnosis/Reason for Treatment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[1, 2, 3].map((row) => (
                      <tr key={row}>
                        <td className="border border-gray-300 p-2">
                          <FormField
                            control={form.control}
                            name={`medical_history.treatment_history.${row}.date`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input {...field} placeholder="Date" />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </td>
                        <td className="border border-gray-300 p-2">
                          <FormField
                            control={form.control}
                            name={`medical_history.treatment_history.${row}.practitioner`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input {...field} placeholder="Practitioner name" />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </td>
                        <td className="border border-gray-300 p-2">
                          <FormField
                            control={form.control}
                            name={`medical_history.treatment_history.${row}.diagnosis`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input {...field} placeholder="Diagnosis/reason" />
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
            </div>

            {/* General Practitioners of Previous 10 Years */}
            <div>
              <h4 className="font-medium mb-4">General Practitioners of Previous Ten Years</h4>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-300 p-2 text-left">Name of Medical Practitioner</th>
                      <th className="border border-gray-300 p-2 text-left">Contact Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[1, 2].map((row) => (
                      <tr key={row}>
                        <td className="border border-gray-300 p-2">
                          <FormField
                            control={form.control}
                            name={`medical_history.gp_history.${row}.name`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input {...field} placeholder="Practitioner name" />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </td>
                        <td className="border border-gray-300 p-2">
                          <FormField
                            control={form.control}
                            name={`medical_history.gp_history.${row}.contact`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input {...field} placeholder="Contact details" />
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
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Medical History</h2>
        <p className="text-gray-600">
          Complete medical history assessment for {examinationType?.replace(/_/g, ' ')} examination
        </p>
      </div>

      {renderPrimaryConditions()}
      {renderAdditionalConditions()}
      {renderOccupationalHistory()}
      {renderTreatmentHistory()}

      {/* Summary Alert */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900 mb-1">Important Information</h4>
            <p className="text-blue-800 text-sm">
              All information provided will be kept strictly confidential and used only for medical assessment purposes. 
              Please ensure all information is accurate and complete. Any false information may affect your fitness determination.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};