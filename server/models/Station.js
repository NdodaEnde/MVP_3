const mongoose = require('mongoose');

// Station model for workflow management
const stationSchema = new mongoose.Schema({
  // Station Identification
  stationId: { 
    type: String, 
    required: true, 
    unique: true 
  },
  
  name: { 
    type: String, 
    required: true 
  },
  
  description: { type: String },
  
  // Station Configuration
  type: {
    type: String,
    enum: ['reception', 'questionnaire', 'vital_signs', 'vision', 'audio', 'ecg', 'spirometry', 'chest_xray', 'doctor_review'],
    required: true
  },
  
  category: {
    type: String,
    enum: ['intake', 'nursing', 'technical', 'medical', 'administrative'],
    required: true
  },
  
  // Capacity and Staffing
  maxCapacity: { 
    type: Number, 
    default: 1 
  },
  
  currentQueue: { 
    type: Number, 
    default: 0 
  },
  
  staffOnDuty: { 
    type: Number, 
    default: 1 
  },
  
  staffMembers: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: { type: String },
    role: { type: String },
    onDuty: { type: Boolean, default: true },
    shiftStart: { type: Date },
    shiftEnd: { type: Date }
  }],
  
  // Operational Status
  status: {
    type: String,
    enum: ['available', 'busy', 'full', 'closed', 'maintenance'],
    default: 'available'
  },
  
  operationalHours: {
    monday: { start: String, end: String },
    tuesday: { start: String, end: String },
    wednesday: { start: String, end: String },
    thursday: { start: String, end: String },
    friday: { start: String, end: String },
    saturday: { start: String, end: String },
    sunday: { start: String, end: String }
  },
  
  // Timing Metrics
  averageServiceTime: { 
    type: Number, 
    default: 10 // minutes
  },
  
  currentWaitTime: { 
    type: Number, 
    default: 0 // minutes
  },
  
  utilizationRate: { 
    type: Number, 
    default: 0 // percentage
  },
  
  // Requirements and Capabilities
  requiredForExamTypes: [{
    type: String,
    enum: ['pre_employment', 'periodic', 'exit', 'return_to_work', 'baseline', 'transfer']
  }],
  
  medicalFlagTriggers: [{ type: String }], // Which medical flags require this station
  
  specialRequirements: [{ type: String }], // Special equipment, certifications, etc.
  
  // Equipment and Resources
  equipment: [{
    name: { type: String },
    model: { type: String },
    status: { type: String, enum: ['operational', 'maintenance', 'broken'], default: 'operational' },
    lastMaintenance: { type: Date },
    nextMaintenance: { type: Date }
  }],
  
  // Performance Metrics
  dailyMetrics: [{
    date: { type: Date },
    patientsServed: { type: Number, default: 0 },
    totalWaitTime: { type: Number, default: 0 },
    totalServiceTime: { type: Number, default: 0 },
    averageWaitTime: { type: Number, default: 0 },
    bottleneckIncidents: { type: Number, default: 0 },
    utilizationRate: { type: Number, default: 0 }
  }],
  
  // Current Queue Information
  currentPatients: [{
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient' },
    sessionId: { type: String },
    queuePosition: { type: Number },
    enteredQueueAt: { type: Date, default: Date.now },
    estimatedServiceTime: { type: Number },
    priority: { type: String, enum: ['urgent', 'high', 'medium', 'low'], default: 'medium' }
  }],
  
  // Location and Organization
  location: {
    building: { type: String },
    floor: { type: String },
    room: { type: String },
    coordinates: {
      x: { type: Number },
      y: { type: Number }
    }
  },
  
  organization: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Organization', 
    required: true 
  },
  
  // Workflow Integration
  nextStationRecommendations: [{
    stationId: { type: String },
    conditions: [{ type: String }], // Conditions that trigger this recommendation
    priority: { type: Number } // Lower number = higher priority
  }],
  
  // Alerts and Notifications
  alerts: [{
    type: { type: String, enum: ['queue_full', 'equipment_down', 'staff_shortage', 'bottleneck'] },
    message: { type: String },
    severity: { type: String, enum: ['low', 'medium', 'high', 'critical'] },
    createdAt: { type: Date, default: Date.now },
    resolvedAt: { type: Date },
    resolved: { type: Boolean, default: false }
  }],
  
  // Settings and Configuration
  settings: {
    autoQueueManagement: { type: Boolean, default: true },
    maxQueueLength: { type: Number, default: 10 },
    alertThresholds: {
      queueLength: { type: Number, default: 5 },
      waitTime: { type: Number, default: 15 }, // minutes
      utilizationRate: { type: Number, default: 90 } // percentage
    },
    allowWalkIns: { type: Boolean, default: true },
    bookingRequired: { type: Boolean, default: false }
  },
  
  // Metadata
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  
  lastUpdated: { 
    type: Date, 
    default: Date.now 
  },
  
  isActive: { 
    type: Boolean, 
    default: true 
  }
  
}, {
  timestamps: true,
  versionKey: false
});

// Indexes for performance
stationSchema.index({ stationId: 1 });
stationSchema.index({ type: 1 });
stationSchema.index({ status: 1 });
stationSchema.index({ organization: 1 });
stationSchema.index({ currentQueue: 1 });
stationSchema.index({ utilizationRate: 1 });

// Virtual for current occupancy percentage
stationSchema.virtual('occupancyPercentage').get(function() {
  return Math.round((this.currentQueue / this.maxCapacity) * 100);
});

// Virtual for estimated wait time based on queue
stationSchema.virtual('estimatedWaitTime').get(function() {
  return this.currentQueue * this.averageServiceTime;
});

// Method to add patient to queue
stationSchema.methods.addToQueue = function(patientId, sessionId, priority = 'medium') {
  // Check if patient already in queue
  const existingIndex = this.currentPatients.findIndex(p => p.patientId.toString() === patientId);
  if (existingIndex !== -1) {
    return { success: false, message: 'Patient already in queue' };
  }
  
  // Determine queue position based on priority
  let queuePosition;
  if (priority === 'urgent') {
    queuePosition = 1;
    // Move other patients down
    this.currentPatients.forEach(patient => {
      if (patient.queuePosition >= queuePosition) {
        patient.queuePosition++;
      }
    });
  } else {
    queuePosition = this.currentPatients.length + 1;
  }
  
  this.currentPatients.push({
    patientId,
    sessionId,
    queuePosition,
    priority,
    estimatedServiceTime: this.averageServiceTime
  });
  
  this.currentQueue = this.currentPatients.length;
  this.updateStatus();
  this.checkAlerts();
  
  return { 
    success: true, 
    queuePosition,
    estimatedWaitTime: queuePosition * this.averageServiceTime
  };
};

// Method to remove patient from queue
stationSchema.methods.removeFromQueue = function(patientId) {
  const patientIndex = this.currentPatients.findIndex(p => 
    p.patientId.toString() === patientId
  );
  
  if (patientIndex === -1) {
    return { success: false, message: 'Patient not found in queue' };
  }
  
  const removedPatient = this.currentPatients[patientIndex];
  this.currentPatients.splice(patientIndex, 1);
  
  // Update queue positions
  this.currentPatients.forEach((patient, index) => {
    patient.queuePosition = index + 1;
  });
  
  this.currentQueue = this.currentPatients.length;
  this.updateStatus();
  
  return { success: true, removedPatient };
};

// Method to update station status based on current conditions
stationSchema.methods.updateStatus = function() {
  if (!this.isActive) {
    this.status = 'closed';
    return;
  }
  
  // Check if any equipment is broken
  const brokenEquipment = this.equipment.some(eq => eq.status === 'broken');
  if (brokenEquipment) {
    this.status = 'maintenance';
    return;
  }
  
  // Check capacity
  if (this.currentQueue >= this.maxCapacity) {
    this.status = 'full';
  } else if (this.currentQueue > 0) {
    this.status = 'busy';
  } else {
    this.status = 'available';
  }
  
  // Calculate utilization
  this.utilizationRate = Math.round((this.currentQueue / this.maxCapacity) * 100);
  this.lastUpdated = new Date();
};

// Method to check and create alerts
stationSchema.methods.checkAlerts = function() {
  const now = new Date();
  
  // Queue length alert
  if (this.currentQueue >= this.settings.alertThresholds.queueLength) {
    this.addAlert('queue_full', `Queue length (${this.currentQueue}) exceeds threshold`, 'medium');
  }
  
  // Wait time alert
  const estimatedWait = this.estimatedWaitTime;
  if (estimatedWait >= this.settings.alertThresholds.waitTime) {
    this.addAlert('bottleneck', `Estimated wait time (${estimatedWait} min) exceeds threshold`, 'high');
  }
  
  // Utilization rate alert
  if (this.utilizationRate >= this.settings.alertThresholds.utilizationRate) {
    this.addAlert('queue_full', `Utilization rate (${this.utilizationRate}%) is very high`, 'medium');
  }
};

// Method to add alert
stationSchema.methods.addAlert = function(type, message, severity) {
  // Check if similar alert exists and is unresolved
  const existingAlert = this.alerts.find(alert => 
    alert.type === type && !alert.resolved && 
    (Date.now() - alert.createdAt) < 300000 // 5 minutes
  );
  
  if (!existingAlert) {
    this.alerts.push({
      type,
      message,
      severity,
      createdAt: new Date()
    });
  }
};

// Method to update daily metrics
stationSchema.methods.updateDailyMetrics = function() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  let todayMetrics = this.dailyMetrics.find(m => 
    m.date.getTime() === today.getTime()
  );
  
  if (!todayMetrics) {
    todayMetrics = {
      date: today,
      patientsServed: 0,
      totalWaitTime: 0,
      totalServiceTime: 0,
      averageWaitTime: 0,
      bottleneckIncidents: 0,
      utilizationRate: this.utilizationRate
    };
    this.dailyMetrics.push(todayMetrics);
  }
  
  // Keep only last 30 days
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  this.dailyMetrics = this.dailyMetrics.filter(m => m.date >= thirtyDaysAgo);
};

// Pre-save middleware
stationSchema.pre('save', function(next) {
  if (this.isModified('currentPatients') || this.isModified('currentQueue')) {
    this.updateStatus();
  }
  next();
});

const Station = mongoose.model('Station', stationSchema);

module.exports = Station;