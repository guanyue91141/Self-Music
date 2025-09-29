/**
 * Self-Music Service Worker
 * No-cache version - bypass all caching
 */

// Install event - no caching
self.addEventListener('install', event => {
  console.log('Service Worker installing...');
  
  event.waitUntil(
    self.skipWaiting() // Skip waiting to activate immediately
  );
});

// Activate event - no cache management
self.addEventListener('activate', event => {
  console.log('Service Worker activating...');
  
  event.waitUntil(
    self.clients.claim() // Take control of all clients
  ).then(() => {
    console.log(`SW加载完成，版本号：no-cache`);
  });
});

// Fetch event - bypass all caching, always go to network
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests, but still forward them to network
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension requests
  if (url.protocol === 'chrome-extension:') {
    return;
  }

  event.respondWith(
    fetch(request).catch(error => {
      console.error('Network request failed:', error, request.url);
      
      // For navigation requests, return a basic offline response
      if (request.mode === 'navigate') {
        return new Response('<!DOCTYPE html><html><head><title>Offline</title></head><body><h1>You are offline</h1><p>Please check your internet connection.</p></body></html>', {
          status: 200,
          headers: { 'Content-Type': 'text/html' }
        });
      }
      
      // For other requests, return a generic error response
      return new Response('Service Unavailable', { 
        status: 503, 
        statusText: 'Service Unavailable' 
      });
    })
  );
});

// Message event - handle commands without cache operations
self.addEventListener('message', event => {
  const { data } = event;
  
  if (data.type === 'GET_VERSION') {
    event.ports[0].postMessage({
      type: 'VERSION_RESPONSE',
      version: 'no-cache'
    });
  }

  if (data.type === 'GET_CACHE_STATUS') {
    // Return empty cache status since caching is disabled
    event.ports[0].postMessage({
      type: 'CACHE_STATUS',
      static: 0,
      audio: 0,
      images: 0,
      api: 0
    });
  }
});

// Background sync for failed requests
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    console.log('Background sync triggered');
  }
});

console.log('Self-Music No-Cache Service Worker loaded');