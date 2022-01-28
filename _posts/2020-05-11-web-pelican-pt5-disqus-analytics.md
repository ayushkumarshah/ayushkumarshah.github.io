---
title: Part 5 - Integrate Disqus comments and Google Analytics with Pelican
date: 2020-05-11 00:45
categories: [Pelican-for-website-creation]
summary: Learn to link Disqus comments and Google Analytics to your site
tags: [pelican, Disqus, comments, discussion, website, analytics]
author: Ayush Kumar Shah
---

This article is a part of a series of articles for web development using pelican. So, if you haven't read the previous
articles, please check it out by clicking the links below.

[Creating and deploying static websites using Markdown and the Python library Pelican](https://shahayush.com/2020/03/web-pelican-intro)

- [Part 1: Setting up Pelican - Installation and Theme](https://shahayush.com/2020/03/web-pelican-pt1-setup)
- [Part 2: Writing content using Markdown](https://shahayush.com/2020/03/web-pelican-pt2-markdown)
- [Part 3: Hosting your website to GitHub Pages and custom domain](https://shahayush.com/2020/03/web-pelican-pt3-hosting)
- [Part 4: Setting up Travis-CI for automating deployment](https://shahayush.com/2020/05/web-pelican-pt4-travisci)

Up to this point, you have created and hosted your static website on GitHub pages/custom domain and also learned to automate deployment.

Now, let's integrate [Disqus comment service]((https://disqus.com/)) system and google analytics into our
site to analyze the in-depth detail about the visitors on your website.

## I. Integrate Disqus Comments

- Initially, go to the [Disqus website]((https://disqus.com/)) and create an account. After creating your account, you will see 2 options as shown below:

![disqus-options](/assets/img/sample/disqus-options.png)

- Select the 2nd option i.e. `I want to install Disqus on my site`. Then fill up the fields like Website Name and Category as shown below.

![disqus-create](/assets/img/sample/disqus-create.png)

In the website name field, you may enter any name for your website.

- In the next step, you will have to select a subscription plan. Select the basic plan as shown.

![disqus-plan](/assets/img/sample/disqus-plan.png)

- Then select `I don't see my platform listed` option as shown.

![disqus-platform](/assets/img/sample/disqus-platform.png)

- Skip the installation step, go to the bottom of the page, and click `Configure`.

![disqus-config](/assets/img/sample/disqus-config.png)

- Add the website name (the GitHub page link or the custom domain if you have it linked) as shown below. 

![disqus-finalconfig](/assets/img/sample/disqus-finalconfig.png)

- Go to `Edit Settings` and click `General`. There, you can see your Disqus website shortname in the `Shortname` field. Copy that name.

![disqus-editsettings](/assets/img/sample/disqus-editsettings.png)

![disqus-shortname](/assets/img/sample/disqus-shortname.png)

- Add the following line with the value copied from above to both the files `publishconf.py` and `pelicanconf.py`

```python
DISQUS_SITENAME = 'ayushblog-2'
```

That's it. You can check by using the command

```console
(.venv) fab reserve
```

Then visit [localhost:8000](localhost:8000). At the bottom, you can see the Disqus comment section. Sometimes, it doesn't appear in localhost. But don't worry, it will still appear in the website.

![disqus-comment](/assets/img/sample/disqus-comment.png)

You can push the updated source code to view the changes on your website.

You can configure the appearance and other preferences of the comment system by logging in to this link: [Disqus admin panel](https://disqus.com/admin/). You can also choose to moderate the comments before making it visible to the public. If you do so, you can moderate the comments by going to the [moderate section of disqus](https://disqus.com/admin/moderate/). You can approve or delete the comment. 

![disqus-approve](/assets/img/sample/disqus-approve.png)

Now, just push the source code and you are ready to go.

You can approve the comments by logging in to [Disqus](https://disqus.com/)

## II. Integrate Google Analytics

Now, let's learn to integrate Google Analytics in our website.


- Create an account for google analytics by visiting this link: [Analytics - Create Account](https://analytics.google.com/analytics/web/provision/#/provision/create). Write an account name.

![analytics-create-name](/assets/img/sample/analytics-create-name.png)

- Select `Web` and click `Next`.

![analytics-create-web](/assets/img/sample/analytics-create-web.png)

- Fill in the information as shown below and click `Create`.

![analytics-create-property](/assets/img/sample/analytics-create-property.png)

- Accept all the terms and conditions.

![analytics-create-terms](/assets/img/sample/analytics-create-terms.png)

![analytics-tracking](/assets/img/sample/analytics-tracking.png)

- Then, you will get a `Tracking ID`. Copy the `Tracking ID` and paste it in the file `publishconf.py` as shown below.

```python
GOOGLE_ANALYTICS = "UA-166070073-1"
```

That's all. Now just push the updated source code to the source branch and the analytics of your website will be tracked by google.

To view your detailed analytics, just log in to the [Google Analytics website](https://analytics.google.com/analytics/web/). 

You can view detailed stats of your website visitors like the number of total visitors, active visitors, bounce rate, location of visitors. You can also view the real-time data of your visitors. How cool
is that?

![analytics](/assets/img/sample/analytics.png)

**`Congratulations!!`** You have completed the entire series of articles on [Creating and deploying static websites using Markdown and the Python library
Pelican](https://shahayush.com/2020/03/web-pelican-intro).

If you have any confusion in any article, feel free to comment on your queries. I will be more than happy to help. I am
also open to suggestions and feedbacks.  

>Also, you can use my GitHub repository for my blog post: [**ayushkumarshah.github.io**](https://github.com/ayushkumarshah/ayushkumarshah.github.io/tree/pelican-backup) as a
reference in any point of the article. I have followed the same steps mentioned in this series to create my blog
website that you are seeing right now.

If you want to visit any specific parts of the article, you can do so from the links below.

- [Part 1: Setting up Pelican - Installation and Theme](https://shahayush.com/2020/03/web-pelican-pt1-setup)
- [Part 2: Writing content using Markdown](https://shahayush.com/2020/03/web-pelican-pt2-markdown)
- [Part 3: Hosting your website to GitHub Pages and custom domain](https://shahayush.com/2020/03/web-pelican-pt3-hosting)
- [Part 4: Setting up Travis-CI for automating deployment](https://shahayush.com/2020/05/web-pelican-pt4-travisci)
- [<span style="color:green">Part 5: Integrate Disqus Comments and Google Analytics with Pelican</span>](https://shahayush.com/2020/05/web-pelican-pt5-disqus-analytics)

Or, go to the [home-page of the article.](https://shahayush.com/2020/03/web-pelican-intro)
