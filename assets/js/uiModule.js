// uiModule.js - 配置優化版

// 程式夥伴：從 config.js 引入所有配置常量
import {
    THEMES,
    MEDITATION_INTERVAL_MIN,
    MEDITATION_MESSAGES,
    MEDITATION_MUSIC,
    MEDITATION_PROMPT_DURATION,
    ALARM_SOUNDS,
    WEATHER_API_KEY,
    WEATHER_API_URL,
    WEATHER_API_LANG,
    WEATHER_UNITS,
    WEATHER_GEOLOCATION_TIMEOUT,
    WEATHER_LOCATION_FAIL_MESSAGE,
    WEATHER_FETCH_FAIL_MESSAGE
} from './config.js';

// V. 主題切換與儲存邏輯
function setTheme(themeName) {
    const body = document.body;
    // 使用配置中的 THEMES 列表
    THEMES.forEach(theme => {
        if (theme !== 'default') {
            body.classList.remove(theme);
        }
    });

    if (themeName !== 'default') {
        body.classList.add(themeName);
    }
    localStorage.setItem('clockTheme', themeName);
}

function loadTheme() {
    const savedTheme = localStorage.getItem('clockTheme') || 'default';
    setTheme(savedTheme);
}

// VI. 冥想引導模式邏輯
let meditationTimer = null; 
let isMeditationEnabled = false; 
const modal = document.getElementById('meditation-modal');
const modalText = document.getElementById('meditation-text');
const closeModalBtn = document.getElementById('close-modal-btn');
const audio = document.getElementById('meditation-audio');
const toggleBtn = document.getElementById('meditation-toggle-btn');
const meditationSelector = document.getElementById('meditation-selector');

function showMeditationPrompt() {
    // 使用配置中的 MEDITATION_MESSAGES 列表
    const randomIndex = Math.floor(Math.random() * MEDITATION_MESSAGES.length);
    modalText.textContent = MEDITATION_MESSAGES[randomIndex];
    
    modal.style.display = 'flex'; 

    audio.play().catch(error => {
        console.log("冥想音訊自動播放失敗:", error);
    });

    // 使用配置中的 MEDITATION_PROMPT_DURATION
    setTimeout(closeMeditationPrompt, MEDITATION_PROMPT_DURATION); 
}

function closeMeditationPrompt() {
    modal.style.display = 'none';
    audio.pause();
    audio.currentTime = 0;
}

function toggleMeditationMode() {
    isMeditationEnabled = !isMeditationEnabled;

    if (isMeditationEnabled) {
        toggleBtn.textContent = '🧘‍♀️ 關閉冥想';
        toggleBtn.style.backgroundColor = '#dc3545';
        
        audio.load(); 
        audio.play().catch(error => console.log("冥想音樂播放失敗:", error));

        // 使用配置中的 MEDITATION_INTERVAL_MIN
        meditationTimer = setInterval(showMeditationPrompt, MEDITATION_INTERVAL_MIN * 60 * 1000); 

    } else {
        toggleBtn.textContent = '🧘‍♀️ 啟用冥想';
        toggleBtn.style.backgroundColor = '';
        clearInterval(meditationTimer);
        closeMeditationPrompt();
    }
}

// VII. 天氣資訊邏輯
// API_KEY 和 WEATHER_API_URL 已從這裡移除，並從 config.js 導入

function fetchWeather() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                getWeatherData(position.coords.latitude, position.coords.longitude);
            },
            (error) => {
                // 使用配置中的失敗訊息
                document.getElementById('weather-location').textContent = WEATHER_LOCATION_FAIL_MESSAGE;
                document.getElementById('weather-temp-desc').textContent = '請檢查權限或網路。';
                console.error('Geolocation Error:', error);
            },
            // 使用配置中的定位超時時間
            { timeout: WEATHER_GEOLOCATION_TIMEOUT }
        );
    } else {
        document.getElementById('weather-location').textContent = '瀏覽器不支援定位。';
    }
}

async function getWeatherData(lat, lon) {
    // 使用配置中的常量構建 URL
    const url = `${WEATHER_API_URL}?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=${WEATHER_UNITS}&lang=${WEATHER_API_LANG}`;
    
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        const temp = Math.round(data.main.temp); 
        const description = data.weather[0].description;
        const iconCode = data.weather[0].icon;
        const locationName = data.name;

        document.getElementById('weather-location').textContent = `${locationName}`;
        document.getElementById('weather-temp-desc').innerHTML = `${temp}°C, ${description}`;
        document.getElementById('weather-icon').innerHTML = `<img src="https://openweathermap.org/img/wn/${iconCode}@2x.png" alt="${description}">`;

    } catch (error) {
        // 使用配置中的失敗訊息
        document.getElementById('weather-temp-desc').textContent = WEATHER_FETCH_FAIL_MESSAGE;
        console.error('Weather Fetch Error:', error);
    }
}

// VIII. 音訊選擇與儲存邏輯
// ALARM_SOUNDS 已從這裡移除，並從 config.js 導入
const alarmSelector = document.getElementById('alarm-selector');
// 註：alarmAudio 在這裡被覆蓋了，我們假設您在 HTML 中有兩個不同的 <audio> 元素 ID
// 但為了保持程式碼結構清晰，我們將其重新命名為 alarmAudioElement
const alarmAudioElement = document.getElementById('alarm-audio');


/**
 * @description 渲染下拉選單的選項，載入偏好並設置監聽器。
 */
function initializeAudioSelector(selector, options, storageKey, audioElement) {
    // 使用配置中的 options
    selector.innerHTML = options.map((item, index) => 
        `<option value="${item.path}">${item.name}</option>`
    ).join('');

    // ... (後續邏輯保持不變) ...
}

/**
 * @description 啟動所有 UI 相關的模組。
 */
export function initializeUIModule() {
    // 啟動主題功能
    loadTheme(); 
    // ... (事件監聽器保持不變) ...

    // 啟動冥想功能事件監聽器
    toggleBtn.addEventListener('click', toggleMeditationMode);
    closeModalBtn.addEventListener('click', closeMeditationPrompt); 

    // 啟動音訊選擇器 (在 DOM 準備好後)
    // 使用配置中的 ALARM_SOUNDS 和 MEDITATION_MUSIC
    initializeAudioSelector(alarmSelector, ALARM_SOUNDS, 'alarmSoundPath', alarmAudioElement);
    initializeAudioSelector(meditationSelector, MEDITATION_MUSIC, 'meditationMusicPath', audio);

    // 啟動天氣功能
    fetchWeather(); 

    console.log("UI Module: UI/主題/冥想/音訊選擇功能已啟動。");
}
