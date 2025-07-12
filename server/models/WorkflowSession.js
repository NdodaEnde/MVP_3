const mongoose = require('mongoose');

// Complete patient workflow session model
const workflowSessionSchema = new mongoose.Schema({
  // Patient Reference
  patientId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Patient', 
    required: true 
  },
  
  // Session Identification
  sessionId: { 
    type: String, 
    required: true, 
    unique: true 
  },
  
  // Journey Status
  currentPhase: {
    type: String,
    enum: ['reception', 'questionnaire', 'station_routing', 'examination', 'completed', 'cancelled'],
    default: 'reception'
  },
  
  currentStation: {
    type: String,
    default: null
  },
  
  // Timing
  journeyStartTime: { 
    type: Date, 
    default: Date.now 
  },
  
  journeyEndTime: { 
    type: Date, 
    default: null 
  },
  
  totalJourneyTime: { 
    type: Number, // minutes
    default: 0 
  },
  
  // Phase 1 Data (Questionnaire)
  questionnaireData: {
    data: { type: mongoose.Schema.Types.Mixed },
    completedAt: { type: Date },
    medicalFlags: [{ type: String }],
    riskAssessment: {
      workingAtHeights: { type: String, enum: ['low', 'medium', 'high'], default: 'low' },
      cardiovascular: { type: String, enum: ['low', 'medium', 'high'], default: 'low' },
      respiratory: { type: String, enum: ['low', 'medium', 'high'], default: 'low' },
      overall: { type: String, enum: ['low', 'medium', 'high'], default: 'low' }
    },
    signatureData: {
      imageData: { type: String },
      timestamp: { type: Date },
      hash: { type: String },
      biometricData: { type: mongoose.Schema.Types.Mixed }
    }
  },
  
  // Phase 2 Data (Reception)
  receptionData: {
    checkedInAt: { type: Date },
    assignedTablet: { type: String },
    qrCode: { type: String },
    receptionistId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User' 
    },
    waitingTime: { type: Number, default: 0 }, // minutes
    checkInMethod: {
      type: String,
      enum: ['walk_in', 'appointment', 'company_booking'],
      default: 'walk_in'
    }
  },
  
  // Phase 2 Data (Station Routing)
  routingData: {
    recommendedStations: [{
      stationId: { type: String },
      stationName: { type: String },
      priority: { type: String, enum: ['urgent', 'high', 'medium', 'low'] },
      reason: { type: String },
      estimatedTime: { type: Number },
      currentWaitTime: { type: Number },
      requiredForExamType: { type: Boolean },
      medicalFlagTriggered: { type: String }
    }],
    
    selectedStation: { type: String },
    completedStations: [{ type: String }],
    currentQueue: { type: Number, default: 0 },
    estimatedWaitTime: { type: Number, default: 0 },
    
    // Station Visit History
    stationVisits: [{
      stationId: { type: String },
      stationName: { type: String },
      enteredAt: { type: Date },
      exitedAt: { type: Date },
      waitTime: { type: Number },
      serviceTime: { type: Number },
      staffMember: { type: String },
      results: { type: mongoose.Schema.Types.Mixed },
      notes: { type: String }
    }]
  },
  
  // Workflow Progress
  workflow: {
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'cancelled'],
      default: 'pending'
    },
    progress: { type: Number, default: 0 }, // 0-100
    lastUpdated: { type: Date, default: Date.now },
    bottlenecks: [{ type: String }],
    alerts: [{
      type: { type: String },
      message: { type: String },
      severity: { type: String, enum: ['low', 'medium', 'high', 'critical'] },
      createdAt: { type: Date, default: Date.now },
      resolved: { type: Boolean, default: false }
    }]
  },
  
  // Performance Metrics
  metrics: {
    totalWaitTime: { type: Number, default: 0 },
    totalServiceTime: { type: Number, default: 0 },
    stationCount: { type: Number, default: 0 },
    efficiencyScore: { type: Number, default: 0 }, // 0-100
    patientSatisfaction: { type: Number, default: 0 }, // 0-100
    bottleneckCount: { type: Number, default: 0 }
  },
  
  // Organization and Location
  organization: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Organization', 
    required: true 
  },
  
  location: { type: String },
  
  // Metadata
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  
  // Sync Status for Offline Support
  syncStatus: {
    type: String,
    enum: ['synced', 'pending', 'conflict', 'error'],
    default: 'synced'
  },
  
  lastSyncAt: { type: Date },
  
  // Version for conflict resolution
  version: { type: Number, default: 1 }
  
}, {
  timestamps: true,
  versionKey: false
});

// Indexes for performance
workflowSessionSchema.index({ patientId: 1 });
workflowSessionSchema.index({ sessionId: 1 });
workflowSessionSchema.index({ currentPhase: 1 });
workflowSessionSchema.index({ organization: 1 });
workflowSessionSchema.index({ journeyStartTime: 1 });
workflowSessionSchema.index({ 'workflow.status': 1 });
workflowSessionSchema.index({ 'receptionData.checkedInAt': 1 });

// Virtual for journey duration
workflowSessionSchema.virtual('journeyDuration').get(function() {
  if (this.journeyEndTime) {
    return Math.round((this.journeyEndTime - this.journeyStartTime) / 60000); // minutes
  }
  return Math.round((Date.now() - this.journeyStartTime) / 60000);
});

// Method to calculate progress based on completed stations
workflowSessionSchema.methods.calculateProgress = function() {
  const totalStations = this.routingData.recommendedStations.length || 5;
  const completedStations = this.routingData.completedStations.length;
  
  let baseProgress = 0;
  if (this.receptionData.checkedInAt) baseProgress += 15;
  if (this.questionnaireData.completedAt) baseProgress += 50;
  
  const stationProgress = (completedStations / totalStations) * 35;
  
  this.workflow.progress = Math.min(100, baseProgress + stationProgress);
  this.workflow.lastUpdated = new Date();
};

// Method to add station visit
workflowSessionSchema.methods.addStationVisit = function(stationData) {
  if (!this.routingData.stationVisits) {
    this.routingData.stationVisits = [];
  }
  
  this.routingData.stationVisits.push({
    ...stationData,
    enteredAt: new Date()
  });
  
  this.currentStation = stationData.stationId;
  this.calculateProgress();
};

// Method to complete station visit
workflowSessionSchema.methods.completeStationVisit = function(stationId, results, notes) {
  const visit = this.routingData.stationVisits.find(v => 
    v.stationId === stationId && !v.exitedAt
  );
  
  if (visit) {
    visit.exitedAt = new Date();
    visit.serviceTime = Math.round((visit.exitedAt - visit.enteredAt) / 60000);
    visit.results = results;
    visit.notes = notes;
    
    // Add to completed stations
    if (!this.routingData.completedStations.includes(stationId)) {
      this.routingData.completedStations.push(stationId);
    }
    
    this.currentStation = null;
    this.calculateProgress();
    
    // Check if journey is complete
    const requiredStations = this.routingData.recommendedStations.filter(s => s.requiredForExamType);
    const completedRequired = requiredStations.filter(s => 
      this.routingData.completedStations.includes(s.stationId)
    );
    
    if (completedRequired.length === requiredStations.length) {
      this.completeJourney();
    }
  }
};

// Method to complete entire journey
workflowSessionSchema.methods.completeJourney = function() {
  this.currentPhase = 'completed';
  this.workflow.status = 'completed';
  this.workflow.progress = 100;
  this.journeyEndTime = new Date();
  this.totalJourneyTime = Math.round((this.journeyEndTime - this.journeyStartTime) / 60000);
  
  // Calculate final metrics
  this.calculateMetrics();
};

// Method to calculate final metrics
workflowSessionSchema.methods.calculateMetrics = function() {
  const visits = this.routingData.stationVisits || [];
  
  this.metrics.totalWaitTime = visits.reduce((sum, visit) => sum + (visit.waitTime || 0), 0);
  this.metrics.totalServiceTime = visits.reduce((sum, visit) => sum + (visit.serviceTime || 0), 0);
  this.metrics.stationCount = visits.length;
  this.metrics.bottleneckCount = this.workflow.bottlenecks.length;
  
  // Calculate efficiency score (lower wait time = higher efficiency)
  if (this.totalJourneyTime > 0) {
    const serviceRatio = this.metrics.totalServiceTime / this.totalJourneyTime;
    this.metrics.efficiencyScore = Math.min(100, Math.round(serviceRatio * 100));
  }
};

// Pre-save middleware
workflowSessionSchema.pre('save', function(next) {
  if (this.isModified('routingData.completedStations')) {
    this.calculateProgress();
  }
  next();
});

const WorkflowSession = mongoose.model('WorkflowSession', workflowSessionSchema);

module.exports = WorkflowSession;