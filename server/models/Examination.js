const mongoose = require('mongoose');

const examinationSchema = new mongoose.Schema({
  // Metadata
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  examinationType: {
    type: String,
    enum: ['pre_employment', 'periodic', 'exit', 'return_to_work', 'baseline', 'transfer'],
    required: true
  },
  protocol: String,
  
  // Workflow Status
  status: {
    type: String,
    enum: ['in_progress', 'completed', 'cancelled'],
    default: 'in_progress'
  },
  
  // Workflow Tracking
  workflowStatus: {
    questionnaire: { completed: { type: Boolean, default: false }, completedAt: Date, completedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' } },
    vitalSigns: { completed: { type: Boolean, default: false }, completedAt: Date, completedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' } },
    tests: { completed: { type: Boolean, default: false }, completedAt: Date, completedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' } },
    medicalReview: { completed: { type: Boolean, default: false }, completedAt: Date, completedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' } },
    certificate: { completed: { type: Boolean, default: false }, completedAt: Date, completedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' } }
  },
  
  // Related Documents
  questionnaire: { type: mongoose.Schema.Types.ObjectId, ref: 'Questionnaire' },
  vitalSigns: { type: mongoose.Schema.Types.ObjectId, ref: 'VitalSigns' },
  testResults: { type: mongoose.Schema.Types.ObjectId, ref: 'TestResults' },
  certificate: { type: mongoose.Schema.Types.ObjectId, ref: 'Certificate' },
  
  // Medical Review
  medicalReview: {
    fitnessStatus: {
      type: String,
      enum: ['fit', 'fit_with_restrictions', 'unfit', 'refer_for_further_assessment']
    },
    restrictions: [String],
    recommendations: String,
    validityPeriod: {
      startDate: Date,
      expiryDate: Date
    },
    followUpRequired: Boolean,
    followUpInterval: {
      type: String,
      enum: ['6_months', '12_months', '24_months', 'other']
    },
    specialConditions: String,
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: Date
  },
  
  // Appointments and Scheduling
  scheduledDate: Date,
  actualDate: Date,
  estimatedDuration: Number, // in minutes
  actualDuration: Number,
  
  // Quality Control
  validationStatus: {
    questionnaireComplete: { type: Boolean, default: false },
    vitalsValidated: { type: Boolean, default: false },
    assessmentComplete: { type: Boolean, default: false },
    readyForCertificate: { type: Boolean, default: false },
    validationErrors: [String],
    lastValidatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    lastValidatedAt: Date
  },
  
  // Audit Trail
  auditTrail: [{
    action: String,
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    timestamp: { type: Date, default: Date.now },
    details: mongoose.Schema.Types.Mixed
  }],
  
  // Notes and Comments
  notes: [{
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    content: String,
    timestamp: { type: Date, default: Date.now },
    type: {
      type: String,
      enum: ['general', 'medical', 'administrative', 'follow_up']
    }
  }]
  
}, {
  timestamps: true,
  versionKey: false
});

// Indexes
examinationSchema.index({ patient: 1 });
examinationSchema.index({ organization: 1 });
examinationSchema.index({ status: 1 });
examinationSchema.index({ examinationType: 1 });
examinationSchema.index({ scheduledDate: 1 });

// Method to add audit trail entry
examinationSchema.methods.addAuditEntry = function(action, userId, details = {}) {
  this.auditTrail.push({
    action,
    performedBy: userId,
    details,
    timestamp: new Date()
  });
};

// Method to update workflow status
examinationSchema.methods.updateWorkflowStatus = function(stage, userId) {
  if (this.workflowStatus[stage]) {
    this.workflowStatus[stage].completed = true;
    this.workflowStatus[stage].completedAt = new Date();
    this.workflowStatus[stage].completedBy = userId;
    
    this.addAuditEntry(`${stage}_completed`, userId);
  }
};

// Method to check if examination is complete
examinationSchema.methods.isComplete = function() {
  return Object.values(this.workflowStatus).every(stage => stage.completed);
};

const Examination = mongoose.model('Examination', examinationSchema);

module.exports = Examination;