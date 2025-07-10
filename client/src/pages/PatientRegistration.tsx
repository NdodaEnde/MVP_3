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
      const idValidation = validateSAID(data.idNumber);
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

  const validateSAID = (idNumber: string) => {
    // 🔧 FIX: Use centralized SA ID validation utility
    try {
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

  const idValidation = validateSAID(form.watch('idNumber') || '');

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
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <UserPlus className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input
                                {...field}
                                value={field.value || ''}
                                onChange={(e) => {
                                  field.onChange(e.target.value);
                                  console.log('Name input changed:', e.target.value);
                                }}
                                placeholder="John Smith"
                                className="pl-10"
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="idNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>SA ID Number</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <IdCard className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input
                                {...field}
                                value={field.value || ''}
                                onChange={(e) => {
                                  field.onChange(e.target.value);
                                  console.log('SA ID input changed:', e.target.value);
                                }}
                                placeholder="8501015009087" 
                                className="pl-10"
                              />
                            </div>
                          </FormControl>
                          {idValidation.isValid && (
                            <FormDescription className="text-green-600">
                              Age: {idValidation.age} years
                            </FormDescription>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input 
                                type="email" 
                                placeholder="john@example.com" 
                                className="pl-10"
                                {...field}
                                value={field.value || ''}
                                onChange={(e) => {
                                  field.onChange(e.target.value);
                                  console.log('Email input changed:', e.target.value);
                                }}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input 
                                placeholder="+27123456789" 
                                className="pl-10"
                                {...field}
                                value={field.value || ''}
                                onChange={(e) => {
                                  field.onChange(e.target.value);
                                  console.log('Phone input changed:', e.target.value);
                                }}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="employer"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Employer</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Building className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input 
                                placeholder="ABC Mining Corp" 
                                className="pl-10"
                                {...field}
                                value={field.value || ''}
                                onChange={(e) => {
                                  field.onChange(e.target.value);
                                  console.log('Employer input changed:', e.target.value);
                                }}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="examinationType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Examination Type</FormLabel>
                          <Select 
                            onValueChange={(value) => {
                              field.onChange(value);
                              console.log('Examination type changed:', value);
                            }}
                            value={field.value || 'pre-employment'}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select examination type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="pre-employment">Pre-Employment</SelectItem>
                              <SelectItem value="periodic">Periodic</SelectItem>
                              <SelectItem value="exit">Exit</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 relative z-50"
                    disabled={isSubmitting}
                    style={{ pointerEvents: 'auto', position: 'relative', zIndex: 9999 }}
                  >
                    {isSubmitting ? 'Registering...' : 'Register Patient'}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                <UserPlus className="mr-2 h-4 w-4" />
                Bulk Import
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Building className="mr-2 h-4 w-4" />
                Manage Employers
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Registrations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Today</span>
                  <span className="font-medium">12</span>
                </div>
                <div className="flex justify-between">
                  <span>This Week</span>
                  <span className="font-medium">47</span>
                </div>
                <div className="flex justify-between">
                  <span>This Month</span>
                  <span className="font-medium">156</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}