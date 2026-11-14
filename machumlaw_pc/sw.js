// The 맞춤 맞춤법 통신(PC통신판)의 서비스 워커. 인터넷이 없어도 열리게 한다.
// - 페이지는 열 때마다 서버에 새 판이 있는지 묻고(no-cache), 인터넷이 안 될 때만 저장해 둔 판을 쓴다.
// - 이 주소(yangjinhyeok22.github.io)는 다른 앱과 함께 쓴다. 그래서 이름이 matchumpc- 로 시작하는 저장분만 다루고 남의 것은 건드리지 않는다.
var PREFIX = 'matchumpc-', CACHE = PREFIX + '2ae80ce4';
var HOME = new URL('./', self.location).pathname;           // 예: /machumlaw/
var FILES = ['./index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];
function mine(req) { return caches.open(CACHE).then(function (c) { return c.match(req); }); }
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) {
    return Promise.all(FILES.map(function (u) { return c.add(new Request(u, { cache: 'reload' })).catch(function () { /* 하나가 빠져도 나머지는 저장한다 */ }); }));
  }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k.indexOf(PREFIX) === 0 && k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  var u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  if (e.request.mode === 'navigate') {
    if (u.pathname !== HOME && u.pathname !== HOME + 'index.html') return;   // 게임 페이지가 아니면 브라우저에 맡긴다
    e.respondWith(fetch(e.request.url, { cache: 'no-cache' }).then(function (r) {
      if (r.ok) { var cp = r.clone(); caches.open(CACHE).then(function (c) { c.put('./index.html', cp); }); }
      return r;
    }).catch(function () { return mine('./index.html'); }));
    return;
  }
  e.respondWith(mine(e.request).then(function (hit) { return hit || fetch(e.request); }));
});
