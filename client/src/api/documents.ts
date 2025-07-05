import api from './api';

export interface Document {
  _id: string;
  name: string;
  type: 'medical-form' | 'questionnaire' | 'certificate' | 'x-ray' | 'lab-result' | 'other';
  size: number;
  uploadedAt: string;
  processedAt?: string;
  status: 'uploaded' | 'processing' | 'processed' | 'failed';
  originalUrl: string;
  extractedData?: any;
  patientId?: string;
  tags?: string[];
}

// Description: Upload documents (single or batch)
// Endpoint: POST /api/documents/upload
// Request: FormData with files
// Response: { documents: Document[], success: boolean, message: string }
export const uploadDocuments = (files: FileList) => {
  // Mocking the response
  return new Promise((resolve) => {
    setTimeout(() => {
      const documents = Array.from(files).map((file, index) => ({
        _id: `doc-${Date.now()}-${index}`,
        name: file.name,
        type: 'medical-form' as const,
        size: file.size,
        uploadedAt: new Date().toISOString(),
        status: 'processing' as const,
        originalUrl: URL.createObjectURL(file),
        tags: ['uploaded', 'pending-ocr']
      }));
      
      resolve({
        documents,
        success: true,
        message: `${files.length} document(s) uploaded successfully`
      });
    }, 1000);
  });
  // Uncomment the below lines to make an actual API call
  // try {
  //   const formData = new FormData();
  //   Array.from(files).forEach(file => formData.append('documents', file));
  //   return await api.post('/api/documents/upload', formData, {
  //     headers: { 'Content-Type': 'multipart/form-data' }
  //   });
  // } catch (error) {
  //   throw new Error(error?.response?.data?.error || error.message);
  // }
};

// Description: Get all documents with filtering and pagination
// Endpoint: GET /api/documents
// Request: { type?: string, status?: string, page?: number, limit?: number, search?: string }
// Response: { documents: Document[], total: number, page: number, totalPages: number }
export const getDocuments = (params?: { type?: string; status?: string; page?: number; limit?: number; search?: string }) => {
  // Mocking the response
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        documents: [
          {
            _id: '1',
            name: 'Medical_Form_John_Smith.pdf',
            type: 'medical-form',
            size: 2048576,
            uploadedAt: '2024-01-15T08:30:00Z',
            processedAt: '2024-01-15T08:32:00Z',
            status: 'processed',
            originalUrl: '/documents/medical_form_1.pdf',
            extractedData: {
              patientName: 'John Smith',
              idNumber: '8501015009087',
              medicalHistory: ['Hypertension', 'Diabetes'],
              medications: ['Lisinopril', 'Metformin']
            },
            patientId: '1',
            tags: ['medical-form', 'processed', 'john-smith']
          },
          {
            _id: '2',
            name: 'Chest_Xray_Sarah_Johnson.jpg',
            type: 'x-ray',
            size: 5242880,
            uploadedAt: '2024-01-15T09:15:00Z',
            processedAt: '2024-01-15T09:18:00Z',
            status: 'processed',
            originalUrl: '/documents/xray_2.jpg',
            extractedData: {
              findings: 'Normal chest X-ray',
              radiologist: 'Dr. Williams',
              date: '2024-01-15'
            },
            patientId: '2',
            tags: ['x-ray', 'normal', 'sarah-johnson']
          },
          {
            _id: '3',
            name: 'Lab_Results_Michael_Brown.pdf',
            type: 'lab-result',
            size: 1048576,
            uploadedAt: '2024-01-15T10:00:00Z',
            status: 'processing',
            originalUrl: '/documents/lab_3.pdf',
            tags: ['lab-result', 'processing', 'michael-brown']
          }
        ],
        total: 3,
        page: 1,
        totalPages: 1
      });
    }, 500);
  });
  // Uncomment the below lines to make an actual API call
  // try {
  //   return await api.get('/api/documents', { params });
  // } catch (error) {
  //   throw new Error(error?.response?.data?.error || error.message);
  // }
};

// Description: Get document by ID with extracted data
// Endpoint: GET /api/documents/:id
// Request: {}
// Response: { document: Document }
export const getDocument = (documentId: string) => {
  // Mocking the response
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        document: {
          _id: documentId,
          name: 'Medical_Form_John_Smith.pdf',
          type: 'medical-form',
          size: 2048576,
          uploadedAt: '2024-01-15T08:30:00Z',
          processedAt: '2024-01-15T08:32:00Z',
          status: 'processed',
          originalUrl: '/documents/medical_form_1.pdf',
          extractedData: {
            patientName: 'John Smith',
            idNumber: '8501015009087',
            dateOfBirth: '1985-01-01',
            medicalHistory: {
              heartDisease: false,
              diabetes: true,
              hypertension: true,
              allergies: ['Penicillin']
            },
            currentMedications: [
              { name: 'Lisinopril', dosage: '10mg', frequency: 'Daily' },
              { name: 'Metformin', dosage: '500mg', frequency: 'Twice daily' }
            ],
            emergencyContact: {
              name: 'Jane Smith',
              relationship: 'Spouse',
              phone: '+27123456789'
            }
          },
          patientId: '1',
          tags: ['medical-form', 'processed', 'john-smith']
        }
      });
    }, 500);
  });
  // Uncomment the below lines to make an actual API call
  // try {
  //   return await api.get(`/api/documents/${documentId}`);
  // } catch (error) {
  //   throw new Error(error?.response?.data?.error || error.message);
  // }
};

// Description: Delete documents
// Endpoint: DELETE /api/documents
// Request: { documentIds: string[] }
// Response: { success: boolean, message: string, deletedCount: number }
export const deleteDocuments = (documentIds: string[]) => {
  // Mocking the response
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        message: `${documentIds.length} document(s) deleted successfully`,
        deletedCount: documentIds.length
      });
    }, 500);
  });
  // Uncomment the below lines to make an actual API call
  // try {
  //   return await api.delete('/api/documents', { data: { documentIds } });
  // } catch (error) {
  //   throw new Error(error?.response?.data?.error || error.message);
  // }
};

// Description: Process document with OCR
// Endpoint: POST /api/documents/:id/process
// Request: {}
// Response: { document: Document, success: boolean, message: string }
export const processDocument = (documentId: string) => {
  // Mocking the response
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        document: {
          _id: documentId,
          status: 'processed',
          processedAt: new Date().toISOString(),
          extractedData: {
            patientName: 'Extracted Name',
            confidence: 0.95,
            fields: ['name', 'id', 'medical_history']
          }
        },
        success: true,
        message: 'Document processed successfully'
      });
    }, 2000);
  });
  // Uncomment the below lines to make an actual API call
  // try {
  //   return await api.post(`/api/documents/${documentId}/process`);
  // } catch (error) {
  //   throw new Error(error?.response?.data?.error || error.message);
  // }
};