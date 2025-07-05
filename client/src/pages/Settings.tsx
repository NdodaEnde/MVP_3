import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/useToast';
import {
  Settings as SettingsIcon,
  Users,
  Building,
  Shield,
  Palette,
  Bell,
  Key,
  Mail,
  Plus,
  Edit,
  Trash2,
  UserPlus,
  Crown,
  Star
} from 'lucide-react';

// Mock API functions
const getUsers = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        users: [
          {
            _id: '1',
            name: 'Dr. Sarah Johnson',
            email: 'sarah.johnson@healthcorp.com',
            role: 'doctor',
            status: 'active',
            lastLogin: '2024-01-15T10:30:00Z',
            avatar: null
          },
          {
            _id: '2',
            name: 'Nurse Mary Wilson',
            email: 'mary.wilson@healthcorp.com',
            role: 'nurse',
            status: 'active',
            lastLogin: '2024-01-15T09:15:00Z',
            avatar: null
          },
          {
            _id: '3',
            name: 'Tech John Smith',
            email: 'john.smith@healthcorp.com',
            role: 'technician',
            status: 'active',
            lastLogin: '2024-01-15T08:45:00Z',
            avatar: null
          }
        ]
      });
    }, 500);
  });
};

const getOrganizationSettings = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        organization: {
          name: 'HealthCorp Medical Center',
          domain: 'healthcorp.com',
          subscriptionTier: 'premium',
          locations: ['Cape Town', 'Johannesburg'],
          settings: {
            branding: {
              primaryColor: '#3b82f6',
              secondaryColor: '#8b5cf6',
              logo: null
            },
            notifications: {
              emailAlerts: true,
              smsAlerts: false,
              systemNotifications: true
            },
            security: {
              twoFactorAuth: false,
              sessionTimeout: 30,
              passwordPolicy: 'standard'
            }
          }
        }
      });
    }, 500);
  });
};

const userSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  role: z.enum(['receptionist', 'nurse', 'technician', 'doctor', 'admin']),
  location: z.string().optional()
});

type UserFormData = z.infer<typeof userSchema>;

export function Settings() {
  const [users, setUsers] = useState<any[]>([]);
  const [organizationSettings, setOrganizationSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAddUser, setShowAddUser] = useState(false);
  const { toast } = useToast();

  const userForm = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: '',
      email: '',
      role: 'receptionist',
      location: ''
    }
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [usersResponse, orgResponse] = await Promise.all([
        getUsers(),
        getOrganizationSettings()
      ]);
      setUsers((usersResponse as any).users);
      setOrganizationSettings((orgResponse as any).organization);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (data: UserFormData) => {
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast({
        title: "Success",
        description: "User added successfully",
      });

      userForm.reset();
      setShowAddUser(false);
      fetchData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add user",
        variant: "destructive",
      });
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-800';
      case 'doctor': return 'bg-red-100 text-red-800';
      case 'nurse': return 'bg-blue-100 text-blue-800';
      case 'technician': return 'bg-green-100 text-green-800';
      case 'receptionist': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'enterprise': return <Crown className="h-4 w-4" />;
      case 'premium': return <Star className="h-4 w-4" />;
      default: return <Shield className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-48 mb-2"></div>
          <div className="h-4 bg-muted rounded w-96"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gradient-to-br from-gray-500 to-slate-600 rounded-lg">
          <SettingsIcon className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Manage users, organization settings, and system configuration
          </p>
        </div>
      </div>

      <Tabs defaultValue="users">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="organization" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            Organization
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium">User Management</h3>
              <p className="text-sm text-muted-foreground">
                Manage user accounts and permissions
              </p>
            </div>
            <Button
              onClick={() => setShowAddUser(true)}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Add User
            </Button>
          </div>

          {/* Add User Form */}
          {showAddUser && (
            <Card className="bg-gradient-to-br from-white to-blue-50/30 border-blue-200">
              <CardHeader>
                <CardTitle>Add New User</CardTitle>
                <CardDescription>
                  Create a new user account for your organization
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...userForm}>
                  <form onSubmit={userForm.handleSubmit(handleAddUser)} className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={userForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Dr. Sarah Johnson" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={userForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email Address</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="sarah@healthcorp.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={userForm.control}
                        name="role"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Role</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select role" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="receptionist">Receptionist</SelectItem>
                                <SelectItem value="nurse">Nurse</SelectItem>
                                <SelectItem value="technician">Technician</SelectItem>
                                <SelectItem value="doctor">Doctor</SelectItem>
                                <SelectItem value="admin">Administrator</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={userForm.control}
                        name="location"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Location</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select location" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="cape-town">Cape Town</SelectItem>
                                <SelectItem value="johannesburg">Johannesburg</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button type="submit" className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700">
                        Add User
                      </Button>
                      <Button type="button" variant="outline" onClick={() => setShowAddUser(false)}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          )}

          {/* Users Table */}
          <Card>
            <CardHeader>
              <CardTitle>Current Users</CardTitle>
              <CardDescription>
                All users in your organization
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user._id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={user.avatar} />
                            <AvatarFallback>
                              {user.name.split(' ').map((n: string) => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{user.name}</div>
                            <div className="text-sm text-muted-foreground">{user.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getRoleColor(user.role)}>
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
                          {user.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(user.lastLogin).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Organization Tab */}
        <TabsContent value="organization" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Organization Details
              </CardTitle>
              <CardDescription>
                Manage your organization information and subscription
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Organization Name</Label>
                  <Input value={organizationSettings?.name} readOnly />
                </div>
                <div>
                  <Label>Domain</Label>
                  <Input value={organizationSettings?.domain} readOnly />
                </div>
                <div>
                  <Label>Subscription Tier</Label>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-blue-100 text-blue-800">
                      {getTierIcon(organizationSettings?.subscriptionTier)}
                      <span className="ml-1 capitalize">{organizationSettings?.subscriptionTier}</span>
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label>Locations</Label>
                  <div className="flex gap-2">
                    {organizationSettings?.locations?.map((location: string, index: number) => (
                      <Badge key={index} variant="outline">{location}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Branding
              </CardTitle>
              <CardDescription>
                Customize your organization's branding
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Primary Color</Label>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-8 h-8 rounded border"
                      style={{ backgroundColor: organizationSettings?.settings?.branding?.primaryColor }}
                    />
                    <Input value={organizationSettings?.settings?.branding?.primaryColor} readOnly />
                  </div>
                </div>
                <div>
                  <Label>Secondary Color</Label>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-8 h-8 rounded border"
                      style={{ backgroundColor: organizationSettings?.settings?.branding?.secondaryColor }}
                    />
                    <Input value={organizationSettings?.settings?.branding?.secondaryColor} readOnly />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Settings
              </CardTitle>
              <CardDescription>
                Configure security and access controls
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Two-Factor Authentication</Label>
                  <p className="text-sm text-muted-foreground">
                    Require 2FA for all user accounts
                  </p>
                </div>
                <Switch checked={organizationSettings?.settings?.security?.twoFactorAuth} />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Session Timeout (minutes)</Label>
                  <Input 
                    type="number" 
                    value={organizationSettings?.settings?.security?.sessionTimeout} 
                    readOnly 
                  />
                </div>
                <div>
                  <Label>Password Policy</Label>
                  <Select value={organizationSettings?.settings?.security?.passwordPolicy}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basic">Basic</SelectItem>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="strict">Strict</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Settings
              </CardTitle>
              <CardDescription>
                Configure how you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Email Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive important alerts via email
                  </p>
                </div>
                <Switch checked={organizationSettings?.settings?.notifications?.emailAlerts} />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>SMS Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive urgent notifications via SMS
                  </p>
                </div>
                <Switch checked={organizationSettings?.settings?.notifications?.smsAlerts} />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>System Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Show in-app notifications
                  </p>
                </div>
                <Switch checked={organizationSettings?.settings?.notifications?.systemNotifications} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}