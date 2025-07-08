const express = require('express');
const router = express.Router();
const Questionnaire = require('../models/Questionnaire');
const Patient = require('../models/Patient');
const Examination = require('../models/Examination');
const User = require('../models/User');
const { requireUser } = require('./middleware/auth');
const { 
  validateSAIDMiddleware, 
  validateSingleSAIDMiddleware,
  validationErrorHandler,
  saIdValidationRateLimit 
} = require('../middleware/validation');

// Validate SA ID endpoint
router.post('/validate-sa-id', saIdValidationRateLimit, validateSingleSAIDMiddleware, async (req, res) => {
  try {
    res.json({
      success: true,
      isValid: true,
      data: req.saIdData,
      message: 'SA ID is valid'
    });
  } catch (error) {
    console.error('SA ID validation error:', error);
    res.status(500).json({ error: 'SA ID validation failed' });
  }
});

// Create a new questionnaire with demographics validation
router.post('/create', requireUser, validateSAIDMiddleware, async (req, res) => {
  try {
    const { patientId, examinationId, examinationType } = req.body;
    
    // Verify patient and examination exist
    const patient = await Patient.findById(patientId);
    const examination = await Examination.findById(examinationId);
    
    if (!patient || !examination) {
      return res.status(404).json({ error: 'Patient or examination not found' });
    }
    
    // Check if questionnaire already exists for this examination
    const existingQuestionnaire = await Questionnaire.findOne({ 
      patient: patientId, 
      examination: examinationId 
    });
    
    if (existingQuestionnaire) {
      return res.status(400).json({ error: 'Questionnaire already exists for this examination' });
    }
    
    // Create new questionnaire
    const questionnaire = new Questionnaire({
      patient: patientId,
      examination: examinationId,
      examination_type: examinationType,
      examination_date: new Date(),
      company_name: patient.employerName,
      employee_id: patient._id,
      employee_number: patient.employeeNumber
    });
    
    await questionnaire.save();
    
    // Update examination to link questionnaire
    examination.questionnaire = questionnaire._id;
    await examination.save();
    
    res.status(201).json({
      success: true,
      questionnaire: questionnaire
    });
    
  } catch (error) {
    console.error('Error creating questionnaire:', error);
    res.status(500).json({ error: 'Failed to create questionnaire' });
  }
});

// Get questionnaire by ID
router.get('/:id', requireUser, async (req, res) => {
  try {
    const questionnaire = await Questionnaire.findById(req.params.id)
      .populate('patient', 'firstName surname idNumber employerName')
      .populate('examination', 'examinationType status');
    
    if (!questionnaire) {
      return res.status(404).json({ error: 'Questionnaire not found' });
    }
    
    res.json({
      success: true,
      questionnaire: questionnaire
    });
    
  } catch (error) {
    console.error('Error fetching questionnaire:', error);
    res.status(500).json({ error: 'Failed to fetch questionnaire' });
  }
});

// Get questionnaire by patient ID
router.get('/patient/:patientId', requireUser, async (req, res) => {
  try {
    const questionnaires = await Questionnaire.find({ 
      patient: req.params.patientId 
    })
      .populate('patient', 'firstName surname idNumber employerName')
      .populate('examination', 'examinationType status')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      questionnaires: questionnaires
    });
    
  } catch (error) {
    console.error('Error fetching questionnaires:', error);
    res.status(500).json({ error: 'Failed to fetch questionnaires' });
  }
});

// Update questionnaire section with validation
router.put('/:id/section', requireUser, validateSAIDMiddleware, async (req, res) => {
  try {
    const { sectionName, sectionData } = req.body;
    
    const questionnaire = await Questionnaire.findById(req.params.id);
    
    if (!questionnaire) {
      return res.status(404).json({ error: 'Questionnaire not found' });
    }
    
    // Update the specific section
    questionnaire[sectionName] = { ...questionnaire[sectionName], ...sectionData };
    
    // Mark section as complete if all required fields are present
    if (validateSection(sectionName, sectionData)) {
      questionnaire.markSectionComplete(sectionName);
    }
    
    await questionnaire.save();
    
    res.json({
      success: true,
      questionnaire: questionnaire,
      completionPercentage: questionnaire.getCompletionPercentage()
    });
    
  } catch (error) {
    console.error('Error updating questionnaire section:', error);
    res.status(500).json({ error: 'Failed to update questionnaire section' });
  }
});

// Auto-save questionnaire data with validation
router.put('/:id/autosave', requireUser, validateSAIDMiddleware, async (req, res) => {
  try {
    const { sectionData } = req.body;
    
    const questionnaire = await Questionnaire.findById(req.params.id);
    
    if (!questionnaire) {
      return res.status(404).json({ error: 'Questionnaire not found' });
    }
    
    // Auto-save the data
    questionnaire.autoSave(sectionData);
    await questionnaire.save();
    
    res.json({
      success: true,
      message: 'Data auto-saved successfully',
      lastSaved: questionnaire.lastSaved
    });
    
  } catch (error) {
    console.error('Error auto-saving questionnaire:', error);
    res.status(500).json({ error: 'Failed to auto-save questionnaire' });
  }
});

// Complete questionnaire
router.put('/:id/complete', requireUser, async (req, res) => {
  try {
    const { signature } = req.body;
    
    const questionnaire = await Questionnaire.findById(req.params.id);
    
    if (!questionnaire) {
      return res.status(404).json({ error: 'Questionnaire not found' });
    }
    
    // Validate all sections are complete
    const incompleteSections = Object.entries(questionnaire.sectionProgress)
      .filter(([key, value]) => !value)
      .map(([key]) => key);
    
    if (incompleteSections.length > 0) {
      return res.status(400).json({
        error: 'Cannot complete questionnaire',
        incompleteSections: incompleteSections
      });
    }
    
    // Complete the questionnaire
    questionnaire.completed = true;
    questionnaire.completedAt = new Date();
    questionnaire.completedBy = req.user.id;
    
    // Add employee signature
    if (signature) {
      questionnaire.declarations_and_signatures.employee_declaration.employee_signature = signature;
      questionnaire.declarations_and_signatures.employee_declaration.employee_signature_date = new Date();
    }
    
    await questionnaire.save();
    
    // Update examination workflow status
    const examination = await Examination.findById(questionnaire.examination);
    if (examination) {
      examination.updateWorkflowStatus('questionnaire', req.user.id);
      await examination.save();
    }
    
    res.json({
      success: true,
      message: 'Questionnaire completed successfully',
      questionnaire: questionnaire
    });
    
  } catch (error) {
    console.error('Error completing questionnaire:', error);
    res.status(500).json({ error: 'Failed to complete questionnaire' });
  }
});

// Get questionnaire template based on examination type
router.get('/template/:examinationType', requireUser, async (req, res) => {
  try {
    const { examinationType } = req.params;
    
    // Define templates for different examination types
    const templates = {
      pre_employment: {
        sections: [
          'medical_history',
          'working_at_heights_assessment',
          'medical_treatment_history',
          'declarations_and_signatures'
        ],
        required_fields: {
          medical_history: ['current_conditions', 'respiratory_conditions', 'occupational_health'],
          working_at_heights_assessment: ['safety_questions', 'training_awareness'],
          medical_treatment_history: ['last_two_years'],
          declarations_and_signatures: ['employee_declaration']
        }
      },
      periodic: {
        sections: [
          'medical_history',
          'periodic_health_history',
          'working_at_heights_assessment',
          'medical_treatment_history',
          'declarations_and_signatures'
        ],
        required_fields: {
          medical_history: ['current_conditions', 'respiratory_conditions', 'occupational_health'],
          periodic_health_history: ['since_last_examination'],
          working_at_heights_assessment: ['safety_questions', 'training_awareness'],
          medical_treatment_history: ['last_two_years'],
          declarations_and_signatures: ['employee_declaration']
        }
      },
      return_to_work: {
        sections: [
          'return_to_work_surveillance',
          'medical_treatment_history',
          'declarations_and_signatures'
        ],
        required_fields: {
          return_to_work_surveillance: ['health_screening', 'symptom_check'],
          medical_treatment_history: ['last_two_years'],
          declarations_and_signatures: ['employee_declaration']
        }
      }
    };
    
    const template = templates[examinationType];
    
    if (!template) {
      return res.status(400).json({ error: 'Invalid examination type' });
    }
    
    res.json({
      success: true,
      template: template
    });
    
  } catch (error) {
    console.error('Error fetching questionnaire template:', error);
    res.status(500).json({ error: 'Failed to fetch questionnaire template' });
  }
});

// Get all questionnaires with pagination and filtering
router.get('/', requireUser, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, examinationType, organizationId } = req.query;
    
    const filter = {};
    
    if (status) filter.completed = status === 'completed';
    if (examinationType) filter.examination_type = examinationType;
    
    // Add organization filter for non-admin users
    if (req.user.role !== 'admin') {
      const user = await User.findById(req.user.id);
      filter.organization = user.organization;
    } else if (organizationId) {
      filter.organization = organizationId;
    }
    
    const questionnaires = await Questionnaire.find(filter)
      .populate('patient', 'firstName surname idNumber employerName')
      .populate('examination', 'examinationType status')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Questionnaire.countDocuments(filter);
    
    res.json({
      success: true,
      questionnaires: questionnaires,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total,
        pages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error('Error fetching questionnaires:', error);
    res.status(500).json({ error: 'Failed to fetch questionnaires' });
  }
});

// Helper function to validate section completion
function validateSection(sectionName, sectionData) {
  const validationRules = {
    medical_history: (data) => {
      return data.current_conditions && data.respiratory_conditions && data.occupational_health;
    },
    periodic_health_history: (data) => {
      return data.since_last_examination;
    },
    working_at_heights_assessment: (data) => {
      return data.safety_questions && data.training_awareness;
    },
    return_to_work_surveillance: (data) => {
      return data.health_screening && data.symptom_check;
    },
    medical_treatment_history: (data) => {
      return data.last_two_years || data.general_practitioners_ten_years;
    },
    declarations_and_signatures: (data) => {
      return data.employee_declaration && 
             data.employee_declaration.information_correct && 
             data.employee_declaration.no_misleading_information;
    }
  };
  
  const validator = validationRules[sectionName];
  return validator ? validator(sectionData) : false;
}

// Get completion status for a questionnaire
router.get('/:id/completion', requireUser, async (req, res) => {
  try {
    const questionnaire = await Questionnaire.findById(req.params.id);
    
    if (!questionnaire) {
      return res.status(404).json({ error: 'Questionnaire not found' });
    }
    
    const completionPercentage = questionnaire.getCompletionPercentage();
    const validation = questionnaire.validateQuestionnaire();
    
    res.json({
      success: true,
      completionPercentage,
      isComplete: completionPercentage === 100,
      canProceed: validation.isValid,
      validation,
      sectionProgress: questionnaire.sectionProgress
    });
    
  } catch (error) {
    console.error('Error getting completion status:', error);
    res.status(500).json({ error: 'Failed to get completion status' });
  }
});

// Update form data with real-time completion calculation
router.put('/:id/update-form', requireUser, async (req, res) => {
  try {
    const { formData, currentSection } = req.body;
    
    const questionnaire = await Questionnaire.findById(req.params.id);
    
    if (!questionnaire) {
      return res.status(404).json({ error: 'Questionnaire not found' });
    }
    
    // Update the entire form data
    Object.keys(formData).forEach(key => {
      if (questionnaire.schema.paths[key]) {
        questionnaire[key] = formData[key];
      }
    });
    
    // Validate each section and update progress
    const sections = ['patient_demographics', 'medical_history', 'physical_exam', 'working_at_heights_assessment', 'declarations_and_signatures'];
    
    sections.forEach(section => {
      if (formData[section]) {
        const isComplete = validateSectionCompletion(section, formData[section], questionnaire.examination_type);
        questionnaire.sectionProgress[section] = isComplete;
      }
    });
    
    // Update last saved timestamp
    questionnaire.lastSaved = new Date();
    
    await questionnaire.save();
    
    const completionPercentage = questionnaire.getCompletionPercentage();
    
    res.json({
      success: true,
      completionPercentage,
      isComplete: completionPercentage === 100,
      sectionProgress: questionnaire.sectionProgress,
      lastSaved: questionnaire.lastSaved
    });
    
  } catch (error) {
    console.error('Error updating form data:', error);
    res.status(500).json({ error: 'Failed to update form data' });
  }
});

// Station handoff endpoint - transfer patient to next station
router.post('/:id/handoff', requireUser, async (req, res) => {
  try {
    const { signature, nextStation = 'vitals' } = req.body;
    
    const questionnaire = await Questionnaire.findById(req.params.id)
      .populate('patient', 'firstName surname idNumber')
      .populate('examination');
    
    if (!questionnaire) {
      return res.status(404).json({ error: 'Questionnaire not found' });
    }
    
    // Validate questionnaire is 100% complete
    const completionPercentage = questionnaire.getCompletionPercentage();
    if (completionPercentage < 100) {
      return res.status(400).json({ 
        error: 'Questionnaire must be 100% complete for handoff',
        completionPercentage,
        missingInfo: 'Please complete all required sections before transferring to next station'
      });
    }
    
    // Validate declarations are complete
    const declarations = questionnaire.declarations_and_signatures?.employee_declaration;
    if (!declarations || !declarations.information_correct || !declarations.no_misleading_information) {
      return res.status(400).json({ 
        error: 'Employee declarations must be completed',
        missingInfo: 'Please confirm all declaration statements'
      });
    }
    
    // Validate signature exists
    if (!declarations.employee_signature && !signature) {
      return res.status(400).json({ 
        error: 'Digital signature required',
        missingInfo: 'Please provide your digital signature before proceeding'
      });
    }
    
    // Save signature if provided
    if (signature && !declarations.employee_signature) {
      questionnaire.declarations_and_signatures.employee_declaration.employee_signature = signature;
      questionnaire.declarations_and_signatures.employee_declaration.employee_signature_date = new Date();
    }
    
    // Mark questionnaire as completed
    questionnaire.completed = true;
    questionnaire.completedAt = new Date();
    questionnaire.completedBy = req.user.id;
    
    // Update examination workflow status
    if (questionnaire.examination) {
      questionnaire.examination.status = 'questionnaire_completed';
      questionnaire.examination.currentStation = nextStation;
      questionnaire.examination.stationHistory = questionnaire.examination.stationHistory || [];
      questionnaire.examination.stationHistory.push({
        station: 'questionnaire',
        completedAt: new Date(),
        completedBy: req.user.id,
        duration: new Date() - questionnaire.createdAt
      });
      await questionnaire.examination.save();
    }
    
    // Add audit trail entry
    questionnaire.addAuditEntry(req.user.id, 'questionnaire_completed_handoff');
    
    await questionnaire.save();
    
    // Generate medical alerts based on questionnaire responses
    const medicalAlerts = generateMedicalAlerts(questionnaire);
    
    // Prepare handoff data for next station
    const handoffData = {
      patientId: questionnaire.patient._id,
      patientName: `${questionnaire.patient.firstName} ${questionnaire.patient.surname}`,
      examinationId: questionnaire.examination._id,
      questionnaireId: questionnaire._id,
      examinationType: questionnaire.examination_type,
      medicalAlerts,
      currentMedications: questionnaire.medical_history?.medication_history?.current_medications || [],
      allergies: questionnaire.medical_history?.medication_history?.allergies || [],
      specialInstructions: medicalAlerts.length > 0 ? 'Patient has medical alerts - review before proceeding' : 'No special medical concerns identified',
      completedAt: new Date(),
      nextStation,
      estimatedTimeAtNextStation: getEstimatedStationTime(nextStation)
    };
    
    res.json({
      success: true,
      message: `Patient successfully transferred to ${nextStation} station`,
      handoffData,
      questionnaire: {
        id: questionnaire._id,
        completed: true,
        completionPercentage: 100,
        completedAt: questionnaire.completedAt
      }
    });
    
  } catch (error) {
    console.error('Error in station handoff:', error);
    res.status(500).json({ error: 'Failed to complete station handoff' });
  }
});

// Helper function for enhanced section validation
function validateSectionCompletion(sectionName, sectionData, examinationType) {
  const validationRules = {
    patient_demographics: (data) => {
      return data.personal_info && 
             data.personal_info.first_names && 
             data.personal_info.surname && 
             data.personal_info.id_number &&
             data.employment_info &&
             data.employment_info.position;
    },
    medical_history: (data) => {
      return data.current_conditions && 
             Object.keys(data.current_conditions).length > 0 &&
             data.respiratory_conditions &&
             Object.keys(data.respiratory_conditions).length > 0;
    },
    physical_exam: (data) => {
      return data.height && data.weight && data.pulse_rate;
    },
    working_at_heights_assessment: (data) => {
      if (examinationType === 'periodic' || examinationType === 'pre_employment') {
        return data.fear_of_heights !== undefined && 
               data.vertigo_dizziness !== undefined &&
               data.balance_problems !== undefined;
      }
      return true; // Not required for all exam types
    },
    declarations_and_signatures: (data) => {
      return data.employee_declaration && 
             data.employee_declaration.information_correct === true && 
             data.employee_declaration.no_misleading_information === true &&
             data.employee_declaration.employee_name &&
             data.employee_declaration.employee_signature;
    }
  };
  
  const validator = validationRules[sectionName];
  return validator ? validator(sectionData) : false;
}

// Helper function to generate medical alerts
function generateMedicalAlerts(questionnaire) {
  const alerts = [];
  const medicalHistory = questionnaire.medical_history;
  
  if (medicalHistory?.current_conditions) {
    if (medicalHistory.current_conditions.heart_disease_high_bp) {
      alerts.push({
        type: 'medical_alert',
        severity: 'high',
        message: 'Patient has history of heart disease or high blood pressure',
        action: 'Monitor blood pressure carefully during examination'
      });
    }
    
    if (medicalHistory.current_conditions.epilepsy_convulsions) {
      alerts.push({
        type: 'medical_alert',
        severity: 'high',
        message: 'Patient has history of epilepsy or convulsions',
        action: 'Ensure safe environment, avoid flashing lights'
      });
    }
    
    if (medicalHistory.current_conditions.diabetes_endocrine) {
      alerts.push({
        type: 'medical_alert',
        severity: 'medium',
        message: 'Patient has diabetes or endocrine condition',
        action: 'Monitor glucose levels if required'
      });
    }
  }
  
  // Check working at heights restrictions
  const heightsAssessment = questionnaire.working_at_heights_assessment;
  if (heightsAssessment) {
    if (heightsAssessment.fear_of_heights || heightsAssessment.vertigo_dizziness) {
      alerts.push({
        type: 'work_restriction',
        severity: 'medium',
        message: 'Patient reports fear of heights or dizziness',
        action: 'May require height work restrictions'
      });
    }
  }
  
  // Check medications
  const medications = medicalHistory?.medication_history?.current_medications;
  if (medications && medications.length > 0) {
    alerts.push({
      type: 'information',
      severity: 'low',
      message: `Patient is taking ${medications.length} medication(s)`,
      action: 'Review current medications for interactions'
    });
  }
  
  return alerts;
}

// Helper function to get estimated station time
function getEstimatedStationTime(station) {
  const estimatedTimes = {
    vitals: '15 minutes',
    tests: '25 minutes',
    review: '10 minutes',
    certificate: '5 minutes'
  };
  
  return estimatedTimes[station] || '10 minutes';
}

// Apply error handling middleware
router.use(validationErrorHandler);

module.exports = router;