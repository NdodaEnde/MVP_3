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

// Apply error handling middleware
router.use(validationErrorHandler);

module.exports = router;