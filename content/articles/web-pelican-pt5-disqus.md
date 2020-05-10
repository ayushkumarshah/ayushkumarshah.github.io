Title: Part 5: Integrate Disqus comments with Pelican
Date: 2020-05-11 00:45
Category: Pelican for website creation
Slug: web-pelican-pt5-disqus
Summary: Learn to link disqus comments to your site
Tags: pelican, disqus, comments, discussion, website
Authors: Ayush Kumar Shah
Status: published

This article is a part of a series of articles for web development using pelican. So, if you haven't read the previous
articles, please check it out by clicking the links below.

[Creating and deploying static websites using Markdown and the Python library Pelican](https://shahayush.com/2020/03/web-pelican-intro)

- [Part 1: Setting up Pelican - Installation and Theme](https://shahayush.com/2020/03/web-pelican-pt1-setup)
- [Part 2: Writing content using Markdown](https://shahayush.com/2020/03/web-pelican-pt2-markdown)
- [Part 3: Hosting your website to GitHub Pages and custom domain](https://shahayush.com/2020/03/web-pelican-pt3-hosting)
- [Part 4: Setting up Travis-CI for automating deployment](https://shahayush.com/2020/05/web-pelican-pt4-travisci)

Upto this point, you have created and hosted your static website on github pages / custom domain and also learnt to automate deployment.

Now, let's integrate [Disqus comment service]((https://disqus.com/)) system in the articles.

- Initially, go to the [Disqus website]((https://disqus.com/)) and create an account. After creating your account, you will see 2 options as shown below:

![disqus-options](/images/disqus-options.png){.img-center}

- Select the 2nd option i.e. `I want to install Disqus on my site`. Then fill up the fields like Website Name and Category as shown below.

![disqus-create](/images/disqus-create.png){.img-center}

In the website name field, you may enter any name for your website.

- In the next step, you will have to select a subscription plan. Select the basic plan as shown.

![disqus-plan](/images/disqus-plan.png){.img-center}

- Then select `I don't see my platform listed` option as shown.

![disqus-platform](/images/disqus-platform.png){.img-center}

- Skip the installation step, goto the bottom of the page and click `Configure`.

![disqus-config](/images/disqus-config.png){.img-center}

- Add the website name (the github page link or the custom domain if you have it linked) as shown below. 

![disqus-finalconfig](/images/disqus-finalconfig.png){.img-center}

- Go to `Edit Settings` and click `General`. There, you can see your disqus website shortname in the `Shortname` field. Copy that name.

![disqus-editsettings](/images/disqus-editsettings.png){.img-center}

![disqus-shortname](/images/disqus-shortname.png){.img-center}

- Add the following line with the value copied from above to both the files `publishconf.py` and `pelicanconf.py`

```python
DISQUS_SITENAME = 'ayushblog-2'
```

That's it. You can check by using the command

```console
(.venv) fab reserve
```

Then visit [localhost:8000](localhost:8000). At the bottom, you can see the disqus comment section.

![disqus-comments](/images/disqus-comments.png){.img-center}

You can push the updated source code to view the changes in your website.

Whenever someone comments, then it is added in the disqus site rather than directly being posted. You need to approve the comment by going to the [moderate section of disqus](https://disqus.com/admin/moderate/). You have the ability to approve or delete the comment. If you approve, only then it can be viewed by everyone in your website.

![disqus-approve](/images/disqus-approve.png)

Now, just push the source code and you are ready to go.

You can approve the comments by logging in to [Disqus](https://disqus.com/)

Learn to integrate Google Analytics in your website in the [part
6](https://shahayush.com/2020/03/web-pelican-pt6-analytics) of the article.

If you have any confusion in any article, feel free to comment your queries. I will be more than happy to help. I am
also open to suggestions and feedbacks.  

>Also, you can use my github repository for my blog post: [**ayushkumarshah.github.io**](https://github.com/ayushkumarshah/ayushkumarshah.github.io) as a
reference in any point of the article. I have followed the exact same steps mentioned in this series to create my blog
website that you are seeing right now.

If you want to visit any specific parts of the article, you can do so from the links below.

- [Part 1: Setting up Pelican - Installation and Theme](https://shahayush.com/2020/03/web-pelican-pt1-setup)
- [Part 2: Writing content using Markdown](https://shahayush.com/2020/03/web-pelican-pt2-markdown)
- [Part 3: Hosting your website to GitHub Pages and custom domain](https://shahayush.com/2020/03/web-pelican-pt3-hosting)
- [Part 4: Setting up Travis-CI for automating deployment](https://shahayush.com/2020/05/web-pelican-pt4-travisci)
- [<span style="color:green">Part 5: Integrate Disqus comments with Pelican</span>](https://shahayush.com/2020/05/web-pelican-pt5-disqus)
- [**Part 6: Integrate Google Analytics with Pelican**](https://shahayush.com/2020/05/web-pelican-pt6-analytics)

Or, goto the [home-page of the article.](https://shahayush.com/2020/03/web-pelican-intro)