// /assets/js/config.js

/**
 * @description 專案的集中式配置檔案。
 * 所有 JS 模組共享的常量和設定都定義在這裡。
 */

// ===================================
// 時間與農曆配置 (Time Module)
// ===================================
export const LUNAR_LOADING_MESSAGE = '農曆函式庫載入失敗或不可用。';
// 註：農曆函式庫的實例化變數名稱是 window.calendarConverterInstance

// ===================================
// 番茄鐘配置 (Pomodoro Module)
// ===================================
export const POMODORO_TIME_MINUTES = 25; // 工作時間 (分鐘)
export const SHORT_BREAK_TIME_MINUTES = 5; // 短暫休息 (分鐘)
export const LONG_BREAK_TIME_MINUTES = 15; // 長時間休息 (分鐘)
export const LONG_BREAK_INTERVAL = 4; // 每隔 4 次工作後進行長時間休息

// ===================================
// 天氣模組配置 (Weather Module)
// ===================================
// 注意：由於您可能尚未提供有效的 API Key 或 URL，這裡使用佔位符。
// 請將 YOUR_API_KEY_HERE 和 YOUR_CITY 替換為實際值。
export const WEATHER_API_URL = 'https://api.example.com/weather/current'; 
export const WEATHER_API_KEY = 'YOUR_API_KEY_HERE'; 
export const DEFAULT_CITY = '您的城市';
export const WEATHER_LOADING_MESSAGE = '載入中...';

// ===================================
// 應用程式一般配置
// ===================================
export const APP_INITIALIZATION_MESSAGE = "Time Module: 時鐘與日期功能已啟動。";

