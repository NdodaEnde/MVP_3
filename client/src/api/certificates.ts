import api from './api';
import { Certificate } from '../types';

// Description: Generate certificate
// Endpoint: POST /api/certificates
// Request: { patientId: string, status: string, restrictions?: string[], recommendations?: string, validUntil: string }
// Response: { certificate: Certificate, success: boolean, message: string }
export const generateCertificate = (data: Omit<Certificate, '_id' | 'doctorId' | 'digitalSignature' | 'issuedAt'>) => {
  // Mocking the response
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        certificate: {
          _id: Date.now().toString(),
          ...data,
          doctorId: 'doctor-123',
          digitalSignature: 'digital-signature-hash-123',
          issuedAt: new Date().toISOString()
        },
        success: true,
        message: 'Certificate generated successfully'
      });
    }, 1000);
  });
  // Uncomment the below lines to make an actual API call
  // try {
  //   return await api.post('/api/certificates', data);
  // } catch (error) {
  //   throw new Error(error?.response?.data?.error || error.message);
  // }
};

// Description: Get patient certificates
// Endpoint: GET /api/certificates/:patientId
// Request: {}
// Response: { certificates: Certificate[] }
export const getPatientCertificates = (patientId: string) => {
  // Mocking the response
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        certificates: [
          {
            _id: '1',
            patientId,
            status: 'fit-with-restrictions',
            restrictions: ['Must wear corrective lenses', 'No heavy lifting over 25kg'],
            recommendations: 'Follow up in 6 months for blood pressure monitoring',
            validUntil: '2025-01-15T00:00:00Z',
            doctorId: 'doctor-123',
            digitalSignature: 'digital-signature-hash-123',
            issuedAt: '2024-01-15T11:45:00Z'
          }
        ]
      });
    }, 500);
  });
  // Uncomment the below lines to make an actual API call
  // try {
  //   return await api.get(`/api/certificates/${patientId}`);
  // } catch (error) {
  //   throw new Error(error?.response?.data?.error || error.message);
  // }
};

// Description: Get all certificates with filtering
// Endpoint: GET /api/certificates
// Request: { status?: string, employer?: string, page?: number, limit?: number }
// Response: { certificates: Certificate[], total: number, page: number, totalPages: number }
export const getCertificates = (params?: { status?: string; employer?: string; page?: number; limit?: number }) => {
  // Mocking the response
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        certificates: [
          {
            _id: '1',
            patientId: '1',
            status: 'fit-with-restrictions',
            restrictions: ['Must wear corrective lenses'],
            recommendations: 'Annual eye exam recommended',
            validUntil: '2025-01-15T00:00:00Z',
            doctorId: 'doctor-123',
            digitalSignature: 'digital-signature-hash-123',
            issuedAt: '2024-01-15T11:45:00Z'
          },
          {
            _id: '2',
            patientId: '2',
            status: 'fit',
            restrictions: [],
            recommendations: 'Continue current health practices',
            validUntil: '2025-01-15T00:00:00Z',
            doctorId: 'doctor-123',
            digitalSignature: 'digital-signature-hash-456',
            issuedAt: '2024-01-15T12:30:00Z'
          }
        ],
        total: 2,
        page: 1,
        totalPages: 1
      });
    }, 500);
  });
  // Uncomment the below lines to make an actual API call
  // try {
  //   return await api.get('/api/certificates', { params });
  // } catch (error) {
  //   throw new Error(error?.response?.data?.error || error.message);
  // }
};