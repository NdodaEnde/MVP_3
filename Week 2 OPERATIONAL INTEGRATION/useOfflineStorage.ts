// src/hooks/useOfflineStorage.ts
import { useState, useEffect, useCallback } from 'react';
import { QuestionnaireFormData } from '@/schemas/questionnaireSchema';

interface OfflineStorageHook {
  saveOffline: (key: string, data: any) => Promise<void>;
  loadOffline: (key: string) => Promise<any>;
  removeOffline: (key: string) => Promise<void>;
  syncPendingData: () => Promise<void>;
  hasPendingSync: () => boolean;
  getPendingCount: () => number;
  clearSyncedData: () => void;
  getStorageSize: () => number;
}

interface OfflineDataItem {
  data: any;
  timestamp: string;
  syncStatus: 'pending' | 'syncing' | 'synced' | 'failed';
  retryCount: number;
  lastSyncAttempt?: string;
  checksum: string;
}

const STORAGE_PREFIX = 'surgiscan_offline_';
const SYNC_QUEUE_KEY = 'surgiscan_sync_queue';
const MAX_RETRY_ATTEMPTS = 3;
const SYNC_RETRY_DELAY = 5000; // 5 seconds

export const useOfflineStorage = (): OfflineStorageHook => {
  const [syncQueue, setSyncQueue] = useState<string[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  // Load sync queue on mount
  useEffect(() => {
    const loadSyncQueue = () => {
      try {
        const queue = localStorage.getItem(SYNC_QUEUE_KEY);
        setSyncQueue(queue ? JSON.parse(queue) : []);
      } catch (error) {
        console.error('Failed to load sync queue:', error);
        setSyncQueue([]);
      }
    };

    loadSyncQueue();
  }, []);

  // Generate checksum for data integrity
  const generateChecksum = (data: any): string => {
    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  };

  // Save data offline
  const saveOffline = useCallback(async (key: string, data: any): Promise<void> => {
    try {
      const storageKey = `${STORAGE_PREFIX}${key}`;
      const offlineItem: OfflineDataItem = {
        data,
        timestamp: new Date().toISOString(),
        syncStatus: 'pending',
        retryCount: 0,
        checksum: generateChecksum(data)
      };

      localStorage.setItem(storageKey, JSON.stringify(offlineItem));

      // Add to sync queue if not already present
      const currentQueue = JSON.parse(localStorage.getItem(SYNC_QUEUE_KEY) || '[]');
      if (!currentQueue.includes(key)) {
        currentQueue.push(key);
        localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(currentQueue));
        setSyncQueue(currentQueue);
      }

      console.log(`📱 Offline data saved: ${key}`);
    } catch (error) {
      console.error('Failed to save offline data:', error);
      throw new Error('Offline storage failed - storage may be full');
    }
  }, []);

  // Load data from offline storage
  const loadOffline = useCallback(async (key: string): Promise<any> => {
    try {
      const storageKey = `${STORAGE_PREFIX}${key}`;
      const stored = localStorage.getItem(storageKey);
      
      if (!stored) return null;

      const offlineItem: OfflineDataItem = JSON.parse(stored);
      
      // Verify data integrity
      const currentChecksum = generateChecksum(offlineItem.data);
      if (currentChecksum !== offlineItem.checksum) {
        console.warn(`Data integrity check failed for ${key}`);
        return null;
      }

      return offlineItem.data;
    } catch (error) {
      console.error('Failed to load offline data:', error);
      return null;
    }
  }, []);

  // Remove data from offline storage
  const removeOffline = useCallback(async (key: string): Promise<void> => {
    try {
      const storageKey = `${STORAGE_PREFIX}${key}`;
      localStorage.removeItem(storageKey);

      // Remove from sync queue
      const currentQueue = JSON.parse(localStorage.getItem(SYNC_QUEUE_KEY) || '[]');
      const updatedQueue = currentQueue.filter((item: string) => item !== key);
      localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(updatedQueue));
      setSyncQueue(updatedQueue);

      console.log(`📱 Offline data removed: ${key}`);
    } catch (error) {
      console.error('Failed to remove offline data:', error);
    }
  }, []);

  // Sync pending data to server
  const syncPendingData = useCallback(async (): Promise<void> => {
    if (isSyncing || !navigator.onLine) return;

    setIsSyncing(true);
    const currentQueue = JSON.parse(localStorage.getItem(SYNC_QUEUE_KEY) || '[]');
    
    for (const key of currentQueue) {
      try {
        const storageKey = `${STORAGE_PREFIX}${key}`;
        const stored = localStorage.getItem(storageKey);
        
        if (!stored) continue;

        const offlineItem: OfflineDataItem = JSON.parse(stored);
        
        // Skip if already synced or too many retry attempts
        if (offlineItem.syncStatus === 'synced' || 
            offlineItem.retryCount >= MAX_RETRY_ATTEMPTS) {
          continue;
        }

        // Update sync status
        offlineItem.syncStatus = 'syncing';
        offlineItem.lastSyncAttempt = new Date().toISOString();
        localStorage.setItem(storageKey, JSON.stringify(offlineItem));

        // Determine sync endpoint based on data type
        const syncEndpoint = getSyncEndpoint(key, offlineItem.data);
        
        // Attempt to sync to server
        const response = await fetch(syncEndpoint.url, {
          method: syncEndpoint.method,
          headers: {
            'Content-Type': 'application/json',
            'X-Offline-Sync': 'true',
            'X-Original-Timestamp': offlineItem.timestamp
          },
          body: JSON.stringify({
            key,
            data: offlineItem.data,
            metadata: {
              offlineTimestamp: offlineItem.timestamp,
              syncAttempt: offlineItem.retryCount + 1,
              checksum: offlineItem.checksum
            }
          })
        });

        if (response.ok) {
          // Sync successful
          offlineItem.syncStatus = 'synced';
          localStorage.setItem(storageKey, JSON.stringify(offlineItem));
          
          console.log(`✅ Synced offline data: ${key}`);
          
          // Remove from queue after successful sync
          setTimeout(() => removeOffline(key), 1000);
        } else {
          throw new Error(`Sync failed with status ${response.status}`);
        }

      } catch (error) {
        console.error(`Failed to sync ${key}:`, error);
        
        // Update retry count
        const storageKey = `${STORAGE_PREFIX}${key}`;
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          const offlineItem: OfflineDataItem = JSON.parse(stored);
          offlineItem.syncStatus = 'failed';
          offlineItem.retryCount++;
          localStorage.setItem(storageKey, JSON.stringify(offlineItem));
          
          // Schedule retry if under limit
          if (offlineItem.retryCount < MAX_RETRY_ATTEMPTS) {
            setTimeout(() => syncPendingData(), SYNC_RETRY_DELAY);
          }
        }
      }
    }

    setIsSyncing(false);
  }, [isSyncing, removeOffline]);

  // Auto-sync when coming online
  useEffect(() => {
    const handleOnline = () => {
      if (syncQueue.length > 0) {
        console.log('📶 Connection restored, syncing offline data...');
        setTimeout(syncPendingData, 1000); // Small delay to ensure connection is stable
      }
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [syncQueue, syncPendingData]);

  // Helper function to determine sync endpoint
  const getSyncEndpoint = (key: string, data: any) => {
    if (key.startsWith('questionnaire_')) {
      return {
        url: '/api/questionnaires/sync',
        method: 'POST'
      };
    } else if (key.startsWith('patient_')) {
      return {
        url: '/api/patients/sync',
        method: 'POST'
      };
    } else {
      return {
        url: '/api/sync/general',
        method: 'POST'
      };
    }
  };

  // Check if there's pending sync data
  const hasPendingSync = useCallback((): boolean => {
    return syncQueue.length > 0;
  }, [syncQueue]);

  // Get count of pending sync items
  const getPendingCount = useCallback((): number => {
    return syncQueue.length;
  }, [syncQueue]);

  // Clear successfully synced data
  const clearSyncedData = useCallback(() => {
    const currentQueue = JSON.parse(localStorage.getItem(SYNC_QUEUE_KEY) || '[]');
    const remainingItems: string[] = [];

    currentQueue.forEach((key: string) => {
      const storageKey = `${STORAGE_PREFIX}${key}`;
      const stored = localStorage.getItem(storageKey);
      
      if (stored) {
        const offlineItem: OfflineDataItem = JSON.parse(stored);
        if (offlineItem.syncStatus === 'synced') {
          localStorage.removeItem(storageKey);
        } else {
          remainingItems.push(key);
        }
      }
    });

    localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(remainingItems));
    setSyncQueue(remainingItems);
  }, []);

  // Get total storage size
  const getStorageSize = useCallback((): number => {
    let totalSize = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(STORAGE_PREFIX)) {
        const value = localStorage.getItem(key);
        totalSize += key.length + (value ? value.length : 0);
      }
    }
    return totalSize;
  }, []);

  return {
    saveOffline,
    loadOffline,
    removeOffline,
    syncPendingData,
    hasPendingSync,
    getPendingCount,
    clearSyncedData,
    getStorageSize
  };
};