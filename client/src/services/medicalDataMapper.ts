import { CertificateData } from './certificateGenerator';

export interface SurgiScanPatientData {
  patient: {
    _id: string;
    name: string;
    idNumber: string;
    employer: string;
    age: number;
    gender: string;
    examinationType: string;
  };
  questionnaire: {
    medicalHistory: any;
    vitalSigns: {
      bloodPressure: { systolic: number; diastolic: number; };
      pulse: number;
      temperature: number;
      height: number;
      weight: number;
      bmi: number;
    };
    workingAtHeights?: {
      fearOfHeights: boolean;
      seizuresEpilepsy: boolean;
      blackoutsDizzySpells: boolean;
      suicidalThoughts: boolean;
      substanceAbuse: boolean;
    };
  };
  testResults: {
    vision?: {
      leftEye: string;
      rightEye: string;
      colorBlind: boolean;
    };
    hearing?: {
      leftEar: number;
      rightEar: number;
    };
    lungFunction?: {
      fev1: number;
      fvc: number;
      ratio: number;
    };
    drugScreen?: {
      result: 'positive' | 'negative';
      substances: string[];
    };
  };
  medicalReview: {
    doctorName: string;
    nurseName: string;
    practiceNumber: string;
    recommendations: string;
    restrictions: string[];
    fitnessDecision: 'fit' | 'fit-with-restriction' | 'fit-with-condition' | 'temporary-unfit' | 'unfit';
  };
}

export class MedicalDataMapper {
  static mapToCertificateData(
    surgiScanData: SurgiScanPatientData,
    companyInfo: any
  ): CertificateData {
    const { patient, questionnaire, testResults, medicalReview } = surgiScanData;
    
    // Split patient name into initials and surname
    const nameParts = patient.name.split(' ');
    const surname = nameParts[nameParts.length - 1];
    const initials = nameParts.slice(0, -1).map(name => name.charAt(0).toUpperCase()).join('');
    
    // Calculate expiry date (1 year from examination)
    const examDate = new Date();
    const expiryDate = new Date(examDate);
    expiryDate.setFullYear(examDate.getFullYear() + 1);
    
    return {
      companyInfo: {
        name: companyInfo.name || "BLUECOLLAR OCCUPATIONAL HEALTH",
        address: companyInfo.address || "123 Main Street, Johannesburg, South Africa",
        phone: companyInfo.phone || "+27 11 123 4567",
        email: companyInfo.email || "info@bluecollar.co.za",
        logo: companyInfo.logo
      },
      
      practitioner: {
        name: medicalReview.doctorName || "Dr. M Mphuthi",
        practiceNumber: medicalReview.practiceNumber || "0404160",
        qualifications: "MBChB, DOH, FCOEM"
      },
      
      patient: {
        initials,
        surname,
        idNumber: patient.idNumber,
        companyName: patient.employer,
        jobTitle: "Employee", // Could be extracted from questionnaire
        dateOfExamination: examDate.toISOString().split('T')[0],
        expiryDate: expiryDate.toISOString().split('T')[0]
      },
      
      examinationType: this.mapExaminationType(patient.examinationType),
      
      medicalTests: this.mapMedicalTests(testResults, questionnaire),
      
      referralActions: this.determineReferralActions(surgiScanData),
      
      restrictions: medicalReview.restrictions || [],
      
      fitnessStatus: medicalReview.fitnessDecision,
      
      comments: medicalReview.recommendations || "N/A",
      
      signatures: {
        practitioner: medicalReview.doctorName || "Dr. M Mphuthi",
        date: examDate.toISOString().split('T')[0],
        stamp: "Official Stamp"
      }
    };
  }
  
  private static mapExaminationType(type: string): 'pre-employment' | 'periodical' | 'exit' {
    const lowerType = type.toLowerCase();
    if (lowerType.includes('pre-employment') || lowerType.includes('pre_employment')) {
      return 'pre-employment';
    } else if (lowerType.includes('periodic') || lowerType.includes('periodical')) {
      return 'periodical';
    } else if (lowerType.includes('exit')) {
      return 'exit';
    }
    return 'pre-employment'; // default
  }
  
  private static mapMedicalTests(testResults: any, questionnaire: any) {
    return {
      bloods: {
        done: questionnaire.vitalSigns ? true : false,
        results: questionnaire.vitalSigns ? "Normal" : "Not Done"
      },
      ear: {
        done: testResults.hearing ? true : false,
        results: testResults.hearing ? this.formatHearingResults(testResults.hearing) : "Not Done"
      },
      nearVision: {
        done: testResults.vision ? true : false,
        results: testResults.vision ? this.formatVisionResults(testResults.vision) : "Not Done"
      },
      sizeDepth: {
        done: testResults.vision ? true : false,
        results: testResults.vision ? "Normal" : "Not Done"
      },
      nightVision: {
        done: testResults.vision ? true : false,
        results: testResults.vision ? "Normal" : "Not Done"
      },
      hearing: {
        done: testResults.hearing ? true : false,
        results: testResults.hearing ? this.formatHearingResults(testResults.hearing) : "Not Done"
      },
      workingAtHeights: {
        done: questionnaire.workingAtHeights ? true : false,
        results: questionnaire.workingAtHeights ? this.formatWorkingAtHeightsResults(questionnaire.workingAtHeights) : "Not Done"
      },
      lungFunction: {
        done: testResults.lungFunction ? true : false,
        results: testResults.lungFunction ? this.formatLungFunctionResults(testResults.lungFunction) : "Not Done"
      },
      xray: {
        done: false, // Not implemented in current system
        results: "Not Done"
      },
      drugScreen: {
        done: testResults.drugScreen ? true : false,
        results: testResults.drugScreen ? testResults.drugScreen.result.toUpperCase() : "Not Done"
      }
    };
  }
  
  private static formatHearingResults(hearing: any): string {
    if (!hearing) return "Not Done";
    const leftEar = hearing.leftEar || 0;
    const rightEar = hearing.rightEar || 0;
    
    if (leftEar <= 25 && rightEar <= 25) {
      return "Normal";
    } else if (leftEar <= 40 && rightEar <= 40) {
      return "Mild Loss";
    } else {
      return "Significant Loss";
    }
  }
  
  private static formatVisionResults(vision: any): string {
    if (!vision) return "Not Done";
    return `L: ${vision.leftEye || '20/20'}, R: ${vision.rightEye || '20/20'}`;
  }
  
  private static formatLungFunctionResults(lungFunction: any): string {
    if (!lungFunction) return "Not Done";
    
    const fev1 = lungFunction.fev1 || 0;
    const fvc = lungFunction.fvc || 0;
    
    if (fev1 >= 80 && fvc >= 80) {
      return "Normal";
    } else if (fev1 >= 60 && fvc >= 60) {
      return "Mild Restriction";
    } else {
      return "Significant Restriction";
    }
  }
  
  private static formatWorkingAtHeightsResults(workingAtHeights: any): string {
    if (!workingAtHeights) return "Not Assessed";
    
    const issues = [
      workingAtHeights.fearOfHeights && "Fear of Heights",
      workingAtHeights.seizuresEpilepsy && "Seizures/Epilepsy",
      workingAtHeights.blackoutsDizzySpells && "Blackouts/Dizzy Spells",
      workingAtHeights.suicidalThoughts && "Mental Health Concerns",
      workingAtHeights.substanceAbuse && "Substance Abuse"
    ].filter(Boolean);
    
    return issues.length > 0 ? "UNFIT - " + issues.join(", ") : "FIT";
  }
  
  private static determineReferralActions(data: SurgiScanPatientData) {
    const { questionnaire, testResults } = data;
    
    return {
      heights: questionnaire.workingAtHeights ? 
        (questionnaire.workingAtHeights.fearOfHeights || 
         questionnaire.workingAtHeights.seizuresEpilepsy ||
         questionnaire.workingAtHeights.blackoutsDizzySpells) : false,
      
      dustExposure: false, // Would need additional questionnaire data
      
      motorisedEquipment: questionnaire.workingAtHeights ?
        (questionnaire.workingAtHeights.seizuresEpilepsy ||
         questionnaire.workingAtHeights.blackoutsDizzySpells) : false,
      
      wearHearingProtection: testResults.hearing ?
        (testResults.hearing.leftEar > 25 || testResults.hearing.rightEar > 25) : false,
      
      confinedSpaces: questionnaire.workingAtHeights ?
        questionnaire.workingAtHeights.fearOfHeights : false,
      
      chemicalExposure: false, // Would need additional questionnaire data
      
      wearSpectacles: testResults.vision ?
        (testResults.vision.leftEye !== '20/20' || testResults.vision.rightEye !== '20/20') : false,
      
      remainOnTreatment: questionnaire.medicalHistory ?
        (questionnaire.medicalHistory.diabetes || 
         questionnaire.medicalHistory.hypertension ||
         questionnaire.medicalHistory.heartDisease) : false
    };
  }
}

export default MedicalDataMapper;