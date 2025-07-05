import api from './api';

export interface ProcessingStats {
  totalDocuments: number;
  processedDocuments: number;
  processingProgress: number;
  documentsPerDay: number;
  documentsPerWeek: number;
  documentsPerMonth: number;
  averageProcessingTime: number;
  errorRate: number;
  currentStatus: 'in-progress' | 'pending' | 'completed' | 'paused';
  milestones: {
    percentage: number;
    reached: boolean;
    reachedAt?: string;
  }[];
  processingTrends: {
    date: string;
    processed: number;
    errors: number;
  }[];
}

export interface ProcessingProject {
  _id: string;
  name: string;
  clientName: string;
  startDate: string;
  estimatedCompletion: string;
  status: 'in-progress' | 'pending' | 'completed' | 'paused';
  totalDocuments: number;
  processedDocuments: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

// Description: Get historical document processing statistics
// Endpoint: GET /api/processing/stats
// Request: { projectId?: string, dateRange?: string }
// Response: { stats: ProcessingStats }
export const getProcessingStats = (params?: { projectId?: string; dateRange?: string }) => {
  // Mocking the response
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        stats: {
          totalDocuments: 2500,
          processedDocuments: 1875,
          processingProgress: 75,
          documentsPerDay: 125,
          documentsPerWeek: 875,
          documentsPerMonth: 3500,
          averageProcessingTime: 2.3,
          errorRate: 3.2,
          currentStatus: 'in-progress',
          milestones: [
            { percentage: 25, reached: true, reachedAt: '2024-01-10T10:00:00Z' },
            { percentage: 50, reached: true, reachedAt: '2024-01-20T14:30:00Z' },
            { percentage: 75, reached: true, reachedAt: '2024-01-28T16:45:00Z' },
            { percentage: 100, reached: false }
          ],
          processingTrends: [
            { date: '2024-01-15', processed: 120, errors: 4 },
            { date: '2024-01-16', processed: 135, errors: 2 },
            { date: '2024-01-17', processed: 110, errors: 6 },
            { date: '2024-01-18', processed: 145, errors: 3 },
            { date: '2024-01-19', processed: 125, errors: 5 },
            { date: '2024-01-20', processed: 130, errors: 2 },
            { date: '2024-01-21', processed: 140, errors: 4 }
          ]
        }
      });
    }, 500);
  });
  // Uncomment the below lines to make an actual API call
  // try {
  //   return await api.get('/api/processing/stats', { params });
  // } catch (error) {
  //   throw new Error(error?.response?.data?.error || error.message);
  // }
};

// Description: Get processing projects list
// Endpoint: GET /api/processing/projects
// Request: { status?: string, page?: number, limit?: number }
// Response: { projects: ProcessingProject[], total: number, page: number, totalPages: number }
export const getProcessingProjects = (params?: { status?: string; page?: number; limit?: number }) => {
  // Mocking the response
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        projects: [
          {
            _id: '1',
            name: 'ABC Mining Historical Records',
            clientName: 'ABC Mining Corp',
            startDate: '2024-01-01T00:00:00Z',
            estimatedCompletion: '2024-02-15T00:00:00Z',
            status: 'in-progress',
            totalDocuments: 2500,
            processedDocuments: 1875,
            priority: 'high'
          },
          {
            _id: '2',
            name: 'XYZ Construction Archive',
            clientName: 'XYZ Construction Ltd',
            startDate: '2024-01-10T00:00:00Z',
            estimatedCompletion: '2024-02-28T00:00:00Z',
            status: 'pending',
            totalDocuments: 1200,
            processedDocuments: 0,
            priority: 'medium'
          },
          {
            _id: '3',
            name: 'DEF Manufacturing Files',
            clientName: 'DEF Manufacturing Inc',
            startDate: '2023-12-15T00:00:00Z',
            estimatedCompletion: '2024-01-30T00:00:00Z',
            status: 'completed',
            totalDocuments: 800,
            processedDocuments: 800,
            priority: 'low'
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
  //   return await api.get('/api/processing/projects', { params });
  // } catch (error) {
  //   throw new Error(error?.response?.data?.error || error.message);
  // }
};

// Description: Generate processing report
// Endpoint: POST /api/processing/reports
// Request: { projectId?: string, dateRange: string, format: 'pdf' | 'csv' }
// Response: { reportUrl: string, success: boolean, message: string }
export const generateProcessingReport = (data: { projectId?: string; dateRange: string; format: 'pdf' | 'csv' }) => {
  // Mocking the response
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        reportUrl: `/reports/processing_report_${Date.now()}.${data.format}`,
        success: true,
        message: 'Report generated successfully'
      });
    }, 2000);
  });
  // Uncomment the below lines to make an actual API call
  // try {
  //   return await api.post('/api/processing/reports', data);
  // } catch (error) {
  //   throw new Error(error?.response?.data?.error || error.message);
  // }
};