#!/usr/bin/env python
# -*- coding: utf-8 -*-

# Theme-specific settings
import bulrush

SITENAME = 'Ayush Kumar Shah'
DOMAIN = 'http://localhost:8000'

BIO_TEXT = 'Ideas & Thoughts'

SITE_AUTHOR = 'Ayush Kumar Shah'
INDEX_DESCRIPTION = 'Machine Learning Engineer .'

SIDEBAR_LINKS = [
    '<a href="/about/">About</a>',
    '<a href="/contact/">Contact</a>',
]

ICONS_PATH = 'images/icons'

GOOGLE_FONTS = [
    'Nunito Sans:300,700',
    'Source Code Pro',
]

SOCIAL_ICONS = [
    ('mailto:ayushkumarshah@gmail.com', 'Email me', 'fa-envelope'),
    ('http://github.com/ayushkumarshah', 'Browse my projects', 'fa-github'),
    ('https://np.linkedin.com/in/ayush7', 'View Linkedin Profile', 'fa-linkedin'),
    ('https://twitter.com/ayushkumarshah7', 'View Twitter Profile', 'fa-twitter'),
    ('/atom.xml', 'Atom Feed', 'fa-rss'),
]

TWITTER_USERNAME = 'ayushkumarshah7'

THEME_COLOR = '#FF8000'

# Pelican settings
RELATIVE_URLS = True
SITEURL = 'http://localhost:8000'
TIMEZONE = 'Asia/Kathmandu'
DEFAULT_DATE = 'fs'
DEFAULT_DATE_FORMAT = '%B %d, %Y'
DEFAULT_PAGINATION = False
SUMMARY_MAX_LENGTH = 42

# Theme Location
THEME = 'themes/pneumatic'
# JINJA_ENVIRONMENT = bulrush.ENVIRONMENT
# JINJA_FILTERS = bulrush.FILTERS

DEFAULT_PAGINATION = 4

ARTICLE_URL = '{date:%Y}/{date:%m}/{slug}/'
ARTICLE_SAVE_AS = ARTICLE_URL + 'index.html'

PAGE_URL = '{slug}/'
PAGE_SAVE_AS = PAGE_URL + 'index.html'

ARCHIVES_SAVE_AS = 'archives.html'
YEAR_ARCHIVE_SAVE_AS = '{date:%Y}/index.html'
MONTH_ARCHIVE_SAVE_AS = '{date:%Y}/{date:%m}/index.html'

# Disable authors, categories, tags, and category pages
DIRECT_TEMPLATES = ['index', 'archives']
CATEGORY_SAVE_AS = ''
TAG_SAVE_AS = ''

# Disable Atom feed generation
FEED_ATOM = 'atom.xml'
FEED_ALL_ATOM = None
CATEGORY_FEED_ATOM = '%s.atom.xml'
TAG_FEED_ATOM = None
TAG_FEED_RSS = None
TRANSLATION_FEED_ATOM = None

TYPOGRIFY = True

CACHE_CONTENT = False
# DELETE_OUTPUT_DIRECTORY = True
# OUTPUT_PATH = 'develop'
PATH = 'content'
PAGE_EXCLUDES = ['404.html']

# templates = ['404.html']
# TEMPLATE_PAGES = {page: page for page in templates}

STATIC_PATHS = ['images', 'extra']
IGNORE_FILES = ['.DS_Store', 'pneumatic.scss', 'pygments.css', 'icomoon.css']

extras = ['CNAME', 'favicon.ico', 'robots.txt', 'ads.txt']
EXTRA_PATH_METADATA = {'extra/%s' % file: {'path': file} for file in extras}

MARKDOWN = {
    'extension_configs': {
        # 'markdown.extensions.codehilite': {'css_class': 'highlight'},
        'markdown.extensions.codehilite': {'linenums': None},
        'markdown.extensions.extra': {},
        'markdown.extensions.meta': {},
        'markdown.extensions.toc': {},
    },
    'output_format': 'html5',
}

PLUGIN_PATHS = ['./pelican-plugins']
PLUGINS = ['assets', 'neighbors', 'pelican_katex', 'sitemap', 'share_post']
# ASSET_SOURCE_PATHS = ['static']
# ASSET_CONFIG = [
#     ('cache', False),
#     ('manifest', False),
#     ('url_expire', False),
#     ('versions', False),
# ]


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

# Enable comments
DISQUS_SITENAME = 'ayushkumarshah'