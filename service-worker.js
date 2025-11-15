// service-worker.js
const AUDIO_CACHE_PREFIX = "music-cache-";
const MAX_AUDIO_CACHE_ITEMS = 50; // LRU/FIFO 控制音频缓存
let AUDIO_CACHE_NAME = AUDIO_CACHE_PREFIX + "temp";

const STATIC_CACHE_NAME = "static-cache-v1";
const AUDIO_YML = "/data/music.yml";

// 簡單 hash 函數 (djb2)
function hashString(str) {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  return (hash >>> 0).toString(36);
}

// ------------------ 安裝 SW ------------------
self.addEventListener("install", (event) => {
  event.waitUntil(
    fetch(AUDIO_YML)
      .then((res) => res.text())
      .then((text) => {
        const urls = [...text.matchAll(/url:\s*"([^"]+)"/g)].map((m) => m[1]);
        AUDIO_CACHE_NAME = AUDIO_CACHE_PREFIX + hashString(urls.join("|"));
        return caches.open(AUDIO_CACHE_NAME).then((cache) => cache.addAll(urls));
      })
      .catch(() => {
        // music.yml 获取失败，创建空缓存
        return caches.open(AUDIO_CACHE_NAME);
      })
  );

  // 預緩存靜態資源 (CSS/JS/圖片/首頁HTML)
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then((cache) => {
      return cache.addAll([
        "/index.html",
        "/about/index.html",
        "/assets/css/style.css",
        "/assets/js/main.js",
        "/assets/images/blog-header.jpg",
      ]);
    })
  );

  self.skipWaiting();
});

// ------------------ 激活 SW ------------------
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter(
            (key) => key !== AUDIO_CACHE_NAME && key !== STATIC_CACHE_NAME
          )
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// ------------------ 攔截 fetch ------------------
self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // 音頻文件 Cache-First
  if (req.destination === "audio") {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached;

        return fetch(req).then((res) => {
          if (res && res.status === 200) {
            const resClone = res.clone();
            caches.open(AUDIO_CACHE_NAME).then((cache) => {
              cache.put(req, resClone).then(async () => {
                // LRU 控制
                const keys = await cache.keys();
                if (keys.length > MAX_AUDIO_CACHE_ITEMS) {
                  cache.delete(keys[0]);
                }
              });
            });
          }
          return res;
        }).catch(() => caches.match(req));
      })
    );
    return;
  }

  // HTML Stale-While-Revalidate
  if (req.destination === "document") {
    event.respondWith(
      caches.match(req).then((cached) => {
        const networkFetch = fetch(req)
          .then((res) => {
            if (res && res.status === 200) {
              caches.open(STATIC_CACHE_NAME).then((cache) => cache.put(req, res.clone()));
            }
            return res;
          })
          .catch(() => cached); // 网络失败时回退到缓存
        return cached || networkFetch;
      })
    );
    return;
  }

  // CSS/JS/图片长期缓存
  if (["style", "script", "image"].includes(req.destination)) {
    event.respondWith(
      caches.match(req).then((cached) => {
        return cached || fetch(req).then((res) => {
          if (res && res.status === 200) {
            caches.open(STATIC_CACHE_NAME).then((cache) => cache.put(req, res.clone()));
          }
          return res;
        }).catch(() => cached);
      })
    );
    return;
  }
});
