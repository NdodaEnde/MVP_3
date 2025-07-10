import { CertificateGenerator, CertificateData } from './certificateGenerator';
import { MedicalDataMapper, SurgiScanPatientData } from './medicalDataMapper';
import { FitnessAssessmentEngine, FitnessAssessmentCriteria } from './fitnessAssessmentEngine';
import { getPatientById } from '../api/patients';
import { getPatientQuestionnaire } from '../api/questionnaires';
import { getPatientVitals } from '../api/vitals';
import { getPatientTests } from '../api/tests';

export interface CertificateGenerationOptions {
  patientId: string;
  doctorName: string;
  nurseName: string;
  practiceNumber: string;
  companyInfo?: {
    name: string;
    address: string;
    phone: string;
    email: string;
    logo?: string;
  };
  overrideDecision?: {
    fitnessStatus: 'fit' | 'fit-with-restriction' | 'fit-with-condition' | 'temporary-unfit' | 'unfit';
    restrictions?: string[];
    comments?: string;
  };
}

export interface CertificateGenerationResult {
  success: boolean;
  certificate?: CertificateData;
  pdfBuffer?: Buffer;
  fitnessAssessment?: any;
  errors?: string[];
  warnings?: string[];
}

export class CertificateService {
  private generator: CertificateGenerator;
  
  constructor(logoPath?: string) {
    this.generator = new CertificateGenerator(logoPath);
  }
  
  /**
   * Generate a complete Certificate of Fitness for a patient
   */
  async generateCertificateForPatient(options: CertificateGenerationOptions): Promise<CertificateGenerationResult> {
    try {
      // 1. Fetch all patient data from SurgiScan system
      const patientData = await this.fetchPatientData(options.patientId);
      
      if (!patientData) {
        return {
          success: false,
          errors: ['Patient data not found']
        };
      }
      
      // 2. Perform automated fitness assessment
      const fitnessAssessment = this.performFitnessAssessment(patientData);
      
      // 3. Apply doctor override if provided
      const finalDecision = options.overrideDecision || {
        fitnessStatus: fitnessAssessment.status,
        restrictions: fitnessAssessment.restrictions,
        comments: fitnessAssessment.recommendations
      };
      
      // 4. Enhance patient data with medical review decision
      const enhancedPatientData: SurgiScanPatientData = {
        ...patientData,
        medicalReview: {
          doctorName: options.doctorName,
          nurseName: options.nurseName,
          practiceNumber: options.practiceNumber,
          recommendations: finalDecision.comments || fitnessAssessment.recommendations,
          restrictions: finalDecision.restrictions || [],
          fitnessDecision: finalDecision.fitnessStatus
        }
      };
      
      // 5. Map SurgiScan data to certificate format
      const certificateData = MedicalDataMapper.mapToCertificateData(
        enhancedPatientData,
        options.companyInfo || this.getDefaultCompanyInfo()
      );
      
      // 6. Generate PDF certificate
      const pdfBuffer = await this.generator.generateCertificate(certificateData);
      
      // 7. Return complete result
      return {
        success: true,
        certificate: certificateData,
        pdfBuffer,
        fitnessAssessment,
        warnings: this.getWarnings(fitnessAssessment, patientData)
      };
      
    } catch (error) {
      console.error('Certificate generation error:', error);
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Unknown error occurred']
      };
    }
  }
  
  /**
   * Fetch all patient medical data from the SurgiScan system
   */
  private async fetchPatientData(patientId: string): Promise<SurgiScanPatientData | null> {
    try {
      // Fetch patient basic info
      const patientResponse = await getPatientById(patientId);
      const patient = (patientResponse as any)?.patient;
      
      if (!patient) {
        throw new Error('Patient not found');
      }
      
      // Fetch questionnaire data
      const questionnaireResponse = await getPatientQuestionnaire(patientId);
      const questionnaire = (questionnaireResponse as any)?.questionnaire;
      
      // Fetch vital signs
      const vitalsResponse = await getPatientVitals(patientId);
      const vitals = (vitalsResponse as any)?.vitals?.[0];
      
      // Fetch test results
      const testsResponse = await getPatientTests(patientId);
      const tests = (testsResponse as any)?.testResults?.[0];
      
      // Construct complete patient data object
      const patientData: SurgiScanPatientData = {
        patient: {
          _id: patient._id,
          name: patient.name,
          idNumber: patient.idNumber,
          employer: patient.employer,
          age: patient.age,
          gender: patient.gender,
          examinationType: patient.examinationType || 'pre-employment'
        },
        questionnaire: {
          medicalHistory: questionnaire?.medicalHistory || {},
          vitalSigns: vitals ? {
            bloodPressure: vitals.bloodPressure || { systolic: 0, diastolic: 0 },
            pulse: vitals.pulse || 0,
            temperature: vitals.temperature || 0,
            height: vitals.height || 0,
            weight: vitals.weight || 0,
            bmi: vitals.bmi || 0
          } : {
            bloodPressure: { systolic: 0, diastolic: 0 },
            pulse: 0,
            temperature: 0,
            height: 0,
            weight: 0,
            bmi: 0
          },
          workingAtHeights: questionnaire?.workingAtHeights
        },
        testResults: {
          vision: tests?.vision,
          hearing: tests?.hearing,
          lungFunction: tests?.lungFunction,
          drugScreen: tests?.drugScreen
        },
        medicalReview: {
          doctorName: '',
          nurseName: '',
          practiceNumber: '',
          recommendations: '',
          restrictions: [],
          fitnessDecision: 'fit'
        }
      };
      
      return patientData;
      
    } catch (error) {
      console.error('Error fetching patient data:', error);
      return null;
    }
  }
  
  /**
   * Perform automated fitness assessment based on medical data
   */
  private performFitnessAssessment(patientData: SurgiScanPatientData) {
    const criteria: FitnessAssessmentCriteria = {
      vitalSigns: {
        bloodPressure: patientData.questionnaire.vitalSigns.bloodPressure,
        pulse: patientData.questionnaire.vitalSigns.pulse,
        bmi: patientData.questionnaire.vitalSigns.bmi
      },
      vision: patientData.testResults.vision || {
        leftEye: '20/20',
        rightEye: '20/20',
        colorBlind: false
      },
      hearing: patientData.testResults.hearing || {
        leftEar: 0,
        rightEar: 0
      },
      lungFunction: patientData.testResults.lungFunction || {
        fev1: 100,
        fvc: 100,
        ratio: 100
      },
      drugScreen: patientData.testResults.drugScreen || {
        result: 'negative',
        substances: []
      },
      medicalHistory: patientData.questionnaire.medicalHistory || {
        diabetes: false,
        hypertension: false,
        heartDisease: false,
        epilepsy: false,
        asthma: false
      },
      workingAtHeights: patientData.questionnaire.workingAtHeights
    };
    
    return FitnessAssessmentEngine.assessFitness(criteria);
  }
  
  /**
   * Get warnings based on assessment and patient data
   */
  private getWarnings(assessment: any, patientData: SurgiScanPatientData): string[] {
    const warnings = [];
    
    // Check for missing critical data
    if (!patientData.testResults.vision) {
      warnings.push('Vision test results not available');
    }
    
    if (!patientData.testResults.hearing) {
      warnings.push('Hearing test results not available');
    }
    
    if (!patientData.testResults.drugScreen) {
      warnings.push('Drug screening results not available');
    }
    
    if (!patientData.questionnaire.vitalSigns.bloodPressure.systolic) {
      warnings.push('Vital signs not recorded');
    }
    
    // Check for urgent flags in assessment
    if (assessment.urgentFlags?.length > 0) {
      warnings.push(...assessment.urgentFlags);
    }
    
    return warnings;
  }
  
  /**
   * Get default company information
   */
  private getDefaultCompanyInfo() {
    return {
      name: "BLUECOLLAR OCCUPATIONAL HEALTH",
      address: "123 Medical Plaza, Johannesburg, 2000, South Africa",
      phone: "+27 11 123 4567",
      email: "certificates@bluecollar.co.za"
    };
  }
  
  /**
   * Validate patient data completeness for certificate generation
   */
  static validatePatientDataCompleteness(patientData: SurgiScanPatientData): { 
    isComplete: boolean; 
    missingItems: string[];
    canProceed: boolean;
  } {
    const missing = [];
    let canProceed = true;
    
    // Essential patient information
    if (!patientData.patient.name) missing.push('Patient name');
    if (!patientData.patient.idNumber) missing.push('ID number');
    if (!patientData.patient.employer) missing.push('Employer information');
    
    // Critical medical data
    if (!patientData.questionnaire.vitalSigns.bloodPressure.systolic) {
      missing.push('Blood pressure');
      canProceed = false;
    }
    
    if (!patientData.testResults.drugScreen?.result) {
      missing.push('Drug screening');
      canProceed = false;
    }
    
    // Important but not critical
    if (!patientData.testResults.vision) missing.push('Vision test');
    if (!patientData.testResults.hearing) missing.push('Hearing test');
    if (!patientData.testResults.lungFunction) missing.push('Lung function test');
    
    return {
      isComplete: missing.length === 0,
      missingItems: missing,
      canProceed
    };
  }
}

export default CertificateService;