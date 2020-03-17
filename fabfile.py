import os
import shutil
import sys
import webbrowser
from datetime import datetime

from fabric.api import env, local, hide
from pelican.server import ComplexHTTPRequestHandler, socketserver

# Local path configuration (can be absolute or relative to fabfile)
env.deploy_path = 'output'
DEPLOY_PATH = env.deploy_path

# Branch to push on GitHub
env.gp_branch = 'master'
env.msg = 'Update blog'
SERVER = '127.0.0.1'
PORT = 8000

TEMPLATE = """
Title: {title}
Date: {year}-{month}-{day} {hour}:{minute}
Modified: {year}-{month}-{day} {hour}:{minute}
Category:
Tags:
Slug: {slug}
Summary:
Status: draft
"""


def newpost(title):
    """Generate template for new post"""
    today = datetime.today()
    slug = title.lower().strip().replace(' ', '-')
    file_location = "content/articles/{}.md".format(slug)
    t = TEMPLATE.strip().format(title=title,
                                year=today.year,
                                month=today.month,
                                day=today.day,
                                hour=today.hour,
                                minute=today.minute,
                                slug=slug)
    with open(file_location, 'w') as output_article:
        output_article.write(t)


def clean():
    """Remove generated files"""
    if os.path.isdir(DEPLOY_PATH):
        shutil.rmtree(DEPLOY_PATH)
        os.makedirs(DEPLOY_PATH)


def build():
    """Build local version of site"""
    local('pelican -s pelicanconf.py')


def rebuild():
    """`clean` then `build`"""
    clean()
    build()


def regenerate():
    """Automatically regenerate site upon file modification"""
    local('pelican -r -s pelicanconf.py')

def serve():
    """Serve site at http://localhost:8000/"""
    os.chdir(env.deploy_path)

    socketserver.TCPServer.allow_reuse_address = True

    try:
        httpd = socketserver.TCPServer(
            (SERVER, PORT), ComplexHTTPRequestHandler)
    except OSError as e:
        print("Could not listen on port %s, server %s." % (PORT, SERVER))
        sys.exit(getattr(e, 'exitcode', 1))

    print("Serving at https://%s:%s." % (SERVER, PORT))
    webbrowser.open_new_tab("http://127.0.0.1:8000/")

    try:
        httpd.serve_forever()
    except KeyboardInterrupt as e:
        print("Shutting down server.")
        httpd.socket.close()


def reserve():
    """`build`, then `serve`"""
    build()
    serve()


def preview():
    """Build production version of site"""
    local('pelican -s publishconf.py')


def deploy():
    """Push to GitHub pages"""
    env.msg = "Build site"
    clean()
    preview()
    local("ghp-import -m '{msg}' -b {gp_branch} {deploy_path}".format(**env))
    local("git push origin {gp_branch}".format(**env))


def publish(commit_message):
    """Automatic deploy  to GitHub Pages"""
    env.msg = commit_message
    env.GH_TOKEN = os.getenv('GH_TOKEN')
    env.TRAVIS_REPO_SLUG = os.getenv('TRAVIS_REPO_SLUG')
    clean()
    local('pelican -s publishconf.py')
    with hide('running', 'stdout', 'stderr'):
        local("ghp-import -m '{msg}' -b {gp_branch} {deploy_path}".format(**env))
        local("git push -fq https://{GH_TOKEN}@github.com/{TRAVIS_REPO_SLUG}.git {gp_branch}".format(**env))
