// src/services/hybridIntegrationService.ts
import { useState, useEffect } from 'react';
import { QuestionnaireFormData } from '@/schemas/questionnaire-schema';

// 🔧 Integration Service for Hybrid Questionnaire System
export class HybridIntegrationService {
  
  // 🔄 Workflow Management
  static async initializePatientSession(patientId: string, sessionType: 'self_service' | 'staff_assisted') {
    try {
      const sessionData = {
        patient_id: patientId,
        session_type: sessionType,
        start_time: new Date().toISOString(),
        device_type: sessionType === 'self_service' ? 'tablet' : 'desktop',
        status: 'active'
      };
      
      // Initialize session in database
      const response = await fetch('/api/workflow/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sessionData)
      });
      
      return await response.json();
    } catch (error) {
      console.error('Failed to initialize session:', error);
      throw error;
    }
  }
  
  // 📊 Real-time Station Monitoring
  static async getStationAvailability() {
    try {
      const response = await fetch('/api/workflow/stations/availability');
      const stations = await response.json();
      
      return stations.map((station: any) => ({
        id: station.id,
        name: station.name,
        currentCapacity: station.current_patients || 0,
        maxCapacity: station.max_capacity || 5,
        averageWaitTime: station.avg_wait_time || 0,
        status: station.status,
        priority: this.calculateStationPriority(station)
      }));
    } catch (error) {
      console.error('Failed to get station availability:', error);
      return [];
    }
  }
  
  // 🎯 Smart Station Routing
  static calculateOptimalStationRoute(
    patientData: Partial<QuestionnaireFormData>, 
    availableStations: any[]
  ) {
    const recommendations = [];
    
    // Medical condition based routing
    const medicalHistory = patientData.medical_history?.current_conditions;
    
    if (medicalHistory?.heart_disease_high_bp) {
      recommendations.push({
        station_id: 'ecg',
        priority: 'high',
        reason: 'Cardiovascular condition detected',
        estimated_time: '20 minutes'
      });
    }
    
    if (medicalHistory?.glaucoma_blindness) {
      recommendations.push({
        station_id: 'vision_testing',
        priority: 'high',
        reason: 'Vision impairment reported',
        estimated_time: '15 minutes'
      });
    }
    
    // Default routing
    recommendations.push({
      station_id: 'nursing',
      priority: 'medium',
      reason: 'Standard vital signs assessment',
      estimated_time: '10 minutes'
    });
    
    // Sort by priority and availability
    return recommendations
      .filter(rec => availableStations.find(s => s.id === rec.station_id))
      .sort((a, b) => {
        const priorityWeight = { high: 3, medium: 2, low: 1 };
        return priorityWeight[b.priority as keyof typeof priorityWeight] - 
               priorityWeight[a.priority as keyof typeof priorityWeight];
      });
  }
  
  // 🚀 Station Handoff Management
  static async executeStationHandoff(
    patientId: string, 
    fromStation: string, 
    toStation: string, 
    metadata?: any
  ) {
    try {
      const handoffData = {
        patient_id: patientId,
        from_station: fromStation,
        to_station: toStation,
        handoff_time: new Date().toISOString(),
        metadata: {
          completion_score: metadata?.completion_score,
          medical_alerts: metadata?.medical_alerts || [],
          staff_notes: metadata?.staff_notes,
          ...metadata
        }
      };
      
      // Execute handoff
      const response = await fetch('/api/workflow/handoff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(handoffData)
      });
      
      if (response.ok) {
        // Notify destination station
        await this.notifyStation(toStation, patientId, handoffData.metadata);
        
        // Update patient workflow status
        await this.updatePatientWorkflowStatus(patientId, toStation);
        
        return { success: true, handoff_id: (await response.json()).id };
      } else {
        throw new Error('Handoff request failed');
      }
    } catch (error) {
      console.error('Station handoff failed:', error);
      throw error;
    }
  }
  
  // 📢 Station Notification System
  static async notifyStation(stationId: string, patientId: string, metadata: any) {
    try {
      const notification = {
        station_id: stationId,
        patient_id: patientId,
        type: 'patient_incoming',
        priority: metadata.medical_alerts?.length > 0 ? 'high' : 'normal',
        message: this.generateNotificationMessage(patientId, metadata),
        timestamp: new Date().toISOString()
      };
      
      // Send real-time notification
      await fetch('/api/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notification)
      });
      
      // WebSocket notification for real-time updates
      if (window.WebSocket && this.wsConnection) {
        this.wsConnection.send(JSON.stringify({
          type: 'station_notification',
          data: notification
        }));
      }
    } catch (error) {
      console.error('Failed to send station notification:', error);
    }
  }
  
  // 🔧 Helper Methods
  private static calculateStationPriority(station: any): 'high' | 'medium' | 'low' {
    const utilizationRate = (station.current_patients || 0) / (station.max_capacity || 5);
    
    if (utilizationRate < 0.3) return 'high';
    if (utilizationRate < 0.7) return 'medium';
    return 'low';
  }
  
  private static generateNotificationMessage(patientId: string, metadata: any): string {
    let message = `Patient incoming from questionnaire station`;
    
    if (metadata.medical_alerts?.length > 0) {
      message += ` - ${metadata.medical_alerts.length} medical alert(s)`;
    }
    
    if (metadata.completion_score) {
      message += ` - ${metadata.completion_score}% questionnaire completion`;
    }
    
    return message;
  }
  
  private static async updatePatientWorkflowStatus(patientId: string, currentStation: string) {
    try {
      await fetch(`/api/patients/${patientId}/workflow`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current_station: currentStation,
          status: 'in_progress',
          last_updated: new Date().toISOString()
        })
      });
    } catch (error) {
      console.error('Failed to update patient workflow status:', error);
    }
  }
  
  // WebSocket connection for real-time updates
  private static wsConnection: WebSocket | null = null;
  
  static initializeWebSocket() {
    try {
      this.wsConnection = new WebSocket(process.env.REACT_APP_WS_URL || 'ws://localhost:3001');
      
      this.wsConnection.onopen = () => {
        console.log('WebSocket connection established');
      };
      
      this.wsConnection.onmessage = (event) => {
        const data = JSON.parse(event.data);
        this.handleWebSocketMessage(data);
      };
      
      this.wsConnection.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    } catch (error) {
      console.error('Failed to initialize WebSocket:', error);
    }
  }
  
  private static handleWebSocketMessage(data: any) {
    // Handle real-time updates
    switch (data.type) {
      case 'station_update':
        // Update station availability
        window.dispatchEvent(new CustomEvent('stationUpdate', { detail: data.payload }));
        break;
      case 'patient_status_change':
        // Update patient status
        window.dispatchEvent(new CustomEvent('patientStatusChange', { detail: data.payload }));
        break;
      default:
        console.log('Unknown WebSocket message type:', data.type);
    }
  }
}

// 🔧 React Hook for Hybrid Integration
export const useHybridIntegration = () => {
  const [stationData, setStationData] = useState<any[]>([]);
  const [workflowStatus, setWorkflowStatus] = useState<string>('idle');
  const [realTimeUpdates, setRealTimeUpdates] = useState<any[]>([]);

  useEffect(() => {
    // Initialize WebSocket connection
    HybridIntegrationService.initializeWebSocket();
    
    // Load initial station data
    loadStationData();
    
    // Set up event listeners for real-time updates
    const handleStationUpdate = (event: CustomEvent) => {
      setStationData(prev => prev.map(station => 
        station.id === event.detail.station_id 
          ? { ...station, ...event.detail }
          : station
      ));
    };
    
    const handlePatientStatusChange = (event: CustomEvent) => {
      setRealTimeUpdates(prev => [...prev, event.detail]);
    };
    
    window.addEventListener('stationUpdate', handleStationUpdate as EventListener);
    window.addEventListener('patientStatusChange', handlePatientStatusChange as EventListener);
    
    return () => {
      window.removeEventListener('stationUpdate', handleStationUpdate as EventListener);
      window.removeEventListener('patientStatusChange', handlePatientStatusChange as EventListener);
    };
  }, []);

  const loadStationData = async () => {
    try {
      const stations = await HybridIntegrationService.getStationAvailability();
      setStationData(stations);
    } catch (error) {
      console.error('Failed to load station data:', error);
    }
  };

  const executeHandoff = async (
    patientId: string,
    fromStation: string,
    toStation: string,
    metadata?: any
  ) => {
    try {
      setWorkflowStatus('processing');
      const result = await HybridIntegrationService.executeStationHandoff(
        patientId,
        fromStation,
        toStation,
        metadata
      );
      setWorkflowStatus('completed');
      return result;
    } catch (error) {
      setWorkflowStatus('error');
      throw error;
    }
  };

  const getOptimalRoute = (patientData: Partial<QuestionnaireFormData>) => {
    return HybridIntegrationService.calculateOptimalStationRoute(patientData, stationData);
  };

  return {
    stationData,
    workflowStatus,
    realTimeUpdates,
    executeHandoff,
    getOptimalRoute,
    refreshStations: loadStationData
  };
};

// 📊 Workflow Analytics Service
export class WorkflowAnalyticsService {
  
  static async getCompletionMetrics(timeRange: 'day' | 'week' | 'month' = 'day') {
    try {
      const response = await fetch(`/api/analytics/completion?range=${timeRange}`);
      const data = await response.json();
      
      return {
        totalQuestionnaires: data.total_questionnaires || 0,
        completionRate: data.completion_rate || 0,
        averageCompletionTime: data.avg_completion_time || 0,
        selfServiceRate: data.self_service_rate || 0,
        staffAssistedRate: data.staff_assisted_rate || 0,
        medicalAlertRate: data.medical_alert_rate || 0
      };
    } catch (error) {
      console.error('Failed to fetch completion metrics:', error);
      return null;
    }
  }
  
  static async getStationUtilization(timeRange: 'day' | 'week' | 'month' = 'day') {
    try {
      const response = await fetch(`/api/analytics/stations?range=${timeRange}`);
      const data = await response.json();
      
      return data.stations?.map((station: any) => ({
        id: station.id,
        name: station.name,
        totalPatients: station.total_patients || 0,
        averageWaitTime: station.avg_wait_time || 0,
        utilizationRate: station.utilization_rate || 0,
        bottleneckScore: station.bottleneck_score || 0
      })) || [];
    } catch (error) {
      console.error('Failed to fetch station utilization:', error);
      return [];
    }
  }
  
  static async identifyBottlenecks() {
    try {
      const response = await fetch('/api/analytics/bottlenecks');
      const data = await response.json();
      
      return {
        criticalStations: data.critical_stations || [],
        recommendations: data.recommendations || [],
        estimatedImpact: data.estimated_impact || {}
      };
    } catch (error) {
      console.error('Failed to identify bottlenecks:', error);
      return null;
    }
  }
}

// 🎯 Smart Routing Engine
export class SmartRoutingEngine {
  
  static calculatePatientPriority(
    patientData: Partial<QuestionnaireFormData>,
    examinationType: string
  ): 'urgent' | 'high' | 'medium' | 'low' {
    let priorityScore = 0;
    
    // Medical condition based priority
    const conditions = patientData.medical_history?.current_conditions;
    if (conditions) {
      if (conditions.heart_disease_high_bp) priorityScore += 3;
      if (conditions.epilepsy_convulsions) priorityScore += 3;
      if (conditions.glaucoma_blindness) priorityScore += 2;
      if (conditions.family_mellitus_diabetes) priorityScore += 1;
    }
    
    // Working at heights specific priority
    if (examinationType === 'working_at_heights') {
      const heights = patientData.working_at_heights;
      if (heights?.q4_fits_seizures) priorityScore += 4;
      if (heights?.q5_suicide_thoughts) priorityScore += 4;
      if (heights?.q3_fear_heights_spaces) priorityScore += 2;
    }
    
    // Return to work priority
    if (examinationType === 'return_to_work') {
      priorityScore += 2; // Always higher priority for return to work
    }
    
    // Priority classification
    if (priorityScore >= 4) return 'urgent';
    if (priorityScore >= 3) return 'high';
    if (priorityScore >= 1) return 'medium';
    return 'low';
  }
  
  static generateStationSequence(
    patientData: Partial<QuestionnaireFormData>,
    examinationType: string,
    availableStations: any[]
  ) {
    const sequence = [];
    const priority = this.calculatePatientPriority(patientData, examinationType);
    
    // Base sequence for all examinations
    const baseSequence = ['nursing', 'vision_testing', 'audio_testing', 'lung_function'];
    
    // Modify sequence based on medical conditions
    const conditions = patientData.medical_history?.current_conditions;
    
    if (conditions?.heart_disease_high_bp) {
      // Prioritize ECG and nursing
      sequence.push('ecg', 'nursing');
    }
    
    if (conditions?.glaucoma_blindness) {
      // Prioritize vision testing
      sequence.unshift('vision_testing');
    }
    
    if (examinationType === 'working_at_heights') {
      // Add specialized height work assessments
      sequence.push('psychological_assessment', 'balance_testing');
    }
    
    // Add remaining base stations that aren't already included
    baseSequence.forEach(station => {
      if (!sequence.includes(station) && 
          availableStations.find(s => s.id === station)) {
        sequence.push(station);
      }
    });
    
    return sequence.map((stationId, index) => {
      const station = availableStations.find(s => s.id === stationId);
      return {
        id: stationId,
        name: station?.name || stationId,
        order: index + 1,
        priority: index === 0 ? 'immediate' : priority,
        estimatedTime: station?.estimated_time || '10 minutes',
        requirements: this.getStationRequirements(stationId, patientData)
      };
    });
  }
  
  private static getStationRequirements(stationId: string, patientData: Partial<QuestionnaireFormData>) {
    const requirements = [];
    
    switch (stationId) {
      case 'nursing':
        requirements.push('vital_signs', 'basic_measurements');
        if (patientData.medical_history?.current_conditions?.heart_disease_high_bp) {
          requirements.push('blood_pressure_monitoring');
        }
        break;
      case 'vision_testing':
        requirements.push('visual_acuity', 'color_vision');
        if (patientData.medical_history?.current_conditions?.glaucoma_blindness) {
          requirements.push('comprehensive_eye_exam');
        }
        break;
      case 'ecg':
        requirements.push('12_lead_ecg', 'cardiac_assessment');
        break;
      case 'psychological_assessment':
        requirements.push('mental_health_screening', 'height_work_clearance');
        break;
    }
    
    return requirements;
  }
}

// 🔄 Offline Sync Manager
export class OfflineSyncManager {
  private static readonly STORAGE_KEY = 'hybrid_questionnaire_offline_data';
  
  static async saveOfflineData(key: string, data: any) {
    try {
      const offlineData = this.getOfflineData();
      offlineData[key] = {
        data,
        timestamp: new Date().toISOString(),
        sync_status: 'pending'
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(offlineData));
    } catch (error) {
      console.error('Failed to save offline data:', error);
    }
  }
  
  static getOfflineData(): Record<string, any> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Failed to load offline data:', error);
      return {};
    }
  }
  
  static async syncPendingData() {
    const offlineData = this.getOfflineData();
    const pendingItems = Object.entries(offlineData).filter(
      ([_, item]: [string, any]) => item.sync_status === 'pending'
    );
    
    for (const [key, item] of pendingItems) {
      try {
        // Attempt to sync to server
        const response = await fetch('/api/sync/questionnaire', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            key,
            data: item.data,
            offline_timestamp: item.timestamp
          })
        });
        
        if (response.ok) {
          // Mark as synced
          offlineData[key].sync_status = 'synced';
          offlineData[key].synced_at = new Date().toISOString();
        }
      } catch (error) {
        console.error(`Failed to sync ${key}:`, error);
      }
    }
    
    // Update local storage
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(offlineData));
  }
  
  static clearSyncedData() {
    const offlineData = this.getOfflineData();
    const pendingData: Record<string, any> = {};
    
    // Keep only pending items
    Object.entries(offlineData).forEach(([key, item]: [string, any]) => {
      if (item.sync_status === 'pending') {
        pendingData[key] = item;
      }
    });
    
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(pendingData));
  }
  
  static getPendingSyncCount(): number {
    const offlineData = this.getOfflineData();
    return Object.values(offlineData).filter(
      (item: any) => item.sync_status === 'pending'
    ).length;
  }
}

// 📱 Device Optimization Service
export class DeviceOptimizationService {
  
  static detectDevice(): 'mobile' | 'tablet' | 'desktop' | 'kiosk' {
    const userAgent = navigator.userAgent.toLowerCase();
    const screenWidth = window.screen.width;
    const screenHeight = window.screen.height;
    
    // Kiosk mode detection
    if (window.outerHeight === window.screen.height && 
        window.outerWidth === window.screen.width) {
      return 'kiosk';
    }
    
    // Tablet detection
    if ((screenWidth >= 768 && screenWidth <= 1024) || 
        /tablet|ipad|playbook|silk/.test(userAgent)) {
      return 'tablet';
    }
    
    // Mobile detection
    if (screenWidth < 768 || 
        /mobile|android|iphone|ipod|blackberry|opera mini|iemobile/.test(userAgent)) {
      return 'mobile';
    }
    
    return 'desktop';
  }
  
  static getOptimalFormConfiguration(deviceType: string) {
    switch (deviceType) {
      case 'tablet':
        return {
          sectionLayout: 'single-column',
          inputSize: 'large',
          touchTargetSize: 48,
          fontSize: '16px',
          autoSaveInterval: 20000
        };
      case 'mobile':
        return {
          sectionLayout: 'single-column',
          inputSize: 'medium',
          touchTargetSize: 44,
          fontSize: '16px',
          autoSaveInterval: 15000
        };
      case 'kiosk':
        return {
          sectionLayout: 'wide',
          inputSize: 'extra-large',
          touchTargetSize: 52,
          fontSize: '18px',
          autoSaveInterval: 30000
        };
      default:
        return {
          sectionLayout: 'two-column',
          inputSize: 'medium',
          touchTargetSize: 40,
          fontSize: '14px',
          autoSaveInterval: 30000
        };
    }
  }
  
  static enableKioskMode() {
    // Request fullscreen
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen();
    }
    
    // Disable right-click context menu
    document.addEventListener('contextmenu', (e) => e.preventDefault());
    
    // Disable certain keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.key === 'F11' || e.key === 'F12' || 
          (e.ctrlKey && (e.key === 'r' || e.key === 'R'))) {
        e.preventDefault();
      }
    });
  }
}

// Export all services for use in components
export {
  HybridIntegrationService,
  WorkflowAnalyticsService,
  SmartRoutingEngine,
  OfflineSyncManager,
  DeviceOptimizationService
};