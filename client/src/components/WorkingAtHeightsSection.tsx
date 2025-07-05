import React, { useState, useEffect } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Mountain,
  AlertTriangle,
  Shield,
  Eye,
  Ear,
  Activity,
  Brain,
  Pill,
  Info,
  CheckCircle2,
  XCircle
} from 'lucide-react';

interface WorkingAtHeightsSectionProps {
  form: UseFormReturn<any>;
  onDataChange?: (data: any) => void;
}

export const WorkingAtHeightsSection: React.FC<WorkingAtHeightsSectionProps> = ({
  form,
  onDataChange
}) => {
  const [riskScore, setRiskScore] = useState(0);
  const [riskLevel, setRiskLevel] = useState<'low' | 'medium' | 'high'>('low');

  // Watch form values for changes
  const watchedValues = form.watch('working_at_heights_assessment');

  useEffect(() => {
    onDataChange?.(watchedValues);
    calculateRiskScore();
  }, [watchedValues, onDataChange]);

  const heightsAssessmentItems = [
    { 
      key: 'fear_of_heights', 
      label: 'Do you have a fear of heights or acrophobia?', 
      critical: true,
      description: 'Any anxiety or discomfort when working at elevated positions',
      points: 3
    },
    { 
      key: 'vertigo_dizziness', 
      label: 'Do you experience vertigo or dizziness?', 
      critical: true,
      description: 'Including balance problems or feeling of spinning',
      points: 3
    },
    { 
      key: 'balance_problems', 
      label: 'Do you have any balance or coordination problems?', 
      critical: true,
      description: 'Difficulty maintaining balance or coordination issues',
      points: 3
    },
    { 
      key: 'previous_falls', 
      label: 'Have you had any previous falls from height?', 
      critical: true,
      description: 'Any fall from more than 2 meters or resulting in injury',
      points: 2
    },
    { 
      key: 'medication_affecting_balance', 
      label: 'Are you taking medication that may affect balance or concentration?', 
      critical: true,
      description: 'Including sedatives, blood pressure medication, or psychiatric drugs',
      points: 2
    },
    { 
      key: 'vision_problems', 
      label: 'Do you have vision problems that could affect safety?', 
      critical: false,
      description: 'Including poor depth perception, color blindness, or uncorrected vision',
      points: 2
    },
    { 
      key: 'hearing_problems', 
      label: 'Do you have hearing problems that could affect communication?', 
      critical: false,
      description: 'Difficulty hearing safety signals or communication',
      points: 1
    },
    { 
      key: 'mobility_restrictions', 
      label: 'Do you have any mobility restrictions or joint problems?', 
      critical: false,
      description: 'Including arthritis, back problems, or limited range of motion',
      points: 2
    }
  ];

  const calculateRiskScore = () => {
    let score = 0;
    heightsAssessmentItems.forEach(item => {
      if (form.getValues(`working_at_heights_assessment.${item.key}`)) {
        score += item.points;
      }
    });

    setRiskScore(score);
    
    if (score >= 8) {
      setRiskLevel('high');
    } else if (score >= 4) {
      setRiskLevel('medium');
    } else {
      setRiskLevel('low');
    }
  };

  const getRiskLevelColor = () => {
    switch (riskLevel) {
      case 'high': return 'text-red-600 bg-red-100 border-red-300';
      case 'medium': return 'text-orange-600 bg-orange-100 border-orange-300';
      case 'low': return 'text-green-600 bg-green-100 border-green-300';
      default: return 'text-gray-600 bg-gray-100 border-gray-300';
    }
  };

  const getRiskLevelIcon = () => {
    switch (riskLevel) {
      case 'high': return <XCircle className="h-4 w-4" />;
      case 'medium': return <AlertTriangle className="h-4 w-4" />;
      case 'low': return <CheckCircle2 className="h-4 w-4" />;
      default: return <Info className="h-4 w-4" />;
    }
  };

  const renderSafetyAssessmentItems = () => (
    <div className="space-y-4">
      {heightsAssessmentItems.map((item) => (
        <div 
          key={item.key} 
          className={`p-4 rounded-lg border transition-all ${
            form.watch(`working_at_heights_assessment.${item.key}`)
              ? item.critical 
                ? 'border-red-300 bg-red-50' 
                : 'border-orange-300 bg-orange-50'
              : 'border-gray-200 bg-white hover:bg-gray-50'
          }`}
        >
          <FormField
            control={form.control}
            name={`working_at_heights_assessment.${item.key}`}
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value || false}
                    onCheckedChange={field.onChange}
                    className={field.value && item.critical ? 'border-red-400' : ''}
                  />
                </FormControl>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <FormLabel className={`text-sm leading-none ${
                      item.critical ? 'font-medium' : ''
                    }`}>
                      {item.label}
                    </FormLabel>
                    {item.critical && (
                      <Badge variant="destructive" size="sm">
                        Critical
                      </Badge>
                    )}
                    <Badge variant="outline" size="sm" className="text-xs">
                      {item.points} {item.points === 1 ? 'point' : 'points'}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-gray-600">
                    {item.description}
                  </p>

                  {field.value && (
                    <FormField
                      control={form.control}
                      name={`working_at_heights_assessment.${item.key}_details`}
                      render={({ field: detailsField }) => (
                        <FormItem className="mt-2">
                          <FormControl>
                            <Textarea
                              {...detailsField}
                              placeholder="Please provide additional details..."
                              rows={2}
                              className="text-sm"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {field.value && item.critical && (
                    <div className="flex items-center gap-2 text-sm text-red-600 bg-red-100 p-2 rounded">
                      <AlertTriangle className="h-4 w-4" />
                      <span>This condition may disqualify you from working at heights</span>
                    </div>
                  )}
                </div>
              </FormItem>
            )}
          />
        </div>
      ))}
    </div>
  );

  const renderPhysicalFitnessAssessment = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-blue-500" />
          Physical Fitness Assessment
        </CardTitle>
        <CardDescription>
          Assessment of physical condition for working at heights
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <FormField
          control={form.control}
          name="working_at_heights_assessment.physical_fitness_level"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Overall physical fitness level</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select fitness level" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="excellent">Excellent - Very active, regular exercise</SelectItem>
                  <SelectItem value="good">Good - Moderately active, some exercise</SelectItem>
                  <SelectItem value="fair">Fair - Limited activity, occasional exercise</SelectItem>
                  <SelectItem value="poor">Poor - Sedentary lifestyle, no regular exercise</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="working_at_heights_assessment.specific_concerns"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Any specific concerns about working at heights?</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Describe any specific concerns, anxieties, or limitations you have regarding working at heights..."
                  rows={4}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );

  const renderRiskAssessmentSummary = () => (
    <Card className={`border-2 ${getRiskLevelColor()}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Risk Assessment Summary
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-medium">Risk Score:</span>
            <div className="flex items-center gap-2">
              {getRiskLevelIcon()}
              <span className="font-bold">{riskScore} points</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="font-medium">Risk Level:</span>
            <Badge className={getRiskLevelColor()}>
              {riskLevel.toUpperCase()}
            </Badge>
          </div>

          <Separator />

          <div className="text-sm space-y-2">
            <div className="font-medium">Risk Assessment Guide:</div>
            <div className="space-y-1 text-gray-600">
              <div>• 0-3 points: Low risk - Generally suitable for heights work</div>
              <div>• 4-7 points: Medium risk - May require additional assessment</div>
              <div>• 8+ points: High risk - Detailed medical evaluation required</div>
            </div>
          </div>

          {riskLevel === 'high' && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                High risk assessment detected. A detailed medical evaluation and additional safety measures may be required before approval for heights work.
              </AlertDescription>
            </Alert>
          )}

          {riskLevel === 'medium' && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Medium risk assessment. Additional precautions and possibly further medical assessment may be recommended.
              </AlertDescription>
            </Alert>
          )}

          {riskLevel === 'low' && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Low risk assessment. Generally suitable for working at heights, subject to medical examination results.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold flex items-center justify-center gap-2">
          <Mountain className="h-6 w-6 text-orange-500" />
          Working at Heights Assessment
        </h2>
        <p className="text-gray-600">
          This assessment evaluates your suitability for work at elevated positions
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Safety Assessment Questions
            <Badge variant="secondary">Required</Badge>
          </CardTitle>
          <CardDescription>
            Please answer all questions honestly. This assessment is critical for your safety and the safety of others.
            Each question contributes to your overall risk score.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {renderSafetyAssessmentItems()}
        </CardContent>
      </Card>

      {renderPhysicalFitnessAssessment()}
      {renderRiskAssessmentSummary()}

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          This assessment is part of your occupational health evaluation. All responses are confidential and will be reviewed by qualified medical professionals. The final determination for working at heights will be made following a complete medical examination.
        </AlertDescription>
      </Alert>
    </div>
  );
};