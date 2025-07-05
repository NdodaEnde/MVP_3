import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  FileText,
  User,
  Heart,
  Mountain,
  RotateCcw,
  Activity,
  PenTool
} from 'lucide-react';
import {
  ExaminationType,
  QuestionnaireSection,
  getExaminationTypeConfig,
  getSectionDisplayInfo,
  getExaminationTypeColorClasses
} from '@/utils/examination-types';
import { useExaminationType, useSectionNavigation } from '@/hooks/useExaminationType';
import { ExaminationProgress } from './ExaminationTypeSelector';

const sectionIconMap = {
  User,
  FileText,
  Clock,
  Mountain,
  RotateCcw,
  Heart,
  Activity,
  PenTool
};

interface DynamicQuestionnaireFormProps {
  examinationType: ExaminationType;
  patientId: string;
  onSectionComplete: (section: QuestionnaireSection, data: any) => void;
  onQuestionnaireComplete: (data: any) => void;
  initialData?: any;
  completedSections?: QuestionnaireSection[];
}

export const DynamicQuestionnaireForm: React.FC<DynamicQuestionnaireFormProps> = ({
  examinationType,
  patientId,
  onSectionComplete,
  onQuestionnaireComplete,
  initialData = {},
  completedSections = []
}) => {
  const {
    config,
    requiredSections,
    optionalSections,
    allSections,
    isSectionRequired,
    progress,
    validation,
    canSubmit
  } = useExaminationType({ 
    initialType: examinationType, 
    completedSections 
  });

  const {
    currentSection,
    setCurrentSection,
    goToNextSection,
    goToPreviousSection,
    canGoNext,
    canGoPrevious,
    currentSectionIndex,
    totalSections
  } = useSectionNavigation(examinationType, completedSections);

  const [sectionData, setSectionData] = useState<Record<string, any>>(initialData);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const colorClasses = getExaminationTypeColorClasses(examinationType);

  // Handle section data changes
  const handleSectionDataChange = (section: QuestionnaireSection, data: any) => {
    setSectionData(prev => ({
      ...prev,
      [section]: data
    }));
  };

  // Handle section completion
  const handleSectionComplete = async (section: QuestionnaireSection, data: any) => {
    try {
      setIsSubmitting(true);
      await onSectionComplete(section, data);
      handleSectionDataChange(section, data);
      
      // Auto-advance to next section if available
      if (canGoNext) {
        goToNextSection();
      }
    } catch (error) {
      console.error('Error completing section:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle questionnaire completion
  const handleQuestionnaireComplete = async () => {
    if (!canSubmit) return;
    
    try {
      setIsSubmitting(true);
      await onQuestionnaireComplete(sectionData);
    } catch (error) {
      console.error('Error completing questionnaire:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render section navigation
  const renderSectionNavigation = () => (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Questionnaire Sections</CardTitle>
          <Badge variant="secondary">
            {currentSectionIndex} of {totalSections}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3">
          <Progress value={(currentSectionIndex / totalSections) * 100} className="h-2" />
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
            {allSections.map((section) => {
              const sectionInfo = getSectionDisplayInfo(section);
              const IconComponent = sectionIconMap[sectionInfo.icon as keyof typeof sectionIconMap];
              const isCompleted = completedSections.includes(section);
              const isCurrent = currentSection === section;
              const isRequired = isSectionRequired(section);
              
              return (
                <Button
                  key={section}
                  variant={isCurrent ? "default" : isCompleted ? "secondary" : "outline"}
                  size="sm"
                  className={`justify-start p-2 h-auto ${
                    isCurrent ? colorClasses.bg : ''
                  }`}
                  onClick={() => setCurrentSection(section)}
                >
                  <div className="flex items-center gap-2 w-full">
                    {isCompleted ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <IconComponent className="h-4 w-4" />
                    )}
                    <div className="flex-1 text-left">
                      <div className="text-sm font-medium truncate">
                        {sectionInfo.title}
                      </div>
                      {isRequired && (
                        <Badge variant="outline" size="sm" className="text-xs">
                          Required
                        </Badge>
                      )}
                    </div>
                  </div>
                </Button>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // Render current section form
  const renderCurrentSectionForm = () => {
    if (!currentSection) return null;

    const sectionInfo = getSectionDisplayInfo(currentSection);
    const IconComponent = sectionIconMap[sectionInfo.icon as keyof typeof sectionIconMap];
    const isCompleted = completedSections.includes(currentSection);
    const isRequired = isSectionRequired(currentSection);

    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${colorClasses.bg}`}>
              <IconComponent className={`h-5 w-5 ${colorClasses.text}`} />
            </div>
            <div className="flex-1">
              <CardTitle className="flex items-center gap-2">
                {sectionInfo.title}
                {isRequired && (
                  <Badge variant="secondary" size="sm">Required</Badge>
                )}
                {isCompleted && (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                )}
              </CardTitle>
              <CardDescription>{sectionInfo.description}</CardDescription>
            </div>
            <div className="text-right text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {sectionInfo.estimatedTime}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Here you would render the actual form fields for each section */}
          <div className="space-y-4">
            <div className="p-4 border rounded-lg bg-gray-50">
              <p className="text-sm text-gray-600 mb-2">
                This is where the {sectionInfo.title} form would be rendered.
              </p>
              <p className="text-xs text-gray-500">
                Form fields for {currentSection} section would be dynamically loaded here
                based on the examination type: {config.title}
              </p>
            </div>

            {/* Section-specific validation */}
            {validation.missingRequired.includes(currentSection) && (
              <div className="flex items-center gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <AlertCircle className="h-4 w-4 text-orange-600" />
                <span className="text-sm text-orange-700">
                  This section is required to complete the {config.title.toLowerCase()}
                </span>
              </div>
            )}

            {/* Mock completion button for demonstration */}
            {!isCompleted && (
              <Button
                onClick={() => handleSectionComplete(currentSection, { mockData: true })}
                disabled={isSubmitting}
                className="w-full"
              >
                {isSubmitting ? 'Saving...' : `Complete ${sectionInfo.title}`}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  // Render navigation controls
  const renderNavigationControls = () => (
    <div className="flex items-center justify-between mt-6">
      <Button
        variant="outline"
        onClick={goToPreviousSection}
        disabled={!canGoPrevious || isSubmitting}
      >
        <ChevronLeft className="mr-2 h-4 w-4" />
        Previous
      </Button>

      <div className="flex items-center gap-4">
        {validation.errors.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-orange-600">
            <AlertCircle className="h-4 w-4" />
            {validation.errors.length} required sections remaining
          </div>
        )}

        {canSubmit ? (
          <Button
            onClick={handleQuestionnaireComplete}
            disabled={isSubmitting}
            className="bg-green-600 hover:bg-green-700"
          >
            <CheckCircle2 className="mr-2 h-4 w-4" />
            {isSubmitting ? 'Submitting...' : 'Complete Questionnaire'}
          </Button>
        ) : (
          <Button
            variant="outline"
            onClick={goToNextSection}
            disabled={!canGoNext || isSubmitting}
          >
            Next
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Examination type header */}
      <ExaminationProgress
        examinationType={examinationType}
        completedSections={completedSections}
        currentSection={currentSection || undefined}
      />

      <Separator />

      {/* Section navigation */}
      {renderSectionNavigation()}

      {/* Current section form */}
      {renderCurrentSectionForm()}

      {/* Navigation controls */}
      {renderNavigationControls()}

      {/* Debug info (remove in production) */}
      <Card className="bg-gray-50">
        <CardHeader>
          <CardTitle className="text-sm">Debug Information</CardTitle>
        </CardHeader>
        <CardContent className="text-xs space-y-2">
          <div>Examination Type: {examinationType}</div>
          <div>Current Section: {currentSection}</div>
          <div>Progress: {progress.percentage}% ({progress.completed}/{progress.total})</div>
          <div>Can Submit: {canSubmit.toString()}</div>
          <div>Required Sections: {requiredSections.join(', ')}</div>
          <div>Optional Sections: {optionalSections.join(', ')}</div>
        </CardContent>
      </Card>
    </div>
  );
};