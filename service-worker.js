// service-worker.js
// 改進版：動態緩存 music.yml 中的所有音樂文件，支持跨域

// 簡單 hash 函數 (djb2)
function hashString(str) {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  return (hash >>> 0).toString(36); // base36 字串
}

const MUSIC_YML = "/data/music.yml";
let CACHE_NAME = "music-cache-temp"; // 安裝時自動更新

// 安裝 SW
self.addEventListener("install", (event) => {
  event.waitUntil(
    fetch(MUSIC_YML)
      .then((res) => res.text())
      .then((text) => {
        // 提取所有音樂 URL
        const urls = [...text.matchAll(/url:\s*"([^"]+)"/g)].map((m) => m[1]);
        // hash 生成版本號
        CACHE_NAME = `music-cache-${hashString(urls.join("|"))}`;
        // 緩存所有音樂
        return caches.open(CACHE_NAME).then((cache) => cache.addAll(urls));
      })
      .catch((err) => {
        console.error("SW 安裝時抓取 music.yml 失敗:", err);
        CACHE_NAME = "music-cache-empty";
        return caches.open(CACHE_NAME);
      })
  );
  self.skipWaiting();
});

// 激活 SW，刪除舊緩存
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

// 攔截 fetch 請求，自動緩存音樂
self.addEventListener("fetch", (event) => {
  const request = event.request;

  // 只處理音頻文件 (audio)
  if (request.destination === "audio") {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;

        return fetch(request)
          .then((response) => {
            // 檢查有效響應
            if (!response || !response.ok) return response;

            // 緩存跨域音頻 (type: "cors" 也可以)
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseToCache));

            return response;
          })
          .catch(() => {
            // 如果網絡失敗，返回緩存或空
            return caches.match(request);
          });
      })
    );
  }
});
