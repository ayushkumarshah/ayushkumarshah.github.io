---
layout: publications
title: "Publications"
permalink: /publications/
author_profile: true
excerpt: "Welcome to my publications page, where I gather all my published and submitted academic papers for conferences and journals. I’ve included live demos, video tutorials, code samples, and links to both preprints and publisher PDFs—making my research as accessible as possible. I hope you find these resources insightful and learn something new about my work."
---

{% if author.googlescholar %}
  You can also find my articles on <u><a href="{{author.googlescholar}}">my Google Scholar profile</a>.</u>
{% endif %}

{% include base_path %}

{% for post in site.publications reversed %}
  {% include archive-single.html %}
{% endfor %}
