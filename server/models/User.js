const mongoose = require('mongoose');

const { validatePassword, isPasswordHash } = require('../utils/password.js');
const {randomUUID} = require("crypto");

const schema = new mongoose.Schema({
  // Basic Information
  email: {
    type: String,
    required: true,
    index: true,
    unique: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
    validate: { validator: isPasswordHash, message: 'Invalid password hash' },
  },
  
  // Personal Information
  name: { type: String, required: true },
  firstName: String,
  lastName: String,
  phone: String,
  
  // Role and Permissions
  role: {
    type: String,
    enum: ['receptionist', 'nurse', 'technician', 'doctor', 'admin', 'employer', 'manager'],
    required: true
  },
  
  // Organization and Location
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  location: String,
  
  // Professional Information
  professional_info: {
    license_number: String,
    specialization: String,
    qualifications: [String],
    experience_years: Number,
    certifications: [{
      name: String,
      issuing_body: String,
      issue_date: Date,
      expiry_date: Date,
      certificate_number: String
    }]
  },
  
  // Permissions
  permissions: [{
    module: String,
    actions: [String] // ['create', 'read', 'update', 'delete']
  }],
  
  // Status and Security
  isActive: {
    type: Boolean,
    default: true,
  },
  
  // Authentication
  refreshToken: {
    type: String,
    unique: true,
    index: true,
    default: () => randomUUID(),
  },
  
  // Activity Tracking
  lastLoginAt: {
    type: Date,
    default: Date.now,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    immutable: true,
  },
  
  // Settings and Preferences
  settings: {
    notifications: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
      push: { type: Boolean, default: true }
    },
    theme: { type: String, default: 'light' },
    language: { type: String, default: 'en' },
    timezone: { type: String, default: 'Africa/Johannesburg' }
  },
  
  // Two-Factor Authentication
  twoFactor: {
    enabled: { type: Boolean, default: false },
    secret: String,
    backupCodes: [String],
    lastUsed: Date
  }
}, {
  versionKey: false,
});

schema.set('toJSON', {
  /* eslint-disable */
  transform: (doc, ret, options) => {
    delete ret.password;
    return ret;
  },
  /* eslint-enable */
});

const User = mongoose.model('User', schema);

module.exports = User;
