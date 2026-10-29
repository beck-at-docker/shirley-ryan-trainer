/* 105 Flights — offline shell.
   Bump CACHE (and BUILD in index.html) on every deploy; the old cache is
   dropped on activate. GitHub Pages sends max-age=600, so every fetch in here
   goes around the HTTP cache — otherwise a deploy can sit behind a stale copy
   for ten minutes. */
var CACHE = "flights105-v25";
var ASSETS = ["./", "index.html", "manifest.webmanifest",
              "icon-192.png", "icon-512.png", "apple-touch-icon.png"];

self.addEventListener("install", function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){
    return Promise.all(ASSETS.map(function(a){
      return fetch(new Request(a, {cache:"reload"})).then(function(res){
        if(!res.ok) throw new Error(a + " " + res.status);
        return c.put(a, res);
      });
    }));
  }).then(function(){ return self.skipWaiting(); }));
});

self.addEventListener("activate", function(e){
  e.waitUntil(caches.keys().then(function(keys){
    return Promise.all(keys.filter(function(k){ return k !== CACHE; })
                           .map(function(k){ return caches.delete(k); }));
  }).then(function(){ return self.clients.claim(); }));
});

/* Same-origin: serve from cache, refresh in the background.
   Cross-origin (the font CSS) is left to the network — the page declares
   real fallback stacks, so it reads fine offline. */
self.addEventListener("fetch", function(e){
  var req = e.request;
  if(req.method !== "GET") return;
  if(new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(
    caches.match(req).then(function(hit){
      var net = fetch(req.url, {cache:"no-cache"}).then(function(res){
        if(res && res.status === 200){
          var copy = res.clone();
          caches.open(CACHE).then(function(c){ c.put(req, copy); });
        }
        return res;
      }).catch(function(){ return hit; });
      return hit || net;
    })
  );
});
