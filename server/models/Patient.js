const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  // Personal Information
  initials: { type: String, required: true },
  firstName: { type: String, required: true },
  surname: { type: String, required: true },
  idNumber: { type: String, required: true, unique: true },
  dateOfBirth: { type: Date, required: true },
  maritalStatus: { 
    type: String, 
    enum: ['single', 'married', 'divorced', 'widow_widower'],
    required: true 
  },
  gender: { 
    type: String, 
    enum: ['male', 'female', 'other'],
    required: true 
  },
  age: { type: Number, required: true },
  
  // Contact Information
  phone: { type: String, required: true },
  email: { type: String, required: true },
  address: {
    street: String,
    city: String,
    postalCode: String,
    province: String
  },
  
  // Employment Information
  employerName: { type: String, required: true },
  employerID: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
  position: String,
  department: String,
  employeeNumber: String,
  
  // Workflow Status
  status: {
    type: String,
    enum: ['checked-in', 'questionnaire', 'nurse', 'technician', 'doctor', 'completed', 'cancelled'],
    default: 'checked-in'
  },
  
  // Examination Information
  examinationType: {
    type: String,
    enum: ['pre_employment', 'periodic', 'exit', 'return_to_work', 'baseline', 'transfer'],
    required: true
  },
  
  // Current Examination Reference
  currentExamination: { type: mongoose.Schema.Types.ObjectId, ref: 'Examination' },
  
  // Historical Examinations
  examinations: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Examination' }],
  
  // Organization and Location
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  location: String,
  
  // Metadata
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  
}, {
  timestamps: true,
  versionKey: false
});

// Indexes for performance
patientSchema.index({ idNumber: 1 });
patientSchema.index({ organization: 1 });
patientSchema.index({ status: 1 });
patientSchema.index({ employerName: 1 });

// Virtual for full name
patientSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.surname}`;
});

// Method to calculate age from ID number (South African ID format)
patientSchema.methods.calculateAgeFromId = function() {
  if (this.idNumber && this.idNumber.length === 13) {
    const birthYear = parseInt(this.idNumber.substring(0, 2));
    const currentYear = new Date().getFullYear();
    const fullBirthYear = birthYear <= (currentYear - 2000) ? 2000 + birthYear : 1900 + birthYear;
    this.age = currentYear - fullBirthYear;
  }
};

// Pre-save middleware to calculate age
patientSchema.pre('save', function(next) {
  if (this.isModified('idNumber')) {
    this.calculateAgeFromId();
  }
  next();
});

const Patient = mongoose.model('Patient', patientSchema);

module.exports = Patient;