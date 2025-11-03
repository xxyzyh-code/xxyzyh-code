---
layout: home
author_profile: true
header:
  overlay_color: "#333"
  overlay_image: /assets/images/unsplash-bg.jpg
title: "欢迎来到我的博客首页"
excerpt: "记录思考、创作与探索的足迹。"
entries_layout: list
classes: wide
---

<div style="text-align:center; margin-bottom:40px;">
  <h2>👋 欢迎来到我的个人博客</h2>
  <p style="font-size:1.1em; color:#ccc;">这里是我的写作与思考空间，你可以在下方找到不同主题的内容。</p>
</div>

<div style="display:flex; flex-wrap:wrap; justify-content:center; gap:20px; margin-bottom:50px;">
  <a href="/about/" style="flex:1 1 150px; max-width:200px; text-align:center; padding:15px; background:#444; color:#fff; text-decoration:none; border-radius:8px; transition:0.3s;">关于我</a>
  <a href="/contact/" style="flex:1 1 150px; max-width:200px; text-align:center; padding:15px; background:#444; color:#fff; text-decoration:none; border-radius:8px; transition:0.3s;">联系我</a>
  <a href="/tags/" style="flex:1 1 150px; max-width:200px; text-align:center; padding:15px; background:#444; color:#fff; text-decoration:none; border-radius:8px; transition:0.3s;">标签</a>
  <a href="/categories/" style="flex:1 1 150px; max-width:200px; text-align:center; padding:15px; background:#444; color:#fff; text-decoration:none; border-radius:8px; transition:0.3s;">分类</a>
  <a href="/subcategories/" style="flex:1 1 150px; max-width:200px; text-align:center; padding:15px; background:#444; color:#fff; text-decoration:none; border-radius:8px; transition:0.3s;">二级分类</a>
  <a href="/archives/" style="flex:1 1 150px; max-width:200px; text-align:center; padding:15px; background:#444; color:#fff; text-decoration:none; border-radius:8px; transition:0.3s;">存档</a>
</div>

<script>
  document.querySelectorAll('a').forEach(a => {
    a.addEventListener('mouseenter', () => a.style.background = '#666');
    a.addEventListener('mouseleave', () => a.style.background = '#444');
  });
</script>

<!-- 🔹 分类与二级分类展示（前端 JS + 动画） -->
<div id="category-subcategory" style="margin:40px auto;">
  <h3>📂 分类与二级分类（按文章数统计）</h3>
  <div id="cat-subcat-list"></div>
</div>

<script>
const posts = [
  {% for post in site.posts %}
  {
    url: "{{ post.url }}",
    title: "{{ post.title | escape }}",
    categories: [{% for cat in post.categories %}"{{ cat }}"{% if forloop.last == false %}, {% endif %}{% endfor %}],
    subcategories: [{% for subcat in post.subcategories %}"{{ subcat }}"{% if forloop.last == false %}, {% endif %}{% endfor %}]
  }{% if forloop.last == false %}, {% endif %}
  {% endfor %}
];

const catMap = {};
posts.forEach(post => {
  post.categories.forEach(cat => {
    if (!catMap[cat]) catMap[cat] = {};
    post.subcategories.forEach(subcat => {
      if (!catMap[cat][subcat]) catMap[cat][subcat] = [];
      catMap[cat][subcat].push(post);
    });
  });
});

const container = document.getElementById('cat-subcat-list');

for (const cat in catMap) {
  const catDiv = document.createElement('div');
  catDiv.style.marginBottom = '15px';
  const catTitle = document.createElement('div');
  catTitle.style.cursor = 'pointer';
  catTitle.style.userSelect = 'none';
  catTitle.style.display = 'flex';
  catTitle.style.alignItems = 'center';
  catTitle.style.gap = '5px';

  const arrow = document.createElement('span');
  arrow.textContent = '▶';
  arrow.style.transition = 'transform 0.3s ease-in-out';
  catTitle.appendChild(arrow);

  const titleSpan = document.createElement('strong');
  titleSpan.textContent = cat;
  catTitle.appendChild(titleSpan);

  catDiv.appendChild(catTitle);

  const subUl = document.createElement('ul');
  subUl.style.listStyle = 'disc';
  subUl.style.paddingLeft = '20px';
  subUl.style.margin = '5px 0';
  subUl.style.maxHeight = '0';
  subUl.style.overflow = 'hidden';
  subUl.style.transition = 'max-height 0.4s ease-in-out';

  for (const subcat in catMap[cat]) {
    const li = document.createElement('li');
    li.style.cursor = 'pointer';
    li.textContent = `${subcat} (${catMap[cat][subcat].length})`;

    li.addEventListener('click', () => {
      // 展示该二级分类下文章标题
      const existing = document.getElementById('subcat-posts');
      if (existing) existing.remove();

      const postList = document.createElement('ul');
      postList.id = 'subcat-posts';
      postList.style.marginTop = '10px';
      postList.style.paddingLeft = '20px';

      catMap[cat][subcat].forEach(p => {
        const pLi = document.createElement('li');
        const a = document.createElement('a');
        a.href = p.url;
        a.textContent = p.title;
        a.style.textDecoration = 'underline';
        a.style.color = '#06f';
        pLi.appendChild(a);
        postList.appendChild(pLi);
      });

      catDiv.appendChild(postList);
    });

    subUl.appendChild(li);
  }

  catDiv.appendChild(subUl);

  // 點擊展開/收起動畫
  catTitle.addEventListener('click', () => {
    if (subUl.style.maxHeight === '0px' || subUl.style.maxHeight === '') {
      subUl.style.maxHeight = subUl.scrollHeight + 'px';
      arrow.style.transform = 'rotate(90deg)';
    } else {
      subUl.style.maxHeight = '0';
      arrow.style.transform = 'rotate(0deg)';
    }
  });

  container.appendChild(catDiv);
}
</script>

<div style="text-align:center; margin:40px auto;">
  <h3>📝 最新发布</h3>
  <p style="color:#aaa;">以下是我最近的博客文章，更多内容请查看各个分类。</p>
</div>

<div style="text-align: center; margin-top: 60px;">
  <p style="font-size:0.9em; color:#888;">本站访问统计：</p>
  <img src="https://visitor-badge.laobi.icu/badge?page_id=xxyzyh-code.xxyzyh-code" alt="Visitor Count">
</div>
