// utils/offlineManager.ts
export class OfflineManager {
  private static instance: OfflineManager;
  private syncInProgress = false;
  private eventListeners: { [key: string]: Function[] } = {};

  private constructor() {
    this.setupEventListeners();
  }

  static getInstance(): OfflineManager {
    if (!OfflineManager.instance) {
      OfflineManager.instance = new OfflineManager();
    }
    return OfflineManager.instance;
  }

  private setupEventListeners() {
    window.addEventListener('online', () => {
      this.emit('network-status-changed', { isOnline: true });
      this.attemptSync();
    });

    window.addEventListener('offline', () => {
      this.emit('network-status-changed', { isOnline: false });
    });

    // Listen for storage events to sync across tabs
    window.addEventListener('storage', (e) => {
      if (e.key?.startsWith('offline_questionnaire_') || e.key === 'sync_queue') {
        this.emit('storage-changed', { key: e.key, newValue: e.newValue });
      }
    });

    // Page visibility change - sync when page becomes visible
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && navigator.onLine) {
        this.attemptSync();
      }
    });
  }

  // Event emitter methods
  on(event: string, callback: Function) {
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = [];
    }
    this.eventListeners[event].push(callback);
  }

  off(event: string, callback: Function) {
    if (this.eventListeners[event]) {
      this.eventListeners[event] = this.eventListeners[event].filter(cb => cb !== callback);
    }
  }

  private emit(event: string, data: any) {
    if (this.eventListeners[event]) {
      this.eventListeners[event].forEach(callback => callback(data));
    }
  }

  // Sync management
  async attemptSync(): Promise<boolean> {
    if (this.syncInProgress || !navigator.onLine) {
      return false;
    }

    this.syncInProgress = true;
    this.emit('sync-started', {});

    try {
      const syncQueue = this.getSyncQueue();
      let successCount = 0;
      let failCount = 0;

      for (const item of syncQueue) {
        try {
          await this.syncItem(item);
          successCount++;
          this.removeFromSyncQueue(item.id);
          localStorage.removeItem(`offline_questionnaire_${item.id}`);
        } catch (error) {
          failCount++;
          this.updateSyncItemError(item.id, error);
        }
      }

      this.emit('sync-completed', { successCount, failCount });
      return failCount === 0;
    } catch (error) {
      this.emit('sync-error', { error });
      return false;
    } finally {
      this.syncInProgress = false;
    }
  }

  private async syncItem(item: any): Promise<void> {
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
  }

  private getSyncQueue(): any[] {
    try {
      const queue = localStorage.getItem('sync_queue');
      return queue ? JSON.parse(queue) : [];
    } catch {
      return [];
    }
  }

  private removeFromSyncQueue(id: string) {
    const queue = this.getSyncQueue();
    const updatedQueue = queue.filter(item => item.id !== id);
    localStorage.setItem('sync_queue', JSON.stringify(updatedQueue));
  }

  private updateSyncItemError(id: string, error: any) {
    const queue = this.getSyncQueue();
    const itemIndex = queue.findIndex(item => item.id === id);
    
    if (itemIndex >= 0) {
      queue[itemIndex].attempts = (queue[itemIndex].attempts || 0) + 1;
      queue[itemIndex].lastError = error.message || 'Unknown error';
      queue[itemIndex].lastAttempt = new Date().toISOString();
      localStorage.setItem('sync_queue', JSON.stringify(queue));
    }
  }

  // Storage management
  async cleanupOldData(maxAge: number = 7 * 24 * 60 * 60 * 1000): Promise<number> {
    const cutoffDate = new Date(Date.now() - maxAge);
    let cleanedCount = 0;

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('offline_questionnaire_')) {
        try {
          const item = localStorage.getItem(key);
          if (item) {
            const data = JSON.parse(item);
            if (new Date(data.timestamp) < cutoffDate) {
              localStorage.removeItem(key);
              cleanedCount++;
            }
          }
        } catch {
          // Remove corrupted data
          localStorage.removeItem(key);
          cleanedCount++;
        }
      }
    }

    return cleanedCount;
  }

  getStorageStats() {
    let totalSize = 0;
    let itemCount = 0;
    const syncQueue = this.getSyncQueue();

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
      syncInProgress: this.syncInProgress,
      storageQuota: 5 * 1024 * 1024 // 5MB localStorage limit
    };
  }
}