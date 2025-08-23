// service-worker.js — SilentStacks v2.0.0
const CACHE_NAME = 'silentstacks-v2.0.0';
const urlsToCache = ['/', '/SilentStacks_v2_monolith.html'];
self.addEventListener('install', e => e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(urlsToCache))));
self.addEventListener('fetch', e => e.respondWith(caches.match(e.request).then(r => r || fetch(e.request))));
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(n => n !== CACHE_NAME).map(n => caches.delete(n))))));
