// components/TabletOptimized/TabletFormComponents.tsx
import React, { useState, useRef, useEffect } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { 
  ChevronRight,
  ChevronDown,
  Check,
  AlertTriangle,
  Info,
  Heart,
  Activity,
  Shield,
  HelpCircle,
  Maximize2,
  Type,
  Hash
} from 'lucide-react';

// Tablet-optimized input component
interface TabletInputProps {
  form: UseFormReturn<any>;
  name: string;
  label: string;
  placeholder?: string;
  type?: 'text' | 'number' | 'email' | 'tel' | 'date' | 'password';
  required?: boolean;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  autoFocus?: boolean;
  maxLength?: number;
  pattern?: string;
  disabled?: boolean;
  helpText?: string;
}

export const TabletInput: React.FC<TabletInputProps> = ({
  form,
  name,
  label,
  placeholder,
  type = 'text',
  required = false,
  description,
  icon: Icon,
  autoFocus = false,
  maxLength,
  pattern,
  disabled = false,
  helpText
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field, fieldState }) => (
        <FormItem className="tablet-form-field">
          <FormLabel className="tablet-text-base font-semibold flex items-center gap-2">
            {Icon && <Icon className="h-5 w-5 text-blue-600" />}
            {label}
            {required && <span className="text-red-500">*</span>}
            {helpText && (
              <button
                type="button"
                onClick={() => setShowHelp(!showHelp)}
                className="text-blue-500 hover:text-blue-700"
              >
                <HelpCircle className="h-4 w-4" />
              </button>
            )}
          </FormLabel>
          
          <FormControl>
            <div className="relative">
              <Input
                {...field}
                ref={inputRef}
                type={type}
                placeholder={placeholder}
                autoFocus={autoFocus}
                maxLength={maxLength}
                pattern={pattern}
                disabled={disabled}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                className={`
                  tablet-touch-target transition-all duration-200
                  ${fieldState.error ? 'border-red-500 bg-red-50' : ''}
                  ${isFocused ? 'border-blue-500 bg-blue-50' : ''}
                  ${disabled ? 'bg-gray-100' : ''}
                `}
                style={{ fontSize: '16px' }} // Prevent iOS zoom
              />
              
              {/* Character counter */}
              {maxLength && field.value && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <Badge variant="outline" className="text-xs">
                    {String(field.value).length}/{maxLength}
                  </Badge>
                </div>
              )}
            </div>
          </FormControl>
          
          {description && (
            <FormDescription className="tablet-text-sm text-gray-600">
              {description}
            </FormDescription>
          )}
          
          {showHelp && helpText && (
            <Alert className="tablet-alert-info mt-2">
              <Info className="h-4 w-4" />
              <AlertDescription>{helpText}</AlertDescription>
            </Alert>
          )}
          
          <FormMessage className="tablet-text-sm" />
        </FormItem>
      )}
    />
  );
};

// Tablet-optimized textarea component
interface TabletTextareaProps {
  form: UseFormReturn<any>;
  name: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  description?: string;
  rows?: number;
  maxLength?: number;
  disabled?: boolean;
  autoExpand?: boolean;
}

export const TabletTextarea: React.FC<TabletTextareaProps> = ({
  form,
  name,
  label,
  placeholder,
  required = false,
  description,
  rows = 4,
  maxLength,
  disabled = false,
  autoExpand = false
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleInput = () => {
    if (autoExpand && textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field, fieldState }) => (
        <FormItem className="tablet-form-field">
          <FormLabel className="tablet-text-base font-semibold flex items-center gap-2">
            <Type className="h-5 w-5 text-blue-600" />
            {label}
            {required && <span className="text-red-500">*</span>}
          </FormLabel>
          
          <FormControl>
            <div className="relative">
              <Textarea
                {...field}
                ref={textareaRef}
                placeholder={placeholder}
                rows={rows}
                maxLength={maxLength}
                disabled={disabled}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                onInput={handleInput}
                className={`
                  tablet-touch-target transition-all duration-200 resize-none
                  ${fieldState.error ? 'border-red-500 bg-red-50' : ''}
                  ${isFocused ? 'border-blue-500 bg-blue-50' : ''}
                  ${disabled ? 'bg-gray-100' : ''}
                `}
                style={{ fontSize: '16px', minHeight: '120px' }}
              />
              
              {/* Character counter */}
              {maxLength && field.value && (
                <div className="absolute right-3 bottom-3">
                  <Badge variant="outline" className="text-xs">
                    {String(field.value).length}/{maxLength}
                  </Badge>
                </div>
              )}
            </div>
          </FormControl>
          
          {description && (
            <FormDescription className="tablet-text-sm text-gray-600">
              {description}
            </FormDescription>
          )}
          
          <FormMessage className="tablet-text-sm" />
        </FormItem>
      )}
    />
  );
};

// Enhanced tablet checkbox component
interface TabletCheckboxProps {
  form: UseFormReturn<any>;
  name: string;
  label: string;
  description?: string;
  required?: boolean;
  critical?: boolean;
  category?: 'medical' | 'legal' | 'privacy' | 'general';
  disabled?: boolean;
  followUpQuestions?: string[];
  onCheckedChange?: (checked: boolean) => void;
}

export const TabletCheckbox: React.FC<TabletCheckboxProps> = ({
  form,
  name,
  label,
  description,
  required = false,
  critical = false,
  category = 'general',
  disabled = false,
  followUpQuestions = [],
  onCheckedChange
}) => {
  const [showFollowUp, setShowFollowUp] = useState(false);
  
  const isChecked = form.watch(name);
  
  useEffect(() => {
    setShowFollowUp(isChecked && followUpQuestions.length > 0);
  }, [isChecked, followUpQuestions.length]);

  const getCategoryColor = () => {
    switch (category) {
      case 'medical': return 'border-red-200 bg-red-50';
      case 'legal': return 'border-blue-200 bg-blue-50';
      case 'privacy': return 'border-purple-200 bg-purple-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  const getCategoryIcon = () => {
    switch (category) {
      case 'medical': return <Heart className="h-4 w-4 text-red-500" />;
      case 'legal': return <Shield className="h-4 w-4 text-blue-500" />;
      case 'privacy': return <Shield className="h-4 w-4 text-purple-500" />;
      default: return <Check className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className={`tablet-medical-checkbox ${isChecked ? 'checked' : ''} ${critical ? 'critical' : ''}`}>
      <FormField
        control={form.control}
        name={name}
        render={({ field }) => (
          <FormItem className="flex flex-row items-start space-x-4 space-y-0 w-full">
            <FormControl>
              <div className="relative">
                <Checkbox
                  checked={field.value || false}
                  onCheckedChange={(checked) => {
                    field.onChange(checked);
                    onCheckedChange?.(checked as boolean);
                  }}
                  disabled={disabled}
                  className="checkbox-input w-6 h-6 border-2"
                />
                {critical && (
                  <AlertTriangle className="absolute -top-1 -right-1 h-3 w-3 text-red-500" />
                )}
              </div>
            </FormControl>
            
            <div className="flex-1 space-y-2">
              <div className="flex items-start justify-between">
                <FormLabel className="checkbox-label cursor-pointer leading-relaxed">
                  <div className="flex items-center gap-2 mb-1">
                    {getCategoryIcon()}
                    <span className="font-medium">{label}</span>
                    {required && <span className="text-red-500">*</span>}
                    {critical && (
                      <Badge variant="destructive" className="text-xs">
                        Critical
                      </Badge>
                    )}
                  </div>
                  {description && (
                    <p className="checkbox-description text-sm text-gray-600 mt-1">
                      {description}
                    </p>
                  )}
                </FormLabel>
                
                <Badge variant="outline" className="text-xs capitalize">
                  {category}
                </Badge>
              </div>
              
              {/* Follow-up questions */}
              {showFollowUp && (
                <div className="mt-4 p-4 border-l-4 border-blue-300 bg-blue-50 rounded-r-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Info className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">
                      Please provide additional details:
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    {followUpQuestions.map((question, index) => (
                      <p key={index} className="text-sm text-blue-700">
                        • {question}
                      </p>
                    ))}
                  </div>
                  
                  <TabletTextarea
                    form={form}
                    name={`${name}_details`}
                    label="Additional Details"
                    placeholder="Please provide detailed information..."
                    rows={3}
                    maxLength={500}
                  />
                </div>
              )}
            </div>
          </FormItem>
        )}
      />
    </div>
  );
};

// Tablet-optimized form section component
interface TabletFormSectionProps {
  title: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  required?: boolean;
  completed?: boolean;
  errorCount?: number;
}

export const TabletFormSection: React.FC<TabletFormSectionProps> = ({
  title,
  description,
  icon: Icon,
  children,
  collapsible = false,
  defaultExpanded = true,
  required = false,
  completed = false,
  errorCount = 0
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <Card className="tablet-form-section">
      <CardHeader 
        className={`tablet-form-section-header ${collapsible ? 'cursor-pointer' : ''}`}
        onClick={() => collapsible && setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {Icon && (
              <div className="tablet-form-section-icon">
                <Icon className="h-6 w-6" />
              </div>
            )}
            
            <div>
              <CardTitle className="tablet-form-section-title flex items-center gap-2">
                {title}
                {required && <span className="text-red-500">*</span>}
                {completed && <Check className="h-5 w-5 text-green-500" />}
                {errorCount > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    {errorCount} error{errorCount > 1 ? 's' : ''}
                  </Badge>
                )}
              </CardTitle>
              
              {description && (
                <p className="tablet-form-section-description">{description}</p>
              )}
            </div>
          </div>
          
          {collapsible && (
            <div className="flex items-center gap-2">
              {completed && (
                <Badge className="bg-green-100 text-green-800">
                  Complete
                </Badge>
              )}
              {isExpanded ? (
                <ChevronDown className="h-5 w-5 text-gray-500" />
              ) : (
                <ChevronRight className="h-5 w-5 text-gray-500" />
              )}
            </div>
          )}
        </div>
      </CardHeader>
      
      {(isExpanded || !collapsible) && (
        <CardContent className="tablet-card-content">
          {children}
        </CardContent>
      )}
    </Card>
  );
};

// Tablet-optimized button component
interface TabletButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'sm' | 'default' | 'lg' | 'xl';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
  fullWidth?: boolean;
  hapticFeedback?: boolean;
  className?: string;
}

export const TabletButton: React.FC<TabletButtonProps> = ({
  children,
  onClick,
  variant = 'default',
  size = 'default',
  disabled = false,
  loading = false,
  icon: Icon,
  fullWidth = false,
  hapticFeedback = true,
  className = ''
}) => {
  const handleClick = () => {
    if (hapticFeedback && 'vibrate' in navigator) {
      navigator.vibrate(10); // Subtle haptic feedback
    }
    onClick?.();
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm': return 'h-10 px-4 text-sm';
      case 'lg': return 'h-14 px-8 text-lg';
      case 'xl': return 'h-16 px-10 text-xl';
      default: return 'h-12 px-6 text-base';
    }
  };

  return (
    <Button
      onClick={handleClick}
      variant={variant}
      disabled={disabled || loading}
      className={`
        tablet-touch-target font-semibold transition-all duration-200
        ${getSizeClasses()}
        ${fullWidth ? 'w-full' : ''}
        ${loading ? 'opacity-70 cursor-not-allowed' : ''}
        ${className}
      `}
    >
      {loading ? (
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          Loading...
        </div>
      ) : (
        <div className="flex items-center gap-2">
          {Icon && <Icon className="h-5 w-5" />}
          {children}
        </div>
      )}
    </Button>
  );
};

// Tablet navigation component
interface TabletNavigationProps {
  currentStep: number;
  totalSteps: number;
  steps: Array<{
    id: string;
    title: string;
    completed: boolean;
  }>;
  onStepClick?: (stepIndex: number) => void;
  showLabels?: boolean;
}

export const TabletNavigation: React.FC<TabletNavigationProps> = ({
  currentStep,
  totalSteps,
  steps,
  onStepClick,
  showLabels = true
}) => {
  return (
    <div className="tablet-nav-container">
      {/* Progress dots */}
      <div className="tablet-nav-dots mb-4">
        {steps.map((step, index) => (
          <button
            key={step.id}
            onClick={() => onStepClick?.(index)}
            className={`
              tablet-nav-dot tablet-touch-target
              ${index === currentStep ? 'active' : ''}
              ${step.completed ? 'completed' : ''}
            `}
            disabled={!onStepClick}
          />
        ))}
      </div>
      
      {/* Progress bar */}
      <div className="tablet-progress-bar">
        <div 
          className="tablet-progress-fill"
          style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
        />
      </div>
      
      {/* Step labels */}
      {showLabels && (
        <div className="text-center mt-4">
          <p className="tablet-text-base font-medium">
            {steps[currentStep]?.title}
          </p>
          <p className="tablet-text-sm text-gray-600">
            Step {currentStep + 1} of {totalSteps}
          </p>
        </div>
      )}
    </div>
  );
};

export default {
  TabletInput,
  TabletTextarea,
  TabletCheckbox,
  TabletFormSection,
  TabletButton,
  TabletNavigation
};