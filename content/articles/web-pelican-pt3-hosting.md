Title: Part 3: Hosting your website to GitHub Pages and custom domain
Date: 2020-03-28 22:30
Modified: 2020-05-10 00:38
Category: Pelican for website creation
Slug: web-pelican-pt3-hosting
Summary: Learn to host your website in github pages or custom domain for free.
Tags: pelican, python, github-pages
Authors: Ayush Kumar Shah
Status: published

This article is a part of a series of articles for web development using pelican. So, if you haven't read the previous
articles, please check it out by clicking the links below.

[Creating and deploying static websites using Markdown and the Python library Pelican](https://shahayush.com/2020/03/web-pelican-intro)

- [Part 1: Setting up Pelican - Installation and Theme](https://shahayush.com/2020/03/web-pelican-pt1-setup)
- [Part 2: Writing content using Markdown](https://shahayush.com/2020/03/web-pelican-pt2-markdown)

Upto this point, you have created your static website locally. You surely want to share it with the public so that they
can view your articles. There are several ways of deploying your websites but the best option is by using github pages.

## Why Github Pages?

1. It is completely free of cost. You don't need to buy any hosting services. Github hosts your website for free.

2. It is secure and reliable as the website is hosted in a secure github server.

3. It becomes easy to organize and keep track of your source code.

## Let's get started

### 1. Create and associate a github repo

- If you don't already have a github account, go to [github](https://github.com) and create one.

- Login to [github](https://github.com) and create a repository with the name username.github.io (Replace username by
  your github's username) and copy the clone address as shown in the gif below.

    ![create_repo](/images/create_repo.gif){.img-center}

- Now, goto your project directory i.e. `'web_development'` perform the following commands to add your remote
  repository that you just created to your project.

```console
(.venv) $ git init
(.venv) $ git remote add origin 'https://github.com/ayushblog/ayushblog.github.io.git'
```

> Use the url that you just copied from the repository you created.

- Also, add your github email address and username to git. You can find your username by logging into
  [github](https://github.com) and finding the name as shown below.

    ![username](/images/username.png){.img-center}

```console
(.venv) $ git config --global user.email "your-github-email"
(.venv) $ git config --global user.name "your-github-name"
```

- We will be using 2 branches in our repository - `source` and `master`.

    - `source:` store the source code of our project (i.e. all folders and files except the output folder)

    - `master:` store the contents of the output folder. i.e. all the html files generated after building the site. The
      master branch will be used to host the website to github-pages.

- So, let's switch to the `source` branch.

```console
# Create and switch to a new branch source
(.venv) $ git checkout -b source
```

- Create a `.gitignore` file to mark the files which should not be added into the repository.

```console
(.venv) $ touch .gitignore
```

- Copy all the lines from this link: [.gitignore](https://raw.githubusercontent.com/ayushkumarshah/ayushkumarshah.github.io/source/.gitignore) and paste it in the newly created `.gitignore` file.

- You may also create a `Readme.md` file for your repository. Create it in the main directory `web_development`

```console
(.venv) $ touch Readme.md
```

- You can add information about your project in the `Readme.md` file  similar to mine. You can copy it from this link:
 [Readme.md](https://raw.githubusercontent.com/ayushkumarshah/ayushkumarshah.github.io/source/README.md) and modify it accordingly. 

### 2. Build and publish your website

- Let's modify the configuration for publishing the website by opening `publishconfig.py` and modifying/adding the following settings.

```python
SITEURL = 'https://username.github.io'
DOMAIN = SITEURL
FEED_DOMAIN = SITEURL
HTTPS = True
```

- Also, let's modify the commands in the file `fabfile.py`. Open the file and add the following settings if not
  present already.

```python
# Local path configuration (can be absolute or relative to fabfile)
env.deploy_path = 'output'
DEPLOY_PATH = env.deploy_path
env.msg = 'Update blog'   # Commit message

# Github Pages configuration
env.github_pages_branch = "master"

# Port for `serve`
SERVER = '127.0.0.1'
PORT = 8000
```

- Also, we need to add a `deploy()` function in `publishconfig.py`.

```python
def deploy():
    """Push to GitHub pages"""
    env.msg = "Build site"
    clean()
    preview()
    local("ghp-import -m '{msg}' -b {github_pages_branch} {deploy_path}".format(**env))
    local("git push origin {github_pages_branch}".format(**env))
```

So, your source code is ready. Let's add it to the repository using the following commands:

```console
(.venv) $ git add -A
(.venv) $ git commit -m "Add source code for first post"
(.venv) $ git push origin source
```

- Now, perform the following command to build and publish the site to the master branch

```console
(.venv) $ fab deploy
```

> Note: Always work in the source branch during development. The deploy() function will push the conents of output folder
into the master branch. So, you don't need to worry about it. So, every time you add an article, just follow the steps
above by first pushing the source code to the source repository and then running the deploy function.

**Congratulations!** your site has been hosted to github pages publicly. To check your website, open your browser on any
device and visit [https://your-username.github.io](https://your-username.github.io).

![Github Site](/images/github_site.png){.img-center}

That's it. You have now learnt to create and host your static website in github pages.

### 3. Linking your site to a custom domain (Optional)

You might want to host your site to a custom domain of your choice  rather than github pages. This can be done
completely free of cost if you have a custom domain registered already.

If you don't have a custom domain, you can buy them at several websites like [Namesilo](https://www.namesilo.com/),
[GoDaddy](https://in.godaddy.com/domains), etc.

You can make your domain secure and managebale using [Cloudflare Service](https://cloudflare.com/)

- The first step is to create a file called `CNAME` inside the `content/extra ` directory.

```console
(.venv) $ touch content/extra/CNAME
```

- Then, add (copy and paste) the name of your site i.e. `www.your-site-name.com` in the file `CNAME`.

- Change the value of `SITEURL` in the `publishconf.py` file.

```python
SITEURL = 'https://you-site-name.com'
```

- Now, you need to redirect your site to point to your contents hosted in github-pages. For that, you need to use your
  domain management site which you used to buy the domain or some 3rd party management site like
  [Cloudflare](https://www.cloudflare.com).

  - Go to the DNS section and add A records one by one to redirect your site to following 4 ip addresses (github-pages):
    You can see the image below for reference. I used [Cloudflare](https://www.cloudflare.com) for DNS management.

    - 185.199.108.153
    - 185.199.109.153
    - 185.199.111.153
    - 185.199.110.153

  ![dns](/images/dns.png){.img-center}

- If you want to redirect the github-pages site to your custom domain, then goto the repository settings and add your
  site name in the Custom domain field of Github Pages section as shown below.

![custom-github](/images/custom-github.png){.img-center}

Congratulations!! Your blogs have been redirected to tour own custom domain. You can browse your site and check if it is
working.

### 4. Add forked repo of theme **(Optional)**

This is an optional step. Perform these steps only if want to modify or tweak with the theme (Flex in this case) to give
your website a slightly different look. You may modify colours, styles or even perform changes in the design (if you
some knowledge on web development - html and css).

Since you have cloned the repository of theme directly, modifying it directly is not a good idea since you will have
issues updating the theme to a newer version.

Hence, you will create your own version of the theme repository instead i.e. forking the repository. I will demonstrate
using the Flex theme but you may follow the exact same steps for other themes as well. Follow these steps (also shown in
the gif below):

- First let's delete the previous cloned repository of the Flex theme.

```console
(.venv) $ rm -rf themes/Flex
```

- Now, open and fork the [Flex
  repository](https://github.com/alexandrevicenzi/Flex/tree/b3bd59002a3e85803332c35702d90e1e19ef39b6) or the repository
  of the theme you chose.

- Then, copy the `https` (not ssh) link of the forked repository.

![Forking_and_cloning_repo](/images/fork_clone.gif){.img-center}

- Now, clone the forked repo in your project.

    Paste the link you copied from the forked repo instead of `https://github.com/ayushkumarshah/Flex.git` and
        `themes/name_of_theme` as 2nd argument in the command below.

```console
(.venv) $ git clone 'https://github.com/ayushkumarshah/Flex.git' 'themes/Flex'
```

Now, you may modify the theme by tweaking with the html and css files inside the `themes/Flex/` directory and then
commit the changes to the forked repository separately.

In the next part, learn to automate the process of pushing to source and deploying to master branch by using Continuous Integration
tools like [Travis-CI](https://travis-ci.org/) in the [part
4](https://shahayush.com/2020/03/web-pelican-pt1-setup) of the article.

- [Part 1: Setting up Pelican - Installation and Theme](https://shahayush.com/2020/03/web-pelican-pt1-setup)
- [Part 2: Writing content using Markdown](https://shahayush.com/2020/03/web-pelican-pt2-markdown)
- [<span style="color:green">Part 3: Hosting your website to GitHub Pages and custom domain</span>](https://shahayush.com/2020/03/web-pelican-pt3-hosting)
- [**Part 4: Setting up Travis-CI for automating deployment**](https://shahayush.com/drafts/web-pelican-pt4-travisci)
- [Part 5: Integrate Disqus comments with Pelican](https://shahayush.com/drafts/web-pelican-pt5-disqus)
- [Part 6: Integrate Google Analytics with Pelican](https://shahayush.com/drafts/web-pelican-pt6-analytics)

Or, goto the [home-page of the article.](https://shahayush.com/2020/03/web-pelican-intro)