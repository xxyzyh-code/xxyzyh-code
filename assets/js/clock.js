// clock.js (主入口)

import { initializeTimeModule } from './timeModule.js';
import { initializePomodoroModule } from './pomodoroModule.js';
import { initializeUIModule } from './uiModule.js';

// 確保 DOM 完全載入後再啟動功能
document.addEventListener('DOMContentLoaded', () => {
    console.log("程式夥伴: 主程式已啟動。");
    
    // 啟動各模組
    initializeTimeModule();
    initializePomodoroModule();
    initializeUIModule();
});
