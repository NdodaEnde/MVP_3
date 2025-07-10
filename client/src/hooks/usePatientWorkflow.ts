import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export interface PatientWorkflowState {
  patientId?: string;
  patientName?: string;
  examinationType?: string;
  completedSteps: string[];
  currentStep?: string;
}

export function usePatientWorkflow(initialPatientId?: string) {
  const navigate = useNavigate();
  const [workflowState, setWorkflowState] = useState<PatientWorkflowState>({
    completedSteps: [],
  });

  // Load workflow state from localStorage
  useEffect(() => {
    const storageKey = initialPatientId ? `patient_workflow_${initialPatientId}` : 'current_patient_workflow';
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setWorkflowState(parsed);
      } catch (error) {
        console.log('Error loading workflow state:', error);
      }
    }
  }, [initialPatientId]);

  // Save workflow state to localStorage
  const saveWorkflowState = (state: PatientWorkflowState) => {
    const storageKey = state.patientId ? `patient_workflow_${state.patientId}` : 'current_patient_workflow';
    localStorage.setItem(storageKey, JSON.stringify(state));
    setWorkflowState(state);
  };

  // Initialize workflow for new patient
  const initializeWorkflow = (patientData: {
    patientId?: string;
    patientName: string;
    examinationType: string;
  }) => {
    const newState: PatientWorkflowState = {
      patientId: patientData.patientId,
      patientName: patientData.patientName,
      examinationType: patientData.examinationType,
      completedSteps: ['registration'], // Registration is completed when we initialize
      currentStep: 'questionnaire'
    };
    saveWorkflowState(newState);
    return newState;
  };

  // Mark step as completed
  const completeStep = (stepId: string, nextStep?: string) => {
    const updatedState = {
      ...workflowState,
      completedSteps: [...workflowState.completedSteps.filter(id => id !== stepId), stepId],
      currentStep: nextStep
    };
    saveWorkflowState(updatedState);
    return updatedState;
  };

  // Navigate to next logical step
  const navigateToNextStep = (currentStepId: string) => {
    const stepOrder = ['registration', 'questionnaire', 'vitals', 'tests', 'review'];
    const currentIndex = stepOrder.indexOf(currentStepId);
    
    if (currentIndex < stepOrder.length - 1) {
      const nextStepId = stepOrder[currentIndex + 1];
      const routes = {
        questionnaire: workflowState.patientId ? `/patients/${workflowState.patientId}/questionnaire` : '/questionnaires',
        vitals: '/vitals',
        tests: '/tests',
        review: '/review'
      };
      
      const route = routes[nextStepId as keyof typeof routes];
      if (route) {
        navigate(route);
        return nextStepId;
      }
    }
    
    return null;
  };

  // Get available next steps
  const getAvailableSteps = () => {
    const { completedSteps } = workflowState;
    const availableSteps = [];

    // After questionnaire, both vitals and tests are available
    if (completedSteps.includes('questionnaire')) {
      if (!completedSteps.includes('vitals')) {
        availableSteps.push('vitals');
      }
      if (!completedSteps.includes('tests')) {
        availableSteps.push('tests');
      }
    }

    // Medical review is available after both vitals and tests
    if (completedSteps.includes('vitals') && completedSteps.includes('tests') && !completedSteps.includes('review')) {
      availableSteps.push('review');
    }

    return availableSteps;
  };

  // Check if examination is complete
  const isExaminationComplete = () => {
    const requiredSteps = ['registration', 'questionnaire', 'vitals', 'tests', 'review'];
    return requiredSteps.every(step => workflowState.completedSteps.includes(step));
  };

  // Navigate with workflow context
  const navigateWithWorkflow = (route: string, stepId: string) => {
    const updatedState = {
      ...workflowState,
      currentStep: stepId
    };
    saveWorkflowState(updatedState);
    navigate(route);
  };

  // Reset workflow (for new examination)
  const resetWorkflow = () => {
    const storageKey = workflowState.patientId ? `patient_workflow_${workflowState.patientId}` : 'current_patient_workflow';
    localStorage.removeItem(storageKey);
    setWorkflowState({ completedSteps: [] });
  };

  return {
    workflowState,
    initializeWorkflow,
    completeStep,
    navigateToNextStep,
    getAvailableSteps,
    isExaminationComplete,
    navigateWithWorkflow,
    resetWorkflow,
    saveWorkflowState
  };
}

export default usePatientWorkflow;