// hooks/useNetworkStatus.ts
import { useState, useEffect, useCallback } from 'react';

export interface NetworkStatus {
  isOnline: boolean;
  isReconnecting: boolean;
  lastOnline: Date | null;
  downtime: number;
  connectionType: string;
}

export function useNetworkStatus() {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isOnline: navigator.onLine,
    isReconnecting: false,
    lastOnline: navigator.onLine ? new Date() : null,
    downtime: 0,
    connectionType: 'unknown'
  });

  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [lastConnectivityCheck, setLastConnectivityCheck] = useState<Date>(new Date());

  const checkOnlineStatus = useCallback(async (): Promise<boolean> => {
    try {
      // Try to fetch a small resource to verify real connectivity
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch('/api/health', {
        method: 'HEAD',
        cache: 'no-cache',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      setLastConnectivityCheck(new Date());
      return response.ok;
    } catch (error) {
      console.log('Network connectivity check failed:', error);
      return false;
    }
  }, []);

  const getConnectionInfo = useCallback(() => {
    // Get connection type if available
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    
    if (connection) {
      return {
        type: connection.effectiveType || connection.type || 'unknown',
        downlink: connection.downlink,
        rtt: connection.rtt,
        saveData: connection.saveData
      };
    }
    
    return { type: 'unknown' };
  }, []);

  const handleOnline = useCallback(async () => {
    console.log('Network interface reported online');
    
    setNetworkStatus(prev => ({
      ...prev,
      isReconnecting: true
    }));

    // Verify actual connectivity, not just network interface
    const isReallyOnline = await checkOnlineStatus();
    
    if (isReallyOnline) {
      const connectionInfo = getConnectionInfo();
      
      setNetworkStatus(prev => ({
        ...prev,
        isOnline: true,
        isReconnecting: false,
        lastOnline: new Date(),
        downtime: 0,
        connectionType: connectionInfo.type
      }));
      
      setReconnectAttempts(0);
      console.log('✅ Network connectivity verified');
    } else {
      // False positive, network interface says online but no real connectivity
      setNetworkStatus(prev => ({
        ...prev,
        isReconnecting: false,
        isOnline: false
      }));
      
      setReconnectAttempts(prev => prev + 1);
      console.log('❌ Network interface online but no connectivity');
    }
  }, [checkOnlineStatus, getConnectionInfo]);

  const handleOffline = useCallback(() => {
    console.log('Network interface reported offline');
    
    setNetworkStatus(prev => ({
      ...prev,
      isOnline: false,
      isReconnecting: false,
      downtime: prev.lastOnline ? Date.now() - prev.lastOnline.getTime() : 0
    }));
  }, []);

  // Set up event listeners and periodic checks
  useEffect(() => {
    // Browser network status events
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Periodic connectivity verification
    const interval = setInterval(async () => {
      const currentlyOnline = await checkOnlineStatus();
      
      setNetworkStatus(prev => {
        // Only update if status actually changed
        if (prev.isOnline !== currentlyOnline) {
          console.log(`Network status changed: ${prev.isOnline ? 'online' : 'offline'} → ${currentlyOnline ? 'online' : 'offline'}`);
          
          const connectionInfo = getConnectionInfo();
          
          return {
            ...prev,
            isOnline: currentlyOnline,
            lastOnline: currentlyOnline ? new Date() : prev.lastOnline,
            downtime: currentlyOnline ? 0 : (prev.lastOnline ? Date.now() - prev.lastOnline.getTime() : prev.downtime),
            connectionType: connectionInfo.type,
            isReconnecting: false
          };
        }
        return prev;
      });
    }, 15000); // Check every 15 seconds

    // Page visibility change - check when page becomes visible
    const handleVisibilityChange = () => {
      if (!document.hidden && navigator.onLine) {
        console.log('Page became visible, checking connectivity...');
        checkOnlineStatus().then(isOnline => {
          if (isOnline) {
            handleOnline();
          }
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Connection type changes (mobile networks)
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    if (connection) {
      const handleConnectionChange = () => {
        const connectionInfo = getConnectionInfo();
        setNetworkStatus(prev => ({
          ...prev,
          connectionType: connectionInfo.type
        }));
        console.log('Connection type changed:', connectionInfo.type);
      };
      
      connection.addEventListener('change', handleConnectionChange);
      
      // Cleanup connection listener
      return () => {
        connection.removeEventListener('change', handleConnectionChange);
      };
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(interval);
    };
  }, [handleOnline, handleOffline, checkOnlineStatus, getConnectionInfo]);

  // Force connectivity check
  const forceConnectivityCheck = useCallback(async () => {
    setNetworkStatus(prev => ({ ...prev, isReconnecting: true }));
    const isOnline = await checkOnlineStatus();
    
    if (isOnline) {
      await handleOnline();
    } else {
      setNetworkStatus(prev => ({ ...prev, isReconnecting: false, isOnline: false }));
    }
    
    return isOnline;
  }, [checkOnlineStatus, handleOnline]);

  return {
    ...networkStatus,
    reconnectAttempts,
    lastConnectivityCheck,
    checkOnlineStatus,
    forceConnectivityCheck
  };
}
