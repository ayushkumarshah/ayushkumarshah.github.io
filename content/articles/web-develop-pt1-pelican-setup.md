Title: Web development using Pelican and Travis-CI - Part 1: Setting up Pelican - Installation and Theme
Date: 2020-03-17 00:00
Category: Web development and hosting
Slug: web-develop-pt1-pelican-setup
Summary:
Tags: pelican, python, pelican-plugin, pneumatic
Authors: Ayush Kumar Shah
Status: draft

[Pelican](https://docs.getpelican.com/en/stable/index.html) is a static site generator, written in Python.

## Features of Pelican

- Articles (e.g., blog posts) and pages (e.g., “About”, “Projects”, “Contact”)
- Comments, via an external service ([Disqus](https://disqus.com/)). If you prefer to have more control over your comment data, self-hosted comments are another option. Check out the [Pelican Plugins](https://github.com/getpelican/pelican-plugins) repository for more details.
- Theming support (themes are created using [Jinja2](https://palletsprojects.com/p/jinja/) templates)
- Publication of articles in multiple languages
- Atom/RSS feeds
- Code syntax highlighting
- Import from WordPress, Dotclear, or RSS feeds
- Integration with external tools: Twitter, Google Analytics, etc. (optional)
- Fast rebuild times thanks to content caching and selective output writing

## Setting up Pelican

Project Structure:
Create any folder for your project. For example: web_development

    $ mkdir web_development
    $ cd web_development
    $ mkdir content

### 1. Installation

First, install virtualenv via pip and then create a virtual environment for your project.

    $ pip install virtualenv
    $ virtualenv .venv

Activate the virtual environment

    $ source .venv/bin/activate

Now, install pelican inside the virtual environment

    (.venv) $ pip install pelican