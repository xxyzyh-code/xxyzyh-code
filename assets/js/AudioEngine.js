// AudioEngine.js
// 核心音頻播放引擎：專職負責 CDN 備援、錯誤處理和防範競態條件（Race Condition）

let currentErrorHandler = null; // 追蹤當前活躍的錯誤處理器
import { getState, setState } from './StateAndUtils.js';
import { DOM_ELEMENTS, STORAGE_KEYS } from './Config.js';

// --- 失敗 URL 追蹤邏輯 (問題 4 修正) ---

// 從 LocalStorage 載入上次失敗的來源 URL 列表
// 🚨 注意：這裡使用了您在 Config.js 中新增的 FAILED_URLS Key
const failedUrls = JSON.parse(localStorage.getItem(STORAGE_KEYS.FAILED_URLS) || '{}');
const MAX_FAILED_URLS_DURATION_MS = 1000 * 60 * 60 * 24; // 失敗的 URL 在 24 小時內會被跳過

/**
 * 記錄失敗 URL 並更新 LocalStorage。
 * @param {string} url - 失敗的 URL
 */
function recordFailedUrl(url) {
    failedUrls[url] = Date.now(); 
    try {
        localStorage.setItem(STORAGE_KEYS.FAILED_URLS, JSON.stringify(failedUrls)); 
    } catch(e) {
        console.warn('無法記錄失敗 URL:', e);
    }
}

// --- UI 提示輔助函數 (問題 5 修正) ---

/**
 * 由於沒有 UiUtils.js，我們在這裡定義一個極簡的提示函數來取代 showToast。
 * @param {string} message - 要顯示的訊息
 */
function showSimpleAlert(message) {
    // 🌟 核心邏輯：在 playerTitle 暫時顯示提示
    console.warn(`[CDN Fallback 提示]: ${message}`);
    
    const statusDiv = DOM_ELEMENTS.playerTitle;
    const originalText = statusDiv.textContent;

    // 暫時顯示提示
    if (statusDiv) {
        statusDiv.textContent = message;
        
        // 3 秒後恢復原標題
        setTimeout(() => {
            // 只有當標題沒有被其他操作（例如用戶切歌）覆蓋時才恢復
            if (statusDiv.textContent === message) {
                statusDiv.textContent = originalText;
            }
        }, 3000); 
    }
}

// --- 核心播放邏輯 ---

/**
 * 核心備援邏輯：依序嘗試 track.sources 中的所有 URL，並避開已知的失敗來源。
 * @param {object} track - 歌曲物件
 * @returns {string} - 返回本次播放的 Session Token (防止 race condition)
 */
export function playAudioWithFallback(track) {
    const audio = DOM_ELEMENTS.audio;
    const sources = track.sources;
    
    // 🌟 1. 關鍵修正：如果存在舊的處理器，先強制移除它
    if (currentErrorHandler) {
        audio.removeEventListener('error', currentErrorHandler);
    }
    
    // 🌟 1. 創建並設置新的 Session Token
    const sessionToken = Date.now().toString(36) + Math.random().toString(36).substring(2);
    setState({ currentPlaybackSession: sessionToken });
    
    let sourceIndex = 0;
    
    // 🌟 2. 定義具名的錯誤處理器 (必須具名，以便移除舊的)
    const handleError = (e) => {
        
        // 核心檢查：Token 不匹配，立即中止，並移除自己
        if (getState().currentPlaybackSession !== sessionToken) {
            console.warn(`[CDN Fallback]: 舊的錯誤事件觸發，Session Token 不匹配，終止後援。`);
            // 不再需要移除自己，因為我們會在 tryNextSource 或外部移除
            return; 
        }
        
        // 核心檢查：如果錯誤是正常中止 (如切換 SRC 導致)，則忽略
        if (e.target.error?.code === audio.error.MEDIA_ERR_ABORTED) {
            console.log(`[CDN Fallback]: 載入中止 (MEDIA_ERR_ABORTED)，切換到下一個來源...`);
        } else {
            // 真正失敗，記錄並嘗試下一個
            const failedUrl = sources[sourceIndex];
            recordFailedUrl(failedUrl); 
            console.warn(`❌ 來源 URL 失敗: ${failedUrl}。錯誤代碼: ${e.target.error?.code || 'Unknown'}`);
        }
        
        // 無論如何，當前這個 handleError 任務已完成，但我們讓 tryNextSource 處理移除
        audio.removeEventListener('error', handleError); // 移除自己 (保險)
        currentErrorHandler = null; // 清空追蹤變量
        
        sourceIndex++;
        tryNextSource(); // 嘗試下一個
    };
    
    // 🌟 3. 追蹤當前的處理器
    currentErrorHandler = handleError;
    
    const tryNextSource = () => {
        
        // 🚨 移除上一個監聽器：不再需要，因為我們只在外面移除舊的。
        // audio.removeEventListener('error', handleError); // 移除這行
        
        // 檢查 Token，防止競態條件
        if (getState().currentPlaybackSession !== sessionToken) {
            console.log(`[CDN Fallback]: Session Token 不匹配，終止備援。`);
            if (currentErrorHandler === handleError) {
                audio.removeEventListener('error', handleError);
                currentErrorHandler = null;
            }
            return;
        }

        if (sourceIndex >= sources.length) {
            console.error(`🚨 所有音頻來源都已嘗試失敗: ${track.title}`);
            DOM_ELEMENTS.playerTitle.textContent = `🚨 播放失敗：所有備援來源都無效。`;
            audio.src = ''; 
            audio.load();
            
            if (currentErrorHandler === handleError) {
                audio.removeEventListener('error', handleError);
                currentErrorHandler = null;
            }
            return;
        }

        const url = sources[sourceIndex];
        
        // 檢查是否是已知失敗的 URL (保持不變)
        if (failedUrls[url] && Date.now() - failedUrls[url] < MAX_FAILED_URLS_DURATION_MS) { 
            console.warn(`⏭ 跳過已知失敗來源: ${url}`);
            sourceIndex++;
            tryNextSource(); 
            return;
        }

        showSimpleAlert(`嘗試備援 (CDN ${sourceIndex + 1}/${sources.length}) 載入 ${track.title}。`);
        DOM_ELEMENTS.playerTitle.textContent = `載入中：${track.title} (備援 ${sourceIndex + 1}/${sources.length})`;

        // 設置新的具名錯誤監聽器
        // 核心修正：只有在第一次嘗試時添加監聽器，後續嘗試在 handleError 中處理移除和添加
        if (sourceIndex === 0) {
            audio.addEventListener('error', handleError); 
        }
        
        audio.src = url;
        audio.load(); 

        audio.play().catch(error => {
            if (error.name === "NotAllowedError" || error.name === "AbortError") {
                console.warn("瀏覽器阻止自動播放或請求被中止。");
                DOM_ELEMENTS.playerTitle.textContent = `需點擊播放：${track.title}`;
                
                // 立即移除監聽器，避免它在用戶點擊播放時再次觸發不必要的備援
                audio.removeEventListener('error', handleError);
                currentErrorHandler = null;
                
            } else {
                console.error("嘗試播放時發生非網絡錯誤，視為失敗，立即嘗試備援:", error);
                
                // 非預期錯誤，移除監聽器，並立即觸發備援流程
                audio.removeEventListener('error', handleError); 
                currentErrorHandler = null;
                sourceIndex++;
                tryNextSource();
            }
        });
    };

    // 清理舊的 audio.src 和 listeners (確保 PlayTrack 啟動時是乾淨的)
    audio.innerHTML = ''; 
    audio.src = '';
    
    tryNextSource();
    
    return sessionToken; 
}
