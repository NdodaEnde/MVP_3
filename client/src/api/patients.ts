import api from './api';
import { Patient, Questionnaire } from '../types';

// Mock data for development
const mockPatients = [
  {
    _id: '1',
    firstName: 'John',
    surname: 'Doe',
    name: 'John Doe', // Added for PatientQueue component
    idNumber: '8001010001',
    age: 44,
    phone: '0123456789',
    email: 'john.doe@example.com',
    employerName: 'Tech Corp',
    employer: 'Tech Corp', // Added for PatientQueue component
    position: 'Software Developer',
    department: 'IT',
    status: 'checked-in',
    examinations: [],
    updatedAt: new Date().toISOString(),
    examinationType: 'Pre-employment'
  },
  {
    _id: '2',
    firstName: 'Jane',
    surname: 'Smith',
    name: 'Jane Smith', // Added for PatientQueue component
    idNumber: '8502020002',
    age: 39,
    phone: '0987654321',
    email: 'jane.smith@example.com',
    employerName: 'Health Solutions',
    employer: 'Health Solutions', // Added for PatientQueue component
    position: 'Nurse',
    department: 'Medical',
    status: 'questionnaire',
    examinations: [],
    updatedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 minutes ago
    examinationType: 'Annual'
  },
  {
    _id: '3',
    firstName: 'Mike',
    surname: 'Johnson',
    name: 'Mike Johnson',
    idNumber: '7903030003',
    age: 45,
    phone: '0111222333',
    email: 'mike.johnson@example.com',
    employerName: 'Mining Corp',
    employer: 'Mining Corp',
    position: 'Engineer',
    department: 'Operations',
    status: 'nurse',
    examinations: [],
    updatedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
    examinationType: 'Return to work'
  },
  {
    _id: '4',
    firstName: 'Sarah',
    surname: 'Williams',
    name: 'Sarah Williams',
    idNumber: '8804040004',
    age: 36,
    phone: '0444555666',
    email: 'sarah.williams@example.com',
    employerName: 'Finance Ltd',
    employer: 'Finance Ltd',
    position: 'Accountant',
    department: 'Finance',
    status: 'doctor',
    examinations: [],
    updatedAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(), // 45 minutes ago
    examinationType: 'Periodic'
  },
  {
    _id: '5',
    firstName: 'David',
    surname: 'Brown',
    name: 'David Brown',
    idNumber: '8705050005',
    age: 37,
    phone: '0777888999',
    email: 'david.brown@example.com',
    employerName: 'Construction Co',
    employer: 'Construction Co',
    position: 'Supervisor',
    department: 'Operations',
    status: 'completed',
    examinations: [],
    updatedAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // 1 hour ago
    examinationType: 'Pre-employment'
  }
];

// Description: Get all patients with optional filtering
// Endpoint: GET /api/patients
// Request: { status?: string, employer?: string, page?: number, limit?: number }
// Response: { patients: Patient[], total: number, page: number, totalPages: number }
export const getPatients = async (params?: { status?: string; employer?: string; page?: number; limit?: number }) => {
  // DEVELOPMENT: Return mock data instead of making API calls
  if (process.env.NODE_ENV === 'development') {
    console.log("🔍 API DEBUG: Returning mock patient data");
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          patients: mockPatients,
          total: mockPatients.length,
          page: 1,
          totalPages: 1
        });
      }, 500); // Simulate network delay
    });
  }
  
  try {
    const response = await api.get('/api/patients', { params });
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.error || error.message);
  }
};

// Description: Create a new patient
// Endpoint: POST /api/patients/create
// Request: Patient registration data
// Response: { patient: Patient, examination: Examination, success: boolean }
export const createPatient = async (data: {
  initials: string;
  firstName: string;
  surname: string;
  idNumber: string;
  dateOfBirth: string;
  maritalStatus: string;
  gender: string;
  phone: string;
  email: string;
  address?: {
    street?: string;
    city?: string;
    postalCode?: string;
    province?: string;
  };
  employerName: string;
  employerID?: string;
  position?: string;
  department?: string;
  employeeNumber?: string;
  examinationType: string;
  location?: string;
}) => {
  // DEVELOPMENT: Return mock success response
  if (process.env.NODE_ENV === 'development') {
    console.log("🔍 API DEBUG: Creating mock patient:", data);
    return new Promise((resolve) => {
      setTimeout(() => {
        const newPatient = {
          _id: Date.now().toString(),
          ...data,
          age: new Date().getFullYear() - new Date(data.dateOfBirth).getFullYear(),
          status: 'registered',
          examinations: []
        };
        resolve({
          patient: newPatient,
          examination: { _id: Date.now().toString(), patientId: newPatient._id },
          success: true
        });
      }, 800);
    });
  }

  try {
    const response = await api.post('/api/patients/create', data);
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.error || error.message);
  }
};

// Description: Update patient status
// Endpoint: PUT /api/patients/:id/status
// Request: { status: string, notes?: string }
// Response: { patient: Patient, success: boolean, message: string }
export const updatePatientStatus = async (patientId: string, status: string, notes?: string) => {
  // DEVELOPMENT: Return mock success response
  if (process.env.NODE_ENV === 'development') {
    console.log("🔍 API DEBUG: Updating patient status:", { patientId, status, notes });
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          patient: { ...mockPatients[0], _id: patientId, status },
          success: true,
          message: 'Patient status updated successfully'
        });
      }, 300);
    });
  }

  try {
    const response = await api.put(`/api/patients/${patientId}/status`, { status, notes });
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.error || error.message);
  }
};

// Description: Get patient by ID
// Endpoint: GET /api/patients/:id
// Request: {}
// Response: { patient: Patient }
export const getPatientById = async (patientId: string) => {
  // DEVELOPMENT: Return mock patient data
  if (process.env.NODE_ENV === 'development') {
    console.log("🔍 API DEBUG: Getting patient by ID:", patientId);
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const patient = mockPatients.find(p => p._id === patientId) || mockPatients[0];
        if (patient) {
          resolve({ patient: { ...patient, _id: patientId } });
        } else {
          reject(new Error('Patient not found'));
        }
      }, 300);
    });
  }

  try {
    const response = await api.get(`/api/patients/${patientId}`);
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.error || error.message);
  }
};

// Description: Delete patient
// Endpoint: DELETE /api/patients/:id
// Request: {}
// Response: { success: boolean, message: string }
export const deletePatient = async (patientId: string) => {
  // DEVELOPMENT: Return mock success response
  if (process.env.NODE_ENV === 'development') {
    console.log("🔍 API DEBUG: Deleting patient:", patientId);
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          message: 'Patient deleted successfully'
        });
      }, 500);
    });
  }

  try {
    const response = await api.delete(`/api/patients/${patientId}`);
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.error || error.message);
  }
};