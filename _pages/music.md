---
layout: analytics
title: 我的靜態音樂站
permalink: /music/
load_player_css: true
---

{% capture custom_css %}
<link rel="stylesheet" href="/assets/css/theme.css">
<link rel="stylesheet" href="/assets/css/custom_player.css">
{% endcapture %}

{% if page.header.includes %}
  {% assign page.header.includes = page.header.includes | push: custom_css %}
{% else %}
  {% assign page.header = page.header | default: {} | merge: { "includes": custom_css } %}
{% endif %}

<div class="center-container">

    <h1>{{ page.title }}</h1> 

    {% assign total_tracks = site.data.music | size %}
    <h3>本站共收錄 {{ total_tracks }} 首音樂，歡迎收聽！</h3> 
    {% include audio_player.html %}

</div>

<script type="module">
    // 導入初始化函數
    import { initializeGamificationModule, addMusicScore } from '/assets/js/gamificationModule.js';
    
    // 確保模組被初始化
    document.addEventListener('DOMContentLoaded', initializeGamificationModule);

    // ⭐️ 新增：實現一個每秒執行，每分鐘調用 addMusicScore 的累加器 ⭐️
    let scoreAccumulator = 0;
    const SECONDS_PER_SCORE = 60; // 每 60 秒計 1 分鐘的時長/積分

    /**
     * @description 每秒被 PlayerCore.js 調用一次，負責音樂遊戲化積分邏輯。
     */
    function musicScoreTimerUpdate() {
        scoreAccumulator++;
        
        // 檢查是否達到 60 秒
        if (scoreAccumulator >= SECONDS_PER_SCORE) {
            
            // 🚨 調用遊戲化模塊中的函數來增加 1 分鐘的時長和積分
            if(addMusicScore()) {
                console.log("✅ 音樂播放滿 1 分鐘，已計入 1 分鐘時長和積分。");
            } else {
                console.log("🚧 音樂播放滿 1 分鐘，但已達今日上限，僅記錄時長。");
            }

            // 重置累加器
            scoreAccumulator = 0; 
        }
        
    }

    // ⭐️ 將正確的累加器函數導出到全局作用域 (window) ⭐️
    // 這是 PlayerCore.js 裡的 handlePlay 函數所期望調用的函數：
    // setInterval(window.updateMusicScore || ...
    window.updateMusicScore = musicScoreTimerUpdate; 
</script>
