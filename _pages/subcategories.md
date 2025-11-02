---
layout: default
title: "📂 二级分类导航"
permalink: /subcategories/
author_profile: true
---

<h2 style="text-align:center; margin-top:20px;">📁 博客二级分类导航</h2>
<p style="text-align:center; color:#888; font-size:0.95em;">
点击任意分类以展开查看对应的文章。
</p>

<div id="category-list" style="margin-top:40px;"></div>

<script>
document.addEventListener("DOMContentLoaded", function() {
  const categories = {};

  {% for post in site.posts %}
    const cats = {{ post.categories | jsonify }};
    if (cats.length > 0) {
      const mainCat = cats[0];
      const subCat = cats[1] || "未分类";
      if (!categories[mainCat]) categories[mainCat] = {};
      if (!categories[mainCat][subCat]) categories[mainCat][subCat] = [];
      categories[mainCat][subCat].push({
        title: {{ post.title | jsonify }},
        url: {{ post.url | jsonify }},
        date: {{ post.date | date: "%Y-%m-%d" | jsonify }}
      });
    }
  {% endfor %}

  const container = document.getElementById("category-list");
  Object.keys(categories).sort().forEach(main => {
    const section = document.createElement("div");
    section.innerHTML = `
      <details style="margin-bottom:20px; border:1px solid #444; border-radius:6px; background:#222;">
        <summary style="padding:10px 15px; font-size:1.2em; font-weight:600; color:#fff; cursor:pointer;">🎯 ${main}</summary>
        <div style="padding:10px 20px;">
          ${Object.keys(categories[main]).sort().map(sub => `
            <details style="margin-top:10px; border:1px solid #555; border-radius:6px;">
              <summary style="padding:8px 12px; background:#333; color:#eee; cursor:pointer;">📎 ${sub}</summary>
              <ul style="list-style:none; padding-left:20px; margin:10px 0;">
                ${categories[main][sub].map(post => `
                  <li style="margin:6px 0;">
                    <a href="${post.url}" style="color:#68c1ff; text-decoration:none;">${post.title}</a>
                    <span style="color:#888; font-size:0.85em;">（${post.date}）</span>
                  </li>
                `).join("")}
              </ul>
            </details>
          `).join("")}
        </div>
      </details>
    `;
    container.appendChild(section);
  });
});
</script>
