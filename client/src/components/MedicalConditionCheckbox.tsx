import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { 
  Heart, 
  Brain, 
  Eye, 
  Activity, 
  AlertTriangle,
  Info,
  Stethoscope
} from 'lucide-react';

interface MedicalConditionCheckboxProps {
  form: UseFormReturn<any>;
  name: string;
  label: string;
  category?: string;
  critical?: boolean;
  description?: string;
  requiresDetails?: boolean;
}

const categoryIcons = {
  cardiovascular: Heart,
  neurological: Brain,
  vision: Eye,
  metabolic: Activity,
  genetic: Activity,
  gastrointestinal: Activity,
  urological: Activity,
  reproductive: Activity,
  endocrine: Activity,
  oncological: AlertTriangle,
  respiratory: Stethoscope,
  general: Info
};

const categoryColors = {
  cardiovascular: 'text-red-500 bg-red-50 border-red-200',
  neurological: 'text-purple-500 bg-purple-50 border-purple-200',
  vision: 'text-blue-500 bg-blue-50 border-blue-200',
  metabolic: 'text-green-500 bg-green-50 border-green-200',
  genetic: 'text-orange-500 bg-orange-50 border-orange-200',
  gastrointestinal: 'text-amber-500 bg-amber-50 border-amber-200',
  urological: 'text-cyan-500 bg-cyan-50 border-cyan-200',
  reproductive: 'text-pink-500 bg-pink-50 border-pink-200',
  endocrine: 'text-indigo-500 bg-indigo-50 border-indigo-200',
  oncological: 'text-red-600 bg-red-100 border-red-300',
  respiratory: 'text-sky-500 bg-sky-50 border-sky-200',
  general: 'text-gray-500 bg-gray-50 border-gray-200'
};

export const MedicalConditionCheckbox: React.FC<MedicalConditionCheckboxProps> = ({
  form,
  name,
  label,
  category = 'general',
  critical = false,
  description,
  requiresDetails = false
}) => {
  const IconComponent = categoryIcons[category as keyof typeof categoryIcons] || Info;
  const colorClass = categoryColors[category as keyof typeof categoryColors] || categoryColors.general;
  
  const fieldValue = form.watch(name);
  const detailsFieldName = `${name}_details`;

  return (
    <div className={`p-3 rounded-lg border transition-all ${
      fieldValue 
        ? critical 
          ? 'border-red-300 bg-red-50' 
          : colorClass
        : 'border-gray-200 bg-white hover:bg-gray-50'
    }`}>
      <FormField
        control={form.control}
        name={name}
        render={({ field }) => (
          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
            <FormControl>
              <Checkbox
                checked={field.value || false}
                onCheckedChange={field.onChange}
                className={fieldValue && critical ? 'border-red-400' : ''}
              />
            </FormControl>
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <IconComponent className={`h-4 w-4 ${
                  fieldValue && critical ? 'text-red-500' : `text-${category === 'cardiovascular' ? 'red' : category === 'neurological' ? 'purple' : 'blue'}-500`
                }`} />
                <FormLabel className={`text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${
                  critical ? 'font-medium' : ''
                }`}>
                  {label}
                </FormLabel>
                {critical && (
                  <Badge variant="destructive" size="sm">
                    Critical
                  </Badge>
                )}
                {category && (
                  <Badge variant="outline" size="sm" className="text-xs">
                    {category}
                  </Badge>
                )}
              </div>
              
              {description && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-1 cursor-help">
                        <Info className="h-3 w-3 text-gray-400" />
                        <span className="text-xs text-gray-500">More info</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs text-sm">{description}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}

              {fieldValue && requiresDetails && (
                <FormField
                  control={form.control}
                  name={detailsFieldName}
                  render={({ field: detailsField }) => (
                    <FormItem className="mt-2">
                      <FormControl>
                        <textarea
                          {...detailsField}
                          placeholder="Please provide additional details..."
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          rows={2}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {fieldValue && critical && (
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-100 p-2 rounded">
                  <AlertTriangle className="h-4 w-4" />
                  <span>This condition may require additional medical evaluation</span>
                </div>
              )}
            </div>
          </FormItem>
        )}
      />
    </div>
  );
};