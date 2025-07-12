import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/useToast';
import { createPatient } from '@/api/patients';
import { validateAndExtractSAID } from '@/utils/sa-id-validation';
import { usePatientWorkflow } from '@/hooks/usePatientWorkflow';
import {
  UserPlus,
  Building,
  Phone,
  Mail,
  IdCard,
  Users
} from 'lucide-react';

const patientSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  idNumber: z.string().regex(/^\d{13}$/, 'ID number must be 13 digits'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  employer: z.string().min(2, 'Employer name is required'),
  examinationType: z.enum(['pre-employment', 'periodic', 'exit'])
});

type PatientFormData = z.infer<typeof patientSchema>;

export function PatientRegistration() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { initializeWorkflow } = usePatientWorkflow();

  const form = useForm<PatientFormData>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      name: '',
      idNumber: '',
      email: '',
      phone: '',
      employer: '',
      examinationType: 'pre-employment'
    }
  });

  const onSubmit = async (data: PatientFormData) => {
    setIsSubmitting(true);
    try {
      // Validate SA ID
      const idValidation = validateSAIDSafely(data.idNumber);
      if (!idValidation.isValid) {
        toast({
          title: "Invalid SA ID",
          description: "Please enter a valid 13-digit SA ID number",
          variant: "destructive",
        });
        return;
      }

      // Create patient with extended data
      const patientData = {
        name: data.name,
        idNumber: data.idNumber,
        email: data.email,
        phone: data.phone,
        employer: data.employer,
        examinationType: data.examinationType,
        age: idValidation.age,
        dateOfBirth: idValidation.dateOfBirth,
        gender: idValidation.gender,
      };

      const response = await createPatient(patientData);
      
      // Initialize workflow for the new patient
      const patientId = response?.patient?._id || `new_${Date.now()}`;
      initializeWorkflow({
        patientId,
        patientName: data.name,
        examinationType: data.examinationType
      });

      toast({
        title: "Patient registered successfully",
        description: `${data.name} has been registered for ${data.examinationType.replace('-', ' ')} examination`,
      });

      // Navigate to questionnaire with workflow context
      const questionnaireRoute = `/patients/${patientId}/questionnaire`;
      navigate(questionnaireRoute);
      
    } catch (error) {
      console.error('Registration error:', error);
      toast({
        title: "Registration failed",
        description: "There was an error registering the patient. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Safe SA ID validation with proper error handling
  const validateSAIDSafely = (idNumber: string) => {
    try {
      if (!idNumber || idNumber.length !== 13) {
        return { isValid: false, age: 0 };
      }

      const validation = validateAndExtractSAID(idNumber);
      
      if (validation.isValid && validation.data) {
        return { 
          isValid: true, 
          age: validation.data.age,
          dateOfBirth: validation.data.dateOfBirth,
          gender: validation.data.gender
        };
      } else {
        console.warn('SA ID validation errors:', validation.errors);
        return { isValid: false, age: 0 };
      }
    } catch (error) {
      console.error('SA ID validation error:', error);
      return { isValid: false, age: 0 };
    }
  };

  // Safe form watching with error handling
  const getCurrentIdValidation = () => {
    try {
      const currentId = form.watch('idNumber') || '';
      return validateSAIDSafely(currentId);
    } catch (error) {
      console.error('Error watching form:', error);
      return { isValid: false, age: 0 };
    }
  };

  const idValidation = getCurrentIdValidation();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
          <UserPlus className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Patient Registration</h1>
          <p className="text-muted-foreground">
            Register a new patient for occupational health examination
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Registration Form */}
        <div className="md:col-span-2">
          <Card className="bg-gradient-to-br from-white to-blue-50/30 border-blue-200">
            <CardHeader>
              <CardTitle>Patient Information</CardTitle>
              <CardDescription>
                Enter the patient's personal and contact details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    {/* Full Name */}
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <UserPlus className="h-4 w-4" />
                            Full Name
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="Enter patient's full name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* SA ID Number */}
                    <FormField
                      control={form.control}
                      name="idNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <IdCard className="h-4 w-4" />
                            SA ID Number
                            {idValidation.isValid && (
                              <span className="text-green-600 text-sm font-medium">
                                ✓ Valid (Age: {idValidation.age})
                              </span>
                            )}
                          </FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Enter 13-digit ID number" 
                              maxLength={13}
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Email */}
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            Email Address
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="patient@example.com" type="email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Phone */}
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            Phone Number
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="0123456789" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Employer */}
                    <FormField
                      control={form.control}
                      name="employer"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Building className="h-4 w-4" />
                            Employer/Company
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="Company name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Examination Type */}
                    <FormField
                      control={form.control}
                      name="examinationType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Examination Type
                          </FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select examination type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="pre-employment">Pre-Employment</SelectItem>
                              <SelectItem value="periodic">Periodic Health Check</SelectItem>
                              <SelectItem value="exit">Exit Examination</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Submit Button */}
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isSubmitting}
                    size="lg"
                  >
                    {isSubmitting ? 'Registering...' : 'Register Patient & Start Questionnaire'}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        {/* Side Panel - Registration Info */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Registration Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm">
                <span className="font-medium">SA ID Validation:</span>
                <p className="text-muted-foreground">
                  Age and gender will be automatically calculated from the SA ID number.
                </p>
              </div>
              <div className="text-sm">
                <span className="font-medium">Next Step:</span>
                <p className="text-muted-foreground">
                  After registration, patient will be directed to complete the medical questionnaire.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}