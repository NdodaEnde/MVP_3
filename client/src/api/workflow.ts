// Workflow API service for Phase 1 + Phase 2 integration
import api from './api';

export interface WorkflowSession {
  sessionId: string;
  patient: {
    id: string;
    firstName: string;
    surname: string;
    idNumber: string;
    examinationType: string;
  };
  currentPhase: 'reception' | 'questionnaire' | 'station_routing' | 'examination' | 'completed';
  currentStation: string | null;
  progress: number;
  journeyDuration: number;
  medicalFlags: string[];
  riskAssessment: {
    workingAtHeights: 'low' | 'medium' | 'high';
    cardiovascular: 'low' | 'medium' | 'high';
    respiratory: 'low' | 'medium' | 'high';
    overall: 'low' | 'medium' | 'high';
  };
  completedStations: string[];
  recommendedStations: StationRecommendation[];
  metrics: {
    totalWaitTime: number;
    totalServiceTime: number;
    stationCount: number;
    efficiencyScore: number;
    patientSatisfaction: number;
    bottleneckCount: number;
  };
}

export interface StationRecommendation {
  stationId: string;
  stationName: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  reason: string;
  estimatedTime: number;
  currentWaitTime: number;
  requiredForExamType: boolean;
  medicalFlagTriggered?: string;
}

export interface Station {
  stationId: string;
  name: string;
  type: string;
  status: 'available' | 'busy' | 'full' | 'closed' | 'maintenance';
  currentQueue: number;
  maxCapacity: number;
  estimatedWaitTime: number;
  utilizationRate: number;
  staffOnDuty: number;
  lastUpdated: string;
}

export interface QueueInfo {
  position: number;
  estimatedWaitTime: number;
  stationName: string;
}

// Workflow Session Management
export const workflowAPI = {
  // Start new workflow session (Reception)
  async startSession(patientId: string, patientInfo: any, receptionistId: string, tabletId: string) {
    try {
      const response = await api.post('/workflow/sessions/start', {
        patientId,
        patientInfo,
        receptionistId,
        tabletId,
        checkInMethod: 'walk_in'
      });
      
      return response.data;
    } catch (error) {
      console.error('Failed to start workflow session:', error);
      throw error;
    }
  },

  // Update questionnaire data
  async updateQuestionnaire(sessionId: string, data: {
    questionnaireData: any;
    medicalFlags: string[];
    riskAssessment: any;
    signatureData?: any;
  }) {
    try {
      const response = await api.put(`/workflow/sessions/${sessionId}/questionnaire`, data);
      return response.data;
    } catch (error) {
      console.error('Failed to update questionnaire:', error);
      throw error;
    }
  },

  // Generate station routing recommendations
  async generateRouting(sessionId: string) {
    try {
      const response = await api.post(`/workflow/sessions/${sessionId}/routing`);
      return response.data;
    } catch (error) {
      console.error('Failed to generate routing:', error);
      throw error;
    }
  },

  // Select station and join queue
  async selectStation(sessionId: string, stationId: string, priority: string = 'medium') {
    try {
      const response = await api.post(`/workflow/sessions/${sessionId}/select-station`, {
        stationId,
        priority
      });
      return response.data;
    } catch (error) {
      console.error('Failed to select station:', error);
      throw error;
    }
  },

  // Complete station visit
  async completeStation(sessionId: string, stationId: string, results: any, notes?: string) {
    try {
      const response = await api.post(`/workflow/sessions/${sessionId}/complete-station`, {
        stationId,
        results,
        notes,
        staffMember: 'current-user-id' // TODO: Get from auth context
      });
      return response.data;
    } catch (error) {
      console.error('Failed to complete station:', error);
      throw error;
    }
  },

  // Get session status
  async getSession(sessionId: string): Promise<{ success: boolean; session: WorkflowSession }> {
    try {
      const response = await api.get(`/workflow/sessions/${sessionId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get session:', error);
      throw error;
    }
  },

  // Get all active sessions (for dashboard)
  async getActiveSessions(organizationId?: string) {
    try {
      const params = organizationId ? { organizationId } : {};
      const response = await api.get('/workflow/sessions', { params });
      return response.data;
    } catch (error) {
      console.error('Failed to get active sessions:', error);
      throw error;
    }
  }
};

// Station Management
export const stationAPI = {
  // Get all stations with current status
  async getStations(organizationId?: string): Promise<{ success: boolean; stations: Station[] }> {
    try {
      const params = organizationId ? { organizationId } : {};
      const response = await api.get('/workflow/stations', { params });
      return response.data;
    } catch (error) {
      console.error('Failed to get stations:', error);
      throw error;
    }
  },

  // Get station details with queue
  async getStationDetails(stationId: string) {
    try {
      const response = await api.get(`/workflow/stations/${stationId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get station details:', error);
      throw error;
    }
  },

  // Update station status
  async updateStationStatus(stationId: string, status: string, reason?: string) {
    try {
      const response = await api.put(`/workflow/stations/${stationId}/status`, {
        status,
        reason
      });
      return response.data;
    } catch (error) {
      console.error('Failed to update station status:', error);
      throw error;
    }
  },

  // Add staff member to station
  async addStaffToStation(stationId: string, staffData: {
    userId: string;
    name: string;
    role: string;
    shiftStart: Date;
    shiftEnd: Date;
  }) {
    try {
      const response = await api.post(`/workflow/stations/${stationId}/staff`, staffData);
      return response.data;
    } catch (error) {
      console.error('Failed to add staff to station:', error);
      throw error;
    }
  },

  // Remove staff member from station
  async removeStaffFromStation(stationId: string, userId: string) {
    try {
      const response = await api.delete(`/workflow/stations/${stationId}/staff/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to remove staff from station:', error);
      throw error;
    }
  }
};

// Real-time Updates (WebSocket integration)
export class WorkflowWebSocket {
  private ws: WebSocket | null = null;
  private listeners: { [event: string]: Function[] } = {};

  connect(sessionId?: string) {
    const wsUrl = process.env.NODE_ENV === 'production' 
      ? `wss://${window.location.host}/ws/workflow`
      : 'ws://localhost:3001/ws/workflow';
    
    const url = sessionId ? `${wsUrl}?sessionId=${sessionId}` : wsUrl;
    
    this.ws = new WebSocket(url);
    
    this.ws.onopen = () => {
      console.log('Workflow WebSocket connected');
      this.emit('connected');
    };
    
    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.emit(data.type, data.payload);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };
    
    this.ws.onclose = () => {
      console.log('Workflow WebSocket disconnected');
      this.emit('disconnected');
      
      // Auto-reconnect after 5 seconds
      setTimeout(() => this.connect(sessionId), 5000);
    };
    
    this.ws.onerror = (error) => {
      console.error('Workflow WebSocket error:', error);
      this.emit('error', error);
    };
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  on(event: string, callback: Function) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  off(event: string, callback: Function) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }
  }

  private emit(event: string, data?: any) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => callback(data));
    }
  }

  send(type: string, payload: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, payload }));
    }
  }
}

// Analytics and Reporting
export const analyticsAPI = {
  // Get workflow performance metrics
  async getWorkflowMetrics(timeframe: 'today' | 'week' | 'month' = 'today') {
    try {
      const response = await api.get(`/workflow/analytics/metrics`, {
        params: { timeframe }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to get workflow metrics:', error);
      throw error;
    }
  },

  // Get station performance data
  async getStationPerformance(timeframe: 'today' | 'week' | 'month' = 'today') {
    try {
      const response = await api.get(`/workflow/analytics/stations`, {
        params: { timeframe }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to get station performance:', error);
      throw error;
    }
  },

  // Get patient satisfaction scores
  async getPatientSatisfaction(timeframe: 'today' | 'week' | 'month' = 'today') {
    try {
      const response = await api.get(`/workflow/analytics/satisfaction`, {
        params: { timeframe }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to get patient satisfaction:', error);
      throw error;
    }
  },

  // Export workflow data
  async exportWorkflowData(format: 'csv' | 'excel' | 'pdf', timeframe: string) {
    try {
      const response = await api.get(`/workflow/analytics/export`, {
        params: { format, timeframe },
        responseType: 'blob'
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `workflow-data.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      return { success: true };
    } catch (error) {
      console.error('Failed to export workflow data:', error);
      throw error;
    }
  }
};

export default workflowAPI;