// AudioEngine.js
// 核心音頻播放引擎：專職負責 CDN 備援、錯誤處理和防範競態條件（Race Condition）

let globalErrorHandler = null; // 追蹤全局活躍的錯誤處理器
import { getState, setState } from './StateAndUtils.js';
import { DOM_ELEMENTS, STORAGE_KEYS } from './Config.js';

// --- 失敗 URL 追蹤邏輯 ---

const failedUrls = JSON.parse(localStorage.getItem(STORAGE_KEYS.FAILED_URLS) || '{}');
const MAX_FAILED_URLS_DURATION_MS = 1000 * 60 * 60 * 1; // 失敗的 URL 在 1 小時內會被跳過

function recordFailedUrl(url) {
    failedUrls[url] = Date.now(); 
    // 清理過期記錄
    for (const key in failedUrls) {
        if (Date.now() - failedUrls[key] > MAX_FAILED_URLS_DURATION_MS) {
            delete failedUrls[key];
        }
    }
    try {
        localStorage.setItem(STORAGE_KEYS.FAILED_URLS, JSON.stringify(failedUrls)); 
    } catch(e) {
        console.warn('無法記錄失敗 URL:', e);
    }
}

// --- UI 提示輔助函數 ---

function showSimpleAlert(message) {
    console.warn(`[CDN Fallback 提示]: ${message}`);
    
    const statusDiv = DOM_ELEMENTS.playerTitle;
    const currentSessionToken = getState().currentPlaybackSession;

    if (statusDiv) {
        // 3 秒後恢復原標題
        setTimeout(() => {
            // 只有當當前 Session Token 仍匹配時才嘗試恢復
            if (getState().currentPlaybackSession === currentSessionToken) {
                 // 保持 "載入中..." 狀態直到 handlePlaying 確認播放成功
                 const currentText = statusDiv.textContent;
                 if (currentText === message) {
                     statusDiv.textContent = `載入中...`; 
                 }
            }
        }, 3000); 
    }
}

// --- 核心播放邏輯 ---

/**
 * 核心備援邏輯：依序嘗試 track.sources 中的所有 URL。
 * @param {object} track - 歌曲物件
 * @returns {string} - 返回本次播放的 Session Token (防止 race condition)
 */
export function playAudioWithFallback(track) {
    const audio = DOM_ELEMENTS.audio;
    const sources = track.sources;
    
    // 1. 生成新的 Session Token
    const sessionToken = Date.now().toString(36) + Math.random().toString(36).substring(2);
    setState({ currentPlaybackSession: sessionToken });
    
    let sourceIndex = 0;
    
    // 2. 移除所有舊的全局錯誤處理器，並安裝新的
    if (globalErrorHandler) {
        audio.removeEventListener('error', globalErrorHandler);
        globalErrorHandler = null;
    }

    /**
     * 穩定版錯誤處理器：專門處理音頻加載或播放失敗，並遞歸推進備援。
     * 由於它是一個全局監聽器，它需要根據 Token 判斷是否應該處理。
     * @param {Event} e - 錯誤事件
     */
    const stableErrorHandler = (e) => {
        
        // 核心檢查 1：Token 不匹配，這不是我們本次 playTrack 產生的錯誤，忽略。
        if (getState().currentPlaybackSession !== sessionToken) {
            console.warn(`[CDN Fallback]: 舊的錯誤事件觸發，Token 不匹配，終止後援。`);
            return; 
        }

        // 核心檢查 2：正常中止 (切換 SRC 導致)，忽略。
        if (e.target.error?.code === audio.error.MEDIA_ERR_ABORTED) {
            console.log(`[CDN Fallback]: 載入中止 (MEDIA_ERR_ABORTED)，忽略。`);
            return; 
        }
        
        // 🚨 這是真正的失敗！
        const failedUrl = sources[sourceIndex];
        recordFailedUrl(failedUrl); 
        console.warn(`❌ 來源 URL 失敗: ${failedUrl}。錯誤代碼: ${e.target.error?.code || 'Unknown'}`);
    
        // 進入下一個來源
        sourceIndex++; 
        tryNextSource(); 
    };
    
    globalErrorHandler = stableErrorHandler;
    audio.addEventListener('error', globalErrorHandler); 
    
    
    const tryNextSource = () => {
        
        // 檢查 Token，防止競態條件
        if (getState().currentPlaybackSession !== sessionToken) {
            console.log(`[CDN Fallback]: Session Token 不匹配，終止備援。`);
            return;
        }

        if (sourceIndex >= sources.length) {
            console.error(`🚨 所有音頻來源都已嘗試失敗: ${track.title}`);
            DOM_ELEMENTS.playerTitle.textContent = `🚨 播放失敗：音源格式不受支持或所有備援失敗。`;
            
            // 備援失敗，移除監聽器
            if (globalErrorHandler === stableErrorHandler) {
                 audio.removeEventListener('error', globalErrorHandler);
                 globalErrorHandler = null;
            }
            return;
        }

        const url = sources[sourceIndex];
        
        // 檢查是否是已知失敗的 URL
        if (failedUrls[url] && Date.now() - failedUrls[url] < MAX_FAILED_URLS_DURATION_MS) { 
            console.warn(`⏭ 跳過已知失敗來源: ${url}`);
            sourceIndex++;
            tryNextSource(); 
            return;
        }

        showSimpleAlert(`嘗試備援 (CDN ${sourceIndex + 1}/${sources.length}) 載入 ${track.title}。`);
        DOM_ELEMENTS.playerTitle.textContent = `載入中：${track.title} (備援 ${sourceIndex + 1}/${sources.length})`;

        audio.src = url;
        audio.load(); // 觸發 loadedmetadata 或 error 事件

        audio.play().catch(error => {
            
            // 處理瀏覽器阻止自動播放的情況
            if (error.name === "NotAllowedError" || error.name === "AbortError") {
                console.warn("瀏覽器阻止自動播放或請求被中止。等待用戶手勢。");
                DOM_ELEMENTS.playerTitle.textContent = `需點擊播放：${track.title}`;
                
                // 由於播放失敗，但載入成功，我們移除 error 監聽器，防止用戶手動播放後，
                // 網絡延遲導致的 error 意外觸發備援。
                if (globalErrorHandler === stableErrorHandler) {
                    audio.removeEventListener('error', globalErrorHandler);
                    globalErrorHandler = null;
                }
                
            } else {
                console.error("嘗試播放時發生非網絡/非自動播放錯誤，視為失敗:", error);
                
                // 這裡不需遞增 sourceIndex 或遞歸調用 tryNextSource，
                // 因為這個錯誤會觸發 audio 上的 'error' 事件，
                // 穩定版的 stableErrorHandler 會接管處理並遞歸。
            }
        });
    };

    // 清理舊的 audio.src (防止重複加載)
    audio.innerHTML = ''; 
    audio.src = '';
    
    tryNextSource();
    
    return sessionToken; 
}
