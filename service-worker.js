// service-worker.js - 最終生產版

// ---------------------------
// 簡單 hash 函數 (djb2)
// ---------------------------
function hashString(str) {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  return (hash >>> 0).toString(36); // 轉成 base36 字串
}

// ---------------------------
// 配置
// ---------------------------
const MUSIC_YML = "/data/music.yml";
let CACHE_NAME = "music-cache-temp"; // 會在安裝時自動改成 hash 版本
const MAX_CACHE_ITEMS = 30; // LRU 限制：最多緩存 30 首音樂

// ---------------------------
// 安裝 Service Worker
// ---------------------------
self.addEventListener("install", (event) => {
  event.waitUntil(
    fetch(MUSIC_YML)
      .then((res) => res.text())
      .then((text) => {
        const urls = [...text.matchAll(/url:\s*"([^"]+)"/g)].map((m) => m[1]);
        // 生成版本號（只依賴 URL 列表）
        const versionHash = hashString(urls.join("|"));
        CACHE_NAME = `music-cache-${versionHash}`;
        return caches.open(CACHE_NAME).then((cache) => cache.addAll(urls));
      })
      .catch((err) => {
        console.error("SW 安裝時抓取音樂列表失敗:", err);
        CACHE_NAME = "music-cache-empty"; // 保底
        return caches.open(CACHE_NAME);
      })
  );
  self.skipWaiting();
});

// ---------------------------
// 激活 Service Worker
// ---------------------------
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// ---------------------------
// 攔截 fetch 請求
// ---------------------------
self.addEventListener("fetch", (event) => {
  const request = event.request;

  // 只攔截音頻請求
  if (request.destination === "audio") {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;

        return fetch(request)
          .then((response) => {
            if (!response || response.status !== 200) return response;

            // 緩存新音樂，並控制 LRU
            caches.open(CACHE_NAME).then(async (cache) => {
              const keys = await cache.keys();
              if (keys.length >= MAX_CACHE_ITEMS) {
                // 刪除最舊的一個 (FIFO 近似 LRU)
                cache.delete(keys[0]);
              }
              cache.put(request, response.clone());
            });

            return response;
          })
          .catch(() => caches.match(request)); // 網絡失敗回退到緩存
      })
    );
  }
});
