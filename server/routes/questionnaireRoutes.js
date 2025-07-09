const express = require('express');
const router = express.Router();
const Questionnaire = require('../models/Questionnaire');
const Patient = require('../models/Patient');
const Examination = require('../models/Examination');

// Submit completed questionnaire
router.post('/submit', async (req, res) => {
  try {
    const questionnaireData = req.body;
    
    // Validate required fields
    if (!questionnaireData.patient_id) {
      return res.status(400).json({ 
        success: false, 
        message: 'Patient ID is required' 
      });
    }

    // Find the patient
    const patient = await Patient.findById(questionnaireData.patient_id);
    if (!patient) {
      return res.status(404).json({ 
        success: false, 
        message: 'Patient not found' 
      });
    }

    // Validate questionnaire data
    const validation = validateQuestionnaire(questionnaireData);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Questionnaire validation failed',
        errors: validation.errors
      });
    }

    // Create questionnaire document
    const questionnaire = new Questionnaire({
      patient: questionnaireData.patient_id,
      organization: patient.organization,
      examination_type: questionnaireData.metadata?.examination_type || patient.examinationType,
      
      // Patient demographics
      patient_demographics: questionnaireData.patient_demographics,
      
      // Medical history
      medical_history: questionnaireData.medical_history,
      
      // Examination-specific sections
      ...(questionnaireData.working_at_heights_assessment && {
        working_at_heights_assessment: questionnaireData.working_at_heights_assessment
      }),
      ...(questionnaireData.periodic_health_history && {
        periodic_health_history: questionnaireData.periodic_health_history
      }),
      ...(questionnaireData.return_to_work_surveillance && {
        return_to_work_surveillance: questionnaireData.return_to_work_surveillance
      }),
      
      // Lifestyle factors
      lifestyle_factors: questionnaireData.lifestyle_factors,
      
      // Medical treatment history
      medical_treatment_history: questionnaireData.medical_treatment_history,
      
      // Declarations and signatures
      declarations_and_signatures: questionnaireData.declarations_and_signatures,
      
      // Status and metadata
      status: 'completed',
      completed: true,
      completedAt: new Date(),
      
      // Validation status
      validation_status: {
        questionnaire_complete: validation.completionPercentage === 100,
        vitals_validated: false,
        assessment_complete: false,
        ready_for_certificate: false,
        validation_errors: validation.errors || [],
        completion_percentage: validation.completionPercentage,
        missing_sections: validation.missingSections || []
      },
      
      // Audit trail
      audit_trail: {
        created_by: req.user?.id || 'system',
        created_at: new Date().toISOString(),
        version_history: [{
          version: '1.0',
          changes: 'Initial questionnaire submission',
          changed_by: req.user?.id || 'system',
          changed_at: new Date().toISOString()
        }],
        access_log: [{
          user: req.user?.id || 'system',
          action: 'submit_questionnaire',
          timestamp: new Date().toISOString()
        }]
      }
    });

    // Save questionnaire
    const savedQuestionnaire = await questionnaire.save();

    // Update patient status and examination
    await Patient.findByIdAndUpdate(questionnaireData.patient_id, {
      status: 'nurse', // Move to next station
      $push: {
        examinations: savedQuestionnaire._id
      }
    });

    // Update or create examination record
    let examination;
    if (patient.currentExamination) {
      examination = await Examination.findByIdAndUpdate(patient.currentExamination, {
        questionnaire: savedQuestionnaire._id,
        'workflowStatus.questionnaire.completed': true,
        'workflowStatus.questionnaire.completedAt': new Date(),
        'workflowStatus.questionnaire.completedBy': req.user?.id
      });
    } else {
      examination = new Examination({
        patient: questionnaireData.patient_id,
        organization: patient.organization,
        examinationType: questionnaireData.metadata?.examination_type || patient.examinationType,
        questionnaire: savedQuestionnaire._id,
        workflowStatus: {
          questionnaire: {
            completed: true,
            completedAt: new Date(),
            completedBy: req.user?.id
          }
        }
      });
      await examination.save();
      
      // Update patient with current examination
      await Patient.findByIdAndUpdate(questionnaireData.patient_id, {
        currentExamination: examination._id
      });
    }

    // Analyze medical alerts
    const medicalAlerts = analyzeMedicalAlerts(questionnaireData);
    
    // Determine next station
    const nextStation = determineNextStation(questionnaireData, medicalAlerts);

    res.json({
      success: true,
      message: 'Questionnaire submitted successfully',
      questionnaireId: savedQuestionnaire._id,
      patientId: questionnaireData.patient_id,
      nextStation,
      medicalAlerts,
      requiresReview: validation.requiresReview || medicalAlerts.length > 0
    });

  } catch (error) {
    console.error('Error submitting questionnaire:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Save questionnaire draft
router.post('/draft', async (req, res) => {
  try {
    const draftData = req.body;
    
    if (!draftData.patient_id) {
      return res.status(400).json({ 
        success: false, 
        message: 'Patient ID is required' 
      });
    }

    // Check if draft already exists
    let questionnaire = await Questionnaire.findOne({
      patient: draftData.patient_id,
      status: 'draft'
    });

    if (questionnaire) {
      // Update existing draft
      Object.assign(questionnaire, {
        ...draftData,
        updatedAt: new Date(),
        'audit_trail.updated_by': req.user?.id || 'system',
        'audit_trail.updated_at': new Date().toISOString()
      });
    } else {
      // Create new draft
      questionnaire = new Questionnaire({
        ...draftData,
        patient: draftData.patient_id,
        status: 'draft',
        completed: false,
        audit_trail: {
          created_by: req.user?.id || 'system',
          created_at: new Date().toISOString()
        }
      });
    }

    const savedDraft = await questionnaire.save();

    res.json({
      success: true,
      message: 'Draft saved successfully',
      draftId: savedDraft._id
    });

  } catch (error) {
    console.error('Error saving draft:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save draft'
    });
  }
});

// Get questionnaire by ID
router.get('/:id', async (req, res) => {
  try {
    const questionnaire = await Questionnaire.findById(req.params.id)
      .populate('patient', 'firstName surname idNumber employerName')
      .populate('organization', 'name');

    if (!questionnaire) {
      return res.status(404).json({
        success: false,
        message: 'Questionnaire not found'
      });
    }

    res.json(questionnaire);

  } catch (error) {
    console.error('Error fetching questionnaire:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch questionnaire'
    });
  }
});

// Get questionnaires by patient ID
router.get('/patient/:patientId', async (req, res) => {
  try {
    const questionnaires = await Questionnaire.find({
      patient: req.params.patientId
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      questionnaires
    });

  } catch (error) {
    console.error('Error fetching patient questionnaires:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch questionnaires'
    });
  }
});

// Validation function
function validateQuestionnaire(data) {
  const errors = [];
  let completionPercentage = 0;
  let sectionsComplete = 0;
  const totalSections = 4; // Demographics, Medical History, Declarations, + optional sections

  // Validate demographics
  if (data.patient_demographics?.personal_info?.id_number && 
      data.patient_demographics?.personal_info?.first_names &&
      data.patient_demographics?.personal_info?.surname) {
    sectionsComplete++;
  } else {
    errors.push('Personal demographics incomplete');
  }

  // Validate medical history
  if (data.medical_history && Object.keys(data.medical_history).length > 0) {
    sectionsComplete++;
  } else {
    errors.push('Medical history is required');
  }

  // Validate declarations
  if (data.declarations_and_signatures?.employee_declaration?.information_correct &&
      data.declarations_and_signatures?.employee_declaration?.employee_signature) {
    sectionsComplete++;
  } else {
    errors.push('Employee declaration and signature required');
  }

  // Count examination-specific sections as complete by default for calculation
  sectionsComplete++;

  completionPercentage = Math.round((sectionsComplete / totalSections) * 100);

  return {
    isValid: errors.length === 0 && completionPercentage === 100,
    errors,
    completionPercentage,
    requiresReview: checkIfRequiresReview(data)
  };
}

// Medical alerts analysis
function analyzeMedicalAlerts(data) {
  const alerts = [];

  const medicalHistory = data.medical_history?.current_conditions || {};
  
  if (medicalHistory.heart_disease_high_bp) {
    alerts.push('Cardiovascular condition detected - requires medical review');
  }

  if (medicalHistory.epilepsy_convulsions) {
    alerts.push('Neurological condition detected - may affect work safety');
  }

  if (medicalHistory.diabetes_endocrine) {
    alerts.push('Diabetes detected - monitor blood glucose levels');
  }

  if (medicalHistory.mental_health_conditions) {
    alerts.push('Mental health condition reported - consider psychological assessment');
  }

  // Check working at heights specific alerts
  const heightsAssessment = data.working_at_heights_assessment;
  if (heightsAssessment) {
    if (heightsAssessment.q4_fits_seizures) {
      alerts.push('CRITICAL: Seizure history - HEIGHT WORK CONTRAINDICATED');
    }
    if (heightsAssessment.q5_suicide_thoughts) {
      alerts.push('URGENT: Mental health concern - immediate referral required');
    }
    if (heightsAssessment.q3_fear_heights_spaces) {
      alerts.push('Height phobia reported - may require work restrictions');
    }
    if (heightsAssessment.q7_thoughts_spirits) {
      alerts.push('URGENT: Psychiatric symptoms reported - immediate psychiatric referral');
    }
    if (heightsAssessment.q8_substance_abuse) {
      alerts.push('Substance use reported - affects work safety');
    }
  }

  // Check respiratory conditions
  const respiratoryConditions = data.medical_history?.respiratory_conditions || {};
  if (respiratoryConditions.tuberculosis_pneumonia) {
    alerts.push('TB/Pneumonia history - chest X-ray required');
  }

  return alerts;
}

// Determine next workflow station
function determineNextStation(data, medicalAlerts) {
  // If there are critical medical alerts, go straight to doctor
  if (medicalAlerts.some(alert => alert.includes('CRITICAL') || alert.includes('URGENT'))) {
    return 'doctor';
  }

  // Standard workflow: questionnaire -> vitals -> tests -> doctor
  return 'vitals';
}

// Check if medical review is required
function checkIfRequiresReview(data) {
  const medicalHistory = data.medical_history?.current_conditions || {};
  const heightsAssessment = data.working_at_heights_assessment;

  // High-risk medical conditions
  if (medicalHistory.heart_disease_high_bp || 
      medicalHistory.epilepsy_convulsions ||
      medicalHistory.diabetes_endocrine ||
      medicalHistory.mental_health_conditions) {
    return true;
  }

  // Working at heights risk factors
  if (heightsAssessment?.q4_fits_seizures || 
      heightsAssessment?.q5_suicide_thoughts ||
      heightsAssessment?.q1_advised_not_work_height ||
      heightsAssessment?.q7_thoughts_spirits) {
    return true;
  }

  return false;
}

module.exports = router;