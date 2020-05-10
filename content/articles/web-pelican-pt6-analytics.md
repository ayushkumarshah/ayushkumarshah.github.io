Title: Part 6: Integrate Google Analytics with Pelican
Date: 2020-05-11 01:45
Category: Pelican for website creation
Slug: web-pelican-pt6-analytics
Summary: Learn to link google analytics to your site
Tags: pelican, analytics, analyze, website
Authors: Ayush Kumar Shah
Status: published

This article is a part of a series of articles for web development using pelican. So, if you haven't read the previous
articles, please check it out by clicking the links below.

[Creating and deploying static websites using Markdown and the Python library Pelican](https://shahayush.com/2020/03/web-pelican-intro)

- [Part 1: Setting up Pelican - Installation and Theme](https://shahayush.com/2020/03/web-pelican-pt1-setup)
- [Part 2: Writing content using Markdown](https://shahayush.com/2020/03/web-pelican-pt2-markdown)
- [Part 3: Hosting your website to GitHub Pages and custom domain](https://shahayush.com/2020/03/web-pelican-pt3-hosting)
- [Part 4: Setting up Travis-CI for automating deployment](https://shahayush.com/2020/05/web-pelican-pt4-travisci)
- [Part 5: Integrate Disqus comments with Pelican](https://shahayush.com/2020/05/web-pelican-pt5-disqus)

Upto this point, you have created and hosted your static website on github pages/ custom domain and also learnt to integrate disqus comments. Now, we will learn to integrate google analytics in our
site in so that you can analyze in-depth detail about the visitors on your website.

- Create an account for google analytics by visiting this link: [Analytics - Create Account](https://analytics.google.com/analytics/web/provision/#/provision/create). Write an account name.

![analytics-create-name](/images/analytics-create-name.png){.img-center}

- Select `Web` and click `Next`.

![analytics-create-web](/images/analytics-create-web.png){.img-center}

- Fill in the information as shown below and click `Create`.

![analytics-create-property](/images/analytics-create-property.png){.img-center}

- Accept all the terms and conditions.

![analytics-create-terms](/images/analytics-create-terms.png){.img-center}

![analytics-tracking](/images/analytics-tracking.png){.img-center}

- Then, you will get a `Tracking ID`. Copy the `Tracking ID` and paste it in the file `publishconf.py` as shown below.

```python
GOOGLE_ANALYTICS = "UA-166070073-1"
```

That's all. Now just push the updated source code to the source branch and the analytics of your website will be tracked by google.

To view your detailed analytics, just login to the [Google Analytics website](https://analytics.google.com/analytics/web/). 

You can view detailed stats of your website visitors like number of total visitors, active visitors, bounce rate, location of visitors. You can also view the real-time data of your visitors. How cool
is that?

![analytics](/images/analytics.png){.img-center}

**`Congratulations!!`** You have completed the entire series of articles on [Creating and deploying static websites using Markdown and the Python library
Pelican](https://shahayush.com/2020/03/web-pelican-intro).

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
- [Part 5: Integrate Disqus comments with Pelican](https://shahayush.com/2020/05/web-pelican-pt5-disqus)
- [<span style="color:green">Part 6: Integrate Google Analytics with Pelican</span>](https://shahayush.com/2020/05/web-pelican-pt6-analytics)

Or, goto the [home-page of the article.](https://shahayush.com/2020/03/web-pelican-intro)