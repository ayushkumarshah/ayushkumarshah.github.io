#!/usr/bin/env python
# -*- coding: utf-8 -*- #

import os
import sys

sys.path.append(os.curdir)

from pelicanconf import *

# Deployment Settings
SITEURL = 'https://amitness.com'
DOMAIN = SITEURL
FEED_DOMAIN = SITEURL
RELATIVE_URLS = False
# USE_LESS = False
GOOGLE_ANALYTICS = "UA-98232022-1"

# Delete the output directory, before generating new files
DELETE_OUTPUT_DIRECTORY = True

# Custom settings
GOOGLE_SITE_VERIFICATION = "8JRd-0wjPb9VeEcjswP5o7DGRJLYALjS0AFQk27tfPE"
HTTPS = True

# Enable comments
DISQUS_SITENAME = 'amit-chaudharys-blog'

# Twitter Open Graph Tags
TWITTER_USERNAME = 'amitness'

# Setting for Amazon Affiliate Ads
ENABLE_AMAZON_ADS = False