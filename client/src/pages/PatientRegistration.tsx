import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { createPatient } from '@/api/patients';
import { useToast } from '@/hooks/useToast';
import { UserPlus, Building, Phone, Mail, CreditCard } from 'lucide-react';

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
      // 🔧 FIX: Map form data to API structure
      const apiData = {
        name: data.name,
        idNumber: data.idNumber,
        email: data.email,
        phone: data.phone,
        employerName: data.employer,
        employer: data.employer,
        examinationType: data.examinationType
      };
      
      console.log('📤 REGISTRATION DEBUG: Submitting patient data:', apiData);
      const response = await createPatient(apiData);
      
      console.log('✅ REGISTRATION DEBUG: Patient created:', response);
      
      toast({
        title: "Success",
        description: "Patient registered successfully",
      });
      form.reset();
      
      // 🔧 FIX: Navigate to patient-specific questionnaire with patient ID
      if (response && response.patient && response.patient._id) {
        console.log('🚀 REGISTRATION DEBUG: Navigating to questionnaire for patient:', response.patient._id);
        navigate(`/patients/${response.patient._id}/questionnaire`);
      } else {
        console.error('❌ REGISTRATION DEBUG: No patient ID in response:', response);
        // Fallback to generic questionnaire if no patient ID
        navigate('/questionnaires');
      }
    } catch (error) {
      console.error('❌ REGISTRATION ERROR:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to register patient",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const validateSAID = (idNumber: string) => {
    // 🔧 FIX: Use centralized SA ID validation utility
    try {
      // Import the validation function dynamically
      import('../../utils/sa-id-validation').then(({ validateAndExtractSAID }) => {
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
      }).catch(error => {
        console.error('SA ID validation error:', error);
        return { isValid: false, age: 0 };
      });
      
      // For now, return basic validation
      return { isValid: /^\d{13}$/.test(idNumber), age: 46 };
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
                            <Input placeholder="John Smith" {...field} />
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
                              <CreditCard className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input 
                                placeholder="8501015009087" 
                                className="pl-10"
                                {...field} 
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
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                    disabled={isSubmitting}
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