// uiModule.js

// V. 主題切換與儲存邏輯
const THEMES = ['default', 'neon-theme', 'dos-theme'];

function setTheme(themeName) {
    const body = document.body;
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
const MEDITATION_INTERVAL_MIN = 60; 
const MEDITATION_MESSAGES = [
    "閉上眼睛，深呼吸三次，感受當下的寧靜。",
    "輕輕放下你的肩膀和下巴，放鬆五秒。",
    "專注於你的呼吸，忘卻時間，重新連結自己。",
    "放下生活瑣事，讓心靈放空、清潔。",
    "現在，保持微笑三秒鐘，感受積極的能量。"
];
const MEDITATION_MUSIC = [
    { name: '柔和輕音', path: 'assets/audio/gentle_music.mp3' },
    { name: '大自然雨聲', path: 'assets/audio/rain_sound.mp3' },
    { name: '寧靜鋼琴', path: 'assets/audio/piano_loop.mp3' }
];

let meditationTimer = null; 
let isMeditationEnabled = false; 
const modal = document.getElementById('meditation-modal');
const modalText = document.getElementById('meditation-text');
const closeModalBtn = document.getElementById('close-modal-btn');
const audio = document.getElementById('meditation-audio');
const toggleBtn = document.getElementById('meditation-toggle-btn');
const meditationSelector = document.getElementById('meditation-selector');

function showMeditationPrompt() {
    const randomIndex = Math.floor(Math.random() * MEDITATION_MESSAGES.length);
    modalText.textContent = MEDITATION_MESSAGES[randomIndex];
    
    modal.style.display = 'flex'; 

    // 播放當前選擇的音樂
    audio.play().catch(error => {
        console.log("冥想音訊自動播放失敗:", error);
    });

    setTimeout(closeMeditationPrompt, 30000); 
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
        
        // 確保播放當前選擇的音樂
        audio.load(); 
        audio.play().catch(error => console.log("冥想音樂播放失敗:", error));

        meditationTimer = setInterval(showMeditationPrompt, MEDITATION_INTERVAL_MIN * 60 * 1000); 

    } else {
        toggleBtn.textContent = '🧘‍♀️ 啟用冥想';
        toggleBtn.style.backgroundColor = '';
        clearInterval(meditationTimer);
        closeMeditationPrompt();
    }
}

// VII. 天氣資訊邏輯
const API_KEY = 'be0d16a112a34af758f9a6a22e133de3'; // 💡 備註：這個 API Key 應在伺服器端保護
const WEATHER_API_URL = 'https://api.openweathermap.org/data/2.5/weather';

function fetchWeather() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                getWeatherData(position.coords.latitude, position.coords.longitude);
            },
            (error) => {
                document.getElementById('weather-location').textContent = '定位失敗 🌍';
                document.getElementById('weather-temp-desc').textContent = '請檢查權限或網路。';
                console.error('Geolocation Error:', error);
            },
            { timeout: 10000 }
        );
    } else {
        document.getElementById('weather-location').textContent = '瀏覽器不支援定位。';
    }
}

async function getWeatherData(lat, lon) {
    const url = `${WEATHER_API_URL}?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=zh_tw`;
    
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
        document.getElementById('weather-temp-desc').textContent = '載入天氣數據失敗 😓';
        console.error('Weather Fetch Error:', error);
    }
}

// VIII. 音訊選擇與儲存邏輯
const ALARM_SOUNDS = [
    { name: '經典鈴聲', path: 'assets/audio/alarm_bell.mp3' },
    { name: '輕柔鐘聲', path: 'assets/audio/gentle_chime.mp3' },
    { name: '電子蜂鳴', path: 'assets/audio/electronic_beep.mp3' }
];
const alarmSelector = document.getElementById('alarm-selector');
const alarmAudio = document.getElementById('alarm-audio');


/**
 * @description 渲染下拉選單的選項，載入偏好並設置監聽器。
 */
function initializeAudioSelector(selector, options, storageKey, audioElement) {
    // 1. 渲染選項
    selector.innerHTML = options.map((item, index) => 
        `<option value="${item.path}">${item.name}</option>`
    ).join('');

    // 2. 載入儲存的偏好 (如果有)
    const savedPath = localStorage.getItem(storageKey);
    let selectedPath = savedPath || options[0].path; 

    // 3. 設置當前選擇並更新 <audio> 的 src
    selector.value = selectedPath;
    audioElement.src = selectedPath;

    // 4. 添加事件監聽器
    selector.addEventListener('change', (e) => {
        const newPath = e.target.value;
        audioElement.src = newPath;
        localStorage.setItem(storageKey, newPath);
        
        // 如果是冥想音樂且正在播放，需要重新載入並播放新音源
        if (audioElement.id === 'meditation-audio' && !audioElement.paused) {
            audioElement.load();
            audioElement.play();
        }
    });
}

/**
 * @description 啟動所有 UI 相關的模組。
 */
export function initializeUIModule() {
    // 啟動主題功能
    loadTheme(); 
    document.getElementById('theme-default-btn').addEventListener('click', () => setTheme('default'));
    document.getElementById('theme-neon-btn').addEventListener('click', () => setTheme('neon-theme'));
    document.getElementById('theme-dos-btn').addEventListener('click', () => setTheme('dos-theme'));

    // 啟動冥想功能事件監聽器
    toggleBtn.addEventListener('click', toggleMeditationMode);
    closeModalBtn.addEventListener('click', closeMeditationPrompt); 

    // 啟動音訊選擇器 (在 DOM 準備好後)
    initializeAudioSelector(alarmSelector, ALARM_SOUNDS, 'alarmSoundPath', alarmAudio);
    initializeAudioSelector(meditationSelector, MEDITATION_MUSIC, 'meditationMusicPath', audio);

    // 啟動天氣功能
    fetchWeather(); 

    console.log("UI Module: UI/主題/冥想/音訊選擇功能已啟動。");
}
