// hooks/useOfflineStorage.ts
import { useState, useCallback, useEffect } from 'react';

interface OfflineData {
  id: string;
  formData: any;
  timestamp: string;
  patientId: string;
  questionnaireId?: string;
  examinationType: string;
  version: number;
  checksum: string;
}

interface SyncQueueItem {
  id: string;
  action: 'create' | 'update' | 'complete';
  data: any;
  timestamp: string;
  attempts: number;
  lastAttempt?: string;
  error?: string;
}

export function useOfflineStorage() {
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error' | 'success'>('idle');
  const [syncProgress, setSyncProgress] = useState({ current: 0, total: 0 });
  const [lastSyncAttempt, setLastSyncAttempt] = useState<Date | null>(null);

  // Generate checksum for data integrity
  const generateChecksum = useCallback((data: any): string => {
    return btoa(JSON.stringify(data)).slice(-8);
  }, []);

  // Save questionnaire data offline
  const saveOffline = useCallback(async (
    key: string,
    formData: any,
    options: {
      patientId: string;
      questionnaireId?: string;
      examinationType: string;
      action?: 'create' | 'update' | 'complete';
    }
  ): Promise<void> => {
    try {
      const offlineData: OfflineData = {
        id: key,
        formData,
        timestamp: new Date().toISOString(),
        patientId: options.patientId,
        questionnaireId: options.questionnaireId,
        examinationType: options.examinationType,
        version: Date.now(),
        checksum: generateChecksum(formData)
      };

      // Save main data
      localStorage.setItem(`offline_questionnaire_${key}`, JSON.stringify(offlineData));

      // Add to sync queue
      const syncItem: SyncQueueItem = {
        id: key,
        action: options.action || 'update',
        data: offlineData,
        timestamp: new Date().toISOString(),
        attempts: 0
      };

      const syncQueue = getSyncQueue();
      const existingIndex = syncQueue.findIndex(item => item.id === key);
      
      if (existingIndex >= 0) {
        syncQueue[existingIndex] = syncItem;
      } else {
        syncQueue.push(syncItem);
      }

      localStorage.setItem('sync_queue', JSON.stringify(syncQueue));

      console.log(`Saved questionnaire ${key} offline with action: ${syncItem.action}`);
    } catch (error) {
      console.error('Failed to save offline data:', error);
      throw new Error('Failed to save questionnaire offline');
    }
  }, [generateChecksum]);

  // Load questionnaire data from offline storage
  const loadOffline = useCallback(async (key: string): Promise<OfflineData | null> => {
    try {
      const stored = localStorage.getItem(`offline_questionnaire_${key}`);
      if (!stored) return null;

      const data: OfflineData = JSON.parse(stored);
      
      // Verify data integrity
      const currentChecksum = generateChecksum(data.formData);
      if (currentChecksum !== data.checksum) {
        console.warn(`Data integrity check failed for ${key}, removing corrupted data`);
        localStorage.removeItem(`offline_questionnaire_${key}`);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Failed to load offline data:', error);
      return null;
    }
  }, [generateChecksum]);

  // Get sync queue
  const getSyncQueue = useCallback((): SyncQueueItem[] => {
    try {
      const queue = localStorage.getItem('sync_queue');
      return queue ? JSON.parse(queue) : [];
    } catch {
      return [];
    }
  }, []);

  // Update sync queue
  const updateSyncQueue = useCallback((queue: SyncQueueItem[]): void => {
    localStorage.setItem('sync_queue', JSON.stringify(queue));
  }, []);

  // Sync individual item to server
  const syncItem = useCallback(async (item: SyncQueueItem): Promise<boolean> => {
    try {
      const { action, data } = item;

      switch (action) {
        case 'create':
          await import('../api/questionnaires').then(({ createQuestionnaire }) =>
            createQuestionnaire({
              patientId: data.patientId,
              examinationId: data.questionnaireId || '',
              examinationType: data.examinationType
            })
          );
          break;

        case 'update':
          if (data.questionnaireId) {
            await import('../api/questionnaires').then(({ autoSaveQuestionnaire }) =>
              autoSaveQuestionnaire(data.questionnaireId, data.formData)
            );
          }
          break;

        case 'complete':
          if (data.questionnaireId) {
            await import('../api/questionnaires').then(({ completeQuestionnaire }) =>
              completeQuestionnaire(data.questionnaireId, data.formData.declarations_and_signatures?.employee_declaration?.employee_signature)
            );
          }
          break;

        default:
          throw new Error(`Unknown sync action: ${action}`);
      }

      return true;
    } catch (error) {
      console.error(`Failed to sync item ${item.id}:`, error);
      return false;
    }
  }, []);

  // Sync all pending data to server
  const syncPendingData = useCallback(async (): Promise<void> => {
    const syncQueue = getSyncQueue();
    if (syncQueue.length === 0) return;

    setSyncStatus('syncing');
    setSyncProgress({ current: 0, total: syncQueue.length });
    setLastSyncAttempt(new Date());

    const updatedQueue: SyncQueueItem[] = [];
    let successCount = 0;

    for (let i = 0; i < syncQueue.length; i++) {
      const item = syncQueue[i];
      setSyncProgress({ current: i + 1, total: syncQueue.length });

      try {
        const success = await syncItem(item);
        
        if (success) {
          successCount++;
          // Remove from offline storage after successful sync
          localStorage.removeItem(`offline_questionnaire_${item.id}`);
        } else {
          // Keep in queue with updated attempt count
          updatedQueue.push({
            ...item,
            attempts: item.attempts + 1,
            lastAttempt: new Date().toISOString(),
            error: 'Sync failed'
          });
        }
      } catch (error) {
        updatedQueue.push({
          ...item,
          attempts: item.attempts + 1,
          lastAttempt: new Date().toISOString(),
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Update sync queue with remaining items
    updateSyncQueue(updatedQueue);

    if (updatedQueue.length === 0) {
      setSyncStatus('success');
    } else {
      setSyncStatus('error');
    }

    console.log(`Sync completed: ${successCount}/${syncQueue.length} items synced successfully`);
  }, [getSyncQueue, syncItem, updateSyncQueue]);

  // Check if there's pending sync data
  const hasPendingSync = useCallback((): boolean => {
    return getSyncQueue().length > 0;
  }, [getSyncQueue]);

  // Get offline storage size
  const getStorageInfo = useCallback(() => {
    const syncQueue = getSyncQueue();
    let totalSize = 0;
    let itemCount = 0;

    // Calculate size of offline questionnaires
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('offline_questionnaire_')) {
        const item = localStorage.getItem(key);
        if (item) {
          totalSize += new Blob([item]).size;
          itemCount++;
        }
      }
    }

    return {
      itemCount,
      totalSize,
      pendingSync: syncQueue.length,
      storageQuota: 5 * 1024 * 1024 // 5MB typical localStorage limit
    };
  }, [getSyncQueue]);

  // Clear all offline data (emergency cleanup)
  const clearAllOfflineData = useCallback((): void => {
    const keysToRemove: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('offline_questionnaire_') || key === 'sync_queue') {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach(key => localStorage.removeItem(key));
    setSyncStatus('idle');
    setSyncProgress({ current: 0, total: 0 });
  }, []);

  // Auto-cleanup old offline data (older than 7 days)
  useEffect(() => {
    const cleanupOldData = () => {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 7);

      const keysToRemove: string[] = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('offline_questionnaire_')) {
          try {
            const item = localStorage.getItem(key);
            if (item) {
              const data: OfflineData = JSON.parse(item);
              if (new Date(data.timestamp) < cutoffDate) {
                keysToRemove.push(key);
              }
            }
          } catch (error) {
            // Remove corrupted data
            keysToRemove.push(key);
          }
        }
      }

      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
        console.log(`Cleaned up old offline data: ${key}`);
      });
    };

    cleanupOldData();
    
    // Run cleanup daily
    const interval = setInterval(cleanupOldData, 24 * 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return {
    saveOffline,
    loadOffline,
    syncPendingData,
    hasPendingSync,
    getStorageInfo,
    clearAllOfflineData,
    syncStatus,
    syncProgress,
    lastSyncAttempt,
    getSyncQueue: () => getSyncQueue()
  };
}