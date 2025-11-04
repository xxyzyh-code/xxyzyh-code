---
title: "時鐘頁"
layout: single
---

# 冥想訓練

這是一個冥想訓練，盯著時鐘跳動，放下生活瑣事，放空清潔心靈...

<div id="digital-clock" style="font-size: 2em; font-weight: bold; margin-top: 20px;">
  正在載入時鐘...
</div>

<script>
function updateClock() {
    const now = new Date();
    
    let hours = now.getHours();
    let minutes = now.getMinutes();
    let seconds = now.getSeconds();

    hours = hours < 10 ? '0' + hours : hours;
    minutes = minutes < 10 ? '0' + minutes : minutes;
    seconds = seconds < 10 ? '0' + seconds : seconds;

    const timeString = hours + ':' + minutes + ':' + seconds;

    const clockElement = document.getElementById('digital-clock');
    if (clockElement) {
        clockElement.textContent = timeString;
    }
}

updateClock();
setInterval(updateClock, 1000);
</script>
