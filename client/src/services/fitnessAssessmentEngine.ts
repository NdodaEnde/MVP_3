export interface FitnessAssessmentCriteria {
  vitalSigns: {
    bloodPressure: {
      systolic: number;
      diastolic: number;
    };
    pulse: number;
    bmi: number;
  };
  vision: {
    leftEye: string;
    rightEye: string;
    colorBlind: boolean;
  };
  hearing: {
    leftEar: number; // dB hearing level
    rightEar: number;
  };
  lungFunction: {
    fev1: number; // % predicted
    fvc: number;
    ratio: number;
  };
  drugScreen: {
    result: 'positive' | 'negative';
    substances: string[];
  };
  medicalHistory: {
    diabetes: boolean;
    hypertension: boolean;
    heartDisease: boolean;
    epilepsy: boolean;
    asthma: boolean;
  };
  workingAtHeights?: {
    fearOfHeights: boolean;
    seizuresEpilepsy: boolean;
    blackoutsDizzySpells: boolean;
    suicidalThoughts: boolean;
    substanceAbuse: boolean;
  };
}

export interface FitnessDecision {
  status: 'fit' | 'fit-with-restriction' | 'fit-with-condition' | 'temporary-unfit' | 'unfit';
  restrictions: string[];
  recommendations: string;
  reasoning: string[];
  urgentFlags: string[];
}

export class FitnessAssessmentEngine {
  
  static assessFitness(criteria: FitnessAssessmentCriteria, jobRequirements?: any): FitnessDecision {
    const decision: FitnessDecision = {
      status: 'fit',
      restrictions: [],
      recommendations: '',
      reasoning: [],
      urgentFlags: []
    };

    // Critical disqualifiers (UNFIT status)
    this.assessCriticalDisqualifiers(criteria, decision);
    
    if (decision.status === 'unfit') {
      return decision;
    }

    // Major health concerns (may result in restrictions or conditions)
    this.assessMajorConcerns(criteria, decision);
    
    // Minor health issues (may result in restrictions)
    this.assessMinorConcerns(criteria, decision);
    
    // Working at heights specific assessment
    if (jobRequirements?.workingAtHeights || criteria.workingAtHeights) {
      this.assessWorkingAtHeights(criteria, decision);
    }
    
    // Determine final status based on findings
    this.determineFinalStatus(decision);
    
    // Generate recommendations
    this.generateRecommendations(criteria, decision);
    
    return decision;
  }
  
  private static assessCriticalDisqualifiers(criteria: FitnessAssessmentCriteria, decision: FitnessDecision) {
    // Drug screen positive
    if (criteria.drugScreen?.result === 'positive') {
      decision.status = 'unfit';
      decision.reasoning.push('Positive drug screen result');
      decision.urgentFlags.push('Substance use detected');
      return;
    }
    
    // Severe vision impairment
    if (this.getVisionScore(criteria.vision?.leftEye) > 60 || 
        this.getVisionScore(criteria.vision?.rightEye) > 60) {
      decision.status = 'unfit';
      decision.reasoning.push('Severe vision impairment');
      return;
    }
    
    // Severe hearing loss (>60dB)
    if (criteria.hearing?.leftEar > 60 || criteria.hearing?.rightEar > 60) {
      decision.status = 'unfit';
      decision.reasoning.push('Severe hearing impairment');
      return;
    }
    
    // Uncontrolled severe hypertension
    if (criteria.vitalSigns?.bloodPressure?.systolic >= 180 || 
        criteria.vitalSigns?.bloodPressure?.diastolic >= 110) {
      decision.status = 'unfit';
      decision.reasoning.push('Severe uncontrolled hypertension');
      decision.urgentFlags.push('Immediate medical attention required');
      return;
    }
    
    // Severe lung function impairment
    if (criteria.lungFunction?.fev1 < 50 || criteria.lungFunction?.fvc < 50) {
      decision.status = 'unfit';
      decision.reasoning.push('Severe respiratory impairment');
      return;
    }
    
    // Working at heights critical disqualifiers
    if (criteria.workingAtHeights) {
      if (criteria.workingAtHeights.seizuresEpilepsy || 
          criteria.workingAtHeights.blackoutsDizzySpells ||
          criteria.workingAtHeights.suicidalThoughts) {
        decision.status = 'unfit';
        decision.reasoning.push('Critical safety concerns for working at heights');
        return;
      }
    }
  }
  
  private static assessMajorConcerns(criteria: FitnessAssessmentCriteria, decision: FitnessDecision) {
    // Moderate hypertension
    if (criteria.vitalSigns?.bloodPressure?.systolic >= 160 || 
        criteria.vitalSigns?.bloodPressure?.diastolic >= 100) {
      decision.status = 'fit-with-condition';
      decision.restrictions.push('Regular blood pressure monitoring required');
      decision.reasoning.push('Moderate hypertension requiring monitoring');
    }
    
    // Diabetes
    if (criteria.medicalHistory?.diabetes) {
      decision.status = 'fit-with-condition';
      decision.restrictions.push('Diabetes management and monitoring required');
      decision.reasoning.push('Diabetes mellitus requiring ongoing management');
    }
    
    // Heart disease
    if (criteria.medicalHistory?.heartDisease) {
      decision.status = 'fit-with-condition';
      decision.restrictions.push('Cardiology follow-up required');
      decision.restrictions.push('No heavy lifting or strenuous activity');
      decision.reasoning.push('Known cardiovascular disease');
    }
    
    // Moderate lung function impairment
    if (criteria.lungFunction?.fev1 < 70 || criteria.lungFunction?.fvc < 70) {
      decision.status = 'fit-with-restriction';
      decision.restrictions.push('Avoid dust exposure');
      decision.restrictions.push('Respiratory protective equipment required');
      decision.reasoning.push('Moderate respiratory impairment');
    }
  }
  
  private static assessMinorConcerns(criteria: FitnessAssessmentCriteria, decision: FitnessDecision) {
    // Mild hypertension
    if (criteria.vitalSigns?.bloodPressure?.systolic >= 140 || 
        criteria.vitalSigns?.bloodPressure?.diastolic >= 90) {
      if (decision.status === 'fit') {
        decision.status = 'fit-with-restriction';
      }
      decision.restrictions.push('Blood pressure monitoring recommended');
      decision.reasoning.push('Mild hypertension');
    }
    
    // Vision correction needed
    if (this.getVisionScore(criteria.vision?.leftEye) > 30 || 
        this.getVisionScore(criteria.vision?.rightEye) > 30) {
      if (decision.status === 'fit') {
        decision.status = 'fit-with-restriction';
      }
      decision.restrictions.push('Must wear corrective lenses during work');
      decision.reasoning.push('Vision correction required');
    }
    
    // Mild hearing loss
    if (criteria.hearing?.leftEar > 25 || criteria.hearing?.rightEar > 25) {
      if (decision.status === 'fit') {
        decision.status = 'fit-with-restriction';
      }
      decision.restrictions.push('Hearing protection required in noisy environments');
      decision.reasoning.push('Mild hearing impairment detected');
    }
    
    // Obesity
    if (criteria.vitalSigns?.bmi >= 35) {
      if (decision.status === 'fit') {
        decision.status = 'fit-with-restriction';
      }
      decision.restrictions.push('Weight management program recommended');
      decision.reasoning.push('Significant obesity');
    }
    
    // Asthma
    if (criteria.medicalHistory?.asthma) {
      if (decision.status === 'fit') {
        decision.status = 'fit-with-restriction';
      }
      decision.restrictions.push('Avoid respiratory irritants');
      decision.restrictions.push('Carry rescue inhaler');
      decision.reasoning.push('History of asthma');
    }
  }
  
  private static assessWorkingAtHeights(criteria: FitnessAssessmentCriteria, decision: FitnessDecision) {
    if (!criteria.workingAtHeights) return;
    
    // Fear of heights
    if (criteria.workingAtHeights.fearOfHeights) {
      decision.status = 'unfit';
      decision.reasoning.push('Fear of heights incompatible with job requirements');
      return;
    }
    
    // Substance abuse
    if (criteria.workingAtHeights.substanceAbuse) {
      decision.status = 'unfit';
      decision.reasoning.push('Substance abuse history incompatible with safety-critical work');
      return;
    }
  }
  
  private static determineFinalStatus(decision: FitnessDecision) {
    // If there are urgent flags, ensure appropriate status
    if (decision.urgentFlags.length > 0 && decision.status !== 'unfit') {
      decision.status = 'temporary-unfit';
    }
    
    // If there are multiple restrictions, consider upgrading status
    if (decision.restrictions.length >= 3 && decision.status === 'fit-with-restriction') {
      decision.status = 'fit-with-condition';
    }
  }
  
  private static generateRecommendations(criteria: FitnessAssessmentCriteria, decision: FitnessDecision) {
    const recommendations = [];
    
    // Based on status
    switch (decision.status) {
      case 'unfit':
        recommendations.push('Medical clearance required before returning to work');
        break;
      case 'temporary-unfit':
        recommendations.push('Address urgent medical concerns and re-evaluate');
        break;
      case 'fit-with-condition':
        recommendations.push('Regular medical monitoring required');
        break;
      case 'fit-with-restriction':
        recommendations.push('Adhere to specified work restrictions');
        break;
      default:
        recommendations.push('Continue current health practices');
    }
    
    // Specific recommendations based on findings
    if (criteria.vitalSigns?.bloodPressure?.systolic >= 140) {
      recommendations.push('Cardiovascular health assessment recommended');
    }
    
    if (criteria.vitalSigns?.bmi >= 30) {
      recommendations.push('Weight management and lifestyle counseling recommended');
    }
    
    if (criteria.lungFunction?.fev1 < 80) {
      recommendations.push('Pulmonary function monitoring recommended');
    }
    
    // Follow-up timeframe
    if (decision.status === 'fit') {
      recommendations.push('Next routine examination in 12 months');
    } else if (decision.status === 'fit-with-restriction') {
      recommendations.push('Follow-up in 6 months');
    } else {
      recommendations.push('Follow-up in 3 months or as clinically indicated');
    }
    
    decision.recommendations = recommendations.join('. ');
  }
  
  private static getVisionScore(vision: string): number {
    if (!vision) return 0;
    
    // Convert vision notation (e.g., "20/20", "20/40") to a score
    const match = vision.match(/20\/(\d+)/);
    if (match) {
      const denominator = parseInt(match[1]);
      return denominator - 20; // 20/20 = 0, 20/40 = 20, etc.
    }
    
    return 0;
  }
}

export default FitnessAssessmentEngine;