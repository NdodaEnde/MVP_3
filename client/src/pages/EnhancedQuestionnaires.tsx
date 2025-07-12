// Enhanced Questionnaires page with smart context detection and mode switching
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/useToast';
import {
  Tablet, Monitor, ToggleLeft, ToggleRight, 
  User, Users, Info, Settings, RefreshCw
} from 'lucide-react';

// Import the separate interfaces
import { PatientTabletInterface } from '@/components/patient/PatientTabletInterface';
import { StaffAdminInterface } from '@/components/admin/StaffAdminInterface';
import { useDeviceDetection, getRecommendedMode } from '@/utils/deviceDetection';
import { QuestionnaireProvider, useQuestionnaireContext } from '@/contexts/QuestionnaireContext';

// Types
type InterfaceMode = 'patient' | 'staff';

// Inner component that uses the context
function EnhancedQuestionnairesInner() {
  const { toast } = useToast();
  const deviceInfo = useDeviceDetection();
  const { state: contextState, switchMode } = useQuestionnaireContext();
  
  // State management
  const [currentMode, setCurrentMode] = useState<InterfaceMode>(contextState.currentMode);
  const [isInitialized, setIsInitialized] = useState(false);
  const [userPreference, setUserPreference] = useState<InterfaceMode | null>(null);
  const [showModeInfo, setShowModeInfo] = useState(false);

  // Initialize mode based on device detection and user preference
  useEffect(() => {
    if (deviceInfo && !isInitialized) {
      // Check for saved user preference
      const savedPreference = localStorage.getItem('questionnaire-mode') as InterfaceMode | null;
      
      let selectedMode: InterfaceMode;
      
      if (savedPreference) {
        // Use saved preference
        selectedMode = savedPreference;
        setUserPreference(savedPreference);
      } else {
        // Use smart default based on device
        selectedMode = getRecommendedMode(deviceInfo);
      }
      
      setCurrentMode(selectedMode);
      setIsInitialized(true);
      
      // Show brief info about auto-detection (only for first-time users)
      if (!savedPreference) {
        setShowModeInfo(true);
        setTimeout(() => setShowModeInfo(false), 5000);
      }
    }
  }, [deviceInfo, isInitialized]);

  // Handle mode switching
  const handleModeSwitch = useCallback((newMode: InterfaceMode) => {
    setCurrentMode(newMode);
    setUserPreference(newMode);
    
    // Update context
    switchMode(newMode);
    
    // Save preference
    localStorage.setItem('questionnaire-mode', newMode);
    
    // Show confirmation
    toast({
      title: `Switched to ${newMode === 'patient' ? 'Patient' : 'Staff'} Mode`,
      description: `Interface optimized for ${newMode === 'patient' ? 'patient self-service' : 'staff assistance'}. Your form data has been preserved.`,
      duration: 3000,
    });
  }, [toast, switchMode]);

  // Get mode display info
  const getModeInfo = () => {
    if (!deviceInfo) return null;
    
    return {
      deviceType: deviceInfo.type,
      isTouchDevice: deviceInfo.isTouchDevice,
      recommendedMode: getRecommendedMode(deviceInfo),
      currentMode
    };
  };

  const modeInfo = getModeInfo();

  // Render mode header with toggle
  const renderModeHeader = () => (
    <Card className="mb-6 border-2 border-blue-200 bg-blue-50/50">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              {currentMode === 'patient' ? (
                <Tablet className="h-5 w-5 text-blue-600" />
              ) : (
                <Monitor className="h-5 w-5 text-blue-600" />
              )}
            </div>
            <div>
              <CardTitle className="text-lg">
                {currentMode === 'patient' ? 'Patient Self-Service' : 'Staff Assistance'} Mode
              </CardTitle>
              <CardDescription>
                {currentMode === 'patient' 
                  ? 'Touch-friendly interface for independent completion'
                  : 'Professional interface for staff-assisted completion'
                }
              </CardDescription>
            </div>
          </div>
          
          {/* Mode Toggle Switch */}
          <div className="flex items-center gap-3">
            <div className="text-sm text-gray-600">
              {currentMode === 'patient' ? 'Patient' : 'Staff'}
            </div>
            <Switch
              checked={currentMode === 'staff'}
              onCheckedChange={(checked) => handleModeSwitch(checked ? 'staff' : 'patient')}
              className="data-[state=checked]:bg-blue-600"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleModeSwitch(currentMode === 'patient' ? 'staff' : 'patient')}
              className="flex items-center gap-2"
            >
              {currentMode === 'patient' ? (
                <>
                  <Users className="h-4 w-4" />
                  Switch to Staff Mode
                </>
              ) : (
                <>
                  <User className="h-4 w-4" />
                  Switch to Patient Mode
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      {/* Device Info & Auto-Detection Status */}
      {modeInfo && (
        <CardContent className="pt-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4" />
                <span>Device: {modeInfo.deviceType}</span>
              </div>
              <div className="flex items-center gap-2">
                {modeInfo.isTouchDevice ? (
                  <Tablet className="h-4 w-4 text-green-600" />
                ) : (
                  <Monitor className="h-4 w-4 text-blue-600" />
                )}
                <span>{modeInfo.isTouchDevice ? 'Touch' : 'Desktop'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                <span>Recommended: {modeInfo.recommendedMode}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {userPreference && (
                <Badge variant="secondary" className="text-xs">
                  User Preference Saved
                </Badge>
              )}
              {contextState.isDirty && (
                <Badge variant="outline" className="text-xs border-orange-400 text-orange-600">
                  Form Data Preserved
                </Badge>
              )}
              {contextState.lastSaved && (
                <Badge variant="outline" className="text-xs border-green-400 text-green-600">
                  Last Saved: {contextState.lastSaved.toLocaleTimeString()}
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );

  // Show loading state while detecting device
  if (!deviceInfo || !isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-blue-600" />
          <div>
            <h3 className="text-lg font-semibold">Detecting Device...</h3>
            <p className="text-gray-600">Optimizing interface for your device</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Auto-Detection Info Alert */}
      {showModeInfo && (
        <Alert className="border-blue-200 bg-blue-50">
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Smart Mode Detection:</strong> We've automatically selected{' '}
            <strong>{currentMode === 'patient' ? 'Patient' : 'Staff'} Mode</strong> based on your device.
            You can switch modes anytime using the toggle above.
          </AlertDescription>
        </Alert>
      )}
      
      {/* Mode Header with Toggle */}
      {renderModeHeader()}
      
      {/* Render Selected Interface */}
      {currentMode === 'patient' ? (
        <PatientTabletInterface 
          deviceType={deviceInfo.type}
          showModeSwitch={false}
        />
      ) : (
        <StaffAdminInterface 
          deviceType={deviceInfo.type}
          showModeSwitch={false}
        />
      )}
    </div>
  );
}

// Main component wrapped with context provider
export function EnhancedQuestionnaires() {
  return (
    <QuestionnaireProvider>
      <EnhancedQuestionnairesInner />
    </QuestionnaireProvider>
  );
}

export default EnhancedQuestionnaires;