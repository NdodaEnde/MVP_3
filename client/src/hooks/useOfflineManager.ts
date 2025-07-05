// hooks/useOfflineManager.ts
import { useState, useEffect, useCallback } from 'react';
import { OfflineManager } from '@/utils/offlineManager';

export interface OfflineManagerState {
  isOnline: boolean;
  syncStatus: 'idle' | 'syncing' | 'success' | 'error';
  syncProgress: { current: number; total: number };
  storageStats: {
    itemCount: number;
    totalSize: number;
    pendingSync: number;
    syncInProgress: boolean;
    storageQuota: number;
  };
  lastSyncAttempt: Date | null;
}

export function useOfflineManager() {
  const [state, setState] = useState<OfflineManagerState>({
    isOnline: navigator.onLine,
    syncStatus: 'idle',
    syncProgress: { current: 0, total: 0 },
    storageStats: {
      itemCount: 0,
      totalSize: 0,
      pendingSync: 0,
      syncInProgress: false,
      storageQuota: 5 * 1024 * 1024
    },
    lastSyncAttempt: null
  });

  const offlineManager = OfflineManager.getInstance();

  // Update storage stats
  const updateStorageStats = useCallback(() => {
    const stats = offlineManager.getStorageStats();
    setState(prev => ({
      ...prev,
      storageStats: stats
    }));
  }, [offlineManager]);

  // Event handlers
  useEffect(() => {
    const handleNetworkChange = ({ isOnline }: { isOnline: boolean }) => {
      setState(prev => ({ ...prev, isOnline }));
    };

    const handleSyncStarted = () => {
      setState(prev => ({ 
        ...prev, 
        syncStatus: 'syncing',
        lastSyncAttempt: new Date()
      }));
    };

    const handleSyncProgress = ({ current, total }: { current: number; total: number }) => {
      setState(prev => ({ 
        ...prev, 
        syncProgress: { current, total }
      }));
    };

    const handleSyncCompleted = ({ successCount, failCount }: { successCount: number; failCount: number }) => {
      setState(prev => ({ 
        ...prev, 
        syncStatus: failCount === 0 ? 'success' : 'error',
        syncProgress: { current: 0, total: 0 }
      }));
      updateStorageStats();
    };

    const handleSyncError = () => {
      setState(prev => ({ 
        ...prev, 
        syncStatus: 'error',
        syncProgress: { current: 0, total: 0 }
      }));
    };

    const handleStorageChanged = () => {
      updateStorageStats();
    };

    // Set up event listeners
    offlineManager.on('network-status-changed', handleNetworkChange);
    offlineManager.on('sync-started', handleSyncStarted);
    offlineManager.on('sync-progress', handleSyncProgress);
    offlineManager.on('sync-completed', handleSyncCompleted);
    offlineManager.on('sync-error', handleSyncError);
    offlineManager.on('storage-changed', handleStorageChanged);

    // Initial state
    updateStorageStats();

    // Update stats periodically
    const interval = setInterval(updateStorageStats, 5000);

    return () => {
      offlineManager.off('network-status-changed', handleNetworkChange);
      offlineManager.off('sync-started', handleSyncStarted);
      offlineManager.off('sync-progress', handleSyncProgress);
      offlineManager.off('sync-completed', handleSyncCompleted);
      offlineManager.off('sync-error', handleSyncError);
      offlineManager.off('storage-changed', handleStorageChanged);
      clearInterval(interval);
    };
  }, [offlineManager, updateStorageStats]);

  // Action functions
  const triggerSync = useCallback(async (): Promise<boolean> => {
    return await offlineManager.attemptSync();
  }, [offlineManager]);

  const cleanupOldData = useCallback(async (maxAge?: number): Promise<number> => {
    return await offlineManager.cleanupOldData(maxAge);
  }, [offlineManager]);

  const clearAllOfflineData = useCallback((): void => {
    // Clear localStorage items
    const keysToRemove: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('offline_questionnaire_') || key === 'sync_queue') {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    // Update state
    setState(prev => ({
      ...prev,
      syncStatus: 'idle',
      syncProgress: { current: 0, total: 0 }
    }));
    
    updateStorageStats();
  }, [updateStorageStats]);

  const getSyncQueue = useCallback(() => {
    try {
      const queue = localStorage.getItem('sync_queue');
      return queue ? JSON.parse(queue) : [];
    } catch {
      return [];
    }
  }, []);

  const hasPendingSync = useCallback((): boolean => {
    return getSyncQueue().length > 0;
  }, [getSyncQueue]);

  const exportOfflineData = useCallback(async (): Promise<Blob> => {
    const offlineData: any = {
      exportDate: new Date().toISOString(),
      questionnaires: [],
      syncQueue: getSyncQueue()
    };

    // Export questionnaire data
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('offline_questionnaire_')) {
        try {
          const item = localStorage.getItem(key);
          if (item) {
            const data = JSON.parse(item);
            offlineData.questionnaires.push({
              key: key.replace('offline_questionnaire_', ''),
              ...data
            });
          }
        } catch (error) {
          console.error(`Failed to export ${key}:`, error);
        }
      }
    }

    const jsonString = JSON.stringify(offlineData, null, 2);
    return new Blob([jsonString], { type: 'application/json' });
  }, [getSyncQueue]);

  const downloadOfflineData = useCallback(async (): Promise<void> => {
    try {
      const blob = await exportOfflineData();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `surgiscan-offline-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download offline data:', error);
    }
  }, [exportOfflineData]);

  return {
    // State
    ...state,
    
    // Computed values
    hasPendingSync: hasPendingSync(),
    isOnline: state.isOnline,
    
    // Actions
    triggerSync,
    cleanupOldData,
    clearAllOfflineData,
    getSyncQueue,
    exportOfflineData,
    downloadOfflineData,
    
    // Utilities
    updateStorageStats
  };
}