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
  metadata: {
    userAgent: string;
    lastModified: string;
    sectionProgress: Record<string, boolean>;
    validationErrors: string[];
  };
}

interface SyncQueueItem {
  id: string;
  action: 'create' | 'update' | 'complete';
  data: OfflineData;
  timestamp: string;
  attempts: number;
  lastAttempt?: string;
  error?: string;
  priority: 'low' | 'normal' | 'high';
}

interface StorageStats {
  itemCount: number;
  totalSize: number;
  pendingSync: number;
  storageQuota: number;
  usagePercentage: number;
  oldestItem?: Date;
  newestItem?: Date;
}

export function useOfflineStorage() {
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error' | 'success'>('idle');
  const [syncProgress, setSyncProgress] = useState({ current: 0, total: 0 });
  const [lastSyncAttempt, setLastSyncAttempt] = useState<Date | null>(null);
  const [storageWarning, setStorageWarning] = useState<string | null>(null);

  // Generate checksum for data integrity
  const generateChecksum = useCallback((data: any): string => {
    const jsonString = JSON.stringify(data, Object.keys(data).sort());
    return btoa(jsonString).slice(-8);
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
      sectionProgress?: Record<string, boolean>;
      validationErrors?: string[];
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
        checksum: generateChecksum(formData),
        metadata: {
          userAgent: navigator.userAgent,
          lastModified: new Date().toISOString(),
          sectionProgress: options.sectionProgress || {},
          validationErrors: options.validationErrors || []
        }
      };

      // Check storage quota before saving
      const storageStats = getStorageStats();
      if (storageStats.usagePercentage > 90) {
        setStorageWarning('Storage space is running low. Consider clearing old offline data.');
      }

      // Save main data
      const dataKey = `offline_questionnaire_${key}`;
      localStorage.setItem(dataKey, JSON.stringify(offlineData));

      // Add to sync queue
      const syncItem: SyncQueueItem = {
        id: key,
        action: options.action || 'update',
        data: offlineData,
        timestamp: new Date().toISOString(),
        attempts: 0,
        priority: options.action === 'complete' ? 'high' : 'normal'
      };

      updateSyncQueue(syncItem);

      console.log(`💾 Saved questionnaire ${key} offline (${options.action})`);
    } catch (error) {
      console.error('Failed to save offline data:', error);
      
      // Handle quota exceeded error
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        setStorageWarning('Storage quota exceeded. Please clear old offline data.');
        throw new Error('Storage quota exceeded. Please clear old offline data.');
      }
      
      throw new Error('Failed to save questionnaire offline');
    }
  }, [generateChecksum]);

  // Load questionnaire data from offline storage
  const loadOffline = useCallback(async (key: string): Promise<OfflineData | null> => {
    try {
      const dataKey = `offline_questionnaire_${key}`;
      const stored = localStorage.getItem(dataKey);
      if (!stored) return null;

      const data: OfflineData = JSON.parse(stored);
      
      // Verify data integrity
      const currentChecksum = generateChecksum(data.formData);
      if (currentChecksum !== data.checksum) {
        console.warn(`❌ Data integrity check failed for ${key}, removing corrupted data`);
        localStorage.removeItem(dataKey);
        removeFromSyncQueue(key);
        return null;
      }

      console.log(`📤 Loaded questionnaire ${key} from offline storage`);
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
  const updateSyncQueue = useCallback((newItem: SyncQueueItem): void => {
    const queue = getSyncQueue();
    const existingIndex = queue.findIndex(item => item.id === newItem.id);
    
    if (existingIndex >= 0) {
      queue[existingIndex] = newItem;
    } else {
      queue.push(newItem);
    }
    
    // Sort by priority and timestamp
    queue.sort((a, b) => {
      const priorityOrder = { high: 3, normal: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
    
    localStorage.setItem('sync_queue', JSON.stringify(queue));
  }, [getSyncQueue]);

  // Remove item from sync queue
  const removeFromSyncQueue = useCallback((id: string): void => {
    const queue = getSyncQueue();
    const updatedQueue = queue.filter(item => item.id !== id);
    localStorage.setItem('sync_queue', JSON.stringify(updatedQueue));
  }, [getSyncQueue]);

  // Sync individual item to server
  const syncItem = useCallback(async (item: SyncQueueItem): Promise<boolean> => {
    try {
      const { action, data } = item;

      switch (action) {
        case 'create':
          const { createQuestionnaire } = await import('@/api/questionnaires');
          await createQuestionnaire({
            patientId: data.patientId,
            examinationId: data.questionnaireId || '',
            examinationType: data.examinationType
          });
          break;

        case 'update':
          if (data.questionnaireId) {
            const { autoSaveQuestionnaire } = await import('@/api/questionnaires');
            await autoSaveQuestionnaire(data.questionnaireId, data.formData);
          }
          break;

        case 'complete':
          if (data.questionnaireId) {
            const { completeQuestionnaire } = await import('@/api/questionnaires');
            await completeQuestionnaire(
              data.questionnaireId,
              data.formData.declarations_and_signatures?.employee_declaration?.employee_signature
            );
          }
          break;

        default:
          throw new Error(`Unknown sync action: ${action}`);
      }

      console.log(`✅ Successfully synced ${item.id} (${action})`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to sync item ${item.id}:`, error);
      return false;
    }
  }, []);

  // Sync all pending data to server
  const syncPendingData = useCallback(async (): Promise<void> => {
    const syncQueue = getSyncQueue();
    if (syncQueue.length === 0) {
      console.log('📭 No pending items to sync');
      return;
    }

    console.log(`🔄 Starting sync of ${syncQueue.length} items...`);
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
          const updatedItem: SyncQueueItem = {
            ...item,
            attempts: item.attempts + 1,
            lastAttempt: new Date().toISOString(),
            error: 'Sync failed'
          };
          
          // Only retry up to 3 times
          if (updatedItem.attempts < 3) {
            updatedQueue.push(updatedItem);
          } else {
            console.warn(`⚠️ Giving up on syncing ${item.id} after 3 attempts`);
          }
        }
      } catch (error) {
        const updatedItem: SyncQueueItem = {
          ...item,
          attempts: item.attempts + 1,
          lastAttempt: new Date().toISOString(),
          error: error instanceof Error ? error.message : 'Unknown error'
        };
        
        if (updatedItem.attempts < 3) {
          updatedQueue.push(updatedItem);
        }
      }

      // Small delay to prevent overwhelming the server
      if (i < syncQueue.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // Update sync queue with remaining items
    localStorage.setItem('sync_queue', JSON.stringify(updatedQueue));

    if (updatedQueue.length === 0) {
      setSyncStatus('success');
      console.log(`🎉 Sync completed successfully: ${successCount}/${syncQueue.length} items synced`);
    } else {
      setSyncStatus('error');
      console.log(`⚠️ Sync completed with errors: ${successCount}/${syncQueue.length} items synced, ${updatedQueue.length} items remain`);
    }

    setSyncProgress({ current: 0, total: 0 });
  }, [getSyncQueue, syncItem]);

  // Check if there's pending sync data
  const hasPendingSync = useCallback((): boolean => {
    return getSyncQueue().length > 0;
  }, [getSyncQueue]);

  // Get offline storage statistics
  const getStorageStats = useCallback((): StorageStats => {
    let totalSize = 0;
    let itemCount = 0;
    let oldestItem: Date | undefined;
    let newestItem: Date | undefined;

    // Calculate size of offline questionnaires
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('offline_questionnaire_')) {
        const item = localStorage.getItem(key);
        if (item) {
          totalSize += new Blob([item]).size;
          itemCount++;
          
          try {
            const data: OfflineData = JSON.parse(item);
            const timestamp = new Date(data.timestamp);
            
            if (!oldestItem || timestamp < oldestItem) {
              oldestItem = timestamp;
            }
            if (!newestItem || timestamp > newestItem) {
              newestItem = timestamp;
            }
          } catch (error) {
            // Ignore corrupted data
          }
        }
      }
    }

    const syncQueue = getSyncQueue();
    const storageQuota = 5 * 1024 * 1024; // 5MB typical localStorage limit
    const usagePercentage = (totalSize / storageQuota) * 100;

    return {
      itemCount,
      totalSize,
      pendingSync: syncQueue.length,
      storageQuota,
      usagePercentage,
      oldestItem,
      newestItem
    };
  }, [getSyncQueue]);

  // Clear all offline data (emergency cleanup)
  const clearAllOfflineData = useCallback((): number => {
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
    setStorageWarning(null);
    
    console.log(`🗑️ Cleared ${keysToRemove.length} offline items`);
    return keysToRemove.length;
  }, []);

  // Auto-cleanup old offline data (older than specified days)
  const cleanupOldData = useCallback(async (maxAge: number = 7): Promise<number> => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - maxAge);

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
              // Also remove from sync queue
              removeFromSyncQueue(data.id);
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
    });

    if (keysToRemove.length > 0) {
      console.log(`🧹 Cleaned up ${keysToRemove.length} old offline items (older than ${maxAge} days)`);
    }

    return keysToRemove.length;
  }, [removeFromSyncQueue]);

  // Auto-cleanup on component mount and daily
  useEffect(() => {
    cleanupOldData();
    
    // Run cleanup daily
    const interval = setInterval(() => cleanupOldData(), 24 * 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [cleanupOldData]);

  return {
    // Core functions
    saveOffline,
    loadOffline,
    syncPendingData,
    hasPendingSync,
    
    // Management functions
    getStorageStats,
    clearAllOfflineData,
    cleanupOldData,
    getSyncQueue,
    removeFromSyncQueue,
    
    // Status
    syncStatus,
    syncProgress,
    lastSyncAttempt,
    storageWarning,
    
    // Utilities
    generateChecksum
  };
}
