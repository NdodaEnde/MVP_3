const CACHE_NAME = 'surgiscan-questionnaire-v1';
const OFFLINE_PAGES = [
  '/',
  '/questionnaires',
  '/offline.html'
];

const CACHE_ASSETS = [
  // Essential app files that should be cached for offline use
  '/manifest.json',
  '/favicon.ico',
  
  // Your app's main CSS and JS bundles (Vite builds these)
  // Note: In production, Vite creates hashed filenames
  // You can either:
  // 1. Add them dynamically in the install event, or
  // 2. Update this list after each build
  
  // Static assets that don't change often
  '/logo.png',
  '/icon-192.png',
  '/icon-512.png',
  
  // You might want to add:
  // - Main CSS bundle (if you want offline styling)
  // - Main JS bundle (if you want full offline functionality)
  // - Critical fonts
  // - Essential images/icons
  
  // Example of what you might add in the future:
  // '/assets/index-[hash].css',     // Your main CSS bundle
  // '/assets/index-[hash].js',      // Your main JS bundle
  // '/fonts/inter-variable.woff2',  // Critical fonts
];

// Install event - cache essential resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Caching offline pages and assets');
        return cache.addAll([...OFFLINE_PAGES, ...CACHE_ASSETS]);
      })
      .then(() => {
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              return cacheName.startsWith('surgiscan-') && cacheName !== CACHE_NAME;
            })
            .map((cacheName) => {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        return self.clients.claim();
      })
  );
});

// Fetch event - implement offline strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // Handle page requests
  if (request.mode === 'navigate') {
    event.respondWith(handleNavigationRequest(request));
    return;
  }

  // Handle asset requests
  event.respondWith(handleAssetRequest(request));
});

// Handle API requests with offline fallback
async function handleApiRequest(request) {
  try {
    // Try network first for API requests
    const response = await fetch(request);
    
    // Cache successful questionnaire responses
    if (response.ok && request.url.includes('/questionnaires/')) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    // Return cached version if available
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    
    // Return offline response
    return new Response(
      JSON.stringify({ 
        error: 'Offline - data will be synced when connection is restored',
        offline: true 
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Handle navigation requests
async function handleNavigationRequest(request) {
  try {
    // Try network first
    const response = await fetch(request);
    return response;
  } catch (error) {
    // Return cached page or offline fallback
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    
    // Return offline page
    return caches.match('/offline.html');
  }
}

// Handle asset requests
async function handleAssetRequest(request) {
  try {
    // Try cache first for assets
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    
    // Try network and cache response
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    // Return cached version if available
    return caches.match(request);
  }
}

// Background sync for questionnaire data
self.addEventListener('sync', (event) => {
  if (event.tag === 'questionnaire-sync') {
    event.waitUntil(syncQuestionnaireData());
  }
});

async function syncQuestionnaireData() {
  try {
    // This would trigger the sync process
    // The actual sync logic is handled by the OfflineManager
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'BACKGROUND_SYNC',
        action: 'sync-questionnaires'
      });
    });
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}