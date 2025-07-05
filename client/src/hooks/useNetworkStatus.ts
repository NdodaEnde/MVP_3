// hooks/useNetworkStatus.ts
import { useState, useEffect, useCallback } from 'react';

export interface NetworkStatus {
  isOnline: boolean;
  isReconnecting: boolean;
  lastOnline: Date | null;
  downtime: number;
}

export function useNetworkStatus() {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isOnline: navigator.onLine,
    isReconnecting: false,
    lastOnline: navigator.onLine ? new Date() : null,
    downtime: 0
  });

  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  const checkOnlineStatus = useCallback(async () => {
    try {
      // Try to fetch a small resource to verify real connectivity
      const response = await fetch('/api/health', {
        method: 'HEAD',
        cache: 'no-cache',
        signal: AbortSignal.timeout(5000)
      });
      
      return response.ok;
    } catch {
      return false;
    }
  }, []);

  const handleOnline = useCallback(async () => {
    setNetworkStatus(prev => ({
      ...prev,
      isReconnecting: true
    }));

    // Verify actual connectivity, not just network interface
    const isReallyOnline = await checkOnlineStatus();
    
    if (isReallyOnline) {
      setNetworkStatus(prev => ({
        ...prev,
        isOnline: true,
        isReconnecting: false,
        lastOnline: new Date(),
        downtime: 0
      }));
      setReconnectAttempts(0);
    } else {
      // False positive, try reconnecting
      setNetworkStatus(prev => ({
        ...prev,
        isReconnecting: false
      }));
      setReconnectAttempts(prev => prev + 1);
    }
  }, [checkOnlineStatus]);

  const handleOffline = useCallback(() => {
    setNetworkStatus(prev => ({
      ...prev,
      isOnline: false,
      isReconnecting: false,
      downtime: prev.lastOnline ? Date.now() - prev.lastOnline.getTime() : 0
    }));
  }, []);

  useEffect(() => {
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check connection status periodically
    const interval = setInterval(async () => {
      const isOnline = await checkOnlineStatus();
      
      setNetworkStatus(prev => {
        if (prev.isOnline !== isOnline) {
          return {
            ...prev,
            isOnline,
            lastOnline: isOnline ? new Date() : prev.lastOnline,
            downtime: isOnline ? 0 : (prev.lastOnline ? Date.now() - prev.lastOnline.getTime() : 0)
          };
        }
        return prev;
      });
    }, 10000); // Check every 10 seconds

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [handleOnline, handleOffline, checkOnlineStatus]);

  return {
    ...networkStatus,
    reconnectAttempts,
    checkOnlineStatus
  };
}
