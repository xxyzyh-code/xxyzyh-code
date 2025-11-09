// timeModule.js - 修正版

/**
 * @description 計算並顯示農曆日期和節氣。
 */
function updateLunarDate() {
    const now = new Date();
    const lunarElement = document.getElementById('lunar-date');
    
    // 程式夥伴修正：從 window 全域物件檢查和獲取函式庫
    // 確保即使在 ES 模組環境中也能正確引用同步載入的函式庫
    const converter = window.calendarConverter; 

    if (typeof converter === 'undefined') {
        if (lunarElement) {
            // 由於路徑已修正，如果還沒載入，可能真的有問題，但我們保留這個提示
            lunarElement.textContent = '農曆函式庫載入失敗或不可用。';
        }
        console.error("Lunar Date Error: window.calendarConverter is undefined.");
        return;
    }

    // 程式邏輯不變，使用 converter 變數
    const lunarData = converter.solar2lunar(now.getFullYear(), now.getMonth() + 1, now.getDate());
    
    let displayString = '';
    displayString += `${lunarData.IMonthCn}${lunarData.IDayCn}`;
    displayString += ` (${lunarData.gzYear})`;

    if (lunarData.isTerm) {
        displayString += ` | ${lunarData.Term}`;
    }

    if (lunarElement) {
        lunarElement.textContent = displayString;
    }
}


/**
 * @description 更新數字時鐘和公曆日期，並處理日夜模式切換。
 */
function updateClock() {
    const now = new Date();
    const currentHour = now.getHours();
    const body = document.body;
    const isDayTime = currentHour >= 6 && currentHour < 18;

    if (isDayTime) {
        body.classList.remove('night-mode');
    } else {
        body.classList.add('night-mode');
    }

    let hours = currentHour;
    let minutes = now.getMinutes();
    let seconds = now.getSeconds();

    const pad = (num) => num < 10 ? '0' + num : num;

    const timeString = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;

    const clockElement = document.getElementById('digital-clock');
    if (clockElement) {
        clockElement.textContent = timeString;
    }

    const dateOptions = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
    const dateString = now.toLocaleDateString('zh-TW', dateOptions); 
    
    const dateElement = document.getElementById('current-date');
    if (dateElement) {
        dateElement.textContent = dateString;
    }

    // 更新農曆
    updateLunarDate();
}

/**
 * @description 啟動時鐘更新機制。
 */
export function initializeTimeModule() {
    updateClock();
    setInterval(updateClock, 1000);
    console.log("Time Module: 時鐘與日期功能已啟動。");
}
