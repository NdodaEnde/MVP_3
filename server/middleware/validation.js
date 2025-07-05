const { validateAndExtractSAID, validateDemographics, autoPopulateFromSAID } = require('../utils/sa-id-validation');

/**
 * Middleware to validate SA ID numbers in questionnaire data
 */
function validateSAIDMiddleware(req, res, next) {
  try {
    const demographics = req.body?.patient_demographics;
    
    if (demographics) {
      // Validate demographics data
      const validation = validateDemographics(demographics);
      
      if (!validation.isValid) {
        return res.status(400).json({
          error: 'Invalid demographic data',
          details: validation.errors,
          warnings: validation.warnings,
          field: 'patient_demographics'
        });
      }
      
      // Auto-populate data from SA ID
      const autoPopulatedDemographics = autoPopulateFromSAID(demographics);
      req.body.patient_demographics = autoPopulatedDemographics;
      
      // Add validation metadata for audit trail
      req.demographicsValidation = {
        validated: true,
        validatedAt: new Date(),
        warnings: validation.warnings,
        autoPopulated: autoPopulatedDemographics._saIdValidation?.validated || false
      };
      
      // Log warnings if any
      if (validation.warnings.length > 0) {
        console.warn('Demographics validation warnings:', validation.warnings);
      }
    }
    
    next();
  } catch (error) {
    console.error('Demographics validation error:', error);
    res.status(500).json({
      error: 'Demographics validation failed',
      details: error.message
    });
  }
}

/**
 * Middleware to validate specific SA ID number
 */
function validateSingleSAIDMiddleware(req, res, next) {
  try {
    const idNumber = req.body?.id_number || req.params?.id_number;
    
    if (idNumber) {
      const validation = validateAndExtractSAID(idNumber);
      
      if (!validation.isValid) {
        return res.status(400).json({
          error: 'Invalid SA ID number',
          details: validation.errors,
          field: 'id_number'
        });
      }
      
      // Add extracted data to request for use in route handlers
      req.saIdData = validation.data;
    }
    
    next();
  } catch (error) {
    console.error('SA ID validation error:', error);
    res.status(500).json({
      error: 'SA ID validation failed',
      details: error.message
    });
  }
}

/**
 * Middleware to validate patient data for registration
 */
function validatePatientRegistrationMiddleware(req, res, next) {
  try {
    const requiredFields = ['initials', 'firstName', 'surname', 'idNumber'];
    const missingFields = [];
    
    // Check required fields
    requiredFields.forEach(field => {
      if (!req.body[field]) {
        missingFields.push(field);
      }
    });
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        error: 'Missing required fields',
        details: `Required fields: ${missingFields.join(', ')}`,
        missingFields
      });
    }
    
    // Validate SA ID
    if (req.body.idNumber) {
      const validation = validateAndExtractSAID(req.body.idNumber);
      
      if (!validation.isValid) {
        return res.status(400).json({
          error: 'Invalid SA ID number',
          details: validation.errors,
          field: 'idNumber'
        });
      }
      
      // Auto-populate age and gender if not provided
      if (!req.body.age) {
        req.body.age = validation.data.age;
      }
      
      if (!req.body.gender) {
        req.body.gender = validation.data.gender;
      }
      
      // Add validation metadata
      req.patientValidation = {
        saIdValidated: true,
        validatedAt: new Date(),
        extractedData: validation.data
      };
    }
    
    next();
  } catch (error) {
    console.error('Patient registration validation error:', error);
    res.status(500).json({
      error: 'Patient validation failed',
      details: error.message
    });
  }
}

/**
 * Error handling middleware for validation errors
 */
function validationErrorHandler(error, req, res, next) {
  if (error.name === 'ValidationError') {
    // Mongoose validation error
    const errors = Object.values(error.errors).map(err => err.message);
    return res.status(400).json({
      error: 'Validation failed',
      details: errors,
      type: 'mongoose_validation'
    });
  }
  
  if (error.code === 11000) {
    // Duplicate key error
    const field = Object.keys(error.keyPattern)[0];
    return res.status(400).json({
      error: 'Duplicate value',
      details: `${field} already exists`,
      field: field,
      type: 'duplicate_key'
    });
  }
  
  next(error);
}

/**
 * Rate limiting middleware for SA ID validation requests
 */
function saIdValidationRateLimit(req, res, next) {
  // Simple in-memory rate limiting (use Redis in production)
  const clientIP = req.ip || req.connection.remoteAddress;
  const key = `sa_id_validation:${clientIP}`;
  
  if (!req.app.locals.rateLimitStore) {
    req.app.locals.rateLimitStore = new Map();
  }
  
  const store = req.app.locals.rateLimitStore;
  const now = Date.now();
  const windowMs = 60000; // 1 minute
  const maxRequests = 10; // 10 requests per minute
  
  const clientData = store.get(key) || { count: 0, resetTime: now + windowMs };
  
  if (now > clientData.resetTime) {
    // Reset window
    clientData.count = 1;
    clientData.resetTime = now + windowMs;
  } else {
    clientData.count++;
  }
  
  store.set(key, clientData);
  
  if (clientData.count > maxRequests) {
    return res.status(429).json({
      error: 'Too many SA ID validation requests',
      details: 'Rate limit exceeded. Please try again later.',
      retryAfter: Math.ceil((clientData.resetTime - now) / 1000)
    });
  }
  
  next();
}

module.exports = {
  validateSAIDMiddleware,
  validateSingleSAIDMiddleware,
  validatePatientRegistrationMiddleware,
  validationErrorHandler,
  saIdValidationRateLimit
};