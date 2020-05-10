Title: Creating and deploying static websites using Markdown and the Python library Pelican
Date: 2020-03-19 21:00
Category: Pelican for website creation
Slug: web-pelican-intro
Summary: Get to know how markdown and the python library pelican can be used to create your static website.
Tags: pelican, python, markdown, github-pages, travis-ci, disqus, google analytics
Authors: Ayush Kumar Shah
Status: published

You may have the desire to build your personal site and host it in your own domain name but several obstacles like
incomplete knowledge of HTML and CSS, databases; financial burden to host your site; the complexities of deployment and
continuous integration pipelines, etc might have prevented  you from doing so.

In this article, I will explain the complete steps to build your personal static website using a static site generator
called [Pelican](https://docs.getpelican.com/en/stable/index.html), which is written in Python, deploy it on [GitHub
Pages](https://pages.github.com/) along with continuous integration (CI) using [Travis-CI](https://travis-ci.org/) and
linking it to your custom domain name, all without requiring the knowledge of HTML and CSS, databases or deployment
pipelines. Furthermore, I will also explain the way to integrate a comment system called [Disqus](https://disqus.com/)
in your site and also help you to link [Google analytics](https://analytics.google.com/analytics/web/) to your site so
that you can analyze in-depth detail about the visitors on your website.

The most striking advantage about this technique is that you can perform the complete process for free except the fee to
register your domain name. You can also avoid this fee by hosting the site only on GitHub pages where you can host a
website like `your_username.github.io`. The only prerequisite for completing this process is the basic knowledge of
Python and Markdown for writing the articles. You might have used Markdown in jupyter notebook or in the `Readme.md`
file of your GitHub repository. Don't worry if you are completely unaware about them. You can still manage to learn them
through this article as they are extremely simple to catch up.

### Advantages of Pelican over wordpress

You may wonder that the same thing can be achieved using wordpress and has a wider community compared to pelican. So,
why use Pelican? I have listed a few advantages of Pelican over wordpress written by [Vincent Cheng](http://www.vcheng.org/) in his article [Migrating from
Wordpress to
Pelican](http://www.vcheng.org/2014/02/22/migrating-from-wordpress-to-pelican/?fbclid=IwAR0dlc-OGv6B0fQ7rGSP5lHY3Ei0oNT6k9WwvX-_TB2yU_dC51uj1Y9gWkI).

1. **speed:** a static blog is going to be faster than a dynamically generated site, no matter how much you try to
   optimize your Wordpress site / cache / database. This site now serves up nothing more than HTML, CSS, and JS files.
2. **simplicity:** as mentioned above, there's no need to set up, configure, and optimize your Wordpress installation.
   Simplicity in this sense also refers to the fact that this site is now powered by a smaller, simple to understand
   stack, rather than a giant and much more complex PHP stack that regularly attracts attackers...
3. **improved workflow:** you can use your preferred editor and your preferred VCS to create and keep track of your blog
   posts. Markdown is a nice bonus as well (it's the sweet spot between a WYSIWYG editor and raw HTML).
4. **mobility/deployment:** static site = easier to move around (just copy the files; there's no database to worry
   about) and deploy (and often cheaper to deploy; you can do so for free with Github Pages, for example).
5. **less cost:** Switching to Pelican means that you get to move off of Wordpress.com infrastracture, hence no more ads (and no need
to pay $30/yr to get rid of them), no restrictions on the amount and type of content you upload, and being able to use your
own domain name (without having to pay extra for it), and of course not having to rely on a third-party to host your blog.

## Let's get started

For ease, I have divided the article into 6 parts as:

- [**Part 1: Setting up Pelican - Installation and Theme**](https://shahayush.com/2020/03/web-pelican-pt1-setup)
- [Part 2: Writing content using Markdown](https://shahayush.com/2020/03/web-pelican-pt2-markdown)
- [Part 3: Hosting your website to GitHub Pages and custom domain](https://shahayush.com/2020/03/web-pelican-pt3-hosting)
- [Part 4: Setting up Travis-CI for automating deployment](https://shahayush.com/2020/03/web-pelican-pt4-travisci)
- [Part 5: Integrate Disqus comments with Pelican](https://shahayush.com/drafts/web-pelican-pt5-disqus)
- [Part 6: Integrate Google Analytics with Pelican](https://shahayush.com/drafts/web-pelican-pt6-analytics)

Click on the respective links to get started.
