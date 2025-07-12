// src/services/offlineQueueManager.ts
export class OfflineQueueManager {
  private static instance: OfflineQueueManager;
  private syncInProgress = false;
  private retryTimeouts: Map<string, NodeJS.Timeout> = new Map();

  static getInstance(): OfflineQueueManager {
    if (!OfflineQueueManager.instance) {
      OfflineQueueManager.instance = new OfflineQueueManager();
    }
    return OfflineQueueManager.instance;
  }

  // Enhanced sync with conflict resolution
  async syncWithConflictResolution(key: string, localData: any, serverData: any) {
    // Simple last-write-wins strategy
    const localTimestamp = new Date(localData.metadata?.timestamp || 0);
    const serverTimestamp = new Date(serverData.metadata?.timestamp || 0);
    
    if (localTimestamp > serverTimestamp) {
      // Local data is newer, push to server
      return this.pushToServer(key, localData);
    } else {
      // Server data is newer, update local
      return this.updateLocalData(key, serverData);
    }
  }

  private async pushToServer(key: string, data: any) {
    try {
      const response = await fetch('/api/sync/force-update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, data })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to push to server: ${response.status}`);
      }
      
      return { success: true, action: 'pushed_to_server' };
    } catch (error) {
      console.error('Failed to push to server:', error);
      throw error;
    }
  }

  private async updateLocalData(key: string, data: any) {
    try {
      const storageKey = `surgiscan_offline_${key}`;
      localStorage.setItem(storageKey, JSON.stringify({
        data,
        timestamp: new Date().toISOString(),
        syncStatus: 'synced',
        retryCount: 0,
        checksum: this.generateChecksum(data)
      }));
      
      return { success: true, action: 'updated_local' };
    } catch (error) {
      console.error('Failed to update local data:', error);
      throw error;
    }
  }

  private generateChecksum(data: any): string {
    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }

  // Monitor storage usage
  getStorageQuota(): { used: number; total: number; percentage: number } {
    const used = new Blob(Object.values(localStorage)).size;
    const total = 5 * 1024 * 1024; // Assume 5MB limit
    
    return {
      used,
      total,
      percentage: (used / total) * 100
    };
  }

  // Clean up old data
  cleanupOldData(maxAge: number = 7 * 24 * 60 * 60 * 1000) { // 7 days default
    const cutoffTime = Date.now() - maxAge;
    
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && key.startsWith('surgiscan_offline_')) {
        try {
          const stored = localStorage.getItem(key);
          if (stored) {
            const data = JSON.parse(stored);
            const itemTime = new Date(data.timestamp).getTime();
            
            if (itemTime < cutoffTime && data.syncStatus === 'synced') {
              localStorage.removeItem(key);
              console.log(`🧹 Cleaned up old synced data: ${key}`);
            }
          }
        } catch (error) {
          // Remove corrupted data
          localStorage.removeItem(key);
          console.log(`🧹 Removed corrupted data: ${key}`);
        }
      }
    }
  }
}
