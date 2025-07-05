const mongoose = require('mongoose');

const testResultsSchema = new mongoose.Schema({
  // References
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  examination: { type: mongoose.Schema.Types.ObjectId, ref: 'Examination', required: true },
  
  // Vision Testing
  vision: {
    visual_acuity_far_6m: {
      right_eye: String,
      left_eye: String
    },
    near_50cm: {
      right_eye: String,
      left_eye: String,
      correction_glasses_contact: {
        type: String,
        enum: ['yes', 'no']
      }
    },
    vision_fields: String,
    colour_vision: String,
    restrictions: String,
    pass_fail: {
      type: String,
      enum: ['pass', 'fail', 'conditional']
    }
  },
  
  // Hearing Assessment
  audiometry: {
    plh_current: Number,
    plh_shift: Number,
    plh_shift_noise_related: {
      type: String,
      enum: ['yes', 'no']
    },
    hearing_thresholds: {
      left_ear: {
        freq_500: Number,
        freq_1000: Number,
        freq_2000: Number,
        freq_4000: Number,
        freq_8000: Number
      },
      right_ear: {
        freq_500: Number,
        freq_1000: Number,
        freq_2000: Number,
        freq_4000: Number,
        freq_8000: Number
      }
    },
    hearing_protection_assessment: String,
    noise_exposure_history: String,
    hearing_aid_usage: String,
    restrictions: String,
    pass_fail: {
      type: String,
      enum: ['pass', 'fail', 'conditional']
    }
  },
  
  // Lung Function Testing
  lung_function: {
    fvc_actual_percentage: Number,
    fvc1_actual_percentage: Number,
    fvc1_fvc_actual: Number,
    peak_flow: Number,
    spirometry_results: {
      fev1: Number,
      fvc: Number,
      fev1_fvc_ratio: Number,
      predicted_fev1: Number,
      predicted_fvc: Number
    },
    respiratory_symptoms: String,
    smoking_history: String,
    occupational_exposure: String,
    respiratory_fitness_classification: String,
    restrictions: String
  },
  
  // Drug Screening
  drug_screening: {
    test_type: {
      type: String,
      enum: ['urine', 'saliva', 'hair']
    },
    chain_of_custody: {
      collected_by: String,
      collection_date: Date,
      collection_time: String,
      specimen_id: String,
      security_seals: [String]
    },
    results: {
      result_status: {
        type: String,
        enum: ['negative', 'positive', 'pending', 'invalid']
      },
      substances_detected: [String],
      confirmation_required: Boolean,
      confirmation_results: String
    },
    medical_review_officer: {
      name: String,
      notes: String,
      reviewed_date: Date
    },
    privacy_controls: {
      access_restricted: Boolean,
      authorized_personnel: [String]
    }
  },
  
  // X-Ray and Imaging
  xray_imaging: {
    images: [{
      image_url: String,
      image_type: String,
      upload_date: Date,
      file_size: Number,
      metadata: mongoose.Schema.Types.Mixed
    }],
    radiologist_report: {
      report_text: String,
      radiologist_name: String,
      report_date: Date,
      abnormalities: [String]
    },
    findings: {
      result_summary: String,
      abnormality_classification: String,
      comparison_with_previous: String,
      recommendations: String
    },
    pacs_integration: {
      pacs_id: String,
      study_id: String,
      series_id: String
    }
  },
  
  // Special Assessments
  special_assessment: {
    respiratory: String,
    musculoskeletal: String,
    skin: String,
    psycho_epworth: String,
    audio: String,
    shift: String,
    heat: String,
    epworth: String,
    bp: String,
    iddn: String,
    niddm: String,
    epilepsy: String,
    coad: String,
    hd: String,
    tb_act: String,
    back: String,
    ca: String,
    asthma: String,
    depression: String,
    chol: String,
    tb_old: String,
    dermatitis: String,
    immun: String
  },
  
  // Equipment and Calibration
  equipment_used: {
    vision_equipment: {
      snellen_chart_id: String,
      color_vision_test_id: String,
      calibration_date: Date
    },
    audiometry_equipment: {
      audiometer_id: String,
      calibration_date: Date,
      ambient_noise_level: Number
    },
    spirometry_equipment: {
      spirometer_id: String,
      calibration_date: Date,
      quality_control_tests: [String]
    },
    xray_equipment: {
      machine_id: String,
      last_service_date: Date,
      radiation_dose: Number
    }
  },
  
  // Quality Control
  quality_control: {
    test_validity: {
      vision_test_valid: Boolean,
      hearing_test_valid: Boolean,
      lung_function_valid: Boolean,
      drug_screen_valid: Boolean,
      xray_valid: Boolean
    },
    quality_flags: [String],
    retest_required: Boolean,
    retest_reason: String,
    technician_notes: String
  },
  
  // Completion and Signatures
  technician_signature: {
    signature_data: String,
    technician_name: String,
    technician_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    signed_at: Date
  },
  
  // Workflow Status
  completed: { type: Boolean, default: false },
  completedAt: Date,
  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  // Review and Validation
  reviewed: { type: Boolean, default: false },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: Date,
  review_notes: String

}, {
  timestamps: true,
  versionKey: false
});

// Indexes
testResultsSchema.index({ patient: 1 });
testResultsSchema.index({ examination: 1 });
testResultsSchema.index({ recordedBy: 1 });
testResultsSchema.index({ completed: 1 });

// Method to calculate overall test results
testResultsSchema.methods.calculateOverallResults = function() {
  const results = {
    vision: 'not_tested',
    hearing: 'not_tested',
    lung_function: 'not_tested',
    drug_screening: 'not_tested',
    xray: 'not_tested',
    overall_fitness: 'pending'
  };
  
  // Vision assessment
  if (this.vision && this.vision.pass_fail) {
    results.vision = this.vision.pass_fail;
  }
  
  // Hearing assessment
  if (this.audiometry && this.audiometry.pass_fail) {
    results.hearing = this.audiometry.pass_fail;
  }
  
  // Lung function assessment
  if (this.lung_function && this.lung_function.fvc_actual_percentage) {
    results.lung_function = this.lung_function.fvc_actual_percentage >= 80 ? 'pass' : 'fail';
  }
  
  // Drug screening
  if (this.drug_screening && this.drug_screening.results.result_status) {
    results.drug_screening = this.drug_screening.results.result_status === 'negative' ? 'pass' : 'fail';
  }
  
  // X-ray assessment
  if (this.xray_imaging && this.xray_imaging.findings.result_summary) {
    results.xray = this.xray_imaging.findings.result_summary.toLowerCase().includes('normal') ? 'pass' : 'conditional';
  }
  
  // Overall fitness determination
  const testResults = [results.vision, results.hearing, results.lung_function, results.drug_screening, results.xray];
  if (testResults.includes('fail')) {
    results.overall_fitness = 'unfit';
  } else if (testResults.includes('conditional')) {
    results.overall_fitness = 'fit_with_restrictions';
  } else if (testResults.every(result => result === 'pass' || result === 'not_tested')) {
    results.overall_fitness = 'fit';
  }
  
  return results;
};

// Method to generate restrictions based on test results
testResultsSchema.methods.generateRestrictions = function() {
  const restrictions = [];
  
  if (this.vision && this.vision.restrictions) {
    restrictions.push(this.vision.restrictions);
  }
  
  if (this.audiometry && this.audiometry.restrictions) {
    restrictions.push(this.audiometry.restrictions);
  }
  
  if (this.lung_function && this.lung_function.restrictions) {
    restrictions.push(this.lung_function.restrictions);
  }
  
  return restrictions;
};

// Method to complete test results
testResultsSchema.methods.complete = function(technicianId, signatureData) {
  this.completed = true;
  this.completedAt = new Date();
  this.technician_signature = {
    signature_data: signatureData,
    technician_id: technicianId,
    signed_at: new Date()
  };
  
  // Perform quality control checks
  this.performQualityControl();
};

// Method to perform quality control checks
testResultsSchema.methods.performQualityControl = function() {
  const flags = [];
  
  // Check for incomplete tests
  if (this.vision && !this.vision.pass_fail) {
    flags.push('Vision test result incomplete');
  }
  
  if (this.audiometry && !this.audiometry.pass_fail) {
    flags.push('Hearing test result incomplete');
  }
  
  // Check for extreme values
  if (this.lung_function && this.lung_function.fvc_actual_percentage < 50) {
    flags.push('Extremely low lung function - verify results');
  }
  
  this.quality_control.quality_flags = flags;
  this.quality_control.retest_required = flags.length > 0;
};

const TestResults = mongoose.model('TestResults', testResultsSchema);

module.exports = TestResults;