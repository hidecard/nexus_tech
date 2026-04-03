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
  const requestUrl = event.request.url;
  
  // Intercept all Google.com requests and redirect through proxy
  if (requestUrl.includes('https://www.google.com')) {
    const proxyUrl = requestUrl.replace('https://www.google.com', '/api/google');
    
    event.respondWith(
      fetch(proxyUrl, {
        method: event.request.method,
        headers: event.request.headers,
        body: event.request.body,
        mode: 'cors',
        credentials: 'omit'
      }).catch(() => {
        // If proxy fails, try direct fetch with CORS headers
        return fetch(event.request, {
          mode: 'cors',
          credentials: 'omit',
          headers: {
            'Accept': 'application/json, text/plain, */*',
          }
        }).catch(() => {
          // Final fallback response
          return new Response(
            JSON.stringify({ 
              error: 'CORS blocked - Request failed through proxy and direct access',
              message: 'Google API request could not be completed'
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
        });
      })
    );
  }
  
  // Also handle Google APIs
  if (requestUrl.includes('https://www.googleapis.com')) {
    const proxyUrl = requestUrl.replace('https://www.googleapis.com', '/api/googleapis');
    
    event.respondWith(
      fetch(proxyUrl, {
        method: event.request.method,
        headers: event.request.headers,
        body: event.request.body,
        mode: 'cors',
        credentials: 'omit'
      }).catch(() => {
        return new Response(
          JSON.stringify({ 
            error: 'Google APIs proxy failed',
            message: 'Could not complete Google APIs request'
          }),
          {
            status: 200,
            statusText: 'OK',
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            }
          }
        );
      })
    );
  }
});
