import { useState } from 'react';
import { Check, ChevronsUpDown, Building, Crown, Star, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useOrganization } from '@/contexts/OrganizationContext';
import { Organization } from '@/api/organizations';

const tierIcons = {
  basic: Shield,
  premium: Star,
  enterprise: Crown,
};

const tierColors = {
  basic: 'bg-gray-100 text-gray-800',
  premium: 'bg-blue-100 text-blue-800',
  enterprise: 'bg-purple-100 text-purple-800',
};

export function OrganizationSwitcher() {
  const [open, setOpen] = useState(false);
  const { organizations, currentOrganization, switchToOrganization, loading } = useOrganization();

  if (loading || !currentOrganization) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg animate-pulse">
        <div className="w-4 h-4 bg-muted rounded"></div>
        <div className="w-24 h-4 bg-muted rounded"></div>
      </div>
    );
  }

  const handleSelect = async (organization: Organization) => {
    if (organization._id !== currentOrganization._id) {
      await switchToOrganization(organization._id);
    }
    setOpen(false);
  };

  const TierIcon = tierIcons[currentOrganization.subscriptionTier];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-64 justify-between bg-gradient-to-r from-white to-blue-50/50 border-blue-200 hover:from-blue-50 hover:to-purple-50"
        >
          <div className="flex items-center gap-2 min-w-0">
            <Building className="h-4 w-4 text-blue-600 flex-shrink-0" />
            <div className="flex flex-col items-start min-w-0">
              <span className="font-medium text-sm truncate max-w-32">
                {currentOrganization.name}
              </span>
              <div className="flex items-center gap-1">
                <TierIcon className="h-3 w-3" />
                <span className="text-xs text-muted-foreground capitalize">
                  {currentOrganization.subscriptionTier}
                </span>
              </div>
            </div>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 bg-white border-blue-200">
        <Command>
          <CommandInput placeholder="Search organizations..." className="h-9" />
          <CommandList>
            <CommandEmpty>No organizations found.</CommandEmpty>
            <CommandGroup heading="Your Organizations">
              {organizations.map((organization) => {
                const OrgTierIcon = tierIcons[organization.subscriptionTier];
                return (
                  <CommandItem
                    key={organization._id}
                    value={organization.name}
                    onSelect={() => handleSelect(organization)}
                    className="flex items-center gap-3 p-3 cursor-pointer hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Building className="h-4 w-4 text-blue-600 flex-shrink-0" />
                      <div className="flex flex-col min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm truncate">
                            {organization.name}
                          </span>
                          <Badge className={cn('text-xs', tierColors[organization.subscriptionTier])}>
                            <OrgTierIcon className="h-3 w-3 mr-1" />
                            {organization.subscriptionTier}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{organization.domain}</span>
                          <span>•</span>
                          <span className="capitalize">{organization.role}</span>
                          {organization.locations.length > 0 && (
                            <>
                              <span>•</span>
                              <span>{organization.locations.length} location{organization.locations.length > 1 ? 's' : ''}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <Check
                      className={cn(
                        "ml-auto h-4 w-4 text-blue-600",
                        currentOrganization._id === organization._id
                          ? "opacity-100"
                          : "opacity-0"
                      )}
                    />
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}