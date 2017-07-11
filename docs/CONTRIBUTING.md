# Contribution
Any kind of contribution is encouraged, e.g., bug fix and question report.

## LF ID Application

All the tools require an Linux Foundation (LF) ID.

If you do not have an LF ID, can [apply one](https://identity.linuxfoundation.org) for free.

## Jira board usage

We are using [Jira](https://jira.hyperledger.org/projects/CE) to track the project progress, and welcome to report bug issues or create to-do tasks there. Each item should try keeping simple and focused, hence easy to fix and review.

After login with your LF ID, you can see those task items may have 4 status:

* `To Do`: Available for picking.
* `In Progress`: Picked by someone (check the assignee) to work on.
* `Under Review`: Related patchset has been submitted for review.
* `Done`: Patchset merged, the item is done.

In brief, if you want to contribute, create or find some `To Do` item, and assign it to yourself, then update its status to `In Progress`. After the item is fixed, remember to mark it as `Under Review` and `Done` when the patch is submitted and merged.

## Questions and discussions

* [RocketChat](https://chat.hyperledger.org/channel/cello): technical discussions and questions, login with your LFID.

## Code Commit Steps

The project employs [Gerrit](https://gerrit.hyperledger.org) as the code commit/review system.

*Before committing code, please go to [Jira](https://jira.hyperledger.org/projects/CE) to create a new task or check if there's related existing one, then assign yourself as the assignee. Notice each task will get a Jira number like [CE-26](https://jira.hyperledger.org/browse/CE-26).

* Clone the project to your working directory with your `LFID`.

```sh
$ git clone ssh://LFID@gerrit.hyperledger.org:29418/cello && scp -p -P 29418 LFID@gerrit.hyperledger.org:hooks/commit-msg cello/.git/hooks/
```

(Optionally) Config your git name and email if not setup previously.

```sh
$ git config user.name "your name"
$ git config user.email "your email"
```

(Optionally) Setup git-review by inputting your LFID. Notice this is only necessary once.
```sh
$ git review -s
```

* Assign yourself a `To Do` Jira task, mark it as `In progress`, then create a branch with the Jira task number off of your cloned repository, e.g., for CE-26, it can be:

```sh
$ cd cello
$ git checkout -b CE-26
```

* After modifying the code, run `make check` to make sure all the checking is passed. Then Commit your code with `-s` to sign-off, and `-a` to automatically add changes (or run `git add .` to include all changes manually).

```sh
$ make check
  ...
  py27: commands succeeded
  py30: commands succeeded
  py35: commands succeeded
  flake8: commands succeeded
  congratulations :)

$ git commit -s -a
```

Example commit msg may look like:

```sh
[CE-26] A short description of your change with no period at the end

You can add more details here in several paragraphs, but please keep each line
width less than 80 characters. A bug fix should include the issue number.

Fix https://jira.hyperledger.org/browse/CE-26.

Change-Id: If2e142ea1a21bc4b42f702f9a27d70d31edff20d
Signed-off-by: Your Name <committer@email.address>
```

* Submit your commit using `git review`, and mark the corresponding Jira item as `Under Review`.

```sh
$ git review
remote: Processing changes: new: 1, refs: 1, done
remote:
remote: New Changes:
remote:   http://gerrit.hyperledger.org/r/7915 [CE-26] Update the contribution documentation
remote:
To ssh://gerrit.hyperledger.org:29418/cello
 * [new branch]      HEAD -> refs/publish/master/CE-26
Switched to branch 'master'
Your branch is up-to-date with 'origin/master'.
```

Notice you will get a [gerrit item url](http://gerrit.hyperledger.org/r/7915), open and check the status.

After the ci checking passed, add [reviewers](https://wiki.hyperledger.org/projects/cello#contributors) to the reviewer list and also post the gerrit item url at the [RocketChat channel](https://chat.hyperledger.org/channel/cello). The patch will be merged into the `master` branch after passing the review, then mark the Jira item as `Done`.

* If you need to refine the patch further as the reviewers may suggest, you can change on the same branch, and commit the new code with `git commit -a --amend`, and then use the `git review` command again.

<a rel="license" href="http://creativecommons.org/licenses/by/4.0/"><img alt="Creative Commons License" style="border-width:0" src="https://i.creativecommons.org/l/by/4.0/88x31.png" /></a><br />This work is licensed under a <a rel="license" href="http://creativecommons.org/licenses/by/4.0/">Creative Commons Attribution 4.0 International License</a>.