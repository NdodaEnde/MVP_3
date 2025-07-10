import api from './api';
import { Patient, Questionnaire } from '../types';

// Dynamic mock data for development - stored in localStorage for persistence
const getStoredPatients = () => {
  const stored = localStorage.getItem('mockPatients');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error('Error parsing stored patients:', e);
    }
  }
  return [];
};

const saveStoredPatients = (patients: any[]) => {
  localStorage.setItem('mockPatients', JSON.stringify(patients));
};

// Initialize with some default mock data if none exists
const initializeMockData = () => {
  const stored = getStoredPatients();
  if (stored.length === 0) {
    const defaultPatients = [
      {
        _id: '1',
        firstName: 'John',
        surname: 'Doe',
        name: 'John Doe',
        idNumber: '8001010001',
        age: 44,
        phone: '0123456789',
        email: 'john.doe@example.com',
        employerName: 'Tech Corp',
        employer: 'Tech Corp',
        position: 'Software Developer',
        department: 'IT',
        status: 'checked-in',
        examinations: [],
        updatedAt: new Date().toISOString(),
        examinationType: 'pre-employment'
      },
      {
        _id: '2',
        firstName: 'Jane',
        surname: 'Smith',
        name: 'Jane Smith',
        idNumber: '8502020002',
        age: 39,
        phone: '0987654321',
        email: 'jane.smith@example.com',
        employerName: 'Health Solutions',
        employer: 'Health Solutions',
        position: 'Nurse',
        department: 'Medical',
        status: 'questionnaire',
        examinations: [],
        updatedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        examinationType: 'periodic'
      }
    ];
    saveStoredPatients(defaultPatients);
    return defaultPatients;
  }
  return stored;
};

// Initialize mock data on module load
const mockPatients = initializeMockData();

// Description: Get all patients with optional filtering
// Endpoint: GET /api/patients
// Request: { status?: string, employer?: string, page?: number, limit?: number }
// Response: { patients: Patient[], total: number, page: number, totalPages: number }
export const getPatients = async (params?: { status?: string; employer?: string; page?: number; limit?: number }) => {
  // DEVELOPMENT: Return dynamic mock data from localStorage
  if (process.env.NODE_ENV === 'development') {
    console.log("🔍 API DEBUG: Returning dynamic mock patient data");
    return new Promise((resolve) => {
      setTimeout(() => {
        const currentPatients = getStoredPatients();
        console.log("🔍 API DEBUG: Current patients count:", currentPatients.length);
        resolve({
          patients: currentPatients,
          total: currentPatients.length,
          page: 1,
          totalPages: 1
        });
      }, 500);
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
  name?: string;
  initials?: string;
  firstName?: string;
  surname?: string;
  idNumber: string;
  dateOfBirth?: string;
  maritalStatus?: string;
  gender?: string;
  phone: string;
  email: string;
  address?: {
    street?: string;
    city?: string;
    postalCode?: string;
    province?: string;
  };
  employer?: string;
  employerName?: string;
  employerID?: string;
  position?: string;
  department?: string;
  employeeNumber?: string;
  examinationType: string;
  location?: string;
}) => {
  // DEVELOPMENT: Create and store new patient in localStorage
  if (process.env.NODE_ENV === 'development') {
    console.log("🔍 API DEBUG: Creating and storing patient:", data);
    return new Promise((resolve) => {
      setTimeout(() => {
        const currentPatients = getStoredPatients();
        const newPatient = {
          _id: Date.now().toString(),
          name: data.name || `${data.firstName || ''} ${data.surname || ''}`.trim(),
          firstName: data.firstName || data.name?.split(' ')[0] || '',
          surname: data.surname || data.name?.split(' ').slice(1).join(' ') || '',
          idNumber: data.idNumber,
          phone: data.phone,
          email: data.email,
          employer: data.employer || data.employerName || '',
          employerName: data.employerName || data.employer || '',
          position: data.position || '',
          department: data.department || '',
          employeeNumber: data.employeeNumber || '',
          examinationType: data.examinationType,
          status: 'checked-in',
          examinations: [],
          updatedAt: new Date().toISOString(),
          // Add all other fields from registration
          ...data,
          // Calculate age if dateOfBirth provided
          age: data.dateOfBirth ? new Date().getFullYear() - new Date(data.dateOfBirth).getFullYear() : undefined
        };
        
        // Add to stored patients
        const updatedPatients = [...currentPatients, newPatient];
        saveStoredPatients(updatedPatients);
        
        console.log("✅ API DEBUG: Patient created with ID:", newPatient._id);
        console.log("✅ API DEBUG: Total patients now:", updatedPatients.length);
        
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
  // DEVELOPMENT: Update patient in localStorage
  if (process.env.NODE_ENV === 'development') {
    console.log("🔍 API DEBUG: Updating patient status:", { patientId, status, notes });
    return new Promise((resolve) => {
      setTimeout(() => {
        const currentPatients = getStoredPatients();
        const patientIndex = currentPatients.findIndex(p => p._id === patientId);
        
        if (patientIndex !== -1) {
          currentPatients[patientIndex] = {
            ...currentPatients[patientIndex],
            status,
            updatedAt: new Date().toISOString()
          };
          saveStoredPatients(currentPatients);
          
          resolve({
            patient: currentPatients[patientIndex],
            success: true,
            message: 'Patient status updated successfully'
          });
        } else {
          resolve({
            patient: null,
            success: false,
            message: 'Patient not found'
          });
        }
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
  // DEVELOPMENT: Get patient from localStorage
  if (process.env.NODE_ENV === 'development') {
    console.log("🔍 API DEBUG: Getting patient by ID:", patientId);
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const currentPatients = getStoredPatients();
        const patient = currentPatients.find(p => p._id === patientId);
        
        if (patient) {
          console.log("✅ API DEBUG: Found patient:", patient.firstName, patient.surname);
          resolve({ patient });
        } else {
          console.error("❌ API DEBUG: Patient not found with ID:", patientId);
          console.log("🔍 API DEBUG: Available patient IDs:", currentPatients.map(p => p._id));
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