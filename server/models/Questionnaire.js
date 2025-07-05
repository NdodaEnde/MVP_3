const mongoose = require('mongoose');

const questionnaireSchema = new mongoose.Schema({
  // References
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  examination: { type: mongoose.Schema.Types.ObjectId, ref: 'Examination', required: true },
  
  // Metadata
  questionnaire_id: { type: String, unique: true },
  company_name: String,
  employee_id: String,
  employee_number: String,
  protocol: String,
  examination_type: {
    type: String,
    enum: ['pre_employment', 'periodic', 'exit', 'return_to_work'],
    required: true
  },
  examination_date: Date,
  
  // Patient Demographics
  patient_demographics: {
    personal_info: {
      initials: { 
        type: String, 
        required: true,
        trim: true
      },
      first_names: { 
        type: String, 
        required: true,
        trim: true
      },
      surname: { 
        type: String, 
        required: true,
        trim: true
      },
      id_number: {
        type: String,
        required: true,
        unique: true,
        validate: {
          validator: function(idNumber) {
            const { validateAndExtractSAID } = require('../utils/sa-id-validation');
            const validation = validateAndExtractSAID(idNumber);
            return validation.isValid;
          },
          message: 'Invalid South African ID number'
        }
      },
      date_of_birth: Date,
      marital_status: {
        type: String,
        enum: ['single', 'married', 'divorced', 'widow_widower']
      },
      gender: {
        type: String,
        enum: ['male', 'female', 'other']
      },
      age: {
        type: Number,
        min: 16,
        max: 120
      }
    },
    contact_info: {
      phone: {
        type: String,
        required: true,
        validate: {
          validator: function(phone) {
            const { validateSAPhoneNumber } = require('../utils/sa-id-validation');
            return validateSAPhoneNumber(phone);
          },
          message: 'Invalid South African phone number'
        }
      },
      email: {
        type: String,
        validate: {
          validator: function(email) {
            if (!email) return true; // Optional field
            const { validateEmail } = require('../utils/sa-id-validation');
            return validateEmail(email);
          },
          message: 'Invalid email address'
        }
      },
      address: {
        street: String,
        city: String,
        province: {
          type: String,
          enum: [
            'Eastern Cape',
            'Free State', 
            'Gauteng',
            'KwaZulu-Natal',
            'Limpopo',
            'Mpumalanga',
            'Northern Cape',
            'North West',
            'Western Cape'
          ]
        },
        postal_code: {
          type: String,
          validate: {
            validator: function(postalCode) {
              if (!postalCode) return true; // Optional field
              const { validatePostalCode } = require('../utils/sa-id-validation');
              return validatePostalCode(postalCode);
            },
            message: 'Invalid postal code (must be 4 digits)'
          }
        }
      },
      emergency_contact: String
    },
    employment_info: {
      position: { 
        type: String, 
        required: true,
        trim: true
      },
      department: { 
        type: String, 
        required: true,
        trim: true
      },
      employee_number: { 
        type: String, 
        required: true,
        trim: true
      },
      company_name: { 
        type: String, 
        required: true,
        trim: true
      },
      employment_type: {
        type: String,
        enum: ['pre_employment', 'baseline', 'transfer', 'periodical', 'exit', 'other'],
        default: 'pre_employment'
      },
      start_date: Date,
      supervisor: String,
      work_location: String
    }
  },

  // Medical History
  medical_history: {
    current_conditions: {
      heart_disease_high_bp: Boolean,
      epilepsy_convulsions: Boolean,
      glaucoma_blindness: Boolean,
      diabetes_endocrine: Boolean,
      kidney_disease: Boolean,
      liver_disease: Boolean,
      mental_health_conditions: Boolean,
      neurological_conditions: Boolean,
      blood_disorders: Boolean,
      cancer_tumors: Boolean,
      autoimmune_conditions: Boolean,
      other_conditions: String
    },
    respiratory_conditions: {
      tuberculosis_pneumonia: Boolean,
      chest_discomfort_palpitations: Boolean,
      asthma_allergies: Boolean,
      chronic_cough: Boolean,
      breathing_difficulties: Boolean,
      lung_disease: Boolean,
      other_respiratory: String
    },
    occupational_health: {
      noise_exposure: Boolean,
      heat_exposure: Boolean,
      chemical_exposure: Boolean,
      dust_exposure: Boolean,
      radiation_exposure: Boolean,
      vibration_exposure: Boolean,
      fitness_status: {
        type: String,
        enum: ['fit', 'unfit', 'fit_with_restrictions']
      },
      competitive_sport: Boolean,
      regular_exercise: Boolean,
      exercise_frequency: String,
      previous_occupational_injuries: Boolean,
      injury_details: String
    },
    medication_history: {
      current_medications: [{
        name: String,
        dosage: String,
        frequency: String,
        purpose: String,
        prescribing_doctor: String
      }],
      allergies: [{
        allergen: String,
        reaction: String,
        severity: {
          type: String,
          enum: ['mild', 'moderate', 'severe']
        }
      }],
      previous_reactions: String
    },
    family_history: {
      hereditary_conditions: [String],
      cardiovascular_disease: Boolean,
      diabetes: Boolean,
      cancer: Boolean,
      mental_health: Boolean,
      other_significant: String
    }
  },
  
  // Periodic Health History (for periodic examinations)
  periodic_health_history: {
    since_last_examination: {
      illness_injury_treatment: String,
      family_history_changes: String,
      occupational_risk_profile_changes: String,
      current_medications: String
    },
    appearance_comment: String
  },
  
  // Working at Heights Assessment
  working_at_heights_assessment: {
    fear_of_heights: Boolean,
    vertigo_dizziness: Boolean,
    balance_problems: Boolean,
    previous_falls: Boolean,
    medication_affecting_balance: Boolean,
    vision_problems: Boolean,
    hearing_problems: Boolean,
    mobility_restrictions: Boolean,
    physical_fitness_level: {
      type: String,
      enum: ['excellent', 'good', 'fair', 'poor']
    },
    specific_concerns: String
  },
  
  // Return to Work Surveillance
  return_to_work_surveillance: {
    absence_reason: String,
    absence_duration: String,
    medical_clearance: Boolean,
    restrictions_required: Boolean,
    restriction_details: String,
    gradual_return_plan: String,
    follow_up_schedule: String,
    treating_physician: String,
    medical_reports_attached: Boolean
  },
  
  // Medical Treatment History
  medical_treatment_history: {
    last_two_years: [{
      date: Date,
      practitioner_name: String,
      medical_specialty: String,
      diagnosis_reason: String,
      treatment_outcome: String,
      ongoing_treatment: Boolean
    }],
    general_practitioners_ten_years: [{
      name: String,
      contact_details: String,
      period_of_care: String
    }],
    hospitalizations: [{
      date: Date,
      hospital: String,
      reason: String,
      duration: String,
      outcome: String
    }],
    surgical_history: [{
      date: Date,
      procedure: String,
      surgeon: String,
      complications: String
    }]
  },

  // Lifestyle Factors
  lifestyle_factors: {
    smoking_history: {
      current_smoker: Boolean,
      previous_smoker: Boolean,
      packs_per_day: Number,
      years_smoking: Number,
      quit_date: Date
    },
    alcohol_consumption: {
      frequency: {
        type: String,
        enum: ['never', 'occasional', 'regular', 'daily']
      },
      units_per_week: Number,
      binge_drinking: Boolean
    },
    substance_use: {
      recreational_drugs: Boolean,
      prescription_drug_misuse: Boolean,
      details: String
    },
    diet_exercise: {
      diet_quality: {
        type: String,
        enum: ['excellent', 'good', 'fair', 'poor']
      },
      exercise_frequency: {
        type: String,
        enum: ['daily', 'weekly', 'monthly', 'rarely', 'never']
      },
      sleep_quality: {
        type: String,
        enum: ['excellent', 'good', 'fair', 'poor']
      }
    }
  },
  
  // Declarations and Signatures
  declarations_and_signatures: {
    employee_declaration: {
      information_correct: Boolean,
      no_misleading_information: Boolean,
      consent_to_medical_examination: Boolean,
      consent_to_information_sharing: Boolean,
      employee_name: String,
      employee_signature: String,
      employee_signature_date: Date,
      witness_name: String,
      witness_signature: String
    },
    health_practitioner: {
      practitioner_name: String,
      practitioner_registration_number: String,
      practitioner_signature: String,
      practitioner_date: Date,
      practitioner_comments: String,
      recommendations: String,
      follow_up_required: Boolean,
      next_examination_date: Date
    }
  },

  // Validation Status
  validation_status: {
    questionnaire_complete: { type: Boolean, default: false },
    vitals_validated: { type: Boolean, default: false },
    assessment_complete: { type: Boolean, default: false },
    ready_for_certificate: { type: Boolean, default: false },
    validation_errors: [String],
    last_validated_by: String,
    last_validated_at: Date,
    completion_percentage: { type: Number, default: 0 },
    missing_sections: [String]
  },

  // Audit Trail
  audit_trail: {
    created_by: String,
    created_at: { type: Date, default: Date.now },
    updated_by: String,
    updated_at: Date,
    version_history: [{
      version: String,
      changes: String,
      changed_by: String,
      changed_at: Date
    }],
    access_log: [{
      user: String,
      action: String,
      timestamp: Date
    }]
  },
  
  // Completion Status
  completed: { type: Boolean, default: false },
  completedAt: Date,
  completedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  
  // Progress Tracking
  sectionProgress: {
    patient_demographics: { type: Boolean, default: false },
    medical_history: { type: Boolean, default: false },
    periodic_health_history: { type: Boolean, default: false },
    working_at_heights_assessment: { type: Boolean, default: false },
    return_to_work_surveillance: { type: Boolean, default: false },
    medical_treatment_history: { type: Boolean, default: false },
    lifestyle_factors: { type: Boolean, default: false },
    declarations_and_signatures: { type: Boolean, default: false }
  },
  
  // Auto-save functionality
  lastSaved: { type: Date, default: Date.now },
  autoSaveData: mongoose.Schema.Types.Mixed
  
}, {
  timestamps: true,
  versionKey: false
});

// Indexes
questionnaireSchema.index({ patient: 1 });
questionnaireSchema.index({ examination: 1 });
questionnaireSchema.index({ questionnaire_id: 1 });
questionnaireSchema.index({ completed: 1 });

// Pre-save middleware to generate questionnaire ID and validate SA ID
questionnaireSchema.pre('save', function(next) {
  // Generate questionnaire ID for new documents
  if (this.isNew && !this.questionnaire_id) {
    this.questionnaire_id = `QST-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  // Auto-populate demographics data from SA ID
  if (this.isModified('patient_demographics.personal_info.id_number')) {
    const { validateAndExtractSAID } = require('../utils/sa-id-validation');
    const idNumber = this.patient_demographics?.personal_info?.id_number;
    
    if (idNumber) {
      const validation = validateAndExtractSAID(idNumber);
      
      if (!validation.isValid) {
        return next(new Error(`Invalid SA ID: ${validation.errors.join(', ')}`));
      }
      
      // Auto-populate extracted data
      this.patient_demographics.personal_info.date_of_birth = validation.data.dateOfBirth;
      this.patient_demographics.personal_info.age = validation.data.age;
      this.patient_demographics.personal_info.gender = validation.data.gender;
      
      // Add validation metadata to audit trail
      if (!this.audit_trail) {
        this.audit_trail = [];
      }
      
      this.audit_trail.push({
        action: 'sa_id_validated',
        timestamp: new Date(),
        sa_id_validated: true,
        validation_metadata: {
          extractedData: validation.data,
          idNumber: idNumber
        }
      });
    }
  }
  
  next();
});

// Method to calculate completion percentage
questionnaireSchema.methods.getCompletionPercentage = function() {
  const sections = Object.values(this.sectionProgress);
  const completedSections = sections.filter(section => section).length;
  const percentage = Math.round((completedSections / sections.length) * 100);
  
  // Update validation status
  this.validation_status.completion_percentage = percentage;
  this.validation_status.questionnaire_complete = percentage === 100;
  
  return percentage;
};

// Method to mark section as complete
questionnaireSchema.methods.markSectionComplete = function(sectionName) {
  if (this.sectionProgress.hasOwnProperty(sectionName)) {
    this.sectionProgress[sectionName] = true;
    this.lastSaved = new Date();
    
    // Check if all sections are complete
    const allComplete = Object.values(this.sectionProgress).every(section => section);
    if (allComplete && !this.completed) {
      this.completed = true;
      this.completedAt = new Date();
    }
  }
};

// Method to auto-save partial data
questionnaireSchema.methods.autoSave = function(sectionData) {
  this.autoSaveData = { ...this.autoSaveData, ...sectionData };
  this.lastSaved = new Date();
};

// Method to validate questionnaire data
questionnaireSchema.methods.validateQuestionnaire = function() {
  const validationErrors = [];
  const missingSection = [];
  
  // Check required sections based on examination type
  const requiredSections = ['patient_demographics', 'medical_history', 'medical_treatment_history', 'declarations_and_signatures'];
  
  if (this.examination_type === 'periodic') {
    requiredSections.push('periodic_health_history');
  }
  
  if (this.examination_type === 'return_to_work') {
    requiredSections.push('return_to_work_surveillance');
  }
  
  // Check if each required section is completed
  requiredSections.forEach(section => {
    if (!this.sectionProgress[section]) {
      missingSection.push(section);
      validationErrors.push(`${section} is incomplete`);
    }
  });
  
  // Update validation status
  this.validation_status.validation_errors = validationErrors;
  this.validation_status.missing_sections = missingSection;
  this.validation_status.last_validated_at = new Date();
  
  return {
    isValid: validationErrors.length === 0,
    errors: validationErrors,
    missingSection: missingSection
  };
};

// Method to add audit log entry
questionnaireSchema.methods.addAuditEntry = function(user, action) {
  if (!this.audit_trail.access_log) {
    this.audit_trail.access_log = [];
  }
  
  this.audit_trail.access_log.push({
    user: user,
    action: action,
    timestamp: new Date()
  });
  
  this.audit_trail.updated_by = user;
  this.audit_trail.updated_at = new Date();
};

const Questionnaire = mongoose.model('Questionnaire', questionnaireSchema);

module.exports = Questionnaire;