// components/OfflineSetup.tsx
import React, { useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';

export function OfflineSetup() {
  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered:', registration);
          
          // Listen for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  toast({
                    title: "App Updated",
                    description: "A new version of the app is available. Refresh to update.",
                    duration: 10000
                  });
                }
              });
            }
          });
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
        });

      // Listen for service worker messages
      navigator.serviceWorker.addEventListener('message', (event) => {
        const { type, action } = event.data;
        
        if (type === 'BACKGROUND_SYNC' && action === 'sync-questionnaires') {
          // Trigger sync through OfflineManager
          const offlineManager = OfflineManager.getInstance();
          offlineManager.attemptSync();
        }
      });
    }

    // Register background sync if supported
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      navigator.serviceWorker.ready.then((registration) => {
        return registration.sync.register('questionnaire-sync');
      }).catch((error) => {
        console.error('Background sync registration failed:', error);
      });
    }
  }, []);

  return null; // This component doesn't render anything
}