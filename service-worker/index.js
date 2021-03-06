import { PROJECT_REVISION, VERSION, addFetchListener } from 'ember-service-worker/service-worker';

const CACHE_KEY_PREFIX = 'asset-cache-';
const CACHE_NAME = `${CACHE_KEY_PREFIX}${PROJECT_REVISION}-${VERSION}`;

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        cache.add(self.registration.scope);
        return fetch('files.json').then(function(response) {
          return response.json();
        }).then(function(json) {
          var files = json.files.map(function(file) {
            return json.prepend ? json.prepend + file : file;
          }).map(function(path) {
            return new Request(path, { mode: 'no-cors' });
          });

          return cache.addAll(files);
        }).catch(function() {
        });
      })
  );
});

addFetchListener(function(event) {
  return caches
    .match(event.request, { cacheName: CACHE_NAME })
    .then(function(response) {
      if (response) {
        return response;
      } else if (event.request.headers.get('accept').indexOf('text/html') >= 0) {
        return caches.match(self.registration.scope);
      }
    });
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      cacheNames.forEach(function(cacheName) {
        if (cacheName.indexOf(CACHE_KEY_PREFIX) === 0 && cacheName !== CACHE_NAME) {
          caches.delete(cacheName);
        }
      });
    })
  );
});
