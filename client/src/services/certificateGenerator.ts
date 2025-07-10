export interface DraftCertificateData {
  // Patient and administrative data (auto-filled)
  patientInfo: {
    initials: string;
    surname: string;
    idNumber: string;
    companyName: string;
    jobTitle: string;
    dateOfExamination: string;
    expiryDate: string;
    examinationType: 'pre-employment' | 'periodical' | 'exit';
  };
  
  // Medical test results (auto-filled from system)
  medicalTestResults: {
    bloods: { done: boolean; results: string; };
    vitalSigns: { 
      bloodPressure: string; 
      pulse: string; 
      temperature: string; 
      height: string; 
      weight: string; 
      bmi: string; 
    };
    vision: { done: boolean; results: string; };
    hearing: { done: boolean; results: string; };
    lungFunction: { done: boolean; results: string; };
    drugScreen: { done: boolean; results: string; };
    workingAtHeights: { done: boolean; results: string; };
    xray: { done: boolean; results: string; };
  };
  
  // Medical history summary (auto-filled from questionnaire)
  medicalHistorySummary: {
    significantConditions: string[];
    medications: string[];
    allergies: string[];
    previousSurgeries: string[];
    familyHistory: string[];
  };
  
  // Doctor's Review Section (to be completed by doctor)
  doctorReview: {
    fitnessStatus: '' | 'fit' | 'fit-with-restriction' | 'fit-with-condition' | 'temporary-unfit' | 'unfit';
    restrictions: string[];
    referralActions: {
      heights: boolean;
      dustExposure: boolean;
      motorisedEquipment: boolean;
      wearHearingProtection: boolean;
      confinedSpaces: boolean;
      chemicalExposure: boolean;
      wearSpectacles: boolean;
      remainOnTreatment: boolean;
    };
    doctorComments: string;
    clinicalNotes: string;
    followUpRequired: boolean;
    followUpDate?: string;
    
    // Signature and approval
    practitionerName: string;
    practiceNumber: string;
    dateReviewed: string;
    digitalSignature?: string;
    officialStamp?: string;
    approved: boolean;
  };
}

export class DraftCertificateGenerator {
  
  /**
   * Generate a draft certificate pre-filled with patient data for doctor review
   */
  static async generateDraftCertificate(patientId: string): Promise<DraftCertificateData> {
    // Fetch all patient data from SurgiScan
    const patientData = await this.fetchPatientMedicalData(patientId);
    
    return {
      patientInfo: this.extractPatientInfo(patientData),
      medicalTestResults: this.extractTestResults(patientData),
      medicalHistorySummary: this.extractMedicalHistory(patientData),
      doctorReview: {
        // Empty - to be filled by doctor
        fitnessStatus: '',
        restrictions: [],
        referralActions: {
          heights: false,
          dustExposure: false,
          motorisedEquipment: false,
          wearHearingProtection: false,
          confinedSpaces: false,
          chemicalExposure: false,
          wearSpectacles: false,
          remainOnTreatment: false
        },
        doctorComments: '',
        clinicalNotes: '',
        followUpRequired: false,
        practitionerName: '',
        practiceNumber: '',
        dateReviewed: new Date().toISOString().split('T')[0],
        approved: false
      }
    };
  }
  
  /**
   * Finalize certificate after doctor review and approval
   */
  static async finalizeCertificate(
    draftCertificate: DraftCertificateData,
    doctorApproval: {
      practitionerName: string;
      practiceNumber: string;
      digitalSignature: string;
      officialStamp: string;
    }
  ): Promise<Buffer> {
    // Validate doctor has completed all required fields
    this.validateDoctorReview(draftCertificate);
    
    // Update with doctor's signature and stamp
    draftCertificate.doctorReview.practitionerName = doctorApproval.practitionerName;
    draftCertificate.doctorReview.practiceNumber = doctorApproval.practiceNumber;
    draftCertificate.doctorReview.digitalSignature = doctorApproval.digitalSignature;
    draftCertificate.doctorReview.officialStamp = doctorApproval.officialStamp;
    draftCertificate.doctorReview.approved = true;
    
    // Generate final PDF certificate
    const finalCertificateData = this.convertToFinalCertificate(draftCertificate);
    const generator = new CertificateGenerator();
    
    return await generator.generateCertificate(finalCertificateData);
  }
  
  private static extractPatientInfo(patientData: any) {
    const nameParts = patientData.patient.name.split(' ');
    const surname = nameParts[nameParts.length - 1];
    const initials = nameParts.slice(0, -1).map((name: string) => name.charAt(0).toUpperCase()).join('');
    
    const examDate = new Date();
    const expiryDate = new Date(examDate);
    expiryDate.setFullYear(examDate.getFullYear() + 1);
    
    return {
      initials,
      surname,
      idNumber: patientData.patient.idNumber,
      companyName: patientData.patient.employer,
      jobTitle: patientData.questionnaire?.jobTitle || 'Employee',
      dateOfExamination: examDate.toISOString().split('T')[0],
      expiryDate: expiryDate.toISOString().split('T')[0],
      examinationType: patientData.patient.examinationType || 'pre-employment'
    };
  }
  
  private static extractTestResults(patientData: any) {
    const vitals = patientData.vitals?.[0];
    const tests = patientData.tests?.[0];
    
    return {
      bloods: {
        done: vitals ? true : false,
        results: vitals ? this.formatBloodResults(vitals) : 'Not Done'
      },
      vitalSigns: {
        bloodPressure: vitals ? `${vitals.bloodPressure?.systolic}/${vitals.bloodPressure?.diastolic} mmHg` : 'Not Recorded',
        pulse: vitals ? `${vitals.pulse} bpm` : 'Not Recorded',
        temperature: vitals ? `${vitals.temperature}°C` : 'Not Recorded',
        height: vitals ? `${vitals.height} cm` : 'Not Recorded',
        weight: vitals ? `${vitals.weight} kg` : 'Not Recorded',
        bmi: vitals ? `${vitals.bmi}` : 'Not Calculated'
      },
      vision: {
        done: tests?.vision ? true : false,
        results: tests?.vision ? `L: ${tests.vision.leftEye}, R: ${tests.vision.rightEye}` : 'Not Done'
      },
      hearing: {
        done: tests?.hearing ? true : false,
        results: tests?.hearing ? `L: ${tests.hearing.leftEar}dB, R: ${tests.hearing.rightEar}dB` : 'Not Done'
      },
      lungFunction: {
        done: tests?.lungFunction ? true : false,
        results: tests?.lungFunction ? `FEV1: ${tests.lungFunction.fev1}%, FVC: ${tests.lungFunction.fvc}%` : 'Not Done'
      },
      drugScreen: {
        done: tests?.drugScreen ? true : false,
        results: tests?.drugScreen ? tests.drugScreen.result.toUpperCase() : 'Not Done'
      },
      workingAtHeights: {
        done: patientData.questionnaire?.workingAtHeights ? true : false,
        results: patientData.questionnaire?.workingAtHeights ? 'Assessed' : 'Not Assessed'
      },
      xray: {
        done: false,
        results: 'Not Done'
      }
    };
  }
  
  private static extractMedicalHistory(patientData: any) {
    const questionnaire = patientData.questionnaire;
    
    return {
      significantConditions: this.extractConditions(questionnaire?.medicalHistory),
      medications: questionnaire?.medications || [],
      allergies: questionnaire?.allergies || [],
      previousSurgeries: questionnaire?.surgeries || [],
      familyHistory: questionnaire?.familyHistory || []
    };
  }
  
  private static extractConditions(medicalHistory: any): string[] {
    if (!medicalHistory) return [];
    
    const conditions = [];
    if (medicalHistory.diabetes) conditions.push('Diabetes Mellitus');
    if (medicalHistory.hypertension) conditions.push('Hypertension');
    if (medicalHistory.heartDisease) conditions.push('Heart Disease');
    if (medicalHistory.epilepsy) conditions.push('Epilepsy');
    if (medicalHistory.asthma) conditions.push('Asthma');
    
    return conditions;
  }
  
  private static formatBloodResults(vitals: any): string {
    const results = [];
    
    if (vitals.bloodPressure) {
      const { systolic, diastolic } = vitals.bloodPressure;
      if (systolic >= 140 || diastolic >= 90) {
        results.push('Hypertension');
      } else {
        results.push('Normal BP');
      }
    }
    
    // Add other blood-related results here
    return results.join(', ') || 'Normal';
  }
  
  private static validateDoctorReview(certificate: DraftCertificateData) {
    const review = certificate.doctorReview;
    
    if (!review.fitnessStatus) {
      throw new Error('Doctor must determine fitness status');
    }
    
    if (!review.practitionerName) {
      throw new Error('Practitioner name is required');
    }
    
    if (!review.practiceNumber) {
      throw new Error('Practice number is required');
    }
    
    if (review.fitnessStatus !== 'fit' && review.restrictions.length === 0 && !review.doctorComments) {
      throw new Error('Restrictions or comments required for non-fit status');
    }
  }
  
  private static convertToFinalCertificate(draft: DraftCertificateData): CertificateData {
    return {
      companyInfo: {
        name: "BLUECOLLAR OCCUPATIONAL HEALTH",
        address: "123 Medical Plaza, Johannesburg, 2000, South Africa",
        phone: "+27 11 123 4567",
        email: "certificates@bluecollar.co.za"
      },
      practitioner: {
        name: draft.doctorReview.practitionerName,
        practiceNumber: draft.doctorReview.practiceNumber,
        qualifications: "MBChB, DOH, FCOEM"
      },
      patient: draft.patientInfo,
      examinationType: draft.patientInfo.examinationType,
      medicalTests: {
        bloods: draft.medicalTestResults.bloods,
        ear: { done: false, results: 'Not Done' },
        nearVision: draft.medicalTestResults.vision,
        sizeDepth: { done: false, results: 'Not Done' },
        nightVision: { done: false, results: 'Not Done' },
        hearing: draft.medicalTestResults.hearing,
        workingAtHeights: draft.medicalTestResults.workingAtHeights,
        lungFunction: draft.medicalTestResults.lungFunction,
        xray: draft.medicalTestResults.xray,
        drugScreen: draft.medicalTestResults.drugScreen
      },
      referralActions: draft.doctorReview.referralActions,
      restrictions: draft.doctorReview.restrictions,
      fitnessStatus: draft.doctorReview.fitnessStatus,
      comments: draft.doctorReview.doctorComments,
      signatures: {
        practitioner: draft.doctorReview.practitionerName,
        date: draft.doctorReview.dateReviewed,
        stamp: draft.doctorReview.officialStamp
      }
    };
  }
  
  private static async fetchPatientMedicalData(patientId: string) {
    // Implementation to fetch all patient data
    // This would call the existing SurgiScan APIs
    return {};
  }
}
  // Header Information
  companyInfo: {
    name: string;
    address: string;
    phone: string;
    email: string;
    logo?: string;
  };
  
  // Practitioner Information
  practitioner: {
    name: string;
    practiceNumber: string;
    qualifications: string;
  };
  
  // Patient Information
  patient: {
    initials: string;
    surname: string;
    idNumber: string;
    companyName: string;
    jobTitle: string;
    dateOfExamination: string;
    expiryDate: string;
  };
  
  // Examination Type
  examinationType: 'pre-employment' | 'periodical' | 'exit';
  
  // Medical Tests Results
  medicalTests: {
    bloods: { done: boolean; results: string; };
    ear: { done: boolean; results: string; };
    nearVision: { done: boolean; results: string; };
    sizeDepth: { done: boolean; results: string; };
    nightVision: { done: boolean; results: string; };
    hearing: { done: boolean; results: string; };
    workingAtHeights: { done: boolean; results: string; };
    lungFunction: { done: boolean; results: string; };
    xray: { done: boolean; results: string; };
    drugScreen: { done: boolean; results: string; };
  };
  
  // Referral Actions
  referralActions: {
    heights: boolean;
    dustExposure: boolean;
    motorisedEquipment: boolean;
    wearHearingProtection: boolean;
    confinedSpaces: boolean;
    chemicalExposure: boolean;
    wearSpectacles: boolean;
    remainOnTreatment: boolean;
  };
  
  // Restrictions  
  restrictions: string[];
  
  // Fitness Declaration
  fitnessStatus: 'fit' | 'fit-with-restriction' | 'fit-with-condition' | 'temporary-unfit' | 'unfit';
  
  // Comments
  comments: string;
  
  // Signatures
  signatures: {
    practitioner: string;
    date: string;
    stamp?: string;
  };
}

export class CertificateGenerator {
  private companyLogo?: Buffer;
  
  constructor(logoPath?: string) {
    if (logoPath && fs.existsSync(logoPath)) {
      this.companyLogo = fs.readFileSync(logoPath);
    }
  }
  
  async generateCertificate(data: CertificateData): Promise<Buffer> {
    const doc = new Document({
      sections: [{
        headers: {
          default: this.createHeader(data.companyInfo),
        },
        children: [
          this.createTitle(),
          this.createPractitionerInfo(data.practitioner),
          this.createPatientInfo(data.patient),
          this.createExaminationType(data.examinationType),
          this.createMedicalTestsTable(data.medicalTests),
          this.createReferralActions(data.referralActions),
          this.createRestrictions(data.restrictions),
          this.createFitnessDeclaration(data.fitnessStatus),
          this.createComments(data.comments),
          this.createSignatureSection(data.signatures)
        ]
      }]
    });
    
    return await Packer.toBuffer(doc);
  }
  
  private createHeader(companyInfo: CertificateData['companyInfo']): Header {
    const children = [];
    
    if (this.companyLogo) {
      children.push(
        new Paragraph({
          children: [
            new ImageRun({
              data: this.companyLogo,
              transformation: {
                width: 100,
                height: 50,
              },
            }),
          ],
          alignment: AlignmentType.LEFT,
        })
      );
    }
    
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: companyInfo.name.toUpperCase(),
            bold: true,
            size: 24,
          }),
        ],
        alignment: AlignmentType.CENTER,
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: companyInfo.address,
            size: 20,
          }),
        ],
        alignment: AlignmentType.CENTER,
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: `Tel: ${companyInfo.phone} | Email: ${companyInfo.email}`,
            size: 20,
          }),
        ],
        alignment: AlignmentType.CENTER,
      })
    );
    
    return new Header({
      children: children
    });
  }
  
  private createTitle(): Paragraph {
    return new Paragraph({
      children: [
        new TextRun({
          text: "CERTIFICATE OF FITNESS",
          bold: true,
          size: 28,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    });
  }
  
  private createPractitionerInfo(practitioner: CertificateData['practitioner']): Paragraph {
    return new Paragraph({
      children: [
        new TextRun({
          text: `Dr ${practitioner.name} / Practice No: ${practitioner.practiceNumber} / ${practitioner.qualifications}`,
          size: 22,
        }),
      ],
      spacing: { after: 200 },
    });
  }
  
  private createPatientInfo(patient: CertificateData['patient']): Table {
    return new Table({
      rows: [
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph("Initials & Surname:")],
              width: { size: 30, type: 'pct' },
            }),
            new TableCell({
              children: [new Paragraph(`${patient.initials} ${patient.surname}`)],
              width: { size: 20, type: 'pct' },
            }),
            new TableCell({
              children: [new Paragraph("ID No:")],
              width: { size: 20, type: 'pct' },
            }),
            new TableCell({
              children: [new Paragraph(patient.idNumber)],
              width: { size: 30, type: 'pct' },
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph("Company Name:")],
            }),
            new TableCell({
              children: [new Paragraph(patient.companyName)],
              columnSpan: 3,
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph("Date of Examination:")],
            }),
            new TableCell({
              children: [new Paragraph(patient.dateOfExamination)],
            }),
            new TableCell({
              children: [new Paragraph("Expiry Date:")],
            }),
            new TableCell({
              children: [new Paragraph(patient.expiryDate)],
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph("Job Title:")],
            }),
            new TableCell({
              children: [new Paragraph(patient.jobTitle)],
              columnSpan: 3,
            }),
          ],
        }),
      ],
    });
  }
  
  private createExaminationType(examinationType: CertificateData['examinationType']): Table {
    const checkboxes = {
      'pre-employment': '☑',
      'periodical': '☐',
      'exit': '☐'
    };
    
    if (examinationType === 'periodical') {
      checkboxes['pre-employment'] = '☐';
      checkboxes['periodical'] = '☑';
    } else if (examinationType === 'exit') {
      checkboxes['pre-employment'] = '☐';
      checkboxes['exit'] = '☑';
    }
    
    return new Table({
      rows: [
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph(`${checkboxes['pre-employment']} PRE-EMPLOYMENT`)],
            }),
            new TableCell({
              children: [new Paragraph(`${checkboxes['periodical']} PERIODICAL`)],
            }),
            new TableCell({
              children: [new Paragraph(`${checkboxes['exit']} EXIT`)],
            }),
          ],
        }),
      ],
    });
  }
  
  private createMedicalTestsTable(tests: CertificateData['medicalTests']): Table {
    return new Table({
      rows: [
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph("MEDICAL EXAMINATION CONDUCTED INCLUDES THE FOLLOWING TESTS")],
              columnSpan: 4,
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph("Done")] }),
            new TableCell({ children: [new Paragraph("Results")] }),
            new TableCell({ children: [new Paragraph("Done")] }),
            new TableCell({ children: [new Paragraph("Results")] }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph(`${tests.bloods.done ? '☑' : '☐'} BLOODS`)] }),
            new TableCell({ children: [new Paragraph(tests.bloods.results)] }),
            new TableCell({ children: [new Paragraph(`${tests.hearing.done ? '☑' : '☐'} Hearing`)] }),
            new TableCell({ children: [new Paragraph(tests.hearing.results)] }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph(`${tests.ear.done ? '☑' : '☐'} EAR`)] }),
            new TableCell({ children: [new Paragraph(tests.ear.results)] }),
            new TableCell({ children: [new Paragraph(`${tests.workingAtHeights.done ? '☑' : '☐'} Working at Heights`)] }),
            new TableCell({ children: [new Paragraph(tests.workingAtHeights.results)] }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph(`${tests.nearVision.done ? '☑' : '☐'} NEAR VISION`)] }),
            new TableCell({ children: [new Paragraph(tests.nearVision.results)] }),
            new TableCell({ children: [new Paragraph(`${tests.lungFunction.done ? '☑' : '☐'} Lung Function`)] }),
            new TableCell({ children: [new Paragraph(tests.lungFunction.results)] }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph(`${tests.sizeDepth.done ? '☑' : '☐'} SIZE & DEPTH`)] }),
            new TableCell({ children: [new Paragraph(tests.sizeDepth.results)] }),
            new TableCell({ children: [new Paragraph(`${tests.xray.done ? '☑' : '☐'} X-Ray`)] }),
            new TableCell({ children: [new Paragraph(tests.xray.results)] }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph(`${tests.nightVision.done ? '☑' : '☐'} NIGHT VISION`)] }),
            new TableCell({ children: [new Paragraph(tests.nightVision.results)] }),
            new TableCell({ children: [new Paragraph(`${tests.drugScreen.done ? '☑' : '☐'} Drug Screen`)] }),
            new TableCell({ children: [new Paragraph(tests.drugScreen.results)] }),
          ],
        }),
      ],
    });
  }
  
  private createReferralActions(actions: CertificateData['referralActions']): Paragraph {
    const actionTexts = [
      `${actions.heights ? '☑' : '☐'} Heights`,
      `${actions.dustExposure ? '☑' : '☐'} Dust Exposure`,
      `${actions.motorisedEquipment ? '☑' : '☐'} Motorised Equipment`,
      `${actions.wearHearingProtection ? '☑' : '☐'} Wear Hearing Protection`,
      `${actions.confinedSpaces ? '☑' : '☐'} Confined Spaces`,
      `${actions.chemicalExposure ? '☑' : '☐'} Chemical Exposure`,
      `${actions.wearSpectacles ? '☑' : '☐'} Wear Spectacles`,
      `${actions.remainOnTreatment ? '☑' : '☐'} Remain on Treatment for Chronic Condition`,
    ];
    
    return new Paragraph({
      children: [
        new TextRun({
          text: "Referred for follow up actions:",
          bold: true,
        }),
        new TextRun({
          text: "\n" + actionTexts.join("   "),
        }),
      ],
      spacing: { after: 200 },
    });
  }
  
  private createRestrictions(restrictions: string[]): Paragraph {
    return new Paragraph({
      children: [
        new TextRun({
          text: "Restrictions:",
          bold: true,
        }),
        new TextRun({
          text: restrictions.length > 0 ? "\n" + restrictions.join(", ") : "\nNone",
        }),
      ],
      spacing: { after: 200 },
    });
  }
  
  private createFitnessDeclaration(status: CertificateData['fitnessStatus']): Table {
    const statusMap = {
      'fit': '☑ FIT',
      'fit-with-restriction': '☑ Fit with Restriction',
      'fit-with-condition': '☑ FIT with Condition',
      'temporary-unfit': '☑ Temporary Unfit',
      'unfit': '☑ UNFIT'
    };
    
    const getStatusText = (statusKey: string) => {
      return status === statusKey ? statusMap[status as keyof typeof statusMap] : 
             statusKey === 'fit' ? '☐ FIT' :
             statusKey === 'fit-with-restriction' ? '☐ Fit with Restriction' :
             statusKey === 'fit-with-condition' ? '☐ FIT with Condition' :
             statusKey === 'temporary-unfit' ? '☐ Temporary Unfit' : '☐ UNFIT';
    };
    
    return new Table({
      rows: [
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph("Fitness Declaration")],
              columnSpan: 5,
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph(getStatusText('fit'))] }),
            new TableCell({ children: [new Paragraph(getStatusText('fit-with-restriction'))] }),
            new TableCell({ children: [new Paragraph(getStatusText('fit-with-condition'))] }),
            new TableCell({ children: [new Paragraph(getStatusText('temporary-unfit'))] }),
            new TableCell({ children: [new Paragraph(getStatusText('unfit'))] }),
          ],
        }),
      ],
    });
  }
  
  private createComments(comments: string): Paragraph {
    return new Paragraph({
      children: [
        new TextRun({
          text: "Comments:",
          bold: true,
        }),
        new TextRun({
          text: "\n" + (comments || "N/A"),
        }),
      ],
      spacing: { after: 200 },
    });
  }
  
  private createSignatureSection(signatures: CertificateData['signatures']): Table {
    return new Table({
      rows: [
        new TableRow({
          children: [
            new TableCell({
              children: [
                new Paragraph("Occupational Health Practitioner / Occupational Medical Practitioner"),
                new Paragraph(""),
                new Paragraph("Dr. Signature:"),
              ],
            }),
            new TableCell({
              children: [
                new Paragraph(""),
                new Paragraph(""),
                new Paragraph("STAMP"),
              ],
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph(`SIGNATURE: ${signatures.practitioner}`)],
            }),
            new TableCell({
              children: [new Paragraph(`Date: ${signatures.date}`)],
            }),
          ],
        }),
      ],
    });
  }
}

export default CertificateGenerator;