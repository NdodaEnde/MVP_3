// Global Workflow State Management - Connects Phase 1 + Phase 2
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import type { QuestionnaireFormData } from '@/schemas/questionnaire-schema';

// 🏗️ Complete Patient Journey State
interface PatientJourneyState {
  // Patient Information
  patientId: string | null;
  patientInfo: {
    firstName: string;
    surname: string;
    idNumber: string;
    company: string;
    position: string;
    examinationType: string;
    contactNumber?: string;
    email?: string;
  } | null;
  
  // Journey Status
  currentPhase: 'reception' | 'questionnaire' | 'station_routing' | 'examination' | 'completed';
  currentStation: string | null;
  journeyStartTime: Date | null;
  
  // Phase 1 Data (Questionnaire)
  questionnaireData: Partial<QuestionnaireFormData>;
  questionnaireComplete: boolean;
  medicalFlags: string[];
  riskAssessment: {
    workingAtHeights: 'low' | 'medium' | 'high';
    cardiovascular: 'low' | 'medium' | 'high';
    respiratory: 'low' | 'medium' | 'high';
    overall: 'low' | 'medium' | 'high';
  };
  
  // Phase 2 Data (Operational)
  receptionData: {
    checkedInAt: Date | null;
    assignedTablet: string | null;
    qrCode: string | null;
    receptionistId: string | null;
  };
  
  routingData: {
    recommendedStations: StationRecommendation[];
    selectedStation: string | null;
    completedStations: string[];
    currentQueue: number;
    estimatedWaitTime: number;
  };
  
  // Workflow Tracking
  workflow: {
    status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
    progress: number; // 0-100
    lastUpdated: Date;
    totalTime: number; // minutes
    bottlenecks: string[];
  };
  
  // Real-time Updates
  realTimeData: {
    connectionStatus: 'connected' | 'disconnected' | 'reconnecting';
    lastSync: Date | null;
    pendingUpdates: number;
  };
}

// Station Recommendation Interface
interface StationRecommendation {
  stationId: string;
  stationName: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  reason: string;
  estimatedTime: number;
  currentWaitTime: number;
  requiredForExamType: boolean;
  medicalFlagTriggered?: string;
}

// Workflow Actions
type WorkflowAction =
  | { type: 'START_JOURNEY'; payload: { patientId: string; patientInfo: any } }
  | { type: 'COMPLETE_RECEPTION'; payload: { tabletId: string; qrCode: string; receptionistId: string } }
  | { type: 'UPDATE_QUESTIONNAIRE'; payload: { data: Partial<QuestionnaireFormData>; progress: number } }
  | { type: 'COMPLETE_QUESTIONNAIRE'; payload: { data: QuestionnaireFormData; medicalFlags: string[] } }
  | { type: 'GENERATE_ROUTING'; payload: { recommendations: StationRecommendation[] } }
  | { type: 'SELECT_STATION'; payload: { stationId: string; queuePosition: number } }
  | { type: 'COMPLETE_STATION'; payload: { stationId: string; results: any } }
  | { type: 'UPDATE_WORKFLOW_STATUS'; payload: { status: string; progress: number } }
  | { type: 'SET_REAL_TIME_STATUS'; payload: { status: 'connected' | 'disconnected' | 'reconnecting' } }
  | { type: 'SYNC_DATA'; payload: { lastSync: Date; pendingUpdates: number } }
  | { type: 'RESET_JOURNEY' };

// Initial State
const initialState: PatientJourneyState = {
  patientId: null,
  patientInfo: null,
  currentPhase: 'reception',
  currentStation: null,
  journeyStartTime: null,
  
  questionnaireData: {},
  questionnaireComplete: false,
  medicalFlags: [],
  riskAssessment: {
    workingAtHeights: 'low',
    cardiovascular: 'low',
    respiratory: 'low',
    overall: 'low'
  },
  
  receptionData: {
    checkedInAt: null,
    assignedTablet: null,
    qrCode: null,
    receptionistId: null
  },
  
  routingData: {
    recommendedStations: [],
    selectedStation: null,
    completedStations: [],
    currentQueue: 0,
    estimatedWaitTime: 0
  },
  
  workflow: {
    status: 'pending',
    progress: 0,
    lastUpdated: new Date(),
    totalTime: 0,
    bottlenecks: []
  },
  
  realTimeData: {
    connectionStatus: 'disconnected',
    lastSync: null,
    pendingUpdates: 0
  }
};

// Workflow Reducer
const workflowReducer = (state: PatientJourneyState, action: WorkflowAction): PatientJourneyState => {
  switch (action.type) {
    case 'START_JOURNEY':
      return {
        ...state,
        patientId: action.payload.patientId,
        patientInfo: action.payload.patientInfo,
        currentPhase: 'reception',
        journeyStartTime: new Date(),
        workflow: {
          ...state.workflow,
          status: 'in_progress',
          progress: 5,
          lastUpdated: new Date()
        }
      };
    
    case 'COMPLETE_RECEPTION':
      return {
        ...state,
        currentPhase: 'questionnaire',
        receptionData: {
          checkedInAt: new Date(),
          assignedTablet: action.payload.tabletId,
          qrCode: action.payload.qrCode,
          receptionistId: action.payload.receptionistId
        },
        workflow: {
          ...state.workflow,
          progress: 15,
          lastUpdated: new Date()
        }
      };
    
    case 'UPDATE_QUESTIONNAIRE':
      return {
        ...state,
        questionnaireData: { ...state.questionnaireData, ...action.payload.data },
        workflow: {
          ...state.workflow,
          progress: Math.max(15, Math.min(60, action.payload.progress)),
          lastUpdated: new Date()
        }
      };
    
    case 'COMPLETE_QUESTIONNAIRE':
      const medicalFlags = action.payload.medicalFlags;
      const riskAssessment = calculateRiskAssessment(action.payload.data, medicalFlags);
      
      return {
        ...state,
        questionnaireData: action.payload.data,
        questionnaireComplete: true,
        medicalFlags,
        riskAssessment,
        currentPhase: 'station_routing',
        workflow: {
          ...state.workflow,
          progress: 65,
          lastUpdated: new Date()
        }
      };
    
    case 'GENERATE_ROUTING':
      return {
        ...state,
        routingData: {
          ...state.routingData,
          recommendedStations: action.payload.recommendations
        },
        workflow: {
          ...state.workflow,
          progress: 70,
          lastUpdated: new Date()
        }
      };
    
    case 'SELECT_STATION':
      return {
        ...state,
        currentStation: action.payload.stationId,
        currentPhase: 'examination',
        routingData: {
          ...state.routingData,
          selectedStation: action.payload.stationId,
          currentQueue: action.payload.queuePosition
        },
        workflow: {
          ...state.workflow,
          progress: 75,
          lastUpdated: new Date()
        }
      };
    
    case 'COMPLETE_STATION':
      const newCompletedStations = [...state.routingData.completedStations, action.payload.stationId];
      const isJourneyComplete = newCompletedStations.length >= getRequiredStationsCount(state.patientInfo?.examinationType);
      
      return {
        ...state,
        routingData: {
          ...state.routingData,
          completedStations: newCompletedStations,
          selectedStation: null
        },
        currentStation: null,
        currentPhase: isJourneyComplete ? 'completed' : 'station_routing',
        workflow: {
          ...state.workflow,
          status: isJourneyComplete ? 'completed' : 'in_progress',
          progress: isJourneyComplete ? 100 : Math.min(95, state.workflow.progress + 10),
          lastUpdated: new Date(),
          totalTime: state.journeyStartTime ? 
            Math.round((new Date().getTime() - state.journeyStartTime.getTime()) / 60000) : 0
        }
      };
    
    case 'UPDATE_WORKFLOW_STATUS':
      return {
        ...state,
        workflow: {
          ...state.workflow,
          progress: action.payload.progress,
          lastUpdated: new Date()
        }
      };
    
    case 'SET_REAL_TIME_STATUS':
      return {
        ...state,
        realTimeData: {
          ...state.realTimeData,
          connectionStatus: action.payload.status
        }
      };
    
    case 'SYNC_DATA':
      return {
        ...state,
        realTimeData: {
          ...state.realTimeData,
          lastSync: action.payload.lastSync,
          pendingUpdates: action.payload.pendingUpdates
        }
      };
    
    case 'RESET_JOURNEY':
      return initialState;
    
    default:
      return state;
  }
};

// Helper Functions
const calculateRiskAssessment = (data: QuestionnaireFormData, medicalFlags: string[]) => {
  let workingAtHeights: 'low' | 'medium' | 'high' = 'low';
  let cardiovascular: 'low' | 'medium' | 'high' = 'low';
  let respiratory: 'low' | 'medium' | 'high' = 'low';
  
  // Working at Heights risk
  if (data.workingAtHeights) {
    const criticalFlags = [
      'advised_not_work_at_height',
      'fear_of_heights_enclosed_spaces',
      'fits_seizures_epilepsy_blackouts',
      'suicide_thoughts_attempts'
    ];
    
    const hasCriticalFlag = criticalFlags.some(flag => 
      data.workingAtHeights?.safety_questions?.[flag as keyof typeof data.workingAtHeights.safety_questions]
    );
    
    if (hasCriticalFlag) workingAtHeights = 'high';
    else if (medicalFlags.some(flag => flag.includes('height'))) workingAtHeights = 'medium';
  }
  
  // Cardiovascular risk
  if (medicalFlags.some(flag => flag.includes('heart') || flag.includes('blood_pressure'))) {
    cardiovascular = 'high';
  } else if (medicalFlags.some(flag => flag.includes('diabetes') || flag.includes('cholesterol'))) {
    cardiovascular = 'medium';
  }
  
  // Respiratory risk
  if (medicalFlags.some(flag => flag.includes('asthma') || flag.includes('respiratory'))) {
    respiratory = 'high';
  } else if (medicalFlags.some(flag => flag.includes('smoking'))) {
    respiratory = 'medium';
  }
  
  // Overall risk
  const risks = [workingAtHeights, cardiovascular, respiratory];
  const overall = risks.includes('high') ? 'high' : 
                  risks.includes('medium') ? 'medium' : 'low';
  
  return { workingAtHeights, cardiovascular, respiratory, overall };
};

const getRequiredStationsCount = (examinationType?: string): number => {
  switch (examinationType) {
    case 'pre_employment': return 6;
    case 'annual': return 5;
    case 'exit': return 3;
    case 'return_to_work': return 4;
    default: return 5;
  }
};

// Context Interface
interface WorkflowContextType {
  state: PatientJourneyState;
  dispatch: React.Dispatch<WorkflowAction>;
  
  // Helper Methods
  startJourney: (patientId: string, patientInfo: any) => void;
  completeReception: (tabletId: string, qrCode: string, receptionistId: string) => void;
  updateQuestionnaire: (data: Partial<QuestionnaireFormData>, progress: number) => void;
  completeQuestionnaire: (data: QuestionnaireFormData, medicalFlags: string[]) => void;
  generateRouting: (recommendations: StationRecommendation[]) => void;
  selectStation: (stationId: string, queuePosition: number) => void;
  completeStation: (stationId: string, results: any) => void;
  resetJourney: () => void;
  
  // Getters
  getProgress: () => number;
  getCurrentPhase: () => string;
  getMedicalFlags: () => string[];
  getRiskAssessment: () => any;
  getEstimatedTimeRemaining: () => number;
  isJourneyComplete: () => boolean;
}

// Create Context
const WorkflowContext = createContext<WorkflowContextType | undefined>(undefined);

// Storage Key
const WORKFLOW_STORAGE_KEY = 'surgiscan_workflow_state';

// Provider Component
export const WorkflowProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(workflowReducer, initialState);

  // Load from storage on mount
  useEffect(() => {
    const saved = localStorage.getItem(WORKFLOW_STORAGE_KEY);
    if (saved) {
      try {
        const parsedState = JSON.parse(saved);
        // Restore dates
        if (parsedState.journeyStartTime) {
          parsedState.journeyStartTime = new Date(parsedState.journeyStartTime);
        }
        if (parsedState.workflow?.lastUpdated) {
          parsedState.workflow.lastUpdated = new Date(parsedState.workflow.lastUpdated);
        }
        if (parsedState.receptionData?.checkedInAt) {
          parsedState.receptionData.checkedInAt = new Date(parsedState.receptionData.checkedInAt);
        }
        if (parsedState.realTimeData?.lastSync) {
          parsedState.realTimeData.lastSync = new Date(parsedState.realTimeData.lastSync);
        }
        
        // Only restore if journey is in progress
        if (parsedState.workflow?.status === 'in_progress') {
          Object.assign(state, parsedState);
        }
      } catch (error) {
        console.error('Failed to load workflow state:', error);
      }
    }
  }, []);

  // Save to storage whenever state changes
  useEffect(() => {
    if (state.patientId) {
      localStorage.setItem(WORKFLOW_STORAGE_KEY, JSON.stringify(state));
    }
  }, [state]);

  // Helper Methods
  const startJourney = (patientId: string, patientInfo: any) => {
    dispatch({ type: 'START_JOURNEY', payload: { patientId, patientInfo } });
  };

  const completeReception = (tabletId: string, qrCode: string, receptionistId: string) => {
    dispatch({ type: 'COMPLETE_RECEPTION', payload: { tabletId, qrCode, receptionistId } });
  };

  const updateQuestionnaire = (data: Partial<QuestionnaireFormData>, progress: number) => {
    dispatch({ type: 'UPDATE_QUESTIONNAIRE', payload: { data, progress } });
  };

  const completeQuestionnaire = (data: QuestionnaireFormData, medicalFlags: string[]) => {
    dispatch({ type: 'COMPLETE_QUESTIONNAIRE', payload: { data, medicalFlags } });
  };

  const generateRouting = (recommendations: StationRecommendation[]) => {
    dispatch({ type: 'GENERATE_ROUTING', payload: { recommendations } });
  };

  const selectStation = (stationId: string, queuePosition: number) => {
    dispatch({ type: 'SELECT_STATION', payload: { stationId, queuePosition } });
  };

  const completeStation = (stationId: string, results: any) => {
    dispatch({ type: 'COMPLETE_STATION', payload: { stationId, results } });
  };

  const resetJourney = () => {
    dispatch({ type: 'RESET_JOURNEY' });
    localStorage.removeItem(WORKFLOW_STORAGE_KEY);
  };

  // Getters
  const getProgress = () => state.workflow.progress;
  const getCurrentPhase = () => state.currentPhase;
  const getMedicalFlags = () => state.medicalFlags;
  const getRiskAssessment = () => state.riskAssessment;
  const getEstimatedTimeRemaining = () => {
    const baseTime = getRequiredStationsCount(state.patientInfo?.examinationType) * 10; // 10 min per station
    const completedTime = state.routingData.completedStations.length * 10;
    return Math.max(0, baseTime - completedTime);
  };
  const isJourneyComplete = () => state.currentPhase === 'completed';

  const value: WorkflowContextType = {
    state,
    dispatch,
    startJourney,
    completeReception,
    updateQuestionnaire,
    completeQuestionnaire,
    generateRouting,
    selectStation,
    completeStation,
    resetJourney,
    getProgress,
    getCurrentPhase,
    getMedicalFlags,
    getRiskAssessment,
    getEstimatedTimeRemaining,
    isJourneyComplete
  };

  return (
    <WorkflowContext.Provider value={value}>
      {children}
    </WorkflowContext.Provider>
  );
};

// Custom Hook
export const useWorkflow = () => {
  const context = useContext(WorkflowContext);
  if (context === undefined) {
    throw new Error('useWorkflow must be used within a WorkflowProvider');
  }
  return context;
};

export default WorkflowProvider;
export type { StationRecommendation, PatientJourneyState };