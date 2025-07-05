import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { 
  UserPlus, 
  Calendar, 
  RotateCcw, 
  Mountain, 
  LogOut,
  Clock,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import {
  ExaminationType,
  getAllExaminationTypes,
  getExaminationTypeConfig,
  getExaminationTypeColorClasses
} from '@/utils/examination-types';

const iconMap = {
  UserPlus,
  Calendar,
  RotateCcw,
  Mountain,
  LogOut
};

interface ExaminationTypeSelectorProps {
  selectedType: ExaminationType;
  onTypeChange: (type: ExaminationType) => void;
  onConfirm?: () => void;
  disabled?: boolean;
  showConfirmButton?: boolean;
  compact?: boolean;
}

export const ExaminationTypeSelector: React.FC<ExaminationTypeSelectorProps> = ({
  selectedType,
  onTypeChange,
  onConfirm,
  disabled = false,
  showConfirmButton = true,
  compact = false
}) => {
  const allTypes = getAllExaminationTypes();

  const handleTypeSelect = (value: string) => {
    onTypeChange(value as ExaminationType);
  };

  if (compact) {
    return (
      <div className="space-y-4">
        <RadioGroup value={selectedType} onValueChange={handleTypeSelect} disabled={disabled}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {allTypes.map((type) => {
              const config = getExaminationTypeConfig(type);
              const colorClasses = getExaminationTypeColorClasses(type);
              const IconComponent = iconMap[config.icon as keyof typeof iconMap];
              
              return (
                <div key={type} className="flex items-center space-x-2">
                  <RadioGroupItem value={type} id={type} />
                  <Label
                    htmlFor={type}
                    className={`flex-1 cursor-pointer p-3 rounded-lg border ${colorClasses.border} ${colorClasses.bg} hover:shadow-sm transition-all`}
                  >
                    <div className="flex items-center gap-3">
                      <IconComponent className={`h-5 w-5 ${colorClasses.text}`} />
                      <div className="flex-1">
                        <div className={`font-medium ${colorClasses.text}`}>
                          {config.title}
                        </div>
                        <div className="text-sm text-gray-600">
                          {config.estimatedDuration}
                        </div>
                      </div>
                      <Badge variant="secondary" className={colorClasses.badge}>
                        {config.priority}
                      </Badge>
                    </div>
                  </Label>
                </div>
              );
            })}
          </div>
        </RadioGroup>
        
        {showConfirmButton && onConfirm && (
          <Button onClick={onConfirm} className="w-full" disabled={disabled}>
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Confirm Selection
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Select Examination Type</h2>
        <p className="text-gray-600">
          Choose the appropriate examination type to customize the questionnaire
        </p>
      </div>

      <RadioGroup value={selectedType} onValueChange={handleTypeSelect} disabled={disabled}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {allTypes.map((type) => {
            const config = getExaminationTypeConfig(type);
            const colorClasses = getExaminationTypeColorClasses(type);
            const IconComponent = iconMap[config.icon as keyof typeof iconMap];
            const isSelected = selectedType === type;
            
            return (
              <div key={type} className="relative">
                <RadioGroupItem 
                  value={type} 
                  id={type}
                  className="sr-only"
                />
                <Label
                  htmlFor={type}
                  className={`block cursor-pointer transition-all ${
                    isSelected ? 'ring-2 ring-blue-500 ring-offset-2' : ''
                  }`}
                >
                  <Card className={`h-full hover:shadow-md transition-shadow ${
                    isSelected ? colorClasses.border : 'border-gray-200'
                  }`}>
                    <CardHeader className="text-center">
                      <div className={`w-12 h-12 mx-auto rounded-full ${colorClasses.bg} flex items-center justify-center mb-2`}>
                        <IconComponent className={`h-6 w-6 ${colorClasses.text}`} />
                      </div>
                      <CardTitle className="text-lg">{config.title}</CardTitle>
                      <CardDescription className="text-sm">
                        {config.description}
                      </CardDescription>
                    </CardHeader>
                    
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-600">
                            {config.estimatedDuration}
                          </span>
                        </div>
                        <Badge variant="secondary" className={colorClasses.badge}>
                          {config.priority}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="text-sm font-medium text-gray-700">
                          Required Sections:
                        </div>
                        <div className="text-sm text-gray-600">
                          {config.requiredSections.length} sections
                        </div>
                      </div>
                      
                      {config.optionalSections.length > 0 && (
                        <div className="space-y-2">
                          <div className="text-sm font-medium text-gray-700">
                            Optional Sections:
                          </div>
                          <div className="text-sm text-gray-600">
                            {config.optionalSections.length} sections
                          </div>
                        </div>
                      )}
                      
                      {isSelected && (
                        <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-2 rounded">
                          <CheckCircle2 className="h-4 w-4" />
                          Selected
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </Label>
              </div>
            );
          })}
        </div>
      </RadioGroup>
      
      {showConfirmButton && onConfirm && (
        <div className="flex justify-center">
          <Button 
            onClick={onConfirm} 
            size="lg"
            disabled={disabled}
            className="min-w-48"
          >
            <CheckCircle2 className="mr-2 h-5 w-5" />
            Start {getExaminationTypeConfig(selectedType).title}
          </Button>
        </div>
      )}
    </div>
  );
};

// Simplified version for forms
interface ExaminationTypeSelectProps {
  value: ExaminationType;
  onChange: (type: ExaminationType) => void;
  disabled?: boolean;
}

export const ExaminationTypeSelect: React.FC<ExaminationTypeSelectProps> = ({
  value,
  onChange,
  disabled = false
}) => {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">Examination Type</Label>
      <RadioGroup value={value} onValueChange={(v) => onChange(v as ExaminationType)} disabled={disabled}>
        <div className="space-y-2">
          {getAllExaminationTypes().map((type) => {
            const config = getExaminationTypeConfig(type);
            const colorClasses = getExaminationTypeColorClasses(type);
            
            return (
              <div key={type} className="flex items-center space-x-2">
                <RadioGroupItem value={type} id={`select-${type}`} />
                <Label
                  htmlFor={`select-${type}`}
                  className="flex-1 cursor-pointer p-2 rounded border hover:bg-gray-50"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{config.title}</div>
                      <div className="text-sm text-gray-600">{config.estimatedDuration}</div>
                    </div>
                    <Badge variant="secondary" className={colorClasses.badge}>
                      {config.priority}
                    </Badge>
                  </div>
                </Label>
              </div>
            );
          })}
        </div>
      </RadioGroup>
    </div>
  );
};

// Progress indicator component
interface ExaminationProgressProps {
  examinationType: ExaminationType;
  completedSections: string[];
  currentSection?: string;
}

export const ExaminationProgress: React.FC<ExaminationProgressProps> = ({
  examinationType,
  completedSections,
  currentSection
}) => {
  const config = getExaminationTypeConfig(examinationType);
  const colorClasses = getExaminationTypeColorClasses(examinationType);
  
  const totalSections = config.requiredSections.length;
  const completed = completedSections.filter(section => 
    config.requiredSections.includes(section as any)
  ).length;
  const percentage = Math.round((completed / totalSections) * 100);
  
  return (
    <Card className={`${colorClasses.border} ${colorClasses.bg}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className={`text-lg ${colorClasses.text}`}>
            {config.title}
          </CardTitle>
          <Badge variant="secondary" className={colorClasses.badge}>
            {percentage}% Complete
          </Badge>
        </div>
        <CardDescription>
          {completed} of {totalSections} required sections completed
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300`}
              style={{ 
                width: `${percentage}%`,
                backgroundColor: colorClasses.text.includes('blue') ? '#3b82f6' :
                                colorClasses.text.includes('green') ? '#10b981' :
                                colorClasses.text.includes('orange') ? '#f59e0b' :
                                colorClasses.text.includes('purple') ? '#8b5cf6' : '#ef4444'
              }}
            />
          </div>
          
          {currentSection && (
            <div className="flex items-center gap-2 text-sm">
              <AlertCircle className="h-4 w-4 text-orange-500" />
              <span className="text-gray-600">
                Current: {currentSection.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};