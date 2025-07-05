// Examination Type Configuration and Utilities

export type ExaminationType = 'pre_employment' | 'periodic' | 'exit' | 'return_to_work' | 'working_at_heights';

export type QuestionnaireSection = 
  | 'patient_demographics'
  | 'medical_history'
  | 'periodic_health_history'
  | 'working_at_heights_assessment'
  | 'return_to_work_surveillance'
  | 'medical_treatment_history'
  | 'lifestyle_factors'
  | 'declarations_and_signatures';

export interface ExaminationTypeConfig {
  title: string;
  description: string;
  color: 'blue' | 'green' | 'orange' | 'red' | 'purple';
  requiredSections: QuestionnaireSection[];
  optionalSections: QuestionnaireSection[];
  estimatedDuration: string;
  icon: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

// Get required sections based on examination type
export const getRequiredSections = (examinationType: ExaminationType): QuestionnaireSection[] => {
  const baseSections: QuestionnaireSection[] = [
    'patient_demographics',
    'medical_history',
    'declarations_and_signatures'
  ];
  
  switch (examinationType) {
    case 'pre_employment':
      return [
        ...baseSections,
        'medical_treatment_history',
        'lifestyle_factors'
      ];
    
    case 'periodic':
      return [
        ...baseSections,
        'periodic_health_history',
        'medical_treatment_history'
      ];
    
    case 'return_to_work':
      return [
        ...baseSections,
        'return_to_work_surveillance',
        'medical_treatment_history'
      ];
    
    case 'working_at_heights':
      return [
        ...baseSections,
        'working_at_heights_assessment',
        'medical_treatment_history'
      ];
    
    case 'exit':
      return [
        ...baseSections,
        'medical_treatment_history'
      ];
    
    default:
      return baseSections;
  }
};

// Get optional sections based on examination type
export const getOptionalSections = (examinationType: ExaminationType): QuestionnaireSection[] => {
  switch (examinationType) {
    case 'pre_employment':
      return ['working_at_heights_assessment'];
    
    case 'periodic':
      return ['lifestyle_factors', 'working_at_heights_assessment'];
    
    case 'return_to_work':
      return ['lifestyle_factors'];
    
    case 'working_at_heights':
      return ['lifestyle_factors', 'periodic_health_history'];
    
    case 'exit':
      return ['lifestyle_factors', 'periodic_health_history'];
    
    default:
      return [];
  }
};

// Get examination type configuration
export const getExaminationTypeConfig = (type: ExaminationType): ExaminationTypeConfig => {
  const configs: Record<ExaminationType, ExaminationTypeConfig> = {
    pre_employment: {
      title: 'Pre-Employment Medical Examination',
      description: 'Complete medical assessment for new employees before starting work',
      color: 'blue',
      requiredSections: getRequiredSections('pre_employment'),
      optionalSections: getOptionalSections('pre_employment'),
      estimatedDuration: '45-60 minutes',
      icon: 'UserPlus',
      priority: 'high'
    },
    
    periodic: {
      title: 'Periodic Health Examination',
      description: 'Regular health check for existing employees to monitor ongoing fitness',
      color: 'green',
      requiredSections: getRequiredSections('periodic'),
      optionalSections: getOptionalSections('periodic'),
      estimatedDuration: '30-45 minutes',
      icon: 'Calendar',
      priority: 'medium'
    },
    
    return_to_work: {
      title: 'Return to Work Assessment',
      description: 'Medical clearance assessment after illness, injury, or extended absence',
      color: 'orange',
      requiredSections: getRequiredSections('return_to_work'),
      optionalSections: getOptionalSections('return_to_work'),
      estimatedDuration: '30-40 minutes',
      icon: 'RotateCcw',
      priority: 'urgent'
    },
    
    working_at_heights: {
      title: 'Working at Heights Assessment',
      description: 'Specialized assessment for employees working at elevated positions',
      color: 'purple',
      requiredSections: getRequiredSections('working_at_heights'),
      optionalSections: getOptionalSections('working_at_heights'),
      estimatedDuration: '25-35 minutes',
      icon: 'Mountain',
      priority: 'high'
    },
    
    exit: {
      title: 'Exit Medical Examination',
      description: 'Final medical assessment before employee departure from organization',
      color: 'red',
      requiredSections: getRequiredSections('exit'),
      optionalSections: getOptionalSections('exit'),
      estimatedDuration: '20-30 minutes',
      icon: 'LogOut',
      priority: 'low'
    }
  };
  
  return configs[type] || configs.pre_employment;
};

// Get all examination types
export const getAllExaminationTypes = (): ExaminationType[] => {
  return ['pre_employment', 'periodic', 'return_to_work', 'working_at_heights', 'exit'];
};

// Check if section is required for examination type
export const isSectionRequired = (section: QuestionnaireSection, examinationType: ExaminationType): boolean => {
  const requiredSections = getRequiredSections(examinationType);
  return requiredSections.includes(section);
};

// Check if section is optional for examination type
export const isSectionOptional = (section: QuestionnaireSection, examinationType: ExaminationType): boolean => {
  const optionalSections = getOptionalSections(examinationType);
  return optionalSections.includes(section);
};

// Check if section should be displayed for examination type
export const shouldDisplaySection = (section: QuestionnaireSection, examinationType: ExaminationType): boolean => {
  return isSectionRequired(section, examinationType) || isSectionOptional(section, examinationType);
};

// Get section priority based on examination type
export const getSectionPriority = (section: QuestionnaireSection, examinationType: ExaminationType): number => {
  const requiredSections = getRequiredSections(examinationType);
  const optionalSections = getOptionalSections(examinationType);
  
  if (requiredSections.includes(section)) {
    return requiredSections.indexOf(section) + 1;
  }
  
  if (optionalSections.includes(section)) {
    return requiredSections.length + optionalSections.indexOf(section) + 1;
  }
  
  return 999; // Hidden sections get lowest priority
};

// Get progress calculation for examination type
export const calculateProgress = (
  completedSections: QuestionnaireSection[],
  examinationType: ExaminationType
): { percentage: number; completed: number; total: number; remaining: QuestionnaireSection[] } => {
  const requiredSections = getRequiredSections(examinationType);
  const completed = completedSections.filter(section => requiredSections.includes(section)).length;
  const total = requiredSections.length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  const remaining = requiredSections.filter(section => !completedSections.includes(section));
  
  return {
    percentage,
    completed,
    total,
    remaining
  };
};

// Get section display information
export const getSectionDisplayInfo = (section: QuestionnaireSection) => {
  const sectionInfo: Record<QuestionnaireSection, {
    title: string;
    description: string;
    icon: string;
    estimatedTime: string;
  }> = {
    patient_demographics: {
      title: 'Patient Demographics',
      description: 'Personal information and employment details',
      icon: 'User',
      estimatedTime: '5 minutes'
    },
    medical_history: {
      title: 'Medical History',
      description: 'Current conditions, medications, and health status',
      icon: 'FileText',
      estimatedTime: '10 minutes'
    },
    periodic_health_history: {
      title: 'Periodic Health History',
      description: 'Changes since last examination',
      icon: 'Clock',
      estimatedTime: '5 minutes'
    },
    working_at_heights_assessment: {
      title: 'Working at Heights Assessment',
      description: 'Safety evaluation for elevated work positions',
      icon: 'Mountain',
      estimatedTime: '8 minutes'
    },
    return_to_work_surveillance: {
      title: 'Return to Work Assessment',
      description: 'Medical clearance after absence',
      icon: 'RotateCcw',
      estimatedTime: '7 minutes'
    },
    medical_treatment_history: {
      title: 'Medical Treatment History',
      description: 'Previous treatments and healthcare providers',
      icon: 'Heart',
      estimatedTime: '8 minutes'
    },
    lifestyle_factors: {
      title: 'Lifestyle Factors',
      description: 'Smoking, alcohol, exercise, and diet habits',
      icon: 'Activity',
      estimatedTime: '6 minutes'
    },
    declarations_and_signatures: {
      title: 'Declarations & Signatures',
      description: 'Consent forms and digital signatures',
      icon: 'PenTool',
      estimatedTime: '3 minutes'
    }
  };
  
  return sectionInfo[section];
};

// Get examination type from string with validation
export const parseExaminationType = (type: string): ExaminationType => {
  const validTypes: ExaminationType[] = getAllExaminationTypes();
  if (validTypes.includes(type as ExaminationType)) {
    return type as ExaminationType;
  }
  return 'pre_employment'; // Default fallback
};

// Get color classes for examination type
export const getExaminationTypeColorClasses = (type: ExaminationType) => {
  const config = getExaminationTypeConfig(type);
  
  const colorMap = {
    blue: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-700',
      badge: 'bg-blue-100 text-blue-800'
    },
    green: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-700',
      badge: 'bg-green-100 text-green-800'
    },
    orange: {
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      text: 'text-orange-700',
      badge: 'bg-orange-100 text-orange-800'
    },
    purple: {
      bg: 'bg-purple-50',
      border: 'border-purple-200',
      text: 'text-purple-700',
      badge: 'bg-purple-100 text-purple-800'
    },
    red: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-700',
      badge: 'bg-red-100 text-red-800'
    }
  };
  
  return colorMap[config.color];
};

// Validate questionnaire completeness for examination type
export const validateQuestionnaireForExaminationType = (
  sectionProgress: Record<QuestionnaireSection, boolean>,
  examinationType: ExaminationType
): { isValid: boolean; missingRequired: QuestionnaireSection[]; errors: string[] } => {
  const requiredSections = getRequiredSections(examinationType);
  const missingRequired = requiredSections.filter(section => !sectionProgress[section]);
  const errors = missingRequired.map(section => {
    const info = getSectionDisplayInfo(section);
    return `${info.title} is required for ${getExaminationTypeConfig(examinationType).title}`;
  });
  
  return {
    isValid: missingRequired.length === 0,
    missingRequired,
    errors
  };
};