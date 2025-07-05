const express = require('express');
const router = express.Router();
const Patient = require('../models/Patient');
const Examination = require('../models/Examination');
const Organization = require('../models/Organization');
const User = require('../models/User');
const { requireUser } = require('./middleware/auth');

// Create a new patient
router.post('/create', requireUser, async (req, res) => {
  try {
    const {
      initials,
      firstName,
      surname,
      idNumber,
      dateOfBirth,
      maritalStatus,
      gender,
      phone,
      email,
      address,
      employerName,
      employerID,
      position,
      department,
      employeeNumber,
      examinationType,
      location
    } = req.body;
    
    // Check if patient already exists
    const existingPatient = await Patient.findOne({ idNumber });
    if (existingPatient) {
      return res.status(400).json({ 
        error: 'Patient with this ID number already exists',
        existingPatient: existingPatient
      });
    }
    
    // Get user's organization
    const user = await User.findById(req.user.id);
    
    // Create new patient
    const patient = new Patient({
      initials,
      firstName,
      surname,
      idNumber,
      dateOfBirth,
      maritalStatus,
      gender,
      phone,
      email,
      address,
      employerName,
      employerID,
      position,
      department,
      employeeNumber,
      examinationType,
      location,
      organization: user.organization,
      createdBy: req.user.id
    });
    
    await patient.save();
    
    // Create initial examination
    const examination = new Examination({
      patient: patient._id,
      organization: user.organization,
      examinationType,
      scheduledDate: new Date(),
      status: 'in_progress'
    });
    
    await examination.save();
    
    // Update patient with current examination
    patient.currentExamination = examination._id;
    patient.examinations.push(examination._id);
    await patient.save();
    
    res.status(201).json({
      success: true,
      patient: patient,
      examination: examination
    });
    
  } catch (error) {
    console.error('Error creating patient:', error);
    res.status(500).json({ error: 'Failed to create patient' });
  }
});

// Get patient by ID
router.get('/:id', requireUser, async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id)
      .populate('organization', 'name domain')
      .populate('currentExamination')
      .populate('examinations')
      .populate('createdBy', 'name email');
    
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    
    res.json({
      success: true,
      patient: patient
    });
    
  } catch (error) {
    console.error('Error fetching patient:', error);
    res.status(500).json({ error: 'Failed to fetch patient' });
  }
});

// Search patients
router.get('/search/:query', requireUser, async (req, res) => {
  try {
    const query = req.params.query;
    const user = await User.findById(req.user.id);
    
    // Build search criteria
    const searchCriteria = {
      organization: user.organization,
      $or: [
        { firstName: { $regex: query, $options: 'i' } },
        { surname: { $regex: query, $options: 'i' } },
        { idNumber: { $regex: query, $options: 'i' } },
        { employerName: { $regex: query, $options: 'i' } },
        { employeeNumber: { $regex: query, $options: 'i' } }
      ]
    };
    
    const patients = await Patient.find(searchCriteria)
      .populate('organization', 'name')
      .populate('currentExamination', 'status examinationType')
      .limit(20)
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      patients: patients
    });
    
  } catch (error) {
    console.error('Error searching patients:', error);
    res.status(500).json({ error: 'Failed to search patients' });
  }
});

// Get patient queue
router.get('/queue/current', requireUser, async (req, res) => {
  try {
    const { status, location } = req.query;
    const user = await User.findById(req.user.id);
    
    const filter = {
      organization: user.organization,
      status: { $ne: 'completed' }
    };
    
    if (status) filter.status = status;
    if (location) filter.location = location;
    
    const patients = await Patient.find(filter)
      .populate('currentExamination', 'status workflowStatus scheduledDate')
      .sort({ createdAt: 1 });
    
    // Group patients by status for queue management
    const queue = {
      'checked-in': [],
      'questionnaire': [],
      'nurse': [],
      'technician': [],
      'doctor': []
    };
    
    patients.forEach(patient => {
      if (queue[patient.status]) {
        queue[patient.status].push(patient);
      }
    });
    
    res.json({
      success: true,
      queue: queue,
      totalPatients: patients.length
    });
    
  } catch (error) {
    console.error('Error fetching patient queue:', error);
    res.status(500).json({ error: 'Failed to fetch patient queue' });
  }
});

// Update patient status
router.put('/:id/status', requireUser, async (req, res) => {
  try {
    const { status, notes } = req.body;
    
    const patient = await Patient.findById(req.params.id);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    
    const previousStatus = patient.status;
    patient.status = status;
    
    await patient.save();
    
    // Update examination audit trail
    const examination = await Examination.findById(patient.currentExamination);
    if (examination) {
      examination.addAuditEntry(
        `status_changed_from_${previousStatus}_to_${status}`,
        req.user.id,
        { notes }
      );
      await examination.save();
    }
    
    res.json({
      success: true,
      patient: patient,
      message: `Patient status updated to ${status}`
    });
    
  } catch (error) {
    console.error('Error updating patient status:', error);
    res.status(500).json({ error: 'Failed to update patient status' });
  }
});

// Get patient examination history
router.get('/:id/history', requireUser, async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id)
      .populate({
        path: 'examinations',
        populate: [
          { path: 'questionnaire' },
          { path: 'vitalSigns' },
          { path: 'testResults' },
          { path: 'certificate' }
        ]
      });
    
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    
    res.json({
      success: true,
      patient: {
        name: patient.fullName,
        idNumber: patient.idNumber,
        employerName: patient.employerName
      },
      examinations: patient.examinations
    });
    
  } catch (error) {
    console.error('Error fetching patient history:', error);
    res.status(500).json({ error: 'Failed to fetch patient history' });
  }
});

// Update patient information
router.put('/:id', requireUser, async (req, res) => {
  try {
    const {
      phone,
      email,
      address,
      employerName,
      position,
      department,
      employeeNumber
    } = req.body;
    
    const patient = await Patient.findById(req.params.id);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    
    // Update editable fields
    if (phone) patient.phone = phone;
    if (email) patient.email = email;
    if (address) patient.address = address;
    if (employerName) patient.employerName = employerName;
    if (position) patient.position = position;
    if (department) patient.department = department;
    if (employeeNumber) patient.employeeNumber = employeeNumber;
    
    await patient.save();
    
    res.json({
      success: true,
      patient: patient
    });
    
  } catch (error) {
    console.error('Error updating patient:', error);
    res.status(500).json({ error: 'Failed to update patient' });
  }
});

// Get patients by employer
router.get('/employer/:employerName', requireUser, async (req, res) => {
  try {
    const { employerName } = req.params;
    const { page = 1, limit = 10, status } = req.query;
    const user = await User.findById(req.user.id);
    
    const filter = {
      organization: user.organization,
      employerName: { $regex: employerName, $options: 'i' }
    };
    
    if (status) filter.status = status;
    
    const patients = await Patient.find(filter)
      .populate('currentExamination', 'status examinationType scheduledDate')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Patient.countDocuments(filter);
    
    res.json({
      success: true,
      patients: patients,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total,
        pages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error('Error fetching patients by employer:', error);
    res.status(500).json({ error: 'Failed to fetch patients by employer' });
  }
});

// Get all patients with pagination and filtering
router.get('/', requireUser, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, examinationType, location } = req.query;
    const user = await User.findById(req.user.id);
    
    const filter = {
      organization: user.organization
    };
    
    if (status) filter.status = status;
    if (examinationType) filter.examinationType = examinationType;
    if (location) filter.location = location;
    
    const patients = await Patient.find(filter)
      .populate('organization', 'name')
      .populate('currentExamination', 'status examinationType scheduledDate')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Patient.countDocuments(filter);
    
    res.json({
      success: true,
      patients: patients,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total,
        pages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error('Error fetching patients:', error);
    res.status(500).json({ error: 'Failed to fetch patients' });
  }
});

// Check-in patient
router.post('/:id/checkin', requireUser, async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    
    // Update patient status to checked-in
    patient.status = 'checked-in';
    await patient.save();
    
    // Update examination
    const examination = await Examination.findById(patient.currentExamination);
    if (examination) {
      examination.actualDate = new Date();
      examination.addAuditEntry('patient_checked_in', req.user.id);
      await examination.save();
    }
    
    res.json({
      success: true,
      patient: patient,
      message: 'Patient checked in successfully'
    });
    
  } catch (error) {
    console.error('Error checking in patient:', error);
    res.status(500).json({ error: 'Failed to check in patient' });
  }
});

// Transfer patient to next station
router.post('/:id/transfer', requireUser, async (req, res) => {
  try {
    const { nextStation, notes } = req.body;
    
    const patient = await Patient.findById(req.params.id);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    
    const previousStation = patient.status;
    patient.status = nextStation;
    await patient.save();
    
    // Update examination audit trail
    const examination = await Examination.findById(patient.currentExamination);
    if (examination) {
      examination.addAuditEntry(
        `transferred_from_${previousStation}_to_${nextStation}`,
        req.user.id,
        { notes }
      );
      await examination.save();
    }
    
    res.json({
      success: true,
      patient: patient,
      message: `Patient transferred to ${nextStation}`
    });
    
  } catch (error) {
    console.error('Error transferring patient:', error);
    res.status(500).json({ error: 'Failed to transfer patient' });
  }
});

module.exports = router;