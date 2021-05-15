# 👨‍💻 Contributing to AgileTs

We are open and grateful for any contribution made by the community.
If you're interested in contributing to AgileTs, this document might make the process for you easier.

The [Open Source Guides](https://opensource.guide/) website has a collection of resources for individuals,
communities, and companies who want to learn how to run and contribute to an open-source project.
Contributors and people new to open source will find the following guides especially useful:

- [How to Contribute to Open Source](https://opensource.guide/how-to-contribute/)
- [Building Welcoming Communities](https://opensource.guide/building-community/)


## 👊 [Code of Conduct](https://code.fb.com/codeofconduct)

Please read [the full text](https://code.fb.com/codeofconduct), so that you are able to understand what interpersonal actions will and will not be tolerated.


## 😎 Get Involved

There are many ways to contribute to AgileTs, and some of them don't involve writing any code.
Here are a few ideas to get started:
- Just start using AgileTs. Does everything work as expected? If not, we're always looking for improvements. Let us know by [opening an issue](#reporting-new-issues).
- Help us solving [open issues](https://github.com/agile-ts/agile/issues) by suggesting workarounds or fixing them.
- [Improve open issues](#improve-issues-and-pull-requests) to make them more clear, readable, and understandable for others.
- Read through the [AgileTs docs](https://agile-ts.org/docs). If you find anything confusing or that can be improved, feel free to make improvements by clicking "Edit" at the bottom of the doc page.
- Take a look at the [features requested](https://github.com/agile-ts/agile/labels/enhancement) by others and consider opening a pull request if you see something you want to work on.

### Join our Discord Server

Contributions are very welcome and not bound to Github.
You can also contribute to our [Discord Community](https://discord.gg/FTqeMNCxw7) by helping other people
who might face a problem you already have solved.

### Improve Issues and Pull Requests

One great way to contribute without writing _any_ code is to improve open issues and pull requests.

- Ask for more information if you believe the issue does not provide all the details required to solve it
- Suggest [labels](https://github.com/agile-ts/agile/labels) that help to categorize issues/pull-requests
- Flag issues that are stale or that should be closed

## ⏰ Our Development Process

AgileTs uses Github as its source of truth.
All changes made so far and made in the future are and will remain publicly accessible here.

### Branch Organization

AgileTs has two primary branches: `master` and `develop`.

`master` contains the latest released code.

`develop` is where the development takes place.

<img src="https://raw.githubusercontent.com/agile-ts/agile/master/static/branch_organization.png" alt="Branch Organisation"/>

The root of all your feature branches have always to be the `develop` branch!


## 🐞 Bugs

We use [GitHub Issues](https://github.com/agile-ts/agile/issues) to keep track of our bugs.
If you would like to report any problem, **take a look around and see if someone already opened an issue about it**.
If you are confident this is a new, unreported bug, you can submit a [bug report](#reporting-new-issues).


## 📕 Reporting New Issues

When [opening a new issue](https://github.com/agile-ts/agile/issues/new/choose), always make sure to fill out the whole issue template.
**This step is very important!** Not doing so may result in your issue not managed in a timely fashion.
Don't take this personally if this happens, and feel free to open a new issue once you've gathered all the information required by the template.

- **One issue, one bug!** Please report a single bug per issue.
- **Provide reproduction steps!** List all steps that are necessary to reproduce the issue. The person reading your bug report should be able to reproduce your issue with minimal effort.


## ⏳ Installation

1. Ensure you have [Yarn](https://yarnpkg.com/) installed
2. After cloning the repository, run `yarn run install:packages` in the `root` of the repository.
   This runs `yarn install` in each AgileTs package to ensure all required dependencies are installed.

### Run Example Project's

1. Follow the [Installation](#Installation) steps above
2. Ensure you have [Yalc](https://www.google.com/search?client=firefox-b-d&q=yalc) installed
3. Run `yarn run dev:publish` to publish all packages in your local 'yalc/(npm)' store
4. Execute `yarn install:agile` in the Example Project in order to install its dependencies correctly
5. When you have made the desired changes. Run `yarn run dev:push` to push your updated changes to your local 'npm store'<br />.
   _ProTip:_ To make changes in real-time, run `yarn run watch`, which will automatically run `yarn run dev:push` whenever you updated a file in the corresponding package.


## ☄️ Pull Request

### Your First Pull Request

So you have also decided to merge code back to the upstream by opening a PR.
You've invested a good chunk of time, and we appreciate it.
We will do our best to work with you and get the PR looked at.

_Working on your first Pull Request?_ You can learn how from this free video series:

[**How to Contribute to an Open Source Project on GitHub**](https://egghead.io/courses/how-to-contribute-to-an-open-source-project-on-github)

We have a list of [beginner friendly issues](https://github.com/agile-ts/agile/labels/good%20first%20issue) to help you to get your feet wet in the AgileTs codebase
and familiar with our contribution process. This is a great place to get started.

### Proposing a Change

If you would like to request a new feature or enhancement but you only want to give an impulse and don't want to implement it,
feel free to create an issue that follows the [feature template](https://github.com/agile-ts/agile/issues/new?template=feature_request.md).

If you're only fixing a bug, it's fine to submit a pull request right away,
but we still recommend creating an [issue](https://github.com/agile-ts/agile/issues/new?template=bug_report.md) detailing what you're fixing.
This is helpful in case we don't accept that specific changes but want to keep track of the issue.

### Sending a Pull Request

Keep in mind that small pull requests are much easier to review and more likely to get merged.
Ensure your PR only solves one problem (issue). Otherwise, please split it up into multiple PR's for a better overview.
Commit Messages that follow this [style guide](https://www.conventionalcommits.org/en/v1.0.0/) are very welcome ^^

Please make sure the following is done before submitting a new pull request:

1. Fork [the repository](https://github.com/agile-ts/agile) and create your branch from `develop`
2. Make sure your code is right formatted (`yarn prettier`)
3. Make sure all Jest tests pass (`yarn test`)
4. Don't forget the **How has this been Tested?** part!

All pull requests should be opened against the `develop` branch
and have a related Issue for better organization!

#### Breaking Changes

When adding a new [breaking change](https://stackoverflow.com/questions/21703216/what-is-a-breaking-change-in-software), follow this template in your pull request:

```md
### New breaking change here

- **Who does this affect**:
- **How to migrate**:
- **Why make this breaking change**:
- **Severity (number of people affected x effort)**:
```

### What Happens Next?

The Core Team of AgileTs is constantly monitoring pull requests and merges them if they seem correct.
Help us to keep pull requests consistent by following the guidelines above.


## 🌟 Style Guide

[Prettier](https://prettier.io) will catch most styling issues that may exist in your code.
You can check the status of your code styling by simply running `yarn prettier`.

**Most important:** Look around. Match the style you see used in the rest of the project(formatting, naming, ..).


## 🚀 Releasing Process [Admin]

AgileTs is published in the [`npm` store](https://www.npmjs.com/).

### 🔐 Check publish rights

Get access from the AgileTs npm admins ([@bennodev19](https://github.com/bennodev19)).

#### Github

You need publish access to the **main AgileTs repository** (not a fork).

#### NPM

For publishing a package in the below [workflow](#workflow), you need no npm publishing rights.
It is published via a Github action that handles the publishing process for us and saves us work.

If you, for whatever reason, need to publish a package **manually**,
publishing will only work if you are logged in to npm with an account with publishing rights to the `@agile-ts/` team/packages.

If you are not currently logged in to npm on your CLI, do the following:

1. `npm login`
2. Enter username, password, and associated email address
3. **Enable 2FA** on your account (required for publishing process)

### 🏃 Workflow

#### 1. Git setup

Checkout the [`develop`](https://github.com/agile-ts/agile/blob/develop/) branch and
make sure that each release change is merged into it.
Only the `develop` branch is allowed to be merged into the master
and thus be the next release! See ['Our Development Process'](#-our-development-process).
```ts
git fetch origin develop
git checkout origin/develop
git fetch --tags // To generate the correct changelog later
```

#### 2. Test and build packages

- Run `yarn test` in the `root` of the project and ensure that all tests run green
- Run [`yarn pack`](https://docs.npmjs.com/cli/v6/commands/npm-pack) in the `root` of the project,
  which simply builds and packs the packages with the files as they will be released.
    - Check if all packages could be built
    - Check that each package built contains the files to be delivered

#### 3. Create Pull Request to `master`

Now that we know each package can be built correctly and works as expected,
we create a pull request to the `master` branch.
```ts
master <-- develop
```
- `Pull Request Title` = 'New Release 🎉'.
- `Pull Request Description` is generated in the next step ([Step 4](#4-create-changelog))
  and will be a changelog based on the previous (in the `develop` branch) merged pull requests.

#### 4. Create Changelog

The changelog uses GitHub labels to classify each pull request.
Use the GitHub interface to assign each newly merged pull request to a GitHub label starting with `tag:`. Otherwise, the PR won't appear in the changelog.

[Check tags of all recently merged Pull-Requests](https://github.com/agile-ts/agile/pulls?q=is%3Apr+sort%3Aupdated-desc+is%3Amerged+)

The `tag:` label prefix is for PRs only!
Other labels are not used by the changelog tool,
and it's not necessary to assign such labels to issues, only PRs!

Generate a GitHub auth token by going to https://github.com/settings/tokens
(the only permission needed is `public_repo`). Save the token somewhere for future reference.

Generate the changelog in the `root` of the project with:
```sh
GITHUB_AUTH=<Your GitHub auth token> yarn run changelog
```
Copy the generated content and paste it as a description into the in [Step 3](#3-create-pull-request-to-master)
created `Pull Request`. Save the changelog somewhere in between because we need it again in the next step ([Step 5](#5-bump-version)).

#### 5. Bump Version

We don't manually increase the versions of the packages to be released.
Instead, we run `yarn version:bump` in the `root` of the project.
This will trigger [Changeset](https://github.com/atlassian/changesets).
Changeset is a handy tool to manage versioning and changelogs with a focus on multi-package repositories.
In order for Changeset to bump the versions correctly, we need to pass 3 questions from it:
```ts
�  Which packages would you like to include? ...
√ changed packages
  √ @agile-ts/api
  √ @agile-ts/core
  √ cra-template-agile
  √ cra-template-agile-typescript
  √ @agile-ts/event
  √ @agile-ts/logger
```
Select the packages where something has changed,
and thus, the version needs to be incremented.
```ts
�  Which packages should have a major bump? ...
√ all packages
  √ @agile-ts/api@0.0.17
  √ @agile-ts/core@0.0.16
  √ cra-template-agile@0.0.5
  √ cra-template-agile-typescript@0.0.5
  √ @agile-ts/event@0.0.6
  √ @agile-ts/logger@0.0.3
  √ @agile-ts/multieditor@0.0.16
  √ @agile-ts/proxytree@0.0.2
  √ @agile-ts/react@0.0.17
```
Decide how the version of the selected packages should be bumped (`major`, `minor`, `patch`).
Note: If no package has a major bump, just press [ENTER] with no package selected,
and it will ask the same question based on `minor` version bumps, ..
```ts
�  Please enter a summary for this change (this will be in the changelogs). Submit empty line to open external editor
�  Summary »
```
Here we pass the changelog generated in [Step 4](#4-create-changelog).

#### 6. Commit changes and merge `master <- develop`

Now we are nearly done with the manual part.
Commit the file generated in the `.changeset` folder to the `develop` branch.
After committing, we wait for each github/circleci action to complete successfully.
- If they `fail`, we have to figure out why and fix the issue
- If they `succeed`, we merge the previously (in [Step3](#3-create-pull-request-to-master)) created pull request (`master <- develop`)

#### 7. Merge `master <- 'Next Release'`

If the merge was successful, Changeset created a new `Pull Request` called 'Next Release'
from the branch `changeset-release/master` to the `master` branch.
In doing so, Changeset automatically incremented the versions and adjusted the changelogs.
Before we merge, we should double-check if the versions have been increased correctly and that everything else seems correct.
Because after we have merged, there is no going back.
After the merge, the changed packages are automatically built and sent to `npm`.
In addition, Changeset creates the appropriate tags and releases in GitHub.

#### 8. Merge `master -> develop`

So that the `devlop` branch does not become obsolete,
we merge the `master` into the `develop` branch at the end.


## 📄 License
By contributing to AgileTs, you agree that your contributions will be licensed under its **MIT license**.


## 🎉 Credits
This File is inspired by the [Docusaurus CONTRIBUTING.md](https://github.com/facebook/docusaurus/blob/master/CONTRIBUTING.md).
