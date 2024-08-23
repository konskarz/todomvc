importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.4.1/workbox-sw.js')
const strategy = new workbox.strategies.StaleWhileRevalidate({ cacheName: 'todomvc' })
workbox.routing.registerRoute(({ request }) => request.mode === 'navigate', strategy)
workbox.routing.registerRoute(/^https:\/\/cdn\.jsdelivr\.net\/.*/, strategy)
