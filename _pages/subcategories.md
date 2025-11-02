---
layout: page
title: 二级分类
permalink: /subcategories/
---

<h1 style="text-align:center;">📂 二级分类索引</h1>
<p style="text-align:center; color:#888;">点击二级分类查看文章</p>

{% assign all_categories = "" | split: "," %}

{% for post in site.posts %}
  {% assign post_cats = post.categories %}
  {% if post_cats.size > 0 %}
    {% assign first_level = post_cats[0] %}
    {% assign second_levels = post_cats[1..-1] %}
    
    {% for second in second_levels %}
      {% assign entry = first_level | append: "||" | append: second | append: "||" | append: post.url | append: "||" | append: post.title %}
      {% assign all_categories = all_categories | push: entry %}
    {% endfor %}
    
    {% if second_levels == nil or second_levels == empty %}
      {% assign entry = first_level | append: "||" | append: "" | append: "||" | append: post.url | append: "||" | append: post.title %}
      {% assign all_categories = all_categories | push: entry %}
    {% endif %}
  {% endif %}
{% endfor %}

{% assign grouped = all_categories | sort %}

{% assign current_first = "" %}
<ul>
{% for item in grouped %}
  {% assign parts = item | split: "||" %}
  {% assign first = parts[0] %}
  {% assign second = parts[1] %}
  {% assign url = parts[2] %}
  {% assign title = parts[3] %}

  {% if first != current_first %}
    {% if current_first != "" %}
      </ul>
    {% endif %}
    <h2>{{ first }}</h2>
    <ul>
    {% assign current_first = first %}
  {% endif %}

  {% if second != "" %}
    <li><strong>{{ second }}</strong> — <a href="{{ url }}">{{ title }}</a></li>
  {% else %}
    <li><a href="{{ url }}">{{ title }}</a></li>
  {% endif %}
{% endfor %}
</ul>
