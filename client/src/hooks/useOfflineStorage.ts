import { useState, useEffect, useCallback } from 'react';

interface OfflineData {
  id: string;
  data: any;
  timestamp: string;
  type: 'questionnaire' | 'patient' | 'vitals';
  synced: boolean;
}

interface SyncQueueItem {
  id: string;
  action: 'create' | 'update' | 'delete';
  endpoint: string;
  data: any;
  timestamp: string;
  retryCount: number;
}

export function useOfflineStorage() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncQueue, setSyncQueue] = useState<SyncQueueItem[]>([]);
  const [syncing, setSyncing] = useState(false);

  // Monitor network status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncPendingData();
    };
    
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Load sync queue from localStorage on mount
    loadSyncQueue();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Save data to localStorage
  const saveOffline = useCallback((key: string, data: any, type: 'questionnaire' | 'patient' | 'vitals' = 'questionnaire') => {
    const offlineData: OfflineData = {
      id: key,
      data,
      timestamp: new Date().toISOString(),
      type,
      synced: false
    };

    localStorage.setItem(`offline_${key}`, JSON.stringify(offlineData));
    
    // Add to sync queue if online
    if (isOnline) {
      addToSyncQueue(key, 'update', getEndpointForType(type), data);
    }
  }, [isOnline]);

  // Load data from localStorage
  const loadOffline = useCallback((key: string): OfflineData | null => {
    const stored = localStorage.getItem(`offline_${key}`);
    if (!stored) return null;

    try {
      return JSON.parse(stored);
    } catch (error) {
      console.error('Error parsing offline data:', error);
      return null;
    }
  }, []);

  // Remove data from localStorage
  const removeOffline = useCallback((key: string) => {
    localStorage.removeItem(`offline_${key}`);
  }, []);

  // Add item to sync queue
  const addToSyncQueue = useCallback((id: string, action: 'create' | 'update' | 'delete', endpoint: string, data: any) => {
    const queueItem: SyncQueueItem = {
      id,
      action,
      endpoint,
      data,
      timestamp: new Date().toISOString(),
      retryCount: 0
    };

    setSyncQueue(prev => {
      // Remove any existing item with same id to avoid duplicates
      const filtered = prev.filter(item => item.id !== id);
      const updated = [...filtered, queueItem];
      
      // Save to localStorage
      localStorage.setItem('sync_queue', JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Load sync queue from localStorage
  const loadSyncQueue = useCallback(() => {
    const stored = localStorage.getItem('sync_queue');
    if (stored) {
      try {
        setSyncQueue(JSON.parse(stored));
      } catch (error) {
        console.error('Error loading sync queue:', error);
      }
    }
  }, []);

  // Sync pending data when online
  const syncPendingData = useCallback(async () => {
    if (!isOnline || syncing || syncQueue.length === 0) return;

    setSyncing(true);
    console.log(`Starting sync of ${syncQueue.length} items...`);

    const successfulSyncs: string[] = [];
    const failedSyncs: SyncQueueItem[] = [];

    for (const item of syncQueue) {
      try {
        const response = await fetch(item.endpoint, {
          method: item.action === 'delete' ? 'DELETE' : 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: item.action !== 'delete' ? JSON.stringify(item.data) : undefined,
        });

        if (response.ok) {
          console.log(`Successfully synced ${item.id}`);
          successfulSyncs.push(item.id);
          
          // Mark offline data as synced
          const offlineData = loadOffline(item.id);
          if (offlineData) {
            offlineData.synced = true;
            localStorage.setItem(`offline_${item.id}`, JSON.stringify(offlineData));
          }
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      } catch (error) {
        console.error(`Failed to sync ${item.id}:`, error);
        
        // Increment retry count
        const retryItem = { ...item, retryCount: item.retryCount + 1 };
        
        // Only retry up to 3 times
        if (retryItem.retryCount < 3) {
          failedSyncs.push(retryItem);
        } else {
          console.error(`Max retries exceeded for ${item.id}, removing from queue`);
        }
      }
    }

    // Update sync queue with failed items
    setSyncQueue(failedSyncs);
    localStorage.setItem('sync_queue', JSON.stringify(failedSyncs));

    if (successfulSyncs.length > 0) {
      console.log(`Successfully synced ${successfulSyncs.length} items`);
    }

    if (failedSyncs.length > 0) {
      console.log(`${failedSyncs.length} items failed to sync and will be retried`);
    }

    setSyncing(false);
  }, [isOnline, syncing, syncQueue, loadOffline]);

  // Get all offline data
  const getAllOfflineData = useCallback((): OfflineData[] => {
    const allData: OfflineData[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('offline_')) {
        const data = loadOffline(key.replace('offline_', ''));
        if (data) allData.push(data);
      }
    }
    
    return allData.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [loadOffline]);

  // Check if there's unsynced data
  const hasUnsyncedData = useCallback((): boolean => {
    const allData = getAllOfflineData();
    return allData.some(item => !item.synced) || syncQueue.length > 0;
  }, [getAllOfflineData, syncQueue.length]);

  // Manual sync trigger
  const forceSync = useCallback(() => {
    if (isOnline) {
      syncPendingData();
    }
  }, [isOnline, syncPendingData]);

  // Clear all offline data
  const clearOfflineData = useCallback(() => {
    const keysToRemove: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('offline_')) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    localStorage.removeItem('sync_queue');
    setSyncQueue([]);
  }, []);

  // Get endpoint for data type
  const getEndpointForType = (type: 'questionnaire' | 'patient' | 'vitals'): string => {
    const endpoints = {
      questionnaire: '/api/questionnaires',
      patient: '/api/patients',
      vitals: '/api/vitals'
    };
    return endpoints[type];
  };

  return {
    // State
    isOnline,
    syncing,
    syncQueue,
    
    // Actions
    saveOffline,
    loadOffline,
    removeOffline,
    syncPendingData,
    forceSync,
    clearOfflineData,
    
    // Queries
    getAllOfflineData,
    hasUnsyncedData: hasUnsyncedData(),
    pendingSyncCount: syncQueue.length
  };
}

// Hook for questionnaire-specific offline functionality
export function useQuestionnaireOffline(patientId: string) {
  const {
    isOnline,
    syncing,
    saveOffline,
    loadOffline,
    hasUnsyncedData,
    syncPendingData
  } = useOfflineStorage();

  const questionnaireKey = `questionnaire_${patientId}`;

  const saveQuestionnaireDraft = useCallback((data: any) => {
    const enhancedData = {
      ...data,
      patient_id: patientId,
      last_modified: new Date().toISOString(),
      offline_version: true
    };
    
    saveOffline(questionnaireKey, enhancedData, 'questionnaire');
  }, [saveOffline, questionnaireKey, patientId]);

  const loadQuestionnaireDraft = useCallback(() => {
    const stored = loadOffline(questionnaireKey);
    return stored?.data || null;
  }, [loadOffline, questionnaireKey]);

  const submitQuestionnaireOffline = useCallback((data: any) => {
    const submissionData = {
      ...data,
      patient_id: patientId,
      submitted_at: new Date().toISOString(),
      submitted_offline: true,
      requires_sync: true
    };

    saveOffline(`${questionnaireKey}_submission`, submissionData, 'questionnaire');
    
    // If online, try to sync immediately
    if (isOnline) {
      syncPendingData();
    }
  }, [saveOffline, questionnaireKey, patientId, isOnline, syncPendingData]);

  return {
    isOnline,
    syncing,
    hasUnsyncedData,
    saveQuestionnaireDraft,
    loadQuestionnaireDraft,
    submitQuestionnaireOffline,
    forceSync: syncPendingData
  };
}