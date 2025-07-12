// Device detection utility for smart context detection
export interface DeviceInfo {
  type: 'mobile' | 'tablet' | 'desktop';
  isTouchDevice: boolean;
  screenSize: 'small' | 'medium' | 'large';
  orientation: 'portrait' | 'landscape';
}

export const detectDevice = (): DeviceInfo => {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  
  let type: DeviceInfo['type'];
  let screenSize: DeviceInfo['screenSize'];
  
  // Device type detection based on screen width and touch capability
  if (width < 768) {
    type = 'mobile';
    screenSize = 'small';
  } else if (width < 1024) {
    type = 'tablet';
    screenSize = 'medium';
  } else {
    type = 'desktop';
    screenSize = 'large';
  }
  
  // Override type if touch device with larger screen
  if (isTouchDevice && width >= 768 && width < 1024) {
    type = 'tablet';
  }
  
  const orientation = width > height ? 'landscape' : 'portrait';
  
  return {
    type,
    isTouchDevice,
    screenSize,
    orientation
  };
};

export const getRecommendedMode = (deviceInfo: DeviceInfo): 'patient' | 'staff' => {
  // Smart default based on device characteristics
  if (deviceInfo.type === 'tablet' && deviceInfo.isTouchDevice) {
    return 'patient';
  }
  
  if (deviceInfo.type === 'desktop' || !deviceInfo.isTouchDevice) {
    return 'staff';
  }
  
  // Mobile defaults to patient mode
  return 'patient';
};

export const useDeviceDetection = () => {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  
  useEffect(() => {
    const updateDeviceInfo = () => {
      setDeviceInfo(detectDevice());
    };
    
    updateDeviceInfo();
    
    // Listen for resize events to update device info
    window.addEventListener('resize', updateDeviceInfo);
    window.addEventListener('orientationchange', updateDeviceInfo);
    
    return () => {
      window.removeEventListener('resize', updateDeviceInfo);
      window.removeEventListener('orientationchange', updateDeviceInfo);
    };
  }, []);
  
  return deviceInfo;
};

// React hook import
import { useState, useEffect } from 'react';