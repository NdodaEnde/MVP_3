const express = require('express');
const router = express.Router();
const WorkflowSession = require('../models/WorkflowSession');
const Station = require('../models/Station');
const Patient = require('../models/Patient');
const { v4: uuidv4 } = require('uuid');

// ===== WORKFLOW SESSION MANAGEMENT =====

// Start new workflow session (Reception)
router.post('/sessions/start', async (req, res) => {
  try {
    const { patientId, patientInfo, receptionistId, tabletId } = req.body;
    
    // Generate unique session ID
    const sessionId = uuidv4();
    const qrCode = `SURGISCAN-${sessionId.substr(0, 8).toUpperCase()}`;
    
    // Create new workflow session
    const session = new WorkflowSession({
      patientId,
      sessionId,
      currentPhase: 'reception',
      receptionData: {
        checkedInAt: new Date(),
        assignedTablet: tabletId,
        qrCode,
        receptionistId,
        checkInMethod: req.body.checkInMethod || 'walk_in'
      },
      organization: req.body.organizationId || req.user?.organization
    });
    
    await session.save();
    
    // Update patient status
    await Patient.findByIdAndUpdate(patientId, {
      status: 'questionnaire',
      currentExamination: session._id
    });
    
    res.status(201).json({
      success: true,
      session: {
        sessionId,
        qrCode,
        currentPhase: session.currentPhase,
        progress: session.workflow.progress
      }
    });
    
  } catch (error) {
    console.error('Error starting workflow session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start workflow session',
      error: error.message
    });
  }
});

// Update questionnaire data
router.put('/sessions/:sessionId/questionnaire', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { questionnaireData, medicalFlags, riskAssessment, signatureData } = req.body;
    
    const session = await WorkflowSession.findOne({ sessionId });
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }
    
    // Update questionnaire data
    session.questionnaireData = {
      data: questionnaireData,
      completedAt: new Date(),
      medicalFlags: medicalFlags || [],
      riskAssessment: riskAssessment || {
        workingAtHeights: 'low',
        cardiovascular: 'low',
        respiratory: 'low',
        overall: 'low'
      },
      signatureData
    };
    
    session.currentPhase = 'station_routing';
    session.calculateProgress();
    
    await session.save();
    
    // Update patient status
    await Patient.findByIdAndUpdate(session.patientId, {
      status: 'nurse'
    });
    
    res.json({
      success: true,
      session: {
        sessionId,
        currentPhase: session.currentPhase,
        progress: session.workflow.progress,
        medicalFlags: session.questionnaireData.medicalFlags,
        riskAssessment: session.questionnaireData.riskAssessment
      }
    });
    
  } catch (error) {
    console.error('Error updating questionnaire:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update questionnaire',
      error: error.message
    });
  }
});

// Generate station routing recommendations
router.post('/sessions/:sessionId/routing', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const session = await WorkflowSession.findOne({ sessionId }).populate('patientId');
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }
    
    // Get available stations
    const stations = await Station.find({
      organization: session.organization,
      isActive: true
    });
    
    // Generate recommendations based on exam type and medical flags
    const recommendations = await generateStationRecommendations(
      session.patientId.examinationType,
      session.questionnaireData.medicalFlags || [],
      session.questionnaireData.riskAssessment,
      stations
    );
    
    // Update session with recommendations
    session.routingData.recommendedStations = recommendations;
    await session.save();
    
    res.json({
      success: true,
      recommendations,
      sessionInfo: {
        sessionId,
        currentPhase: session.currentPhase,
        progress: session.workflow.progress
      }
    });
    
  } catch (error) {
    console.error('Error generating routing:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate routing recommendations',
      error: error.message
    });
  }
});

// Select station and join queue
router.post('/sessions/:sessionId/select-station', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { stationId, priority = 'medium' } = req.body;
    
    const session = await WorkflowSession.findOne({ sessionId });
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }
    
    const station = await Station.findOne({ stationId });
    if (!station) {
      return res.status(404).json({
        success: false,
        message: 'Station not found'
      });
    }
    
    // Add patient to station queue
    const queueResult = station.addToQueue(session.patientId, sessionId, priority);
    if (!queueResult.success) {
      return res.status(400).json(queueResult);
    }
    
    await station.save();
    
    // Update session
    session.routingData.selectedStation = stationId;
    session.routingData.currentQueue = queueResult.queuePosition;
    session.routingData.estimatedWaitTime = queueResult.estimatedWaitTime;
    session.currentStation = stationId;
    session.currentPhase = 'examination';
    
    await session.save();
    
    res.json({
      success: true,
      queueInfo: {
        position: queueResult.queuePosition,
        estimatedWaitTime: queueResult.estimatedWaitTime,
        stationName: station.name
      },
      session: {
        currentPhase: session.currentPhase,
        progress: session.workflow.progress
      }
    });
    
  } catch (error) {
    console.error('Error selecting station:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to select station',
      error: error.message
    });
  }
});

// Complete station visit
router.post('/sessions/:sessionId/complete-station', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { stationId, results, notes, staffMember } = req.body;
    
    const session = await WorkflowSession.findOne({ sessionId });
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }
    
    const station = await Station.findOne({ stationId });
    if (!station) {
      return res.status(404).json({
        success: false,
        message: 'Station not found'
      });
    }
    
    // Remove patient from station queue
    const removeResult = station.removeFromQueue(session.patientId);
    await station.save();
    
    // Complete station visit in session
    session.completeStationVisit(stationId, results, notes);
    await session.save();
    
    res.json({
      success: true,
      session: {
        currentPhase: session.currentPhase,
        progress: session.workflow.progress,
        completedStations: session.routingData.completedStations,
        isComplete: session.currentPhase === 'completed'
      }
    });
    
  } catch (error) {
    console.error('Error completing station:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete station visit',
      error: error.message
    });
  }
});

// Get session status
router.get('/sessions/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const session = await WorkflowSession.findOne({ sessionId })
      .populate('patientId', 'firstName surname idNumber')
      .populate('receptionData.receptionistId', 'firstName surname');
    
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }
    
    res.json({
      success: true,
      session: {
        sessionId: session.sessionId,
        patient: session.patientId,
        currentPhase: session.currentPhase,
        currentStation: session.currentStation,
        progress: session.workflow.progress,
        journeyDuration: session.journeyDuration,
        medicalFlags: session.questionnaireData.medicalFlags || [],
        riskAssessment: session.questionnaireData.riskAssessment,
        completedStations: session.routingData.completedStations || [],
        recommendedStations: session.routingData.recommendedStations || [],
        metrics: session.metrics
      }
    });
    
  } catch (error) {
    console.error('Error getting session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get session',
      error: error.message
    });
  }
});

// ===== STATION MANAGEMENT =====

// Get all stations with current status
router.get('/stations', async (req, res) => {
  try {
    const { organizationId } = req.query;
    
    const stations = await Station.find({
      organization: organizationId || req.user?.organization,
      isActive: true
    }).populate('staffMembers.userId', 'firstName surname');
    
    // Update status for all stations
    for (const station of stations) {
      station.updateStatus();
      await station.save();
    }
    
    res.json({
      success: true,
      stations: stations.map(station => ({
        stationId: station.stationId,
        name: station.name,
        type: station.type,
        status: station.status,
        currentQueue: station.currentQueue,
        maxCapacity: station.maxCapacity,
        estimatedWaitTime: station.estimatedWaitTime,
        utilizationRate: station.utilizationRate,
        staffOnDuty: station.staffOnDuty,
        lastUpdated: station.lastUpdated
      }))
    });
    
  } catch (error) {
    console.error('Error getting stations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get stations',
      error: error.message
    });
  }
});

// Get station details with queue
router.get('/stations/:stationId', async (req, res) => {
  try {
    const { stationId } = req.params;
    
    const station = await Station.findOne({ stationId })
      .populate('currentPatients.patientId', 'firstName surname idNumber')
      .populate('staffMembers.userId', 'firstName surname');
    
    if (!station) {
      return res.status(404).json({
        success: false,
        message: 'Station not found'
      });
    }
    
    res.json({
      success: true,
      station
    });
    
  } catch (error) {
    console.error('Error getting station details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get station details',
      error: error.message
    });
  }
});

// ===== HELPER FUNCTIONS =====

async function generateStationRecommendations(examinationType, medicalFlags, riskAssessment, stations) {
  const recommendations = [];
  
  // Base stations required for each exam type
  const baseStations = {
    pre_employment: ['vital_signs', 'vision', 'audio', 'ecg', 'chest_xray', 'doctor_review'],
    periodic: ['vital_signs', 'vision', 'audio', 'spirometry', 'doctor_review'],
    exit: ['vital_signs', 'doctor_review'],
    return_to_work: ['vital_signs', 'vision', 'doctor_review'],
    baseline: ['vital_signs', 'vision', 'audio', 'ecg', 'spirometry', 'chest_xray', 'doctor_review']
  };
  
  const requiredStations = baseStations[examinationType] || baseStations.periodic;
  
  for (const stationType of requiredStations) {
    const station = stations.find(s => s.type === stationType);
    if (!station) continue;
    
    let priority = 'medium';
    let reason = `Required for ${examinationType} examination`;
    
    // Adjust priority based on medical flags
    if (medicalFlags.length > 0) {
      // Heart conditions need ECG urgently
      if (stationType === 'ecg' && medicalFlags.some(flag => flag.includes('heart'))) {
        priority = 'urgent';
        reason = 'Urgent: Heart condition flagged in questionnaire';
      }
      
      // Vision issues need vision test with high priority
      if (stationType === 'vision' && medicalFlags.some(flag => flag.includes('vision'))) {
        priority = 'high';
        reason = 'High priority: Vision concerns noted';
      }
      
      // Respiratory issues need spirometry
      if (stationType === 'spirometry' && medicalFlags.some(flag => flag.includes('respiratory'))) {
        priority = 'high';
        reason = 'High priority: Respiratory concerns noted';
      }
    }
    
    // Adjust based on risk assessment
    if (riskAssessment.cardiovascular === 'high' && ['ecg', 'vital_signs'].includes(stationType)) {
      priority = 'urgent';
      reason = 'Urgent: High cardiovascular risk detected';
    }
    
    if (riskAssessment.respiratory === 'high' && stationType === 'spirometry') {
      priority = 'high';
      reason = 'High priority: Respiratory risk assessment';
    }
    
    recommendations.push({
      stationId: station.stationId,
      stationName: station.name,
      priority,
      reason,
      estimatedTime: station.averageServiceTime,
      currentWaitTime: station.estimatedWaitTime,
      requiredForExamType: true,
      medicalFlagTriggered: medicalFlags.find(flag => 
        station.medicalFlagTriggers?.includes(flag)
      )
    });
  }
  
  // Sort by priority
  const priorityOrder = { urgent: 1, high: 2, medium: 3, low: 4 };
  recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  
  return recommendations;
}

module.exports = router;