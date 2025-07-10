import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { QuestionnaireCompletion } from '@/components/QuestionnaireCompletion';

export default function QuestionnaireCompletePage() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get patient data from navigation state
  const { patientId, patientName, examinationType } = location.state || {
    patientId: 'unknown',
    patientName: 'Patient',
    examinationType: 'pre-employment'
  };

  const handleContinueToStation = (stationRoute: string) => {
    navigate(stationRoute);
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <QuestionnaireCompletion
        patientId={patientId}
        patientName={patientName}
        examinationType={examinationType}
        onContinueToStation={handleContinueToStation}
      />
    </div>
  );
}