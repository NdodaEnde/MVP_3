// src/hooks/useNetworkStatus.ts
import { useState, useEffect } from 'react';

interface NetworkStatus {
  isOnline: boolean;
  connectionType: 'wifi' | 'cellular' | 'ethernet' | 'unknown';
  downlink?: number;
  effectiveType?: '2g' | '3g' | '4g' | 'slow-2g';
  rtt?: number;
}

export const useNetworkStatus = (): NetworkStatus => {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isOnline: navigator.onLine,
    connectionType: 'unknown'
  });

  useEffect(() => {
    const updateNetworkStatus = () => {
      const connection = (navigator as any).connection || 
                       (navigator as any).mozConnection || 
                       (navigator as any).webkitConnection;

      setNetworkStatus({
        isOnline: navigator.onLine,
        connectionType: connection?.type || 'unknown',
        downlink: connection?.downlink,
        effectiveType: connection?.effectiveType,
        rtt: connection?.rtt
      });
    };

    const handleOnline = () => updateNetworkStatus();
    const handleOffline = () => updateNetworkStatus();
    const handleConnectionChange = () => updateNetworkStatus();

    // Initial status
    updateNetworkStatus();

    // Event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    const connection = (navigator as any).connection;
    if (connection) {
      connection.addEventListener('change', handleConnectionChange);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (connection) {
        connection.removeEventListener('change', handleConnectionChange);
      }
    };
  }, []);

  return networkStatus;
};