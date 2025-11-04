---
layout: default
title: 我的靜態音樂站  <-- 我們要顯示這個標題
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

# {{ page.title }}  <-- 步驟 1: 使用 Liquid 輸出主要標題

## 歡迎收聽！  <-- 步驟 2: 將「歡迎收聽！」降級為子標題

{% include audio_player.html %}
