---
layout: project
title: "Projects"
permalink: /projects/
author_profile: true
---

{% for project in site.data.projects %}
<div class="project-item">
  <h2 class="project-title">{{ project.title }}</h2>
  <p class="project-description">{{ project.description }}</p>
  <div class="project-links">
    {% if project.demo %}
    <a href="{{ project.demo }}" class="btn btn-demo" target="_blank">Live Demo</a>
    {% endif %}
    {% if project.code %}
    <a href="{{ project.code }}" class="btn btn-code" target="_blank">View Code</a>
    {% endif %}
  </div>
</div>
<hr class="project-separator" />
{% endfor %}
