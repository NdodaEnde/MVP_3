// Context for preserving questionnaire data when switching modes
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import type { QuestionnaireFormData } from '@/schemas/questionnaire-schema';

// Context state interface
interface QuestionnaireState {
  formData: Partial<QuestionnaireFormData>;
  currentMode: 'patient' | 'staff';
  selectedPatient: any;
  progress: number;
  lastSaved: Date | null;
  isDirty: boolean;
}

// Context actions
type QuestionnaireAction =
  | { type: 'SET_FORM_DATA'; payload: Partial<QuestionnaireFormData> }
  | { type: 'SET_MODE'; payload: 'patient' | 'staff' }
  | { type: 'SET_PATIENT'; payload: any }
  | { type: 'SET_PROGRESS'; payload: number }
  | { type: 'MARK_SAVED' }
  | { type: 'MARK_DIRTY' }
  | { type: 'RESET_FORM' }
  | { type: 'LOAD_FROM_STORAGE'; payload: QuestionnaireState };

// Initial state
const initialState: QuestionnaireState = {
  formData: {},
  currentMode: 'patient',
  selectedPatient: null,
  progress: 0,
  lastSaved: null,
  isDirty: false,
};

// Context reducer
const questionnaireReducer = (state: QuestionnaireState, action: QuestionnaireAction): QuestionnaireState => {
  switch (action.type) {
    case 'SET_FORM_DATA':
      return {
        ...state,
        formData: { ...state.formData, ...action.payload },
        isDirty: true,
      };
    
    case 'SET_MODE':
      return {
        ...state,
        currentMode: action.payload,
      };
    
    case 'SET_PATIENT':
      return {
        ...state,
        selectedPatient: action.payload,
      };
    
    case 'SET_PROGRESS':
      return {
        ...state,
        progress: action.payload,
      };
    
    case 'MARK_SAVED':
      return {
        ...state,
        lastSaved: new Date(),
        isDirty: false,
      };
    
    case 'MARK_DIRTY':
      return {
        ...state,
        isDirty: true,
      };
    
    case 'RESET_FORM':
      return {
        ...initialState,
        currentMode: state.currentMode, // Preserve mode
      };
    
    case 'LOAD_FROM_STORAGE':
      return action.payload;
    
    default:
      return state;
  }
};

// Context interface
interface QuestionnaireContextType {
  state: QuestionnaireState;
  dispatch: React.Dispatch<QuestionnaireAction>;
  
  // Helper functions
  updateFormData: (data: Partial<QuestionnaireFormData>) => void;
  switchMode: (mode: 'patient' | 'staff') => void;
  selectPatient: (patient: any) => void;
  updateProgress: (progress: number) => void;
  markSaved: () => void;
  markDirty: () => void;
  resetForm: () => void;
  saveToStorage: () => void;
  loadFromStorage: () => void;
}

// Create context
const QuestionnaireContext = createContext<QuestionnaireContextType | undefined>(undefined);

// Storage key
const STORAGE_KEY = 'questionnaire-context';

// Provider component
export const QuestionnaireProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(questionnaireReducer, initialState);

  // Load from storage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsedState = JSON.parse(saved);
        // Convert lastSaved string back to Date
        if (parsedState.lastSaved) {
          parsedState.lastSaved = new Date(parsedState.lastSaved);
        }
        dispatch({ type: 'LOAD_FROM_STORAGE', payload: parsedState });
      } catch (error) {
        console.error('Failed to load questionnaire state from storage:', error);
      }
    }
  }, []);

  // Save to storage whenever state changes
  useEffect(() => {
    if (state.isDirty || state.formData.patientId) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }, [state]);

  // Helper functions
  const updateFormData = (data: Partial<QuestionnaireFormData>) => {
    dispatch({ type: 'SET_FORM_DATA', payload: data });
  };

  const switchMode = (mode: 'patient' | 'staff') => {
    dispatch({ type: 'SET_MODE', payload: mode });
  };

  const selectPatient = (patient: any) => {
    dispatch({ type: 'SET_PATIENT', payload: patient });
  };

  const updateProgress = (progress: number) => {
    dispatch({ type: 'SET_PROGRESS', payload: progress });
  };

  const markSaved = () => {
    dispatch({ type: 'MARK_SAVED' });
  };

  const markDirty = () => {
    dispatch({ type: 'MARK_DIRTY' });
  };

  const resetForm = () => {
    dispatch({ type: 'RESET_FORM' });
    localStorage.removeItem(STORAGE_KEY);
  };

  const saveToStorage = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  };

  const loadFromStorage = () => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsedState = JSON.parse(saved);
        if (parsedState.lastSaved) {
          parsedState.lastSaved = new Date(parsedState.lastSaved);
        }
        dispatch({ type: 'LOAD_FROM_STORAGE', payload: parsedState });
      } catch (error) {
        console.error('Failed to load from storage:', error);
      }
    }
  };

  const value: QuestionnaireContextType = {
    state,
    dispatch,
    updateFormData,
    switchMode,
    selectPatient,
    updateProgress,
    markSaved,
    markDirty,
    resetForm,
    saveToStorage,
    loadFromStorage,
  };

  return (
    <QuestionnaireContext.Provider value={value}>
      {children}
    </QuestionnaireContext.Provider>
  );
};

// Custom hook to use the context
export const useQuestionnaireContext = () => {
  const context = useContext(QuestionnaireContext);
  if (context === undefined) {
    throw new Error('useQuestionnaireContext must be used within a QuestionnaireProvider');
  }
  return context;
};

export default QuestionnaireProvider;