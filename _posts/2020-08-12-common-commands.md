---
layout: post
title: Common commands 
date: 2020-08-12 13:00
categories: [linux, mac]
summary: A curated list of common commands that makes usage easy
tags: [linux, mac, vim, tmux, neovim, ssh, i32m, brew, shell]
author: Ayush Kumar Shah
---

- [General Shell Commands](#general-shell-commands)
- [SSH Commands](#ssh-commands)
- [tmux commands](#tmux-commands)
- [Vim Commands](#vim-commands)
- [Git Commands](#git-commands)
- [i3wm commands](#i3wm-commands)
- [Brew bundle](#brew-bundle-for-osx)

# General shell commands

|||
|--|--|
|pwd| get current path
|pwd &#124; pbcopy | copy current path to clipboard (Use xcopy or xsel for linux)
|cd -  | go back to previous location|
|ls -ls| list files with detailed info (permission, date, symoblic links)|
|cat filename| show the contents of the file filename|
|free -h                 |Show RAM - space used and free           |
|df -h                    |Show disk information - sapce used and free           |
|du -sh .                 |Show total size occupied by current directory           |
|du -sh *                 |Show size of each file or folder in current directory           |
|du -sh * &#124; tail -1  |Show total size occupied by the last file in the current directory|
|stat filename            |Display file status         |
|top or htop or ytop             |Process info and CPU Usage  (You need to install htop or ytop)|
|man command-name         |Information about the command|
|tree [-aldf][-L level][-P pattern][-I pattern][-o filename] |display directory's contents in a  tree <br> a - all files <br> l - symbolic links <br> d - directories only <br> L - limit number of levels of directory <br> I - files not matching pattern <br> P - files matching pattern <br> o - output to filename <br> You need to install tree|
|`<C-T>`|fzf: fuzzy finding files or directories <br> You need to install fzf|
|`<C-R>`|fzf: fuzzy finding commands in history|
|`<Esc-C>`|fzf: fuzzy finding files or directories from current path|


# SSH Commands

## SSH Tunnelling

To access servers hosted on the remote machine from the local machine

```console
$ ssh -NL port_no_server:localhost:port_no_local username@ip-address
```

Example:

```console
$ ssh -NL 8888:localhost:8888 ayush@192.168.100.7
```

## Copy multiple files from remote to local:

```console
$ scp username@remote-ip:/some/remote/directory/\{file1,file2,file3\} /localpath
$ scp username@remote-ip:'/path1/file1 /path2/file2 /path3/file3' /localPath
```

## Other ssh commands

**Generate ssh key:**

Using ed25519 (more secure: Recommended)
```console
$ ssh-keygen -t ed25519
```

Using RSA
```console
$ ssh-keygen -t rsa -b 3072
```

**Save ssh host info**
Modify this file: `~/.ssh/config`

```config
Host *
    AddKeysToAgent yes
    UseKeychain yes
    IdentityFile ~/.ssh/id_rsa (path/to/key)

Host targaryen
    HostName 192.168.1.10
    User daenerys
    Port 7654

Host tyrell
    HostName 192.168.10.20

Host martell
    HostName 192.168.10.50

Host *ell
    User oberyn

Host * !martell
    LogLevel INFO

Host *
    User root
    Compression yes

```

**Save ssh password so that no need to re-enter every time**

Run this in client (not server)

```console
ssh-copy-id -i path/to/key.pub username@server-ip-address
```

Example:

```console
ssh-copy-id -i ~/.ssh/id_rsa.pub ayush@192.168.1.107
```

**Open server in nautilus / file explorer in linux**

```markdown
File explorer: Other locations > Connect to server > sftp://username@ip/
```

# tmux commands

|||
|--|--|
|tmux                      |Create a tmux session with default window name 0 
|tmux new -As name          |Create a tmux session with a name or attach to an existing session (if it exists)|
|tmux ls                   |List the active tmux sessions                                                |
|tmux a -t name            |Attach to an existing tmux session                                           |
|tmux kill-session- t name |Kill an existing tmux session                                           |
|`<prefix>` = `<c-B>` (default), can be changed to `<c-A>`  |                     |
|```<prefix>``` [%"] | (Splitting panes)                                           |
|[c-D] | (exit)                                                             |
|```<prefix>``` D | (get out )                                                     |
|```<prefix>``` c| Create a new window (appears in status bar)                   |
|```<prefix>``` 0| Switch to window 0                                            |
|```<prefix>``` 1| Switch to window 1                                            |
|```<prefix>``` x| Kill current window                                           |
|```<prefix>``` d| Detach tmux (exit back to normal terminal)                    |
|```<prefix>``` z| the active pane is toggled between zoomed and unzoomed        |
|```<prefix>``` space| switch between split orientations|
|```<prefix>``` !| Break current pane to a new window |
|```<prefix>``` \| Swap pane within a window |
|```<prefix>``` `<C-o>`| Swap pane within a window |
|```<prefix>``` :move-window -t 2| rename current window to 2 if 2 does not exist
|```<prefix>``` :resize-pane -D n| Resizes the current pane down by n cells
|```<prefix>``` :resize-pane -U n| Resizes the current pane upward by n cells
|```<prefix>``` :resize-pane -L n| Resizes the current pane left by n cells
|```<prefix>``` :resize-pane -R n| Resizes the current pane right by n cells
|```<prefix>``` :join-pane [-dhv] [-l size `|` -p percentage] [-s src-pane] [-t dst-pane] <br> Eg: `<prefix>` :join-pane -v -s 4 -t :1 | Join one pane to another  
|```<prefix>``` `<c-S>` | save current state <br> You need to install tmux-resurrect |
|```<prefix>``` `<c-R>` | reload saved state                                        |


# Vim commands

## I. Pure Vim

### Syntax:

Verbs (operations) + Noun (text on which operation is performed)

```
[count] [operation] [text object / motion]
```

### Run bash commands in vim

```vim
:[.]!command
```

`. (dot)` - outputs the command into the current buffer

### 1. VIM Verbs (operations)

|||
|--|--|
|c                                |change                                             |
|d                                |delete                                            |
|C                                |change everything from where your cursor is to the end of the line|
|D                                |delete everything from where your cursor is to the end of the line|
|dd                                |delete a line                             |
|x                                |delete a sigle character                                            |
|y| yank text into the copy buffer.                                                    |
|yy or Y| yank line into the copy buffer.                                                    |
|v| highlight one character at a time.                                                 |
|V |highlight one line at a time.                                                      |
|`<c-v>` | highlight by columns.                                                         |
|p| paste text after the current line.                                                 |
|P| paste text on the current line.                                                    |
|>| Shift Right                                                    |
|<| Shift Left                                                    |
|=| Indent |
|gU | make uppercase                                                                  |
|gu | make lowercase                                                                  |
|~ | swap case                                                                        |

### 2. VIM Nouns (text)

#### i. Text Objects 

Must be combined with verbs 

|||
|--|--|
|iw | inner word (non whitespace) (works from anywhere in a word)
|aw | word with surrounding white space (works from anywhere in a word) <br> aw ~ W. Difference in position. E.g. For dw, cursor must be at beginning, whereas daw works from any position.
|ib | inner bracket (the contents of an HTML tag)  
|ab | a bracket 
|it | inner tag (the contents of an HTML tag)  
|at | a tag block  
|i" | inner quotes
|a" | a quote
|ip | inner paragraph
|ap | a paragraph
|is | inner sentence
|as | a sentence

Combination examples:

|||
|--|--|
|gUiw| capitalize a word|
|ci(| change inner bracket|
|6dW| delete 6 words|
|yis| copy inner sentence|
|di"| delete inner quotes|

#### ii. Motions

Can be combined with verbs or used independently

|||
|--|--|
|[count] w/W | go a (word / word with whitespace) to right |
|[count] b/B | go a (word / word with whitespace) to left   |
|[count] e/E | go to the end of (word / word with whitespace) |
|[count] ]m | go to the beginning of next method |
|[count] h / j / k / l | left / down / up / right
|[count] f/F [char] [;,]+ | go to the next occurence of character   |
|[count] t/T [char] [;,]+ | go to just before the next occurence of character |
|% | move to matching parenthesis pair    |
|[count] +| down to first non blank char of the line.  |
|[count]$| moves the cursor to the end of the line.        |
|0| moves the cursor to the beginning of the line.                 |
|G| move to the end of the file.                                |
|gg| move to the beginning of the file.                         |

Combination examples:

|||
|--|--|
|3ce| Change 3 words to end |
|d]m| delete start of next method |
|ctL| change upto before the next occurence of L |
|d]m| delete start of next method |

### 3. Other important vim commands

|||
|--|--|
|i| Insert to left of cursor                |
|a| Insert to right of cursor                |
|A| insert at end of line                    |
|I| insert at beginning of line              |
|o| insert at beginning of next line              |
|O| insert at beginning of previous line              |
|u | undo                                  |
|`<c-r>` | will redo the last undo.            |
|/text| search for text                      |
|:%s/text/replacement text/g| search through the entire document for text and replace it with replacement text.
|:%s/text/replacement text/gc |search through the entire document and confirm before replacing text.
|*|search forward for word under cursor
|#|search backward for word under cursor
|:vsplit        |vertical split windows
|m[a-zA-Z]|sets a custom mark whose location can be accessed using `[mark] and line accessed using '[mark]|
|'.| move to the last edit                                                            |
|:marks| show all current marks that are being used                    |
|:q  | quit                                                                                 |
|:q! or ZQ | force quit                                                         |
|:wq or ZZ | write and quit                                        |
|:bd | remove buffer
|[:vert] :sf filename| find file and open in split mode
|`<c-v>` select multiple lines then I| insert at multiple lines     |
|q `<char`> commands q <br> @`<char`>| record command macros <br> apply recorded commands|


### 4. Useful key remappings 

|||
|--|--|
|jk (Custom- ```inoremap jk <Esc>``` ) |``<Esc>``
|kj (Custom)```inoremap kj <Esc>``` |``<Esc>``
|nnoremap ``<C-c>| <Esc>``
|nnoremap ``<C-s>``| :w``<CR>``
|nnoremap ``<C-Q>``| :wq!``<CR>``
|Better window navigation
|nnoremap ``<C-h>``| ``<C-w>h``
|nnoremap ``<C-j>``| ``<C-w>j``
|nnoremap ``<C-k>``| ``<C-w>k``
|nnoremap ``<C-l>``| ``<C-w>l``

### 5. Using Args

Args are list of files initially opened. So, it's a subset of buffers.

|||
|--|--|
|:args               |display args files
|:args **/*.yaml     |add files to args
|:sall               |open all args files in split mode
|:vert sall          |open all args files in vertical split mode
|:windo difft|show differences in all args files
|c-x, c-l|autocomplete
|:vim TODO/ ## |search in all args files|
|:cdo s/TODO/DONE/g |replace in all args files|

### 6. Scrolling and motions 

|||
|--|--|
|`<c-u`> , `<c-d`>|Up, down scroll|
|{ }|Up, down scroll between spaces|
|`<c-b`> , `<c-f`>|Up, down full screen scroll|
|`<c-y`> , `<c-e`>|Up, down scroll by lines|
|H / M / L|Navigations to top / middle / bottom|
|zt|Put current cursor position to top|
|zz|Put current cursor position to middle|
|zb|Put current cursor position to bottom|


## II. Vim Plugins commands

Install any vim plugin manager like vim-plug.

To apply latest settings:

```vim
:source $MYVIMRC
```

### Bulk-rename in ranger

- Select files to rename using visual selection
- :bulkrename
 
### 1. vim-surround commands

Install Plug `tpope/vim-surround`

|||
|--|--|
|ds['"bB[](){}t] |  delete surrounding quotes
|cs['"bB[](){}t] ['"bB[](){}t]| change surrounding quotes 
|ysiw['"bB[](){}t]|  add surrounding quotes "
|v-select, S['"bB[](){}t] | add surrounding 

Examples:

||||
|--|--|--|
|`<p>` Hello `</p>` |cst`<h2>` |  `<h2>` Hello `</h2>`
| if *x>3{ | ysW( | if ( x>3 ) {
|*"hello"| ysWf print<cr(Enter)>| print("hello")

### 2. Git plugins commands

Install these plugins first

```vim
" Show differences with style
Plug 'mhinz/vim-signify'
" Main GIT PLugin :Git
Plug 'tpope/vim-fugitive'
" Git Hub plugin, enables :Gbrowse
Plug 'tpope/vim-rhubarb'
" Git commit browser
Plug 'junegunn/gv.vim'
" Git commit history in each line
```


|||
|--|--|
|``<c-o>`` ``<c-i>`` | Toggle between buffers
|:Git diff      |Show git differences
|:Gdiffsplit    |Show differences in split mode
|:GBrowse       |Open the repository in github
|:GV            |Show git commit history 

### 3. Coc commands

Install COC plugin first

```vim
" Intellisense
Plug 'neoclide/coc.nvim', {'branch': 'release'}
```

|||
|--|--|
|gd | Goto Definitions of variable under cursor
|gr | Goto References of variable under cursor
|:CocInstall tool_name E.g. :CocInstall coc-python| Installing coc tools
|:CocUninstall tool_name| Uninstalling coc tools
|:CocList extensions (Tab for autocompletion)| Show extensions
|:CocCommand| execute a COC command
|o | expand/collapse in Coc explorer (First run :CocInstall coc-explorer)

### 4. coc-python

Install coc-python first

```vim
:CocInstall coc-python
```

|||
|--|--|
|Shift K | doc hint
|:Format | autopep8 formatting
|``<C-w>``w | Switch cursors between sidebar and code
|``<C-n>`` ``<C-n>`` ``<C-n>``<br> c <br> I <br> A | multiple cursors: <br> change <br> Insert at first <br> Insert at end

### 5. FZF

Install fzf in system and fzf plugin

OSx

```console
brew install fzf

# To install useful key bindings and fuzzy completion:
$(brew --prefix)/opt/fzf/install

brew install ripgrep
```

Linux

```console
sudo apt install fzf
sudo apt install ripgrep
```

FZF Plugin

```vim
Plug 'junegunn/fzf', { 'do': { -> fzf#install() } }
Plug 'junegunn/fzf.vim'
Plug 'airblade/vim-rooter'
```

|||
|--|--|
|:Rg | Find word inside file
|:BLines | Find all occurrences of word in a giant file
|:Lines | Same as above but search in all buffers
|:History: | History of commands ran in vim
|:Ag | similar to Rg but
|:Buffers | Search through buffers
|> | Tab
|gf | Goto file: open file directly from path written in vim


### 6. Startify

Install Startify Plugin for Project management

```vim
" Start Screen
Plug 'mhinz/vim-startify'
```

|||
|--|--|
|:SSave| Save session
|:SLoad| Load session

### 7. vim-commentary

```vim
" Better Comments
Plug 'tpope/vim-commentary'
```

|||
|--|--|
|gc`[<count>] <Text object>` (Examples below)| Comment out the target of a motion
|gcap| Comment out a paragraph
|gcw| Comment out the current line
|gc2j| Comment out the current line and 2 lines below it

Easy remapping
|nnoremap ``<leader>``/| :Commentary``<CR>``
|vnoremap ``<leader>``/| :Commentary``<CR>``

# Git commands

|||
|--|--|
|git commit --amend | add to previous commits
|git push origin -f branchname | forced push
|git rebase master | merge changes of master onto the current branch (first pull from master before rebase)
|git log
|git diff
|git remote -v | show repo information
|git reset --hard <SOME-COMMIT> eg git reset --hard HEAD@1
|git show
|git config --global user.name
|git config --global user.email
|git reset <file> | remove file from the current index (the "about to be committed" list) without changing anything else.
|git checkout filename | Undo local changes to latest commit

## Ignore files that have already been committed to the repo

```console
$ git rm -r --cached .
$ git add .
$ git commit -m "Clean up ignored files"
```

## Hard delete unpublished commits

```console
git reset --hard commit_id (reset to the particular commit. It will destroy any local modifications.)
```

## Alternatively, if there's work to keep

```console
git stash
git reset --hard commit_id
git stash pop
```

> This saves the modifications, then reapplies that patch after resetting. You could get merge conflicts, if you've modified things which were changed since the commit you reset to.

## Undo published commits with new commits

> This will create three separate revert commits:

```console
git revert a867b4af 25eee4ca 0766c053
```

> It also takes ranges. This will revert the last two commits:

```console
git revert HEAD~2..HEAD
```

> Similarly, you can revert a range of commits using commit hashes:

```console
git revert a867b4af..0766c053
```

> Reverting a merge commit

```console
git revert -m 1 <merge_commit_sha>
```

> To get just one, you could use `rebase -i` to squash them afterwards Or, you
> could do it manually (be sure to do this at top level of the repo)
> get your index and work tree into the desired state, without changing HEAD:

```console
git checkout 0d1d7fc32 .
```

> Then commit. Be sure and write a good message describing what you just did

```console
git commit
```

## Git reset

git reset does know five "modes": soft, mixed, hard, merge and keep. I will start with the first three, since these are the modes you'll usually encounter. After that you'll find a nice little a bonus, so stay tuned.

- soft

    When using

    ```console
    git reset --soft HEAD~1
    ```

     you will remove the last commit from the current branch, but the file changes
    will stay in your working tree. Also the changes will stay on your index, so following with a git commit will create a commit with the exact same changes as the commit you "removed" before.

- mixed

    This is the default mode and quite similar to soft. When "removing" a commit
    with

    ```console
    git reset HEAD~1
    ```

     you will still keep the changes in your working tree but not on the index; so if you want to "redo" the commit, you will have to add the changes (git add) before commiting.

- hard

    When using

    ```console
    git reset --hard HEAD~1
    ```

    you will lose all uncommited changes in addition to the changes introduced in the last commit. The changes won't stay in your working tree so doing a git status command will tell you that you don't have any changes in your repository.

    > Tread carefully with this one. If you accidentally remove uncommited changes which were never tracked by git (speak: committed or at least added to the index), you have no way of getting them back using git.

- Bonus (keep)

    ```console
    git reset --keep HEAD~1
    ```

    is an interesting and useful one. It only resets the files which are different between the current HEAD and the given commit. It aborts the reset if anyone of these files has uncommited changes. It's basically acts as a safer version of hard.

    > This mode is particularly useful when you have a bunch of changes and want to switch to a different branch without losing these changes - for example when you started to work on the wrong branch.

## Remove sensitive file from github repo history
```console
git filter-branch --index-filter "git rm -rf --cached --ignore-unmatch path_to_file" HEAD
git push -f origin master
```

## Other git commands

```console
git rm | rm plus git add combined
git rm --cached | file removed from the index (staging it for deletion on the next commit), but keep your  copy in the local file system.
```

# i3wm commands

- pavucontrol
- alsamixer

|||
|--|--|
|mod + r - resize mode , then arrow keys or vim keys
|mod + Shift + e - exit
|mod + d - dmenu
|mod+Shift+c reload
|mod+Shift+r restart

Alt+Shift- Change keyboard language

# Brew bundle for OSx

## Usage

Create a `Brewfile` in the root of your project with:

```bash
touch Brewfile
```

Add your dependencies in your `Brewfile`:

```ruby
tap "homebrew/cask"
tap "user/tap-repo", "https://user@bitbucket.org/user/homebrew-tap-repo.git"
cask_args appdir: "/Applications"

brew "imagemagick"
brew "denji/nginx/nginx-full", args: ["with-rmtp-module"]
brew "mysql@5.6", restart_service: true, link: true, conflicts_with: ["mysql"]

cask "firefox", args: { appdir: "~/my-apps/Applications" }
cask "google-chrome"
cask "java" unless system "/usr/libexec/java_home --failfast"

mas "1Password", id: 443987910

whalebrew "whalebrew/wget"
```

`cask` and `mas` entries are automatically skipped on Linux.
Other entries can be run only on (or not on) Linux with `if OS.mac?` or `if OS.linux?`.

## Install

You can then easily install all dependencies with:

```bash
brew bundle
```

Any previously-installed dependencies which have upgrades available will be upgraded.

`brew bundle` will look for a `Brewfile` in the current directory. Use `--file` to specify a path to a different `Brewfile`, or set the `HOMEBREW_BUNDLE_FILE` environment variable; `--file` takes precedence if both are provided.

My `.Brewfile` is stored in the home directory and the `HOMEBREW_BUNDLE_FILE` environment variable is set to `~/.Brewfile`

You can skip the installation of dependencies by adding space-separated values to one or more of the following environment variables:

- `HOMEBREW_BUNDLE_BREW_SKIP`
- `HOMEBREW_BUNDLE_CASK_SKIP`
- `HOMEBREW_BUNDLE_MAS_SKIP`
- `HOMEBREW_BUNDLE_WHALEBREW_SKIP`
- `HOMEBREW_BUNDLE_TAP_SKIP`

`brew bundle` will output a `Brewfile.lock.json` in the same directory as the `Brewfile` if all dependencies are installed successfully. This contains dependency and system status information which can be useful in debugging `brew bundle` failures and replicating a "last known good build" state.

You can opt-out of this behaviour by setting the `HOMEBREW_BUNDLE_NO_LOCK` environment variable or passing the `--no-lock` option.

You may wish to check this file into the same version control system as your `Brewfile` (or ensure your version control system ignores it if you'd prefer to rely on debugging information from a local machine).

## Dump

You can create a `Brewfile` from all the existing Homebrew packages you have installed with:

```bash
brew bundle dump
```

The `--force` option will allow an existing `Brewfile` to be overwritten as well.
The `--describe` option will output a description comment above each line.
The `--no-restart` option will prevent `restart_service` from being added to `brew` lines with running services.

## Cleanup

You can also use a `Brewfile` to list the only packages that should be installed, removing any package not present or dependent. This workflow is useful for maintainers or testers who regularly install lots of formulae. To uninstall all Homebrew formulae not listed in the `Brewfile`:

```bash
brew bundle cleanup
```

Unless the `--force` option is passed, formulae that would be uninstalled will be listed rather than actually be uninstalled.

## Check

You can check there's anything to install/upgrade in the `Brewfile` by running:

```bash
brew bundle check
```

This provides a successful exit code if everything is up-to-date, making it useful for scripting.

For a list of dependencies that are missing, pass `--verbose`. This will also check _all_ dependencies by not exiting on the first missing dependency category.

## List

Outputs a list of all of the entries in the Brewfile.

```bash
brew bundle list
```

Pass one of `--casks`, `--taps`, `--mas`, `--whalebrew` or `--brews` to limit output to that type. Defaults to `--brews`. Pass `--all` to see everything.

Note that the _type_ of the package is **not** included in this output.

## Exec

Runs an external command within Homebrew's superenv build environment.

```bash
brew bundle exec -- bundle install
```

This sanitized build environment ignores unrequested dependencies, which makes sure that things you didn't specify in your `Brewfile` won't get picked up by commands like `bundle install`, `npm install`, etc. It will also add compiler flags which will help find keg-only dependencies like `openssl`, `icu4c`, etc.

## Restarting services

You can choose whether `brew bundle` restarts a service every time it's run, or
only when the formula is installed or upgraded in your `Brewfile`:

```ruby
# Always restart myservice
brew 'myservice', restart_service: true

# Only restart when installing or upgrading myservice
brew 'myservice', restart_service: :changed
```

# References

- [Vim: Tutorial on Editing, Navigation, and File Management (2018)](https://youtu.be/E-ZbrtoSuzw)
- [Mastering the Vim Language](https://youtu.be/wlR5gYd6um0)
- [Stack Overflow: Git commits](https://stackoverflow.com/a/4114122)
