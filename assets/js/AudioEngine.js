// AudioEngine.js
// 核心音频播放引擎：负责 CDN 备援、错误处理、防范竞态条件（Race Condition）

import { getState, setState } from './StateAndUtils.js';
import { DOM_ELEMENTS, STORAGE_KEYS } from './Config.js';

let globalErrorHandler = null;

const failedUrls = JSON.parse(localStorage.getItem(STORAGE_KEYS.FAILED_URLS) || '{}');
// 最大失败 URL 记录时长：1 小时
const MAX_FAILED_URLS_DURATION_MS = 1000 * 60 * 60;

function recordFailedUrl(url) {
    failedUrls[url] = Date.now();
    for (const key in failedUrls) {
        if (Date.now() - failedUrls[key] > MAX_FAILED_URLS_DURATION_MS) {
            delete failedUrls[key];
        }
    }
    try {
        localStorage.setItem(STORAGE_KEYS.FAILED_URLS, JSON.stringify(failedUrls));
    } catch (e) {
        console.warn('无法记录失败 URL:', e);
    }
}

function removeCurrentErrorHandler(handler, audio) {
    if (!handler) return;
    if (globalErrorHandler === handler) {
        audio.removeEventListener('error', globalErrorHandler);
        globalErrorHandler = null;
        console.log('[CDN Fallback]: 移除全局错误处理器');
    } else {
        audio.removeEventListener('error', handler);
    }
}

function handleMetadata(audio, track, handler, sessionToken) {
    if (getState().currentPlaybackSession !== sessionToken) return;

    console.log(`[CDN Fallback]: ✅ 音源成功载入元数据 (${track.title})`);
    removeCurrentErrorHandler(handler, audio);

    if (audio.paused) {
        DOM_ELEMENTS.playerTitle.textContent = `载入完成：${track.title} (请点击播放)`;
    } else {
        DOM_ELEMENTS.playerTitle.textContent = `正在播放：${track.title}`;
    }
}

function showSimpleAlert(message) {
    console.warn(`[CDN Fallback 提示]: ${message}`);
    const statusDiv = DOM_ELEMENTS.playerTitle;
    const currentSessionToken = getState().currentPlaybackSession;

    if (statusDiv) {
        setTimeout(() => {
            if (getState().currentPlaybackSession === currentSessionToken) {
                const currentText = statusDiv.textContent;
                if (currentText.includes('备援')) {
                    statusDiv.textContent = `载入中...`;
                }
            }
        }, 3000);
    }
}

export function playAudioWithFallback(track) {
    const audio = DOM_ELEMENTS.audio;
    const sources = track.sources;
    const sessionToken = Date.now().toString(36) + Math.random().toString(36).substring(2);
    setState({ currentPlaybackSession: sessionToken });

    let sourceIndex = 0;

    if (globalErrorHandler) {
        audio.removeEventListener('error', globalErrorHandler);
        globalErrorHandler = null;
    }

    audio.src = '';
    audio.load();

    const stableErrorHandler = (e) => {
        if (getState().currentPlaybackSession !== sessionToken) return;
        if (e.target.error?.code === audio.error.MEDIA_ERR_ABORTED) return;

        const failedUrl = sources[sourceIndex];
        recordFailedUrl(failedUrl);
        console.warn(`❌ 来源 URL 失败: ${failedUrl} 错误代码: ${e.target.error?.code || 'Unknown'}`);

        sourceIndex++;
        tryNextSource();
    };

    globalErrorHandler = stableErrorHandler;
    audio.addEventListener('error', globalErrorHandler);

    const tryNextSource = () => {
        if (getState().currentPlaybackSession !== sessionToken) {
            removeCurrentErrorHandler(stableErrorHandler, audio);
            return;
        }

        if (sourceIndex >= sources.length) {
            console.error(`🚨 所有音频来源尝试失败: ${track.title}`);
            DOM_ELEMENTS.playerTitle.textContent = `🚨 播放失败：音源格式不受支持或所有备援失败`;
            removeCurrentErrorHandler(stableErrorHandler, audio);
            return;
        }

        let url = sources[sourceIndex];
        if (failedUrls[url] && Date.now() - failedUrls[url] < MAX_FAILED_URLS_DURATION_MS) {
            console.warn(`⏭ 跳过已知失败来源: ${url}`);
            sourceIndex++;
            tryNextSource();
            return;
        }

        showSimpleAlert(`尝试备援 (CDN ${sourceIndex + 1}/${sources.length}) 载入 ${track.title}`);
        DOM_ELEMENTS.playerTitle.textContent = `载入中：${track.title} (备援 ${sourceIndex + 1}/${sources.length})`;

        audio.src = url;
        audio.load();

        const currentMetadataHandler = () => handleMetadata(audio, track, stableErrorHandler, sessionToken);
        audio.addEventListener('loadedmetadata', currentMetadataHandler, { once: true });

        audio.play().catch(error => {
            if (error.name === "NotAllowedError" || error.name === "AbortError") {
                console.warn("浏览器阻止自动播放，等待用户手势");
                if (audio.paused) {
                    DOM_ELEMENTS.playerTitle.textContent = `载入完成：${track.title} (请点击播放)`;
                }
                removeCurrentErrorHandler(stableErrorHandler, audio);
            } else {
                console.error("播放时发生未知错误，尝试下一备援:", error);
                sourceIndex++;
                tryNextSource();
            }
        });
    };

    tryNextSource();
    return sessionToken;
}
