import React, { createContext, useContext, useState, ReactNode } from 'react';

interface Organization {
  _id: string;
  name: string;
  domain: string;
  subscriptionTier: string;
  role: string;
  locations: string[];
}

interface OrganizationContextType {
  organizations: Organization[];
  currentOrganization: Organization | null;
  loading: boolean;
  switchToOrganization: (organizationId: string) => Promise<void>;
  refreshOrganizations: () => Promise<void>;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

interface OrganizationProviderProps {
  children: ReactNode;
}

export function OrganizationProvider({ children }: OrganizationProviderProps) {
  // Mock organization data for development
  const mockOrganizations: Organization[] = [
    {
      _id: '1',
      name: 'HealthCorp Medical Center',
      domain: 'healthcorp.com',
      subscriptionTier: 'premium',
      role: 'admin',
      locations: ['Cape Town', 'Johannesburg']
    }
  ];

  const [organizations] = useState<Organization[]>(mockOrganizations);
  const [currentOrganization] = useState<Organization | null>(mockOrganizations[0]);
  const [loading] = useState(false);

  const switchToOrganization = async (organizationId: string) => {
    // Mock function for development
    console.log('Switching to organization:', organizationId);
  };

  const refreshOrganizations = async () => {
    // Mock function for development
    console.log('Refreshing organizations');
  };

  return (
    <OrganizationContext.Provider
      value={{
        organizations,
        currentOrganization,
        loading,
        switchToOrganization,
        refreshOrganizations,
      }}
    >
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization() {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error('useOrganization must be used within an OrganizationProvider');
  }
  return context;
}