const mongoose = require('mongoose');

const organizationSchema = new mongoose.Schema({
  // Basic Information
  name: { type: String, required: true },
  domain: { type: String, required: true, unique: true },
  description: String,
  industry: String,
  
  // Contact Information
  contact_info: {
    email: { type: String, required: true },
    phone: String,
    fax: String,
    website: String,
    address: {
      street: String,
      city: String,
      postal_code: String,
      province: String,
      country: { type: String, default: 'South Africa' }
    }
  },
  
  // Subscription Information
  subscription: {
    tier: {
      type: String,
      enum: ['basic', 'premium', 'enterprise'],
      required: true,
      default: 'basic'
    },
    status: {
      type: String,
      enum: ['active', 'suspended', 'cancelled', 'trial'],
      default: 'trial'
    },
    start_date: { type: Date, default: Date.now },
    end_date: Date,
    billing_cycle: {
      type: String,
      enum: ['monthly', 'quarterly', 'annually'],
      default: 'monthly'
    },
    max_users: { type: Number, default: 10 },
    max_locations: { type: Number, default: 1 },
    max_monthly_examinations: { type: Number, default: 100 }
  },
  
  // Locations
  locations: [{
    name: { type: String, required: true },
    address: {
      street: String,
      city: String,
      postal_code: String,
      province: String
    },
    contact: {
      phone: String,
      email: String,
      manager: String
    },
    capacity: {
      daily_examinations: Number,
      equipment_available: [String],
      staff_count: Number
    },
    active: { type: Boolean, default: true }
  }],
  
  // Branding and Customization
  branding: {
    logo_url: String,
    primary_color: { type: String, default: '#1f2937' },
    secondary_color: { type: String, default: '#3b82f6' },
    accent_color: { type: String, default: '#10b981' },
    font_family: { type: String, default: 'Inter' },
    custom_css: String
  },
  
  // Certificate Templates
  certificate_templates: [{
    template_id: String,
    template_name: String,
    template_type: {
      type: String,
      enum: ['standard', 'custom', 'white_label']
    },
    html_template: String,
    css_styles: String,
    active: { type: Boolean, default: true },
    created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    created_at: { type: Date, default: Date.now }
  }],
  
  // Settings and Configuration
  settings: {
    // Workflow Settings
    workflow: {
      auto_advance_patients: { type: Boolean, default: true },
      require_signatures: { type: Boolean, default: true },
      enable_photo_capture: { type: Boolean, default: true },
      auto_generate_certificates: { type: Boolean, default: false },
      notification_preferences: {
        email_notifications: { type: Boolean, default: true },
        sms_notifications: { type: Boolean, default: false },
        push_notifications: { type: Boolean, default: true }
      }
    },
    
    // Security Settings
    security: {
      two_factor_required: { type: Boolean, default: false },
      session_timeout: { type: Number, default: 480 }, // minutes
      password_policy: {
        min_length: { type: Number, default: 8 },
        require_uppercase: { type: Boolean, default: true },
        require_lowercase: { type: Boolean, default: true },
        require_numbers: { type: Boolean, default: true },
        require_special_chars: { type: Boolean, default: true }
      },
      ip_whitelist: [String],
      access_logging: { type: Boolean, default: true }
    },
    
    // Integration Settings
    integrations: {
      email_service: {
        provider: String,
        api_key: String,
        sender_email: String,
        sender_name: String
      },
      sms_service: {
        provider: String,
        api_key: String,
        sender_number: String
      },
      document_storage: {
        provider: String,
        bucket_name: String,
        access_key: String,
        secret_key: String
      },
      pacs_integration: {
        enabled: { type: Boolean, default: false },
        endpoint: String,
        username: String,
        password: String
      }
    },
    
    // Compliance Settings
    compliance: {
      data_retention_period: { type: Number, default: 2555 }, // days (7 years)
      audit_logging: { type: Boolean, default: true },
      privacy_policy_url: String,
      terms_of_service_url: String,
      consent_management: {
        required: { type: Boolean, default: true },
        version: String,
        last_updated: Date
      }
    },
    
    // Business Rules
    business_rules: {
      examination_types: [{
        type: String,
        required_tests: [String],
        validity_period: Number, // days
        auto_scheduling: Boolean
      }],
      certification_rules: {
        auto_approve_fit: { type: Boolean, default: false },
        require_doctor_review: { type: Boolean, default: true },
        validity_periods: {
          fit: { type: Number, default: 365 }, // days
          fit_with_restrictions: { type: Number, default: 180 },
          periodic_review: { type: Number, default: 365 }
        }
      },
      quality_control: {
        random_audit_percentage: { type: Number, default: 5 },
        mandatory_fields: [String],
        validation_rules: [String]
      }
    }
  },
  
  // Usage Analytics
  usage_analytics: {
    total_examinations: { type: Number, default: 0 },
    monthly_examinations: { type: Number, default: 0 },
    total_certificates: { type: Number, default: 0 },
    active_users: { type: Number, default: 0 },
    storage_used: { type: Number, default: 0 }, // in MB
    api_calls_this_month: { type: Number, default: 0 },
    last_activity: Date,
    peak_usage_times: [String]
  },
  
  // Billing Information
  billing: {
    billing_contact: {
      name: String,
      email: String,
      phone: String
    },
    payment_method: {
      type: String,
      enum: ['credit_card', 'debit_order', 'eft', 'invoice']
    },
    billing_address: {
      street: String,
      city: String,
      postal_code: String,
      province: String,
      country: String
    },
    tax_number: String,
    vat_number: String,
    invoicing_email: String
  },
  
  // Status and Flags
  status: {
    type: String,
    enum: ['active', 'suspended', 'pending_approval', 'cancelled'],
    default: 'pending_approval'
  },
  
  // Metadata
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  trial_end_date: Date,
  last_login: Date,
  
  // Feature Flags
  features: {
    advanced_analytics: { type: Boolean, default: false },
    api_access: { type: Boolean, default: false },
    white_label: { type: Boolean, default: false },
    multi_location: { type: Boolean, default: false },
    custom_branding: { type: Boolean, default: false },
    bulk_operations: { type: Boolean, default: false },
    automated_reporting: { type: Boolean, default: false }
  }
  
}, {
  timestamps: true,
  versionKey: false
});

// Indexes
organizationSchema.index({ domain: 1 });
organizationSchema.index({ status: 1 });
organizationSchema.index({ 'subscription.tier': 1 });
organizationSchema.index({ 'subscription.status': 1 });

// Virtual for active users count
organizationSchema.virtual('activeUsersCount', {
  ref: 'User',
  localField: '_id',
  foreignField: 'organization',
  count: true,
  match: { isActive: true }
});

// Method to check if organization can add more users
organizationSchema.methods.canAddUsers = function(additionalUsers = 1) {
  return (this.usage_analytics.active_users + additionalUsers) <= this.subscription.max_users;
};

// Method to check if organization can add more locations
organizationSchema.methods.canAddLocations = function(additionalLocations = 1) {
  return (this.locations.length + additionalLocations) <= this.subscription.max_locations;
};

// Method to check monthly examination limits
organizationSchema.methods.canPerformExamination = function() {
  return this.usage_analytics.monthly_examinations < this.subscription.max_monthly_examinations;
};

// Method to get active locations
organizationSchema.methods.getActiveLocations = function() {
  return this.locations.filter(location => location.active);
};

// Method to update usage analytics
organizationSchema.methods.updateUsage = function(type, increment = 1) {
  switch (type) {
    case 'examination':
      this.usage_analytics.total_examinations += increment;
      this.usage_analytics.monthly_examinations += increment;
      break;
    case 'certificate':
      this.usage_analytics.total_certificates += increment;
      break;
    case 'api_call':
      this.usage_analytics.api_calls_this_month += increment;
      break;
  }
  this.usage_analytics.last_activity = new Date();
};

// Method to reset monthly counters
organizationSchema.methods.resetMonthlyCounters = function() {
  this.usage_analytics.monthly_examinations = 0;
  this.usage_analytics.api_calls_this_month = 0;
};

// Method to check subscription status
organizationSchema.methods.isSubscriptionActive = function() {
  return this.subscription.status === 'active' && 
         (!this.subscription.end_date || this.subscription.end_date > new Date());
};

// Method to check if in trial period
organizationSchema.methods.isInTrial = function() {
  return this.subscription.status === 'trial' && 
         (!this.trial_end_date || this.trial_end_date > new Date());
};

// Method to get feature availability
organizationSchema.methods.hasFeature = function(featureName) {
  // Check subscription tier features
  const tierFeatures = {
    basic: ['basic_reporting', 'standard_templates'],
    premium: ['basic_reporting', 'standard_templates', 'advanced_analytics', 'multi_location', 'automated_reporting'],
    enterprise: ['basic_reporting', 'standard_templates', 'advanced_analytics', 'multi_location', 'automated_reporting', 'api_access', 'white_label', 'custom_branding', 'bulk_operations']
  };
  
  const availableFeatures = tierFeatures[this.subscription.tier] || [];
  return availableFeatures.includes(featureName) || this.features[featureName] === true;
};

// Method to add location
organizationSchema.methods.addLocation = function(locationData) {
  if (this.canAddLocations()) {
    this.locations.push(locationData);
    return true;
  }
  return false;
};

// Method to deactivate location
organizationSchema.methods.deactivateLocation = function(locationId) {
  const location = this.locations.id(locationId);
  if (location) {
    location.active = false;
    return true;
  }
  return false;
};

const Organization = mongoose.model('Organization', organizationSchema);

module.exports = Organization;