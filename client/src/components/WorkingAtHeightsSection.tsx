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
  XCircle,
  FileText
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
  const watchedValues = form.watch('workingAtHeights');

  useEffect(() => {
    onDataChange?.(watchedValues);
    calculateRiskScore();
  }, [watchedValues, onDataChange]);

  // Safety Questions based on JSON Schema
  const safetyQuestions = [
    { 
      key: 'advised_not_work_at_height', 
      label: 'Have you ever been advised not to work at height?', 
      critical: true,
      description: 'Previous medical advice against working at elevated positions',
      points: 4
    },
    { 
      key: 'serious_occupational_accident', 
      label: 'Have you ever had a serious occupational accident?', 
      critical: true,
      description: 'Any workplace accident resulting in injury or time off work',
      points: 3
    },
    { 
      key: 'fear_of_heights_enclosed_spaces', 
      label: 'Do you have a fear of heights or enclosed spaces?', 
      critical: true,
      description: 'Phobias that could affect safety when working at height',
      points: 4
    },
    { 
      key: 'fits_seizures_epilepsy_blackouts', 
      label: 'Do you suffer from fits, seizures, epilepsy, or blackouts?', 
      critical: true,
      description: 'Conditions that could cause loss of consciousness',
      points: 5
    },
    { 
      key: 'suicide_thoughts_attempts', 
      label: 'Have you ever had thoughts of suicide or attempted suicide?', 
      critical: true,
      description: 'Mental health concerns that require immediate attention',
      points: 5
    },
    { 
      key: 'seen_mental_health_professional', 
      label: 'Have you ever seen a mental health professional?', 
      critical: false,
      description: 'History of mental health treatment or counseling',
      points: 2
    },
    { 
      key: 'thoughts_not_own_messages_spirits', 
      label: 'Do you ever have thoughts that are not your own, messages, or hear spirits?', 
      critical: true,
      description: 'Symptoms of psychosis or hallucinatory experiences',
      points: 4
    },
    { 
      key: 'substance_abuse_problem', 
      label: 'Do you have a substance abuse problem?', 
      critical: true,
      description: 'Alcohol or drug dependency issues',
      points: 3
    },
    { 
      key: 'other_problems_affecting_safety', 
      label: 'Do you have any other problems that may affect your safety?', 
      critical: false,
      description: 'Any additional safety concerns not covered above',
      points: 2
    }
  ];

  // Training Awareness Questions
  const trainingQuestions = [
    { 
      key: 'informed_of_tasks_safety_requirements', 
      label: 'Have you been informed of the tasks and safety requirements?', 
      critical: false,
      description: 'Understanding of job responsibilities and safety protocols',
      points: 0
    },
    { 
      key: 'chronic_diseases_diabetes_epilepsy', 
      label: 'Do you suffer from chronic diseases such as diabetes or epilepsy?', 
      critical: true,
      description: 'Chronic conditions that may affect work performance',
      points: 3
    }
  ];

  const calculateRiskScore = () => {
    let score = 0;
    
    // Calculate score for safety questions
    safetyQuestions.forEach(item => {
      if (form.getValues(`workingAtHeights.safety_questions.${item.key}`)) {
        score += item.points;
      }
    });
    
    // Calculate score for training questions
    trainingQuestions.forEach(item => {
      if (form.getValues(`workingAtHeights.training_awareness.${item.key}`)) {
        score += item.points;
      }
    });

    setRiskScore(score);
    
    if (score >= 12) {
      setRiskLevel('high');
    } else if (score >= 6) {
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

  const renderQuestionSection = (questions: any[], sectionName: string, title: string) => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
      {questions.map((item) => (
        <div 
          key={item.key} 
          className={`p-4 rounded-lg border transition-all ${
            form.watch(`workingAtHeights.${sectionName}.${item.key}`)
              ? item.critical 
                ? 'border-red-300 bg-red-50' 
                : 'border-orange-300 bg-orange-50'
              : 'border-gray-200 bg-white hover:bg-gray-50'
          }`}
        >
          <FormField
            control={form.control}
            name={`workingAtHeights.${sectionName}.${item.key}`}
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
                    {item.points > 0 && (
                      <Badge variant="outline" size="sm" className="text-xs">
                        {item.points} {item.points === 1 ? 'point' : 'points'}
                      </Badge>
                    )}
                  </div>
                  
                  <p className="text-sm text-gray-600">
                    {item.description}
                  </p>

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

  const renderAdditionalComments = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-blue-500" />
          Additional Information
        </CardTitle>
        <CardDescription>
          Please provide any additional relevant information
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <FormField
          control={form.control}
          name="workingAtHeights.additional_comments"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Additional Comments</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Any additional information relevant to working at heights assessment..."
                  rows={4}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="workingAtHeights.examiner_notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Examiner Notes (For medical staff use)</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Medical examiner observations and notes..."
                  rows={3}
                  className="bg-gray-50"
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
          {renderQuestionSection(safetyQuestions, 'safety_questions', 'Safety Questions')}\n          <Separator />\n          {renderQuestionSection(trainingQuestions, 'training_awareness', 'Training and Awareness')}
        </CardContent>
      </Card>

      {renderAdditionalComments()}
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