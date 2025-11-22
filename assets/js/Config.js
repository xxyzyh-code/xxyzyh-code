// Config.js
// 負責靜態配置、常量和主數據列表的初始化

// ------------------------------------
// ⭐️ 關鍵：Supabase API 配置 (使用您提供的 Key)
// ------------------------------------
const SUPABASE_URL = 'https://dpflzangmwahuwyevegp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwZmx6YW5nbXdhaHV3eWV2ZWdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0Mjc0NDYsImV4cCI6MjA3ODAwMzQ0Nn0.bydLBJIGqHcEKDhmw4E7zEqxFxymieS7GlLjL9Zyr90';
const GLOBAL_STATS_TABLE = 'play_logs'; 

// ------------------------------------
// 1. 準備數據和狀態追蹤
// ------------------------------------
const MASTER_TRACK_LIST = (function() {
    const trackDataArray = window.PLAYER_GLOBAL_DATA?.trackDataArray;
    
    if (typeof trackDataArray === 'undefined' || trackDataArray.length === 0) {
        console.error("錯誤: Liquid 注入的 trackDataArray 數據未找到或為空。");
        return [];
    }
    return trackDataArray.map((track, index) => ({
        id: track.id || `s${index}`, 
        title: track.title,
        artist: track.artist,
        // 🚨 核心修正 1：確保 sources 永遠是陣列
        sources: Array.isArray(track.sources) ? track.sources : (track.sources ? [track.sources] : []), 
        originalIndex: index,
        // 確保 lrcSources 是陣列
        lrcSources: Array.isArray(track.lrcPath) ? track.lrcPath : (track.lrcPath ? [track.lrcPath] : []) 
    }));
})();  

// ------------------------------------
// 2. DOM 元素 & 儲存鍵常量
// ------------------------------------
const DOM_ELEMENTS = {
    // 您的 HTML 中 ID 是 'audio'，這裡是正確的
    audio: document.getElementById('audio'), 
    playerTitle: document.querySelector('#custom-audio-player h3'),
    modeButton: document.getElementById('mode-button'), 
    timerToggleButton: document.getElementById('timer-toggle-btn'),
    timerMenu: document.getElementById('timer-menu'),
    totalListenTimeSpan: document.getElementById('total-listen-time'),
    remainingTimerSpan: document.getElementById('remaining-timer'),
    playlistSearchInput: document.getElementById('playlist-search'), 
    themeToggleBtn: document.getElementById('theme-toggle-btn'),
    themeMenu: document.getElementById('theme-menu'),
    currentThemeName: document.getElementById('current-theme-name'),
    themeOptions: document.querySelectorAll('#theme-menu .theme-option'),
    
    // ✅ 修正 1：同步 HTML 中的 ID 'playlistUl'
    playlistUl: document.getElementById('playlistUl'), 
    
    lyricsContainer: document.getElementById('lyrics-container'),
    lyricsContent: document.getElementById('lyrics-content'),
    lyricsPlaceholder: document.getElementById('lyrics-placeholder'),
    
    // ✅ 修正 2：由於您使用內建 controls，我們將 'audio' 元素本身視為全局播放按鈕。
    // 這允許 AudioEngine 仍然有目標可以操作 (雖然這次是隱藏/顯示 controls)。
    globalPlayBtn: document.getElementById('audio') 
};

const STORAGE_KEYS = {
    PLAY_COUNT: 'audioTrackPlayCounts',
    DATA_MODE: 'audioPlayerDataMode',
    VOLUME: 'audioPlayerVolume',
    MUTED: 'audioPlayerMuted',
    MODE: 'audioPlayerMode',
    LAST_ORIGINAL_INDEX: 'audioPlayerOriginalIndex',
    LAST_TIME: 'audioPlayerTime',
    THEME: 'userThemePreference',
    FAILED_URLS: 'audioFailedUrls' 
};

const THEMES = {
    LIGHT: 'light', DARK: 'dark', GREY: 'grey', BLUE: 'blue',
    GREEN: 'green', PURPLE: 'purple', PINK: 'pink', YELLOW: 'yellow', RED: 'red'
};


export { 
    SUPABASE_URL, SUPABASE_ANON_KEY, GLOBAL_STATS_TABLE, 
    MASTER_TRACK_LIST, DOM_ELEMENTS, STORAGE_KEYS, THEMES 
};
