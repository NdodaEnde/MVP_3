import { useState, useEffect, useMemo } from 'react';
import {
  ExaminationType,
  QuestionnaireSection,
  getExaminationTypeConfig,
  getRequiredSections,
  getOptionalSections,
  shouldDisplaySection,
  calculateProgress,
  validateQuestionnaireForExaminationType,
  parseExaminationType
} from '@/utils/examination-types';

export interface UseExaminationTypeProps {
  initialType?: string;
  completedSections?: QuestionnaireSection[];
}

export interface UseExaminationTypeReturn {
  // Current examination type
  examinationType: ExaminationType;
  setExaminationType: (type: ExaminationType) => void;
  
  // Configuration
  config: ReturnType<typeof getExaminationTypeConfig>;
  
  // Section management
  requiredSections: QuestionnaireSection[];
  optionalSections: QuestionnaireSection[];
  allSections: QuestionnaireSection[];
  
  // Section utilities
  isSectionRequired: (section: QuestionnaireSection) => boolean;
  isSectionOptional: (section: QuestionnaireSection) => boolean;
  shouldShowSection: (section: QuestionnaireSection) => boolean;
  
  // Progress tracking
  progress: {
    percentage: number;
    completed: number;
    total: number;
    remaining: QuestionnaireSection[];
  };
  
  // Validation
  validation: {
    isValid: boolean;
    missingRequired: QuestionnaireSection[];
    errors: string[];
  };
  
  // Helper functions
  canSubmit: boolean;
  getNextSection: () => QuestionnaireSection | null;
  getPreviousSection: () => QuestionnaireSection | null;
}

export const useExaminationType = ({
  initialType = 'pre_employment',
  completedSections = []
}: UseExaminationTypeProps = {}): UseExaminationTypeReturn => {
  
  const [examinationType, setExaminationType] = useState<ExaminationType>(
    parseExaminationType(initialType)
  );
  
  // Get configuration for current examination type
  const config = useMemo(() => 
    getExaminationTypeConfig(examinationType), 
    [examinationType]
  );
  
  // Get sections for current examination type
  const requiredSections = useMemo(() => 
    getRequiredSections(examinationType), 
    [examinationType]
  );
  
  const optionalSections = useMemo(() => 
    getOptionalSections(examinationType), 
    [examinationType]
  );
  
  const allSections = useMemo(() => 
    [...requiredSections, ...optionalSections], 
    [requiredSections, optionalSections]
  );
  
  // Section utility functions
  const isSectionRequired = (section: QuestionnaireSection): boolean => {
    return requiredSections.includes(section);
  };
  
  const isSectionOptional = (section: QuestionnaireSection): boolean => {
    return optionalSections.includes(section);
  };
  
  const shouldShowSection = (section: QuestionnaireSection): boolean => {
    return shouldDisplaySection(section, examinationType);
  };
  
  // Progress calculation
  const progress = useMemo(() => 
    calculateProgress(completedSections, examinationType),
    [completedSections, examinationType]
  );
  
  // Validation
  const validation = useMemo(() => {
    const sectionProgress = Object.fromEntries(
      allSections.map(section => [section, completedSections.includes(section)])
    ) as Record<QuestionnaireSection, boolean>;
    
    return validateQuestionnaireForExaminationType(sectionProgress, examinationType);
  }, [completedSections, examinationType, allSections]);
  
  // Can submit when all required sections are complete
  const canSubmit = validation.isValid;
  
  // Navigation helpers
  const getNextSection = (): QuestionnaireSection | null => {
    const incompleteSections = allSections.filter(
      section => !completedSections.includes(section)
    );
    return incompleteSections.length > 0 ? incompleteSections[0] : null;
  };
  
  const getPreviousSection = (): QuestionnaireSection | null => {
    const completedInOrder = allSections.filter(
      section => completedSections.includes(section)
    );
    return completedInOrder.length > 0 ? completedInOrder[completedInOrder.length - 1] : null;
  };
  
  // Update examination type with validation
  const handleSetExaminationType = (type: ExaminationType) => {
    setExaminationType(type);
  };
  
  return {
    examinationType,
    setExaminationType: handleSetExaminationType,
    config,
    requiredSections,
    optionalSections,
    allSections,
    isSectionRequired,
    isSectionOptional,
    shouldShowSection,
    progress,
    validation,
    canSubmit,
    getNextSection,
    getPreviousSection
  };
};

// Hook for managing section navigation
export const useSectionNavigation = (
  examinationType: ExaminationType,
  completedSections: QuestionnaireSection[] = []
) => {
  const [currentSection, setCurrentSection] = useState<QuestionnaireSection | null>(null);
  
  const requiredSections = getRequiredSections(examinationType);
  const optionalSections = getOptionalSections(examinationType);
  const allSections = [...requiredSections, ...optionalSections];
  
  // Initialize with first incomplete section
  useEffect(() => {
    if (!currentSection) {
      const firstIncomplete = allSections.find(section => 
        !completedSections.includes(section)
      );
      setCurrentSection(firstIncomplete || allSections[0]);
    }
  }, [allSections, completedSections, currentSection]);
  
  const goToNextSection = () => {
    if (!currentSection) return;
    
    const currentIndex = allSections.indexOf(currentSection);
    const nextIndex = currentIndex + 1;
    
    if (nextIndex < allSections.length) {
      setCurrentSection(allSections[nextIndex]);
    }
  };
  
  const goToPreviousSection = () => {
    if (!currentSection) return;
    
    const currentIndex = allSections.indexOf(currentSection);
    const previousIndex = currentIndex - 1;
    
    if (previousIndex >= 0) {
      setCurrentSection(allSections[previousIndex]);
    }
  };
  
  const goToSection = (section: QuestionnaireSection) => {
    if (allSections.includes(section)) {
      setCurrentSection(section);
    }
  };
  
  const canGoNext = currentSection ? 
    allSections.indexOf(currentSection) < allSections.length - 1 : false;
  
  const canGoPrevious = currentSection ? 
    allSections.indexOf(currentSection) > 0 : false;
  
  const currentSectionIndex = currentSection ? 
    allSections.indexOf(currentSection) + 1 : 0;
  
  return {
    currentSection,
    setCurrentSection,
    goToNextSection,
    goToPreviousSection,
    goToSection,
    canGoNext,
    canGoPrevious,
    currentSectionIndex,
    totalSections: allSections.length,
    progress: Math.round((currentSectionIndex / allSections.length) * 100)
  };
};

// Hook for examination type selection
export const useExaminationTypeSelection = () => {
  const [selectedType, setSelectedType] = useState<ExaminationType>('pre_employment');
  const [isSelecting, setIsSelecting] = useState(true);
  
  const confirmSelection = () => {
    setIsSelecting(false);
  };
  
  const changeSelection = () => {
    setIsSelecting(true);
  };
  
  const config = getExaminationTypeConfig(selectedType);
  
  return {
    selectedType,
    setSelectedType,
    isSelecting,
    confirmSelection,
    changeSelection,
    config
  };
};