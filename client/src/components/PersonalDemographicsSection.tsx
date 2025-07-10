import React, { useState, useEffect } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  User,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Building,
  CheckCircle2,
  AlertCircle,
  Info
} from 'lucide-react';
import {
  validateAndExtractSAID,
  formatSAIDForDisplay,
  cleanSAIDInput,
  validateEmail,
  validateSAPhoneNumber,
  formatSAPhoneNumber,
  SA_PROVINCES,
  type SAProvince
} from '@/utils/sa-id-validation';
import { diagnoseSAID, formatSAIDDiagnostic, explainSAID } from '@/utils/sa-id-diagnostic';
import { ExaminationType } from '@/utils/examination-types';

interface PersonalDemographicsSectionProps {
  form: UseFormReturn<any>;
  examinationType: ExaminationType;
  onSAIDChange?: (idNumber: string) => void;
  onDataChange?: (data: any) => void;
}

export const PersonalDemographicsSection: React.FC<PersonalDemographicsSectionProps> = ({
  form,
  examinationType,
  onSAIDChange,
  onDataChange
}) => {
  const [saIdValidation, setSaIdValidation] = useState<{
    isValid: boolean;
    errors: string[];
    data?: any;
  }>({ isValid: false, errors: [] });
  
  const [isAutoPopulating, setIsAutoPopulating] = useState(false);

  // Watch form values for changes
  const watchedValues = form.watch('patient_demographics');

  useEffect(() => {
    onDataChange?.(watchedValues);
  }, [watchedValues, onDataChange]);

  // Handle SA ID number change with enhanced diagnostics
  const handleSAIDChange = (value: string) => {
    const cleanId = cleanSAIDInput(value);
    form.setValue('patient_demographics.personal_info.id_number', cleanId);
    
    if (cleanId.length === 13) {
      // Use diagnostic tool for better error reporting
      const diagnostic = diagnoseSAID(cleanId);
      
      if (diagnostic.isValid) {
        const validation = validateAndExtractSAID(cleanId);
        setSaIdValidation(validation);
        
        if (validation.isValid && validation.data) {
          setIsAutoPopulating(true);
          
          // Auto-populate extracted data
          form.setValue('patient_demographics.personal_info.date_of_birth', validation.data.dateOfBirth);
          form.setValue('patient_demographics.personal_info.age', validation.data.age);
          form.setValue('patient_demographics.personal_info.gender', validation.data.gender);
          
          // Trigger callback
          onSAIDChange?.(cleanId);
          
          setTimeout(() => setIsAutoPopulating(false), 1000);
        }
      } else {
        // Enhanced error reporting with suggestions
        const enhancedErrors = [
          ...diagnostic.errors,
          ...(diagnostic.suggestions.length > 0 ? ['Suggestions:', ...diagnostic.suggestions] : [])
        ];
        
        setSaIdValidation({ 
          isValid: false, 
          errors: enhancedErrors,
          data: diagnostic.extractedData 
        });
      }
    } else {
      setSaIdValidation({ isValid: false, errors: [] });
    }
  };

  // Handle phone number formatting
  const handlePhoneChange = (value: string, fieldName: string) => {
    const cleanPhone = value.replace(/[^\d]/g, '');
    form.setValue(fieldName, cleanPhone);
  };

  const renderPersonalInfoSection = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Personal Information
        </CardTitle>
        <CardDescription>
          Enter the patient's personal details. SA ID number will automatically populate age, gender, and date of birth.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Names */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="patient_demographics.personal_info.initials"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Initials *</FormLabel>
                <FormControl>
                  <Input placeholder="J.D." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="patient_demographics.personal_info.first_names"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First Names *</FormLabel>
                <FormControl>
                  <Input placeholder="John David" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="patient_demographics.personal_info.surname"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Surname *</FormLabel>
                <FormControl>
                  <Input placeholder="Smith" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* SA ID Number */}
        <FormField
          control={form.control}
          name="patient_demographics.personal_info.id_number"
          render={({ field }) => (
            <FormItem>
              <FormLabel>South African ID Number *</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    placeholder="9001010001234"
                    value={field.value}
                    onChange={(e) => handleSAIDChange(e.target.value)}
                    maxLength={13}
                    className={
                      field.value?.length === 13
                        ? saIdValidation.isValid
                          ? 'border-green-500 focus:border-green-500'
                          : 'border-red-500 focus:border-red-500'
                        : ''
                    }
                  />
                  {field.value?.length === 13 && saIdValidation.isValid && (
                    <CheckCircle2 className="absolute right-2 top-2.5 h-4 w-4 text-green-500" />
                  )}
                  {field.value?.length === 13 && !saIdValidation.isValid && (
                    <AlertCircle className="absolute right-2 top-2.5 h-4 w-4 text-red-500" />
                  )}
                </div>
              </FormControl>
              <FormDescription>
                Enter 13-digit SA ID number. Age, gender, and date of birth will be automatically calculated.
              </FormDescription>
              {saIdValidation.errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {saIdValidation.errors.join(', ')}
                  </AlertDescription>
                </Alert>
              )}
              {isAutoPopulating && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Auto-populating fields from SA ID number...
                  </AlertDescription>
                </Alert>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Auto-populated fields */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="patient_demographics.personal_info.date_of_birth"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Date of Birth
                  {saIdValidation.isValid && (
                    <Badge variant="secondary" size="sm">Auto-filled</Badge>
                  )}
                </FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    {...field}
                    readOnly={saIdValidation.isValid}
                    className={saIdValidation.isValid ? 'bg-green-50' : ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="patient_demographics.personal_info.age"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  Age
                  {saIdValidation.isValid && (
                    <Badge variant="secondary" size="sm">Auto-calculated</Badge>
                  )}
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    readOnly={saIdValidation.isValid}
                    className={saIdValidation.isValid ? 'bg-green-50' : ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="patient_demographics.personal_info.gender"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  Gender
                  {saIdValidation.isValid && (
                    <Badge variant="secondary" size="sm">Auto-detected</Badge>
                  )}
                </FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={saIdValidation.isValid}
                >
                  <FormControl>
                    <SelectTrigger className={saIdValidation.isValid ? 'bg-green-50' : ''}>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Marital Status */}
        <FormField
          control={form.control}
          name="patient_demographics.personal_info.marital_status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Marital Status</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select marital status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="single">Single</SelectItem>
                  <SelectItem value="married">Married</SelectItem>
                  <SelectItem value="divorced">Divorced</SelectItem>
                  <SelectItem value="widow_widower">Widow/Widower</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );

  const renderContactInfoSection = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Phone className="h-5 w-5" />
          Contact Information
        </CardTitle>
        <CardDescription>
          Provide contact details for communication and emergency purposes.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="patient_demographics.contact_info.phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number *</FormLabel>
                <FormControl>
                  <Input
                    placeholder="0123456789"
                    {...field}
                    onChange={(e) => handlePhoneChange(e.target.value, field.name)}
                  />
                </FormControl>
                <FormDescription>
                  South African phone number (10 digits starting with 0)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="patient_demographics.contact_info.email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email Address
                </FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="john.smith@example.com"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="patient_demographics.contact_info.emergency_contact"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Emergency Contact</FormLabel>
              <FormControl>
                <Input
                  placeholder="Name and phone number of emergency contact"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Emergency contact person and their phone number
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );

  const renderAddressSection = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Address Information
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <FormField
          control={form.control}
          name="patient_demographics.contact_info.address.street"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Street Address</FormLabel>
              <FormControl>
                <Input placeholder="123 Main Street, Suburb" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="patient_demographics.contact_info.address.city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>City</FormLabel>
                <FormControl>
                  <Input placeholder="Cape Town" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="patient_demographics.contact_info.address.province"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Province</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select province" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {SA_PROVINCES.map((province) => (
                      <SelectItem key={province} value={province}>
                        {province}
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
            name="patient_demographics.contact_info.address.postal_code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Postal Code</FormLabel>
                <FormControl>
                  <Input placeholder="8000" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </CardContent>
    </Card>
  );

  const renderEmploymentInfoSection = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building className="h-5 w-5" />
          Employment Information
        </CardTitle>
        <CardDescription>
          Employment details for the medical examination.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="patient_demographics.employment_info.company_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Company Name *</FormLabel>
                <FormControl>
                  <Input placeholder="ABC Mining Company" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="patient_demographics.employment_info.employee_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Employee Number *</FormLabel>
                <FormControl>
                  <Input placeholder="EMP001234" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="patient_demographics.employment_info.position"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Position/Job Title *</FormLabel>
                <FormControl>
                  <Input placeholder="Mining Engineer" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="patient_demographics.employment_info.department"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Department *</FormLabel>
                <FormControl>
                  <Input placeholder="Operations" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="patient_demographics.employment_info.employment_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Employment Type</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select employment type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="pre_employment">Pre-Employment</SelectItem>
                    <SelectItem value="baseline">Baseline</SelectItem>
                    <SelectItem value="transfer">Transfer</SelectItem>
                    <SelectItem value="periodical">Periodical</SelectItem>
                    <SelectItem value="exit">Exit</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="patient_demographics.employment_info.work_location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Work Location</FormLabel>
                <FormControl>
                  <Input placeholder="Main Office, Mine Site A" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Personal Demographics</h2>
        <p className="text-gray-600">
          Complete patient demographic information for {examinationType.replace(/_/g, ' ')} examination
        </p>
      </div>

      {renderPersonalInfoSection()}
      {renderContactInfoSection()}
      {renderAddressSection()}
      {renderEmploymentInfoSection()}
      
      {saIdValidation.isValid && saIdValidation.data && (
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>
            SA ID validated successfully. Age: {saIdValidation.data.age}, Gender: {saIdValidation.data.gender}, 
            Citizenship: {saIdValidation.data.citizenship}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};