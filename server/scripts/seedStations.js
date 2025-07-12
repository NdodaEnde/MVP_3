// Seed script to create initial stations for testing
const mongoose = require('mongoose');
const Station = require('../models/Station');
require('dotenv').config();

// Connect to database
mongoose.connect(process.env.DATABASE_URL);

const seedStations = async () => {
  try {
    console.log('🌱 Seeding stations...');
    
    // Clear existing stations
    await Station.deleteMany({});
    
    // Define base stations
    const stations = [
      {
        stationId: 'reception-001',
        name: 'Reception & Check-in',
        description: 'Patient registration and initial check-in',
        type: 'reception',
        category: 'intake',
        maxCapacity: 5,
        averageServiceTime: 3,
        requiredForExamTypes: ['pre_employment', 'periodic', 'exit', 'return_to_work', 'baseline'],
        operationalHours: {
          monday: { start: '07:00', end: '17:00' },
          tuesday: { start: '07:00', end: '17:00' },
          wednesday: { start: '07:00', end: '17:00' },
          thursday: { start: '07:00', end: '17:00' },
          friday: { start: '07:00', end: '16:00' },
          saturday: { start: '08:00', end: '12:00' },
          sunday: { start: '', end: '' }
        },
        settings: {
          autoQueueManagement: true,
          maxQueueLength: 10,
          alertThresholds: {
            queueLength: 5,
            waitTime: 10,
            utilizationRate: 85
          }
        }
      },
      
      {
        stationId: 'vital-signs-001',
        name: 'Vital Signs & Nursing',
        description: 'Height, weight, blood pressure, temperature, urinalysis',
        type: 'vital_signs',
        category: 'nursing',
        maxCapacity: 3,
        averageServiceTime: 8,
        requiredForExamTypes: ['pre_employment', 'periodic', 'exit', 'return_to_work', 'baseline'],
        medicalFlagTriggers: ['hypertension', 'diabetes', 'heart_disease'],
        equipment: [
          { name: 'Digital Scale', model: 'Seca 877', status: 'operational' },
          { name: 'Height Meter', model: 'Seca 217', status: 'operational' },
          { name: 'Blood Pressure Monitor', model: 'Omron HEM-7156T', status: 'operational' }
        ],
        settings: {
          autoQueueManagement: true,
          maxQueueLength: 8,
          alertThresholds: {
            queueLength: 4,
            waitTime: 15,
            utilizationRate: 90
          }
        }
      },
      
      {
        stationId: 'vision-001',
        name: 'Vision Testing',
        description: 'Visual acuity, color blindness, peripheral vision',
        type: 'vision',
        category: 'technical',
        maxCapacity: 2,
        averageServiceTime: 10,
        requiredForExamTypes: ['pre_employment', 'periodic', 'return_to_work', 'baseline'],
        medicalFlagTriggers: ['vision_problems', 'glaucoma', 'working_at_heights'],
        equipment: [
          { name: 'Snellen Chart', model: 'Digital Snellen', status: 'operational' },
          { name: 'Ishihara Test', model: 'Standard', status: 'operational' }
        ],
        settings: {
          autoQueueManagement: true,
          maxQueueLength: 6,
          alertThresholds: {
            queueLength: 3,
            waitTime: 20,
            utilizationRate: 85
          }
        }
      },
      
      {
        stationId: 'audio-001',
        name: 'Audiometry',
        description: 'Hearing assessment and audiometry testing',
        type: 'audio',
        category: 'technical',
        maxCapacity: 2,
        averageServiceTime: 12,
        requiredForExamTypes: ['pre_employment', 'periodic', 'baseline'],
        medicalFlagTriggers: ['hearing_loss', 'ear_problems', 'noise_exposure'],
        equipment: [
          { name: 'Audiometer', model: 'Interacoustics AD629', status: 'operational' },
          { name: 'Sound Booth', model: 'IAC-3', status: 'operational' }
        ],
        settings: {
          autoQueueManagement: true,
          maxQueueLength: 5,
          alertThresholds: {
            queueLength: 3,
            waitTime: 25,
            utilizationRate: 80
          }
        }
      },
      
      {
        stationId: 'ecg-001',
        name: 'ECG / Cardiac',
        description: 'Electrocardiogram and cardiac assessment',
        type: 'ecg',
        category: 'technical',
        maxCapacity: 1,
        averageServiceTime: 15,
        requiredForExamTypes: ['pre_employment', 'baseline'],
        medicalFlagTriggers: ['heart_disease', 'chest_pain', 'high_blood_pressure', 'working_at_heights'],
        equipment: [
          { name: 'ECG Machine', model: 'Philips PageWriter TC70', status: 'operational' }
        ],
        nextStationRecommendations: [
          { stationId: 'doctor-review-001', conditions: ['abnormal_ecg'], priority: 1 }
        ],
        settings: {
          autoQueueManagement: true,
          maxQueueLength: 4,
          alertThresholds: {
            queueLength: 2,
            waitTime: 30,
            utilizationRate: 95
          }
        }
      },
      
      {
        stationId: 'spirometry-001',
        name: 'Spirometry',
        description: 'Lung function testing',
        type: 'spirometry',
        category: 'technical',
        maxCapacity: 1,
        averageServiceTime: 10,
        requiredForExamTypes: ['periodic', 'baseline'],
        medicalFlagTriggers: ['asthma', 'respiratory_problems', 'smoking', 'dust_exposure'],
        equipment: [
          { name: 'Spirometer', model: 'CareFusion MicroLoop', status: 'operational' }
        ],
        settings: {
          autoQueueManagement: true,
          maxQueueLength: 5,
          alertThresholds: {
            queueLength: 3,
            waitTime: 20,
            utilizationRate: 85
          }
        }
      },
      
      {
        stationId: 'chest-xray-001',
        name: 'Chest X-Ray',
        description: 'Chest radiography and imaging',
        type: 'chest_xray',
        category: 'technical',
        maxCapacity: 1,
        averageServiceTime: 8,
        requiredForExamTypes: ['pre_employment', 'baseline'],
        medicalFlagTriggers: ['respiratory_problems', 'smoking', 'chest_pain'],
        equipment: [
          { name: 'X-Ray Machine', model: 'Philips DigitalDiagnost C90', status: 'operational' }
        ],
        specialRequirements: ['radiation_safety_certification'],
        settings: {
          autoQueueManagement: true,
          maxQueueLength: 6,
          alertThresholds: {
            queueLength: 4,
            waitTime: 15,
            utilizationRate: 80
          }
        }
      },
      
      {
        stationId: 'doctor-review-001',
        name: 'Doctor Review',
        description: 'Medical practitioner final assessment',
        type: 'doctor_review',
        category: 'medical',
        maxCapacity: 2,
        averageServiceTime: 15,
        requiredForExamTypes: ['pre_employment', 'periodic', 'exit', 'return_to_work', 'baseline'],
        medicalFlagTriggers: ['any_medical_flag'],
        specialRequirements: ['medical_practitioner_license'],
        settings: {
          autoQueueManagement: true,
          maxQueueLength: 8,
          alertThresholds: {
            queueLength: 5,
            waitTime: 25,
            utilizationRate: 95
          }
        }
      }
    ];
    
    // Create stations with default organization (will be updated per organization)
    const createdStations = [];
    for (const stationData of stations) {
      const station = new Station({
        ...stationData,
        organization: new mongoose.Types.ObjectId(), // Default organization ID
        isActive: true,
        createdBy: new mongoose.Types.ObjectId() // Default user ID
      });
      
      const saved = await station.save();
      createdStations.push(saved);
      console.log(`✅ Created station: ${station.name} (${station.stationId})`);
    }
    
    console.log(`🎉 Successfully seeded ${createdStations.length} stations!`);
    
    // Generate some sample daily metrics
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (const station of createdStations) {
      // Add sample metrics for today
      station.dailyMetrics.push({
        date: today,
        patientsServed: Math.floor(Math.random() * 20) + 5,
        totalWaitTime: Math.floor(Math.random() * 120) + 30,
        totalServiceTime: Math.floor(Math.random() * 300) + 100,
        averageWaitTime: Math.floor(Math.random() * 15) + 5,
        bottleneckIncidents: Math.floor(Math.random() * 3),
        utilizationRate: Math.floor(Math.random() * 40) + 60
      });
      
      await station.save();
    }
    
    console.log('📊 Added sample daily metrics to all stations');
    
    return createdStations;
    
  } catch (error) {
    console.error('❌ Error seeding stations:', error);
    throw error;
  }
};

// Run seeding if called directly
if (require.main === module) {
  seedStations()
    .then(() => {
      console.log('🌱 Station seeding completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Station seeding failed:', error);
      process.exit(1);
    });
}

module.exports = { seedStations };