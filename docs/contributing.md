[//]: # "SPDX-License-Identifier: CC-BY-4.0"

Any kind of contribution is encouraged, e.g., [Jira items](https://jira.hyperledger.org/projects/CE/issues) or [patchsets](https://github.com/hyperledger/cello).

## 1. LF ID Application

All the tools require an Linux Foundation (LF) ID.

If you do not have an LF ID, [here is how to get one](https://wiki.hyperledger.org/display/CA/Setting+up+an+LFID).

## 2. Jira board usage

We are using [Jira](https://jira.hyperledger.org/projects/CE) to track the project progress, and welcome to report bug issues or create to-do tasks there. Each item should try keeping simple and focused, hence easy to fix and review.

After login with your LF ID, you can see those task items with one of the following statuses:

* `To Do`: Available for picking and fix.
* `In Progress`: Some on already picked it (check the assignee) to work on.
* `Under Review`: Related patchset has been submitted for review, and added as comment under the Jira item.
* `Done`: Patchset merged, the item has been resolved.

In brief, if you want to contribute, create or find some `To Do` item, and assign it to yourself, then update its status to `In Progress`. After the item is fixed, remember to mark it as `Under Review` and `Done` when the patch is submitted and merged.

## 3. Questions and discussions

* [Chat](https://discord.gg/hyperledger): technical discussions and questions

## 4. Code Commit Steps

The project employs [GitHub](https://github.com/hyperledger/cello) as the code commit/review system.

* Before committing code, please go to [Jira](https://jira.hyperledger.org/projects/CE) to create a new task or check if there's related existing one, then assign yourself as the assignee. Notice each task will get a Jira number like [CE-26](https://jira.hyperledger.org/browse/CE-26).

* Clone the project to your working directory.

```bash
$ git clone git@github.com:hyperledger/cello.git
```

(Optionally) Config your git name and email if not setup previously.

```bash
$ git config user.name "your name"
$ git config user.email "your email"
```

* Assign yourself a `To Do` Jira task, mark it as `In progress`, then create a branch with the Jira task number off of your cloned repository, e.g., for CE-26, it can be:

```bash
$ cd cello
$ git checkout -b CE-26
```

* After modifying the code, run `make check` to make sure all the checking is passed. Then Commit your code with `-s` to sign-off, and `-a` to automatically add changes (or run `git add .` to include all changes manually).

```bash
$ make check
  ...
  py27: commands succeeded
  py30: commands succeeded
  py35: commands succeeded
  flake8: commands succeeded
  congratulations :)

$ git commit -s -a
```

Example commit msg may look like (take CE-1234 for example):

```bash
[CE-1234] A short description of your change with no period at the end

You can add more details here in several paragraphs, but please keep each line
width less than 80 characters. A bug fix should include the issue number.

CE-1234 #done.

Signed-off-by: Your Name <committer@email.address>
```

* Submit your PR using [hub](https://github.com/github/hub/), and mark the
  corresponding Jira item as `Under Review`.

```bash
docs % git push ryjones
Enumerating objects: 7, done.
Counting objects: 100% (7/7), done.
Delta compression using up to 4 threads
Compressing objects: 100% (4/4), done.
Writing objects: 100% (4/4), 835 bytes | 835.00 KiB/s, done.
Total 4 (delta 3), reused 0 (delta 0), pack-reused 0
remote: Resolving deltas: 100% (3/3), completed with 3 local objects.
To github.com:ryjones/cello.git
   90f0d2e..ec42e8a  master -> master
docs % hub pull-request
https://github.com/hyperledger/cello/pull/145
docs %
```

Notice you will get a GitHub PR url like `https://github.com/hyperledger/cello/pull/145`, open it and check the status.

After the ci checking passed, add [reviewers](https://wiki.hyperledger.org/projects/cello#contributors) to the reviewer list and also post the GitHub PR url in the chat channel. The patch will be merged into the `master` branch after passing the review, then mark the Jira item as `Done`.

* If you need to refine the patch further as the reviewers may suggest, you can change on the same branch, and commit the new code with `git commit -a --amend`, and then use the `git review` command again.

<a rel="license" href="http://creativecommons.org/licenses/by/4.0/"><img alt="Creative Commons License" style="border-width:0" src="https://i.creativecommons.org/l/by/4.0/88x31.png" /></a><br />This work is licensed under a <a rel="license" href="http://creativecommons.org/licenses/by/4.0/">Creative Commons Attribution 4.0 International License</a>.
