import api from './api';

export interface TestResult {
  _id: string;
  patientId: string;
  examination: string;
  testType: 'audiometry' | 'spirometry' | 'vision' | 'chest_xray' | 'ecg' | 'blood_work' | 'urine_analysis';
  testName: string;
  performedBy: string;
  performedAt: string;
  results: any;
  interpretation: string;
  status: 'normal' | 'abnormal' | 'borderline' | 'requires_review';
  attachments?: string[];
  notes: string;
}

// Mock test results data
const mockTestResults = {
  '1': [
    {
      _id: 'test_001',
      patientId: '1',
      examination: 'exam_001',
      testType: 'audiometry',
      testName: 'Pure Tone Audiometry',
      performedBy: 'Technician Mike Chen',
      performedAt: '2024-01-15T13:30:00Z',
      results: {
        left_ear: {
          '500Hz': 15,
          '1000Hz': 10,
          '2000Hz': 15,
          '4000Hz': 20,
          '8000Hz': 25
        },
        right_ear: {
          '500Hz': 10,
          '1000Hz': 15,
          '2000Hz': 10,
          '4000Hz': 15,
          '8000Hz': 20
        },
        threshold_average_left: 17,
        threshold_average_right: 14,
        classification: 'Normal hearing'
      },
      interpretation: 'Hearing within normal limits bilaterally. No significant hearing loss detected.',
      status: 'normal',
      notes: 'Patient reported history of noise exposure but results show no significant impact on hearing thresholds.',
      attachments: ['audiogram_john_doe_20240115.pdf']
    },
    {
      _id: 'test_002',
      patientId: '1',
      examination: 'exam_001',
      testType: 'spirometry',
      testName: 'Pulmonary Function Test',
      performedBy: 'Technician Lisa Park',
      performedAt: '2024-01-15T14:00:00Z',
      results: {
        fvc: 4.8,
        fvc_predicted: 4.6,
        fvc_percent: 104,
        fev1: 3.9,
        fev1_predicted: 3.7,
        fev1_percent: 105,
        fev1_fvc_ratio: 81,
        pef: 520,
        pef_predicted: 490,
        pef_percent: 106,
        interpretation: 'Normal spirometry'
      },
      interpretation: 'Normal pulmonary function. All parameters within expected ranges for age and height.',
      status: 'normal',
      notes: 'Excellent cooperation during testing. Values consistent with regular exercise habits.',
      attachments: ['spirometry_john_doe_20240115.pdf']
    },
    {
      _id: 'test_003',
      patientId: '1',
      examination: 'exam_001',
      testType: 'chest_xray',
      testName: 'Chest X-Ray PA & Lateral',
      performedBy: 'Radiographer Dr. Anderson',
      performedAt: '2024-01-15T15:00:00Z',
      results: {
        heart_size: 'Normal',
        lung_fields: 'Clear bilaterally',
        mediastinum: 'Normal',
        pleura: 'No effusion or pneumothorax',
        bones: 'No acute abnormalities',
        soft_tissues: 'Normal'
      },
      interpretation: 'Normal chest radiograph. No acute cardiopulmonary abnormalities.',
      status: 'normal',
      notes: 'High quality images obtained. Patient positioned appropriately.',
      attachments: ['chest_xray_john_doe_20240115.jpg']
    },
    {
      _id: 'test_004',
      patientId: '1',
      examination: 'exam_001',
      testType: 'blood_work',
      testName: 'Comprehensive Metabolic Panel',
      performedBy: 'Lab Technician Sarah Kim',
      performedAt: '2024-01-15T16:00:00Z',
      results: {
        glucose: 95,
        glucose_normal_range: '70-100 mg/dL',
        bun: 18,
        bun_normal_range: '7-20 mg/dL',
        creatinine: 1.0,
        creatinine_normal_range: '0.6-1.2 mg/dL',
        sodium: 140,
        sodium_normal_range: '136-145 mEq/L',
        potassium: 4.2,
        potassium_normal_range: '3.5-5.0 mEq/L',
        chloride: 102,
        chloride_normal_range: '98-107 mEq/L',
        co2: 24,
        co2_normal_range: '22-29 mEq/L'
      },
      interpretation: 'All values within normal limits. Good metabolic function.',
      status: 'normal',
      notes: 'Fasting sample collected appropriately. Patient well-hydrated.',
      attachments: ['lab_results_john_doe_20240115.pdf']
    },
    {
      _id: 'test_005',
      patientId: '1',
      examination: 'exam_002',
      testType: 'vision',
      testName: 'Visual Acuity & Color Vision',
      performedBy: 'Optometrist Dr. Williams',
      performedAt: '2024-07-02T15:30:00Z',
      results: {
        distance_vision: {
          left_eye: '20/20',
          right_eye: '20/20',
          both_eyes: '20/20'
        },
        near_vision: {
          left_eye: 'J1',
          right_eye: 'J1',
          both_eyes: 'J1'
        },
        color_vision: 'Normal',
        ishihara_plates: '15/15 correct',
        visual_field: 'Full to confrontation',
        glasses_required: false
      },
      interpretation: 'Excellent visual acuity. No visual impairment detected.',
      status: 'normal',
      notes: 'Patient reports no visual complaints. Excellent cooperation during testing.',
      attachments: ['vision_test_john_doe_20240702.pdf']
    }
  ],
  '2': [
    {
      _id: 'test_006',
      patientId: '2',
      examination: 'exam_003',
      testType: 'spirometry',
      testName: 'Pulmonary Function Test - Athletic',
      performedBy: 'Technician David Kim',
      performedAt: '2024-01-20T11:00:00Z',
      results: {
        fvc: 4.2,
        fvc_predicted: 3.8,
        fvc_percent: 110,
        fev1: 3.6,
        fev1_predicted: 3.2,
        fev1_percent: 112,
        fev1_fvc_ratio: 85,
        pef: 580,
        pef_predicted: 450,
        pef_percent: 129,
        interpretation: 'Superior pulmonary function'
      },
      interpretation: 'Superior pulmonary function consistent with athletic conditioning. Excellent lung capacity.',
      status: 'normal',
      notes: 'Outstanding results. Patient is marathon runner with exceptional cardiovascular fitness.',
      attachments: ['spirometry_jane_smith_20240120.pdf']
    },
    {
      _id: 'test_007',
      patientId: '2',
      examination: 'exam_003',
      testType: 'ecg',
      testName: '12-Lead Electrocardiogram',
      performedBy: 'Cardiac Technician Lisa Chen',
      performedAt: '2024-01-20T11:30:00Z',
      results: {
        rhythm: 'Sinus bradycardia',
        rate: 48,
        pr_interval: 160,
        qrs_duration: 90,
        qt_interval: 420,
        axis: 'Normal',
        st_segments: 'Normal',
        t_waves: 'Normal',
        interpretation: 'Sinus bradycardia, athlete heart'
      },
      interpretation: 'Sinus bradycardia consistent with athletic conditioning. No pathological findings.',
      status: 'normal',
      notes: 'Low heart rate expected in endurance athlete. ECG otherwise normal.',
      attachments: ['ecg_jane_smith_20240120.pdf']
    }
  ],
  '3': [
    {
      _id: 'test_008',
      patientId: '3',
      examination: 'exam_004',
      testType: 'urine_analysis',
      testName: 'Complete Urinalysis',
      performedBy: 'Lab Technician Mark Johnson',
      performedAt: '2024-01-25T09:00:00Z',
      results: {
        color: 'Yellow',
        clarity: 'Clear',
        specific_gravity: 1.020,
        ph: 6.5,
        protein: 'Negative',
        glucose: 'Negative',
        ketones: 'Negative',
        blood: 'Negative',
        nitrites: 'Negative',
        leukocyte_esterase: 'Negative',
        microscopy: 'Normal'
      },
      interpretation: 'Normal urinalysis. No abnormalities detected.',
      status: 'normal',
      notes: 'Clean catch specimen. All parameters within normal limits.',
      attachments: ['urinalysis_mike_johnson_20240125.pdf']
    }
  ]
};

// Get patient test results
export const getPatientTests = async (patientId: string) => {
  // DEVELOPMENT: Return mock data
  if (process.env.NODE_ENV === 'development') {
    console.log("🔍 API DEBUG: Getting test results for patient:", patientId);
    return new Promise((resolve) => {
      setTimeout(() => {
        const tests = mockTestResults[patientId as keyof typeof mockTestResults] || [];
        resolve({ tests });
      }, 600);
    });
  }

  try {
    const response = await api.get(`/api/tests/patient/${patientId}`);
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.error || error.message);
  }
};

// Create test result
export const createTestResult = async (data: Omit<TestResult, '_id' | 'performedAt'>) => {
  // DEVELOPMENT: Return mock success
  if (process.env.NODE_ENV === 'development') {
    console.log("🔍 API DEBUG: Creating test result:", data);
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          test: {
            _id: `test_${Date.now()}`,
            ...data,
            performedAt: new Date().toISOString()
          }
        });
      }, 800);
    });
  }

  try {
    const response = await api.post('/api/tests/create', data);
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.error || error.message);
  }
};

// Update test result
export const updateTestResult = async (testId: string, data: Partial<TestResult>) => {
  // DEVELOPMENT: Return mock success
  if (process.env.NODE_ENV === 'development') {
    console.log("🔍 API DEBUG: Updating test result:", testId);
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          test: { _id: testId, ...data }
        });
      }, 500);
    });
  }

  try {
    const response = await api.put(`/api/tests/${testId}`, data);
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.error || error.message);
  }
};

// Alias for backwards compatibility
export const saveTestResults = createTestResult;