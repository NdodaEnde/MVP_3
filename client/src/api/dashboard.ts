import api from './api';

// Description: Get dashboard statistics
// Endpoint: GET /api/dashboard/stats
// Request: {}
// Response: { stats: object }
export const getDashboardStats = () => {
  // Mocking the response
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        stats: {
          totalPatients: 156,
          todayExaminations: 23,
          pendingCertificates: 8,
          completedToday: 15,
          queueStats: {
            reception: 3,
            nurse: 5,
            technician: 4,
            doctor: 2
          },
          monthlyTrends: [
            { month: 'Jan', examinations: 120, certificates: 115 },
            { month: 'Feb', examinations: 135, certificates: 130 },
            { month: 'Mar', examinations: 156, certificates: 150 },
            { month: 'Apr', examinations: 142, certificates: 138 },
            { month: 'May', examinations: 168, certificates: 165 },
            { month: 'Jun', examinations: 189, certificates: 185 }
          ],
          statusDistribution: [
            { status: 'Fit', count: 85, percentage: 68 },
            { status: 'Fit with Restrictions', count: 32, percentage: 26 },
            { status: 'Unfit', count: 8, percentage: 6 }
          ]
        }
      });
    }, 500);
  });
  // Uncomment the below lines to make an actual API call
  // try {
  //   return await api.get('/api/dashboard/stats');
  // } catch (error) {
  //   throw new Error(error?.response?.data?.error || error.message);
  // }
};

// Description: Get workflow queue status
// Endpoint: GET /api/dashboard/queue
// Request: {}
// Response: { queue: object }
export const getQueueStatus = () => {
  // Mocking the response
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        queue: {
          reception: [
            { _id: '1', name: 'Alice Cooper', waitTime: 5, priority: 'normal' },
            { _id: '2', name: 'Bob Wilson', waitTime: 12, priority: 'urgent' },
            { _id: '3', name: 'Carol Davis', waitTime: 8, priority: 'normal' }
          ],
          nurse: [
            { _id: '4', name: 'David Miller', waitTime: 15, priority: 'normal' },
            { _id: '5', name: 'Eva Garcia', waitTime: 22, priority: 'normal' },
            { _id: '6', name: 'Frank Johnson', waitTime: 18, priority: 'urgent' }
          ],
          technician: [
            { _id: '7', name: 'Grace Lee', waitTime: 25, priority: 'normal' },
            { _id: '8', name: 'Henry Brown', waitTime: 30, priority: 'normal' }
          ],
          doctor: [
            { _id: '9', name: 'Ivy Chen', waitTime: 45, priority: 'urgent' },
            { _id: '10', name: 'Jack Taylor', waitTime: 35, priority: 'normal' }
          ]
        }
      });
    }, 300);
  });
  // Uncomment the below lines to make an actual API call
  // try {
  //   return await api.get('/api/dashboard/queue');
  // } catch (error) {
  //   throw new Error(error?.response?.data?.error || error.message);
  // }
};