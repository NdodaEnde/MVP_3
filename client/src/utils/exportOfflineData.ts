// utils/exportOfflineData.ts
export class OfflineDataExporter {
  static async exportAllOfflineData(): Promise<Blob> {
    const offlineData: any = {
      exportDate: new Date().toISOString(),
      questionnaires: [],
      syncQueue: []
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

    // Export sync queue
    try {
      const syncQueue = localStorage.getItem('sync_queue');
      if (syncQueue) {
        offlineData.syncQueue = JSON.parse(syncQueue);
      }
    } catch (error) {
      console.error('Failed to export sync queue:', error);
    }

    const jsonString = JSON.stringify(offlineData, null, 2);
    return new Blob([jsonString], { type: 'application/json' });
  }

  static downloadOfflineData() {
    this.exportAllOfflineData().then(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `surgiscan-offline-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  }

  static async importOfflineData(file: File): Promise<{ success: boolean; message: string }> {
    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (!data.questionnaires || !Array.isArray(data.questionnaires)) {
        throw new Error('Invalid backup file format');
      }

      let importedCount = 0;

      // Import questionnaires
      for (const questionnaire of data.questionnaires) {
        const key = `offline_questionnaire_${questionnaire.key}`;
        const { key: _, ...questionnaireData } = questionnaire;
        localStorage.setItem(key, JSON.stringify(questionnaireData));
        importedCount++;
      }

      // Import sync queue if it exists
      if (data.syncQueue && Array.isArray(data.syncQueue)) {
        const existingQueue = JSON.parse(localStorage.getItem('sync_queue') || '[]');
        const mergedQueue = [...existingQueue, ...data.syncQueue];
        
        // Remove duplicates based on ID
        const uniqueQueue = mergedQueue.filter((item, index, self) => 
          index === self.findIndex(t => t.id === item.id)
        );
        
        localStorage.setItem('sync_queue', JSON.stringify(uniqueQueue));
      }

      return {
        success: true,
        message: `Successfully imported ${importedCount} questionnaire${importedCount !== 1 ? 's' : ''}`
      };
    } catch (error) {
      return {
        success: false,
        message: `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
}