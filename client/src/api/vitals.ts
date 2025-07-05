import api from './api';

export interface VitalSigns {
  _id: string;
  patientId: string;
  examination: string;
  recordedBy: string;
  recordedAt: string;
  measurements: {
    height_cm: number;
    weight_kg: number;
    bmi: number;
    blood_pressure: {
      systolic: number;
      diastolic: number;
    };
    pulse_rate: number;
    temperature_celsius: number;
    respiratory_rate: number;
    oxygen_saturation: number;
  };
  physical_examination: {
    vision: {
      left_eye: string;
      right_eye: string;
      color_vision: 'normal' | 'deficient';
      glasses_required: boolean;
    };
    hearing: {
      left_ear: string;
      right_ear: string;
      hearing_aid_required: boolean;
    };
    general_appearance: string;
    cardiovascular: string;
    respiratory: string;
    neurological: string;
  };
  notes: string;
  abnormalities: string[];
  status: 'normal' | 'abnormal' | 'requires_review';
}

// Mock vital signs data
const mockVitalSigns = {
  '1': [
    {
      _id: 'vitals_001',
      patientId: '1',
      examination: 'exam_001',
      recordedBy: 'Nurse Sarah Johnson',
      recordedAt: '2024-01-15T11:00:00Z',
      measurements: {
        height_cm: 178,
        weight_kg: 82,
        bmi: 25.9,
        blood_pressure: {
          systolic: 128,
          diastolic: 82
        },
        pulse_rate: 72,
        temperature_celsius: 36.8,
        respiratory_rate: 16,
        oxygen_saturation: 98
      },
      physical_examination: {
        vision: {
          left_eye: '20/20',
          right_eye: '20/25',
          color_vision: 'normal',
          glasses_required: false
        },
        hearing: {
          left_ear: 'Normal',
          right_ear: 'Normal',
          hearing_aid_required: false
        },
        general_appearance: 'Well-appearing, alert and oriented male in no distress',
        cardiovascular: 'Regular rate and rhythm, no murmurs, rubs or gallops',
        respiratory: 'Clear to auscultation bilaterally, no wheezes or crackles',
        neurological: 'Alert and oriented x3, normal gait and coordination'
      },
      notes: 'All vital signs within normal limits. Patient reports feeling well.',
      abnormalities: [],
      status: 'normal'
    },
    {
      _id: 'vitals_002', 
      patientId: '1',
      examination: 'exam_002',
      recordedBy: 'Nurse Maria Rodriguez',
      recordedAt: '2024-07-02T14:30:00Z',
      measurements: {
        height_cm: 178,
        weight_kg: 80,
        bmi: 25.2,
        blood_pressure: {
          systolic: 125,
          diastolic: 80
        },
        pulse_rate: 68,
        temperature_celsius: 36.6,
        respiratory_rate: 14,
        oxygen_saturation: 99
      },
      physical_examination: {
        vision: {
          left_eye: '20/20',
          right_eye: '20/20',
          color_vision: 'normal',
          glasses_required: false
        },
        hearing: {
          left_ear: 'Normal',
          right_ear: 'Normal', 
          hearing_aid_required: false
        },
        general_appearance: 'Healthy appearing male, good physical condition',
        cardiovascular: 'Regular rate and rhythm, no abnormalities detected',
        respiratory: 'Clear lung fields, good air entry bilaterally',
        neurological: 'Neurologically intact, no deficits noted'
      },
      notes: 'Slight weight loss since last visit. Patient reports increased exercise routine.',
      abnormalities: [],
      status: 'normal'
    }
  ],
  '2': [
    {
      _id: 'vitals_003',
      patientId: '2', 
      examination: 'exam_003',
      recordedBy: 'Nurse Patricia Wong',
      recordedAt: '2024-01-20T10:15:00Z',
      measurements: {
        height_cm: 165,
        weight_kg: 58,
        bmi: 21.3,
        blood_pressure: {
          systolic: 110,
          diastolic: 70
        },
        pulse_rate: 60,
        temperature_celsius: 36.5,
        respiratory_rate: 12,
        oxygen_saturation: 99
      },
      physical_examination: {
        vision: {
          left_eye: '20/20',
          right_eye: '20/20',
          color_vision: 'normal',
          glasses_required: false
        },
        hearing: {
          left_ear: 'Normal',
          right_ear: 'Normal',
          hearing_aid_required: false
        },
        general_appearance: 'Athletic build, excellent physical condition',
        cardiovascular: 'Bradycardia consistent with athletic conditioning, no murmurs',
        respiratory: 'Excellent lung capacity, clear throughout',
        neurological: 'Sharp reflexes, excellent coordination'
      },
      notes: 'Excellent physical condition consistent with marathon training. Low resting HR expected for athlete.',
      abnormalities: [],
      status: 'normal'
    }
  ]
};

// Get patient vital signs
export const getPatientVitals = async (patientId: string) => {
  // DEVELOPMENT: Return mock data
  if (process.env.NODE_ENV === 'development') {
    console.log("🔍 API DEBUG: Getting vital signs for patient:", patientId);
    return new Promise((resolve) => {
      setTimeout(() => {
        const vitals = mockVitalSigns[patientId as keyof typeof mockVitalSigns] || [];
        resolve({ vitals });
      }, 400);
    });
  }

  try {
    const response = await api.get(`/api/vitals/patient/${patientId}`);
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.error || error.message);
  }
};

// Create vital signs record
export const createVitalSigns = async (data: Omit<VitalSigns, '_id' | 'recordedAt'>) => {
  // DEVELOPMENT: Return mock success
  if (process.env.NODE_ENV === 'development') {
    console.log("🔍 API DEBUG: Creating vital signs:", data);
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          vitals: {
            _id: `vitals_${Date.now()}`,
            ...data,
            recordedAt: new Date().toISOString()
          }
        });
      }, 600);
    });
  }

  try {
    const response = await api.post('/api/vitals/create', data);
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.error || error.message);
  }
};

// Update vital signs record
export const updateVitalSigns = async (vitalId: string, data: Partial<VitalSigns>) => {
  // DEVELOPMENT: Return mock success
  if (process.env.NODE_ENV === 'development') {
    console.log("🔍 API DEBUG: Updating vital signs:", vitalId);
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          vitals: { _id: vitalId, ...data }
        });
      }, 400);
    });
  }

  try {
    const response = await api.put(`/api/vitals/${vitalId}`, data);
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.error || error.message);
  }
};

// Alias for backwards compatibility
export const saveVitalSigns = createVitalSigns;