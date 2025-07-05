import api from './api';

export interface Organization {
  _id: string;
  name: string;
  domain: string;
  subscriptionTier: 'basic' | 'premium' | 'enterprise';
  locations: string[];
  settings: {
    branding: {
      logo?: string;
      primaryColor: string;
      secondaryColor: string;
    };
    certificateTemplate: string;
  };
  role: 'admin' | 'member' | 'viewer';
}

// Description: Get user's organizations
// Endpoint: GET /api/organizations
// Request: {}
// Response: { organizations: Organization[] }
export const getUserOrganizations = () => {
  // Mocking the response
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        organizations: [
          {
            _id: '1',
            name: 'HealthCorp Medical Center',
            domain: 'healthcorp.com',
            subscriptionTier: 'premium',
            locations: ['Cape Town', 'Johannesburg'],
            settings: {
              branding: {
                primaryColor: '#3b82f6',
                secondaryColor: '#8b5cf6'
              },
              certificateTemplate: 'standard'
            },
            role: 'admin'
          },
          {
            _id: '2',
            name: 'Mining Health Services',
            domain: 'mininghealth.co.za',
            subscriptionTier: 'enterprise',
            locations: ['Rustenburg', 'Witbank'],
            settings: {
              branding: {
                primaryColor: '#059669',
                secondaryColor: '#0891b2'
              },
              certificateTemplate: 'mining'
            },
            role: 'member'
          },
          {
            _id: '3',
            name: 'Construction Medical',
            domain: 'constructmed.co.za',
            subscriptionTier: 'basic',
            locations: ['Durban'],
            settings: {
              branding: {
                primaryColor: '#dc2626',
                secondaryColor: '#ea580c'
              },
              certificateTemplate: 'basic'
            },
            role: 'viewer'
          }
        ]
      });
    }, 500);
  });
  // Uncomment the below lines to make an actual API call
  // try {
  //   return await api.get('/api/organizations');
  // } catch (error) {
  //   throw new Error(error?.response?.data?.error || error.message);
  // }
};

// Description: Switch to organization
// Endpoint: POST /api/organizations/:id/switch
// Request: {}
// Response: { success: boolean, organization: Organization }
export const switchOrganization = (organizationId: string) => {
  // Mocking the response
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        organization: {
          _id: organizationId,
          name: 'Selected Organization',
          domain: 'selected.com',
          subscriptionTier: 'premium',
          locations: ['Location'],
          settings: {
            branding: {
              primaryColor: '#3b82f6',
              secondaryColor: '#8b5cf6'
            },
            certificateTemplate: 'standard'
          },
          role: 'admin'
        }
      });
    }, 300);
  });
  // Uncomment the below lines to make an actual API call
  // try {
  //   return await api.post(`/api/organizations/${organizationId}/switch`);
  // } catch (error) {
  //   throw new Error(error?.response?.data?.error || error.message);
  // }
};