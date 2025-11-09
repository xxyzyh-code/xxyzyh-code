// timeModule.js

/**
 * @description 計算並顯示農曆日期和節氣。
 */
function updateLunarDate() {
    const now = new Date();
    const lunarElement = document.getElementById('lunar-date');
    
    // 檢查外部函式庫是否已載入 (從 CDN 引入)
    if (typeof calendarConverter === 'undefined') {
        if (lunarElement) {
            lunarElement.textContent = '載入農曆函式庫中...';
        }
        return;
    }

    const lunarData = calendarConverter.solar2lunar(now.getFullYear(), now.getMonth() + 1, now.getDate());
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
