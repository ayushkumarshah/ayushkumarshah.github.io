#!/usr/bin/env python
# -*- coding: utf-8 -*-
from __future__ import unicode_literals

import bulrush

SITENAME = 'Ayush Kumar Shah'
DOMAIN = 'http://localhost:8000'

SITE_AUTHOR = 'Ayush Kumar Shah'
BROWSER_COLOR = '#333333'

GOOGLE_FONTS = [
    'Nunito Sans:300,700',
    'Source Code Pro',
]

ICONS_PATH = 'images/icons'
TWITTER_USERNAME = 'ayush7'

# Pelican settings (common for all themes)
RELATIVE_URLS = True
SITEURL = 'http://localhost:8000'
TIMEZONE = 'Asia/Kathmandu'
DEFAULT_DATE = 'fs'
DEFAULT_DATE_FORMAT = '%B %d, %Y'
DEFAULT_PAGINATION = 5

# Theme Location
THEME = 'themes/bulrush/bulrush'
JINJA_ENVIRONMENT = bulrush.ENVIRONMENT
JINJA_FILTERS = bulrush.FILTERS

# Social Widget (common for all themes)
SOCIAL = (
    ('GitHub', 'https://github.com/ayushkumarshah'),
    ('Email', 'mailto:ayushkumarshah@gmail.com'),
    ('Linkedin','https://np.linkedin.com/in/ayush7'),
    ('Twitter','https://twitter.com/ayushkumarshah7'),
    ('Facebook','https://www.facebook.com/ayushkumarshah'),
    ('Reddit','https://www.reddit.com/user/ayushify')
)

# Bulrush theme specific
NAVBAR_LABEL = 'Home'
DISPLAY_CATEGORIES_ON_MENU = False

# Main Menu (common for all themes)
MAIN_MENU = True
MENUITEMS = (('All Posts', '/archives'), ('Categories', '/categories'),  ('Contact', '/contact'), ('About', '/about'),)

# URL Configs (common for all themes)
ARTICLE_URL = '{date:%Y}/{date:%m}/{slug}/'
ARTICLE_SAVE_AS = ARTICLE_URL + 'index.html'

PAGE_URL = '{slug}/'
PAGE_SAVE_AS = PAGE_URL + 'index.html'

ARCHIVES_SAVE_AS = 'archives.html'
YEAR_ARCHIVE_SAVE_AS = '{date:%Y}/index.html'
MONTH_ARCHIVE_SAVE_AS = '{date:%Y}/{date:%m}/index.html'

# Disable authors (common for all themes)
DIRECT_TEMPLATES = ['index', 'archives', 'categories', 'tags']
AUTHOR_SAVE_AS = ''

# Disable Atom feed generation (common for all themes)
FEED_ATOM = 'atom.xml'
FEED_ALL_ATOM = None
CATEGORY_FEED_ATOM = '%s.atom.xml'
TAG_FEED_ATOM = None
TAG_FEED_RSS = None
TRANSLATION_FEED_ATOM = None

CACHE_CONTENT = False

FEED_USE_SUMMARY = True

TYPOGRIFY = True


# DELETE_OUTPUT_DIRECTORY = True
# OUTPUT_PATH = 'develop'
MAILCHIMP = dict(
    domain='shahayush.us18.list-manage.com',
    user_id='26347d45ca92bc78df74fba40',
    list_id='10ef08cad6',
    validation=True,
)

PATH = 'content'
PAGE_EXCLUDES = ['404.html']

STATIC_PATHS = ['images', 'extra']
IGNORE_FILES = ['.DS_Store', 'pneumatic.scss', 'pygments.css', 'icomoon.css']

extras = ['CNAME', 'favicon.ico', 'robots.txt', 'ads.txt']
EXTRA_PATH_METADATA = {'extra/%s' % file: {'path': file} for file in extras}

MARKDOWN = {
    'extension_configs': {
        'markdown.extensions.codehilite': {'css_class': 'highlight'},
        'markdown.extensions.extra': {},
        'markdown.extensions.meta': {},
        'markdown.extensions.toc': {},
    },
    'output_format': 'html5',
}

PLUGIN_PATHS = ['./pelican-plugins']
PLUGINS = ['assets', 'sitemap', 'post_stats', 'feed_summary', 'share_post', 'neighbors', 'related_posts',]

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
    },
    'exclude': ['author/']
}

# Enable comments
DISQUS_SITENAME = 'ayushkumarshah'

### Flex configurations

# SITETITLE = 'Ayush Kumar Shah'
# SITESUBTITLE = 'Ideas and Thoughts'
# SITELOGO = '/images/icons/avatar.png'
# FAVICON = '/images/icons/favicon.ico'
# STATIC_PATHS = ['images', 'extra']
# PYGMENTS_STYLE = 'friendly'