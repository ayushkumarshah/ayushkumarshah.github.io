Title: Web development using Pelican and Travis-CI - Part 3: Hosting your website to GitHub Pages and custom domain
Date: 2020-03-17 00:00
Category: Web development and hosting
Slug: web-develop-pt3-github-pages
Summary: In this article, you will learn how to install pelican and set up your project. You will also learn to install a theme for your website.
Tags: pelican, python, pelican-plugin, pneumatic
Authors: Ayush Kumar Shah
Status: draft

- First, open and fork the [Flex
  repository](https://github.com/alexandrevicenzi/Flex/tree/b3bd59002a3e85803332c35702d90e1e19ef39b6) or the repository
  of the theme you chose.

- Then, copy the **https** (not ssh) link of the forked repository.

![Forking_and_cloning_repo](/images/fork_clone.gif){.img-center}

- Add the repo as a submodule in your project.

    Paste the link you copied from the forked repo instead of `https://github.com/ayushkumarshah/Flex.git` and
        `themes/name_of_theme` as 2nd argument in the command below.

      (.venv) $ git submodule add https://github.com/ayushkumarshah/Flex.git themes/Flex
