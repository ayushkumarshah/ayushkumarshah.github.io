#!/usr/bin/env python
# -*- coding: utf-8 -*-
from __future__ import unicode_literals

# Theme-specific settings

SITENAME = 'Ayush Kumar Shah'
DOMAIN = 'http://localhost:8000'

SITE_AUTHOR = 'Ayush Kumar Shah'
BROWSER_COLOR = '#333333'

# Pelican settings
SITEURL = 'http://localhost:8000'
TIMEZONE = 'Asia/Kathmandu'
DEFAULT_DATE = 'fs'
DEFAULT_DATE_FORMAT = '%B %d, %Y'
SUMMARY_MAX_LENGTH = 42

# Theme Location
THEME = 'themes/Flex'
# JINJA_ENVIRONMENT = bulrush.ENVIRONMENT
# JINJA_FILTERS = bulrush.FILTERS

DEFAULT_PAGINATION = 5

ARTICLE_URL = '{date:%Y}/{date:%m}/{slug}/'
ARTICLE_SAVE_AS = ARTICLE_URL + 'index.html'

PAGE_URL = '{slug}/'
PAGE_SAVE_AS = PAGE_URL + 'index.html'

ARCHIVES_SAVE_AS = 'archives.html'
YEAR_ARCHIVE_SAVE_AS = '{date:%Y}/index.html'
MONTH_ARCHIVE_SAVE_AS = '{date:%Y}/{date:%m}/index.html'

CACHE_CONTENT = False
# DELETE_OUTPUT_DIRECTORY = True
# OUTPUT_PATH = 'develop'
PATH = 'content'
PAGE_EXCLUDES = ['404.html']

STATIC_PATHS = ['images', 'extra']
IGNORE_FILES = ['.DS_Store', 'pneumatic.scss', 'pygments.css', 'icomoon.css']

extras = ['CNAME', 'favicon.ico', 'robots.txt', 'ads.txt']
EXTRA_PATH_METADATA = {'extra/%s' % file: {'path': file} for file in extras}

PLUGIN_PATHS = ['./pelican-plugins']

# Enable comments
DISQUS_SITENAME = 'ayushkumarshah'

### Flex configurations

PLUGINS = ['sitemap', 'post_stats', 'feed_summary','share_post']

SITETITLE = 'Ayush Kumar Shah'
SITESUBTITLE = 'Ideas and Thoughts'
SITELOGO = '/images/icons/avatar.png'
FAVICON = '/images/icons/favicon.ico'

# Sitemap Settings
SITEMAP = {
    'format': 'xml',
    'priorities': {
        'articles': 0.6,
        'indexes': 0.6,
        'pages': 0.5,
    },
    'changefreqs': {
        'articles': 'monthly',
        'indexes': 'daily',
        'pages': 'monthly',
    }
}

SOCIAL = (
    ('github', 'https://github.com/alexandrevicenzi/Flex'),
    ('envelope', 'mailto:ayushkumarshah@gmail.com'),
    ('linkedin','https://np.linkedin.com/in/ayush7'),
    ('twitter','https://twitter.com/ayushkumarshah7'),
    ('facebook','https://www.facebook.com/ayushkumarshah'),
    ('reddit','https://www.reddit.com/user/ayushkumarshah')
)

STATIC_PATHS = ['images', 'extra']

# Main Menu
MAIN_MENU = True
MENUITEMS = (('Archives', '/archives'), ('Categories', '/categories'), ('Tags', '/tags'),)

# MARKDOWN = {
#     'extension_configs': {
#         'markdown.extensions.codehilite': {'css_class': 'highlight'},
#         'markdown.extensions.codehilite': {'linenums': None},
#         'markdown.extensions.extra': {},
#         # 'markdown.extensions.meta': {},
#         # 'markdown.extensions.toc': {},
#     },
#     'output_format': 'html5',
# }

PYGMENTS_STYLE = 'friendly'

# Feed generation is usually not desired when developing
FEED_DOMAIN = SITEURL
FEED_ALL_ATOM = 'feeds/all.atom.xml'
CATEGORY_FEED_ATOM = 'feeds/%s.atom.xml'
TRANSLATION_FEED_ATOM = None
AUTHOR_FEED_ATOM = None
AUTHOR_FEED_RSS = None

HOME_HIDE_TAGS = True
FEED_USE_SUMMARY = True