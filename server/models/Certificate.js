const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema({
  // References
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  examination: { type: mongoose.Schema.Types.ObjectId, ref: 'Examination', required: true },
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  
  // Certificate Identification
  certificate_id: { type: String, unique: true },
  certificate_number: { type: String, unique: true },
  
  // Final Assessment
  final_assessment: {
    fitness_status: {
      type: String,
      enum: ['fit', 'fit_with_restrictions', 'unfit', 'refer_for_further_assessment'],
      required: true
    },
    restrictions: [String],
    recommendations: String,
    validity_period: {
      start_date: { type: Date, required: true },
      expiry_date: { type: Date, required: true }
    },
    follow_up_requirements: {
      periodic_review_required: Boolean,
      periodic_review_interval: {
        type: String,
        enum: ['6_months', '12_months', '24_months', 'other']
      },
      special_conditions: String,
      next_review_date: Date
    }
  },
  
  // Medical Summary
  medical_summary: {
    examination_findings: String,
    significant_medical_history: String,
    test_results_summary: String,
    clinical_impression: String,
    occupational_health_assessment: String
  },
  
  // Chronic Diseases Monitoring
  chronic_diseases: {
    monitoring_variance: String,
    conditions_identified: [String],
    management_recommendations: String
  },
  
  // Occupational Diseases
  occupational_diseases: {
    type_and_date_diagnosed: String,
    work_related_conditions: [String],
    exposure_history: String,
    prevention_measures: String
  },
  
  // Digital Signatures
  signatures: {
    ohp_signature: {
      signature_data: String,
      ohp_name: String,
      ohp_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      ohp_date: Date,
      ohp_credentials: String
    },
    omp_signature: {
      signature_data: String,
      omp_name: String,
      omp_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      omp_date: Date,
      omp_credentials: String
    }
  },
  
  // Certificate Generation
  certificate_template: {
    template_id: String,
    template_version: String,
    branding: {
      organization_logo: String,
      organization_name: String,
      letterhead: String,
      colors: {
        primary: String,
        secondary: String
      }
    }
  },
  
  // Certificate Document
  certificate_document: {
    pdf_url: String,
    file_size: Number,
    generated_at: Date,
    qr_code: String, // For authentication
    watermark: String,
    version: { type: Number, default: 1 }
  },
  
  // Distribution
  distribution: {
    patient_notification: {
      email_sent: Boolean,
      email_sent_at: Date,
      sms_sent: Boolean,
      sms_sent_at: Date,
      portal_available: Boolean
    },
    employer_notification: {
      email_sent: Boolean,
      email_sent_at: Date,
      dashboard_updated: Boolean,
      dashboard_updated_at: Date
    },
    delivery_confirmations: [{
      recipient: String,
      method: String,
      confirmed_at: Date,
      confirmation_id: String
    }]
  },
  
  // Certificate Status
  status: {
    type: String,
    enum: ['draft', 'pending_review', 'approved', 'issued', 'expired', 'revoked'],
    default: 'draft'
  },
  
  // Workflow Tracking
  workflow_status: {
    medical_review_complete: Boolean,
    signatures_complete: Boolean,
    certificate_generated: Boolean,
    distribution_complete: Boolean
  },
  
  // Version Control
  version_control: {
    current_version: { type: Number, default: 1 },
    previous_versions: [{
      version: Number,
      pdf_url: String,
      created_at: Date,
      changes_made: String,
      modified_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    }],
    amendment_history: [{
      date: Date,
      reason: String,
      changes: String,
      amended_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    }]
  },
  
  // Audit Trail
  audit_trail: [{
    action: String,
    performed_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    timestamp: { type: Date, default: Date.now },
    details: mongoose.Schema.Types.Mixed,
    ip_address: String
  }],
  
  // Compliance and Legal
  compliance: {
    regulatory_requirements: [String],
    compliance_checklist: [{
      requirement: String,
      satisfied: Boolean,
      notes: String
    }],
    legal_disclaimer: String,
    privacy_notice: String
  },
  
  // Certificate Authentication
  authentication: {
    qr_code_data: String,
    digital_seal: String,
    blockchain_hash: String, // For future blockchain integration
    verification_url: String
  },
  
  // Expiry and Renewal
  expiry_management: {
    expiry_date: Date,
    renewal_required: Boolean,
    renewal_reminder_sent: Boolean,
    renewal_reminder_date: Date,
    auto_renewal_eligible: Boolean
  },
  
  // Created and Updated Information
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  issued_at: Date,
  issued_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  
}, {
  timestamps: true,
  versionKey: false
});

// Indexes
certificateSchema.index({ patient: 1 });
certificateSchema.index({ examination: 1 });
certificateSchema.index({ organization: 1 });
certificateSchema.index({ certificate_id: 1 });
certificateSchema.index({ certificate_number: 1 });
certificateSchema.index({ status: 1 });
certificateSchema.index({ 'final_assessment.validity_period.expiry_date': 1 });

// Pre-save middleware to generate certificate ID and number
certificateSchema.pre('save', function(next) {
  if (this.isNew) {
    if (!this.certificate_id) {
      this.certificate_id = `CERT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    if (!this.certificate_number) {
      const year = new Date().getFullYear();
      const month = String(new Date().getMonth() + 1).padStart(2, '0');
      const random = Math.random().toString(36).substr(2, 6).toUpperCase();
      this.certificate_number = `${year}${month}-${random}`;
    }
  }
  next();
});

// Method to add audit trail entry
certificateSchema.methods.addAuditEntry = function(action, userId, details = {}, ipAddress = '') {
  this.audit_trail.push({
    action,
    performed_by: userId,
    details,
    ip_address: ipAddress,
    timestamp: new Date()
  });
};

// Method to generate QR code data for authentication
certificateSchema.methods.generateQRCode = function() {
  const qrData = {
    certificate_id: this.certificate_id,
    certificate_number: this.certificate_number,
    patient_id: this.patient.toString(),
    issued_date: this.issued_at,
    expiry_date: this.final_assessment.validity_period.expiry_date,
    verification_url: `${process.env.APP_URL}/verify/${this.certificate_id}`
  };
  
  this.authentication.qr_code_data = JSON.stringify(qrData);
  this.authentication.verification_url = qrData.verification_url;
  
  return qrData;
};

// Method to check if certificate is expired
certificateSchema.methods.isExpired = function() {
  return new Date() > this.final_assessment.validity_period.expiry_date;
};

// Method to check if certificate is expiring soon
certificateSchema.methods.isExpiringSoon = function(daysThreshold = 30) {
  const expiryDate = this.final_assessment.validity_period.expiry_date;
  const thresholdDate = new Date();
  thresholdDate.setDate(thresholdDate.getDate() + daysThreshold);
  return expiryDate <= thresholdDate;
};

// Method to create amendment
certificateSchema.methods.createAmendment = function(reason, changes, userId) {
  this.version_control.current_version += 1;
  this.version_control.amendment_history.push({
    date: new Date(),
    reason,
    changes,
    amended_by: userId
  });
  
  this.addAuditEntry('certificate_amended', userId, { reason, changes });
};

// Method to issue certificate
certificateSchema.methods.issue = function(userId, ipAddress) {
  this.status = 'issued';
  this.issued_at = new Date();
  this.issued_by = userId;
  this.workflow_status.distribution_complete = true;
  
  // Generate QR code for authentication
  this.generateQRCode();
  
  this.addAuditEntry('certificate_issued', userId, {}, ipAddress);
};

// Method to revoke certificate
certificateSchema.methods.revoke = function(reason, userId, ipAddress) {
  this.status = 'revoked';
  this.addAuditEntry('certificate_revoked', userId, { reason }, ipAddress);
};

// Method to update distribution status
certificateSchema.methods.updateDistributionStatus = function(method, recipient, confirmationId) {
  this.distribution.delivery_confirmations.push({
    recipient,
    method,
    confirmed_at: new Date(),
    confirmation_id: confirmationId
  });
  
  // Update specific distribution flags
  if (method === 'email' && recipient.includes('patient')) {
    this.distribution.patient_notification.email_sent = true;
    this.distribution.patient_notification.email_sent_at = new Date();
  } else if (method === 'email' && recipient.includes('employer')) {
    this.distribution.employer_notification.email_sent = true;
    this.distribution.employer_notification.email_sent_at = new Date();
  }
};

const Certificate = mongoose.model('Certificate', certificateSchema);

module.exports = Certificate;