Title: Web development using Pelican and Travis-CI - Part 1: Setting up Pelican - Installation and Theme
Date: 2020-03-17 00:00
Category: Web development and hosting
Slug: web-develop-pt1-pelican-setup
Summary: In this article, you will learn how to install pelican and set up your project. You will also learn to install a theme for your website.
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

```console
$ mkdir web_development
$ cd web_development
```

## 1. Installation and Configuration

First, install virtualenv via pip and then create a virtual environment for your project.

```console
$ pip install virtualenv
$ virtualenv .venv
```

Activate the virtual environment

```console
$ source .venv/bin/activate
```

Now, install pelican inside the virtual environment

```console
(.venv) $ pip install pelican==3.7.1
(.venv) $ pelican-quickstart
```

Pelican asks a series of questions to help you get started by building required configuration files.

    Welcome to pelican-quickstart v3.7.1.

This script will help you create a new Pelican-based website. Please answer the following questions so this script can generate the files
needed by Pelican.

    > Where do you want to create your new web site? [.] .
    > What will be the title of this web site? Ayush Kumar Shah
    > Who will be the author of this web site? Ayush Kumar Shah
    > What will be the default language of this web site? [en] en
    > Do you want to specify a URL prefix? e.g., http://example.com   (Y/n) n
    > Do you want to enable article pagination? (Y/n) Y
    > How many articles per page do you want? [10] 5
    > What is your time zone? [Europe/Paris] Asia/Kathmandu
    > Do you want to generate a Fabfile/Makefile to automate generation and publishing? (Y/n) Y
    > Do you want an auto-reload & simpleHTTP script to assist with theme and site development? (Y/n) n
    > Do you want to upload your website using FTP? (y/N) N
    > Do you want to upload your website using SSH? (y/N) N
    > Do you want to upload your website using Dropbox? (y/N) N
    > Do you want to upload your website using S3? (y/N) N
    > Do you want to upload your website using Rackspace Cloud Files? (y/N) N
    > Do you want to upload your website using GitHub Pages? (y/N) y
    > Is this your personal page (username.github.io)? (y/N) y

Done. Your new project is available at `/Users/ayushkumarshah/Desktop/Blog_writing/web`

While answering the questions, please keep these things in mind:

- Title and Author: Replace `Ayush Kumar Shah` with the title and author's name that you want.
- Default language : You can set any language using the standard [ISO 639.1](https://www.loc.gov/standards/iso639-2/php/code_list.php) 2 letter code.

- Article Pagination: If you do not want to limit the number or articles in a page, enter n.

- Time zone: Choose your timezone from the [Wikipedia](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones).

- Fabfile will help in the further processes. So enter Y.

You may delete the Makefile as we will not be using it.

```console
(.venv) $ rm Makefile
```

After successfully running the command, your directory should look like this:

    web_development
        ├── content/
        ├── fabfile.py
        ├── output/
        ├── pelicanconf.py
        └── publishconf.py

Let me tell you with the purpose of each of these files :

- content/ - directory that stored al the website content
- fabfile.py - script that helps us automate website genration and publishing
- output/ - directory which stores the html files of the generated static website
- pelicanconf.py - file containing all the configurations of the website
publishconf.py - file containing additional website configurations used while publishing the website

## 2. Generate and view your website

Till now, we have installed and configured pelican successfully. 

Let's generate our first website and preview what it looks like. Make sure you are inside .venv environment. We will
first install Fabric which is required to run scripts from fabfile.py.

```console
(.venv) $ pip install Fabric==1.13.2
(.venv) $ pip install Fabric3==1.14.post1
```

Open fabfile.py and replace all instances of SocketServer by socketserver. (SocketServer is for python2).

```python
# import SocketServer
import socketserver
...
# class AddressReuseTCPServer(SocketServer.TCPServer):
class AddressReuseTCPServer(socketserver.TCPServer):
```

Now, we are ready to generate and view our site.

```console
(.venv) $ fab build
(.venv) $ fab serve
```

You may also run a single command equivalent to the 2 commands above:

```console
(.venv) $ fab reserve
```

After running the command, you will notice html files generated inside the output folder. These files are the html files
of your website.

Your website should be already running in port 8000 of your localhost. To view your website, open your browser and
visit
[localhost:8000](localhost:8000)

Congratulations, you have generated your first website.

[![First site](/images/first_site.png){.img-center}](https://ibb.co/wLVFGcf)

Click the image to view the full sized image.

## 3. Installing Pelican Themes

Now that we have built our website, let's make the design more beautiful and responsive. There are numerous Pelican
themes to choose from. Both the [live version of the themes](http://www.pelicanthemes.com/) and the
[repositories](https://github.com/getpelican/pelican-themes) are available. You can check them out and select the one
that suits your website. My favorite themes are
[Flex](https://github.com/alexandrevicenzi/Flex) ([live
version](http://flex.alxd.me/blog/)), [Pneumatic](https://github.com/iKevinY/pneumatic) ([live version](https://kevinyap.ca/)) and
[Bulrush](https://github.com/textbook/bulrush) ([live version](https://blog.jonrshar.pe/)).

> I will demonstrate using the
[Flex](https://github.com/alexandrevicenzi/Flex) theme.

First, open and clone the [Flex
  repository](https://github.com/alexandrevicenzi/Flex) or the repository
  of the theme you chose. Make sure you are inside the web_development directory.

```console
(.venv) $ git clone https://github.com/alexandrevicenzi/Flex.git themes/Flex
```
Here, the 2nd argument is the destination directory of the theme in your project. You can replace `themes/Flex` by
`themes/name_of_theme`.

Now, specify the path of your theme in the configuration file `pelicanconf.py` by adding the following line:

    THEME = 'themes/Flex'

Although Flex theme reqires no additional plugin, most of the themes require various Pelican plugins. So, let's download the
[pelican-plugins](https://github.com/getpelican/pelican-plugins) into your project. Note that you may skip this step if
you want to use [Flex](https://github.com/alexandrevicenzi/Flex) theme.

```console
(.venv) $ git clone https://github.com/getpelican/pelican-plugins.git
```

Now, add the path of the plugins in `pelicanconf.py` in the similar way as before by adding the following lines:

    PLUGIN_PATHS = ['./pelican-plugins']

Also add the a line specifying a list of plugins required in your theme. You can view the name of plugins required in
the repository of the theme.

    PLUGINS = ['sitemap', 'post_stats', 'feed_summary']

At this state, your directory structure should look like this:

    web_development
        ├── content/
        ├── fabfile.py
        ├── output
            ├── ... (many html files)
        ├── themes
            ├── Flex/
        ├── pelican-plugins
            ├── ... (various plugin directories)
        ├── pelicanconf.py
        └── publishconf.py

If it doesn't, then you probably did something wrong.

So, by now we have successfully installed the [Flex](https://github.com/alexandrevicenzi/Flex) theme in our website. You

### Flex Configurations
We can check our new theme by generating and serving our new website again.

Close the previous reserve if it is still
running by pressing Ctrl+C or Cmd+C. Now,

```console
(.venv) $ fab reserve
```
Open your browser and visit
[localhost:8000](localhost:8000)

You should see your website in a new theme.

[![Flex](/images/Flex.png){.img-center}](https://ibb.co/ZJdh95N)

However, it is not customized to include your profile. So, let's customize the site by adding some attributes of
the theme.

First, let's create some folders inside the content directory.

```console
(.venv) $ mkdir content/images
(.venv) $ mkdir content/pages
(.venv) $ mkdir content/extras
```

Let's replace the default profile photo and favicon by your own.
> Copy the profile image `profile.png` and the collection of favicon files like `favicon.ico`, `favicon-16x16.png`, etc into the images directory you just created.

Note: A favicon is a small pixel icon that appears at the top of the browser before the site name. It serves as branding
for your website. You can create one [online](https://realfavicongenerator.net/#.XnO555MzZhE).

Also, install the following dependencies:

```console
(.venv) $ pip install bs4==0.0.1
(.venv) $ pip install beautifulsoup4==4.5.3
```

Different themes have different attributes or configurations.

Check the documentation or the Readme.md file
of the respective theme. For [Flex](https://github.com/alexandrevicenzi/Flex) theme, a sample pelicanconfig.py can be
found inside the docs folder. Check it for reference and also compare it with the [live version of the
theme](http://flex.alxd.me/blog/). You can find more examples of the configurations in the [Flex
Wiki](https://github.com/alexandrevicenzi/Flex/wiki) for reference.

I will demonstrate using a sample configuration for this theme. For that, add the following lines in your
`pelicanconfig.py` file.

    ### Flex configurations

    SITETITLE = 'Ayush Kumar Shah'  # Replace with your name
    SITESUBTITLE = 'Ideas and Thoughts'
    SITELOGO = '/images/profile.png'
    FAVICON = '/images/favicon.ico'

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

    # Add a link to your social media accounts
    SOCIAL = (
        ('github', 'https://github.com/alexandrevicenzi/Flex'),
        ('envelope', 'mailto:ayushkumarshah@gmail.com'),
        ('linkedin','https://np.linkedin.com/in/ayush7'),
        ('twitter','https://twitter.com/ayushkumarshah7'),
        ('facebook','https://www.facebook.com/ayushkumarshah'),
        ('reddit','https://www.reddit.com/user/ayushkumarshah')
    )

    STATIC_PATHS = ['images', 'extra']

    # # Blogroll
    # Add links to your about and contact page
    LINKS = (('About', '/pages/about'),
            ('Contact', '/pages/contact/'),)

    # Main Menu Items
    MAIN_MENU = True
    MENUITEMS = (('Archives', '/archives'),('Categories', '/categories'),('Tags', '/tags'),)


**Congratulations**, you have completed the basic setup for Pelican. 

However, your site has no content. Start writing content in the [part 2](https://shahayush.com/drafts/web-develop-pt2-content-markdown) of the article.

- [Part 2: Writing content using Markdown](https://shahayush.com/drafts/web-develop-pt2-content-markdown)
- [Part 3: Hosting your website to GitHub Pages and custom domain](https://shahayush.com/drafts/web-develop-pt3-github-pages)
- [Part 4: Setting up Travis-CI for continuous integration of Builds](https://shahayush.com/drafts/web-develop-pt1-pelican-setup)
- [Part 5: Linking Disqus comments to your website](https://shahayush.com/drafts/web-develop-pt1-pelican-setup)
- [Part 6: Using Google Analytics with Pelican](https://shahayush.com/drafts/web-develop-pt1-pelican-setup)

Or, goto the [home-page of the article.](https://shahayush.com/drafts/web-develop-pelican-travis-intro)