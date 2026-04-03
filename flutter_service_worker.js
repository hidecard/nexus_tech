'use strict';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      try {
        await self.registration.unregister();
      } catch (e) {
        console.warn('Failed to unregister the service worker:', e);
      }

      try {
        const clients = await self.clients.matchAll({
          type: 'window',
        });
        // Reload clients to ensure they are not using the old service worker.
        clients.forEach((client) => {
          if (client.url && 'navigate' in client) {
            client.navigate(client.url);
          }
        });
      } catch (e) {
        console.warn('Failed to navigate some service worker clients:', e);
      }
    })()
  );
});

// Handle fetch events for CORS issues
self.addEventListener('fetch', (event) => {
  // Only handle requests to google.com that are failing due to CORS
  if (event.request.url.includes('google.com')) {
    event.respondWith(
      fetch(event.request.url, {
        mode: 'cors',
        credentials: 'omit',
        headers: {
          'Accept': 'application/json, text/plain, */*',
        }
      }).catch(() => {
        // If fetch fails, return a fallback response
        return new Response(
          JSON.stringify({ 
            error: 'CORS blocked - This request needs to be made through a proxy server',
            message: 'Direct requests to Google APIs are blocked by CORS policy'
          }),
          {
            status: 200,
            statusText: 'OK',
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
              'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            }
          }
        );
      })
    );
  }
});
