const mongoose = require('mongoose');

const vitalSignsSchema = new mongoose.Schema({
  // References
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  examination: { type: mongoose.Schema.Types.ObjectId, ref: 'Examination', required: true },
  
  // Physical Measurements
  physical_measurements: {
    height_cm: { type: Number, required: true },
    weight_kg: { type: Number, required: true },
    bmi: { type: Number }, // Calculated automatically
    weight_change_5kg_past_year: Boolean,
    weight_change_reason: String
  },
  
  // Cardiovascular Measurements
  cardiovascular: {
    pulse_rate_per_min: { type: Number, required: true },
    blood_pressure: {
      systolic: { type: Number, required: true },
      diastolic: { type: Number, required: true },
      patient_position: {
        type: String,
        enum: ['sitting', 'standing', 'lying'],
        default: 'sitting'
      },
      repeat_required: Boolean,
      repeat_systolic: Number,
      repeat_diastolic: Number
    },
    abnormal_bp_reason: {
      type: String,
      enum: ['not_responding_to_treatment', 'never_diagnosed', 'defaulted_treatment']
    }
  },
  
  // General Measurements
  general: {
    temperature_celsius: Number,
    hgt_mmol_l: Number // HGT (Blood glucose)
  },
  
  // Urinalysis
  urinalysis: {
    blood: {
      type: String,
      enum: ['present', 'absent']
    },
    protein: {
      type: String,
      enum: ['present', 'absent']
    },
    glucose: {
      type: String,
      enum: ['present', 'absent']
    },
    ketones: Boolean,
    nitrates: Boolean,
    nad: Boolean, // No Abnormality Detected
    random_glucose_mmol_l: Number,
    random_cholesterol_mmol_l: Number,
    abnormal_glucose_reason: {
      type: String,
      enum: ['not_responding_to_treatment', 'never_diagnosed', 'defaulted_treatment']
    }
  },
  
  // Nursing Assessment
  nursing_assessment: {
    general_appearance: String,
    mental_state: String,
    mobility_assessment: String,
    physical_function: String,
    pain_assessment: {
      pain_scale: { type: Number, min: 0, max: 10 },
      pain_location: String,
      pain_description: String
    },
    medication_review: String,
    nursing_recommendations: String,
    observations: String
  },
  
  // Equipment and Calibration
  equipment_used: {
    scale_id: String,
    bp_monitor_id: String,
    thermometer_id: String,
    height_measure_id: String,
    calibration_dates: {
      scale_calibrated: Date,
      bp_monitor_calibrated: Date,
      thermometer_calibrated: Date
    }
  },
  
  // Quality Indicators
  quality_indicators: {
    abnormal_readings: [String],
    flagged_for_review: Boolean,
    review_reason: String,
    follow_up_required: Boolean,
    follow_up_notes: String
  },
  
  // Photos and Documentation
  documentation: {
    skin_condition_photos: [String], // URLs to photos
    injury_photos: [String],
    additional_notes: String
  },
  
  // Digital Signature and Completion
  nurse_signature: {
    signature_data: String,
    nurse_name: String,
    nurse_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    signed_at: Date
  },
  
  // Workflow Status
  completed: { type: Boolean, default: false },
  completedAt: Date,
  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  // Validation and Review
  validated: { type: Boolean, default: false },
  validatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  validatedAt: Date,
  validation_notes: String

}, {
  timestamps: true,
  versionKey: false
});

// Indexes
vitalSignsSchema.index({ patient: 1 });
vitalSignsSchema.index({ examination: 1 });
vitalSignsSchema.index({ recordedBy: 1 });
vitalSignsSchema.index({ completed: 1 });

// Virtual for BMI calculation
vitalSignsSchema.virtual('calculatedBMI').get(function() {
  if (this.physical_measurements.height_cm && this.physical_measurements.weight_kg) {
    const heightInMeters = this.physical_measurements.height_cm / 100;
    return Math.round((this.physical_measurements.weight_kg / (heightInMeters * heightInMeters)) * 10) / 10;
  }
  return null;
});

// Pre-save middleware to calculate BMI
vitalSignsSchema.pre('save', function(next) {
  if (this.physical_measurements.height_cm && this.physical_measurements.weight_kg) {
    const heightInMeters = this.physical_measurements.height_cm / 100;
    this.physical_measurements.bmi = Math.round((this.physical_measurements.weight_kg / (heightInMeters * heightInMeters)) * 10) / 10;
  }
  next();
});

// Method to check for abnormal readings
vitalSignsSchema.methods.checkAbnormalReadings = function() {
  const abnormal = [];
  
  // Check blood pressure
  if (this.cardiovascular.blood_pressure.systolic > 140 || this.cardiovascular.blood_pressure.diastolic > 90) {
    abnormal.push('High Blood Pressure');
  }
  if (this.cardiovascular.blood_pressure.systolic < 90 || this.cardiovascular.blood_pressure.diastolic < 60) {
    abnormal.push('Low Blood Pressure');
  }
  
  // Check pulse rate
  if (this.cardiovascular.pulse_rate_per_min > 100) {
    abnormal.push('High Pulse Rate');
  }
  if (this.cardiovascular.pulse_rate_per_min < 60) {
    abnormal.push('Low Pulse Rate');
  }
  
  // Check BMI
  if (this.physical_measurements.bmi > 30) {
    abnormal.push('Obese BMI');
  }
  if (this.physical_measurements.bmi < 18.5) {
    abnormal.push('Underweight BMI');
  }
  
  // Check temperature
  if (this.general.temperature_celsius > 37.5) {
    abnormal.push('Fever');
  }
  if (this.general.temperature_celsius < 36) {
    abnormal.push('Low Temperature');
  }
  
  this.quality_indicators.abnormal_readings = abnormal;
  this.quality_indicators.flagged_for_review = abnormal.length > 0;
  
  return abnormal;
};

// Method to complete vital signs recording
vitalSignsSchema.methods.complete = function(nurseId, signatureData) {
  this.completed = true;
  this.completedAt = new Date();
  this.nurse_signature = {
    signature_data: signatureData,
    nurse_id: nurseId,
    signed_at: new Date()
  };
  
  // Check for abnormal readings
  this.checkAbnormalReadings();
};

const VitalSigns = mongoose.model('VitalSigns', vitalSignsSchema);

module.exports = VitalSigns;