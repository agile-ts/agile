# 👨‍💻 Contributing to AgileTs
We are open and grateful for any contribution made by the community. 
If you're interested in contributing to AgileTs, this document might make the process for you easier.

The [Open Source Guides](https://opensource.guide/) website has a collection of resources for individuals, 
communities, and companies who want to learn how to run and contribute to an open source project. 
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
- [Improve open issues](#improve-issues-and-pull-requests) to make them more clear, readable and understandable for others.
- Read through the [AgileTs docs](https://agile-ts.org/docs). If you find anything that is confusing or can be improved, feel free to  make edits by clicking "Edit" at the bottom of the doc page. 
- Take a look at the [features requested](https://github.com/agile-ts/agile/labels/enhancement) by others and consider opening a pull request if you see something you want to work on.

### Join our Discord Server
Contributions are very welcome and not bound to github. 
You can also contribute in our [Discord Community](https://discord.gg/FTqeMNCxw7) by helping other people
which might face a problem you already have solved.

### Improve Issues and Pull Requests

One great way to contribute without writing _any_ code is to improve open issues and pull requests.

- Ask for more information if you believe the issue does not provide all the details required to solve it
- Suggest [labels](https://github.com/agile-ts/agile/labels) that help to categorize issues/pull-requests
- Flag issues that are stale or that should be closed

## ⏰ Our Development Process

AgileTs uses Github as it's source of truth. 
All changes made so far and which will be made in future are and will remain publicly accessible here.

### Branch Organization

AgileTs has two primary branches: `master` and `develop`

`master` contains the latest released code

`develop` is where development takes place

<img src="https://raw.githubusercontent.com/agile-ts/agile/master/static/branch_organization.png" alt="Branch Organisation"/>

The root of all your branches have to be the `develop` branch!


## 🐞 Bugs

We use [GitHub Issues](https://github.com/agile-ts/agile/issues) to keep track of our bugs. 
If you would like to report any problem, **take a look around and see if someone already opened an issue about it**. 
If you are certain this is a new unreported bug, you can submit a [bug report](#reporting-new-issues).


## 📕 Reporting New Issues

When [opening a new issue](https://github.com/agile-ts/agile/issues/new/choose), always make sure to fill out the whole issue template. 
**This step is very important!** Not doing so may result in your issue not managed in a timely fashion. 
Don't take this personally if this happens, and feel free to open a new issue once you've gathered all the information required by the template.

- **One issue, one bug!** Please report a single bug per issue.
- **Provide reproduction steps!** List all steps that are necessary to reproduce the issue. The person reading your bug report should be able to reproduce your issue with minimal effort.


## ⏳ Installation

1. Ensure you have [Yarn](https://yarnpkg.com/) installed
2. After cloning the repository, run `yarn run install-packages` in the root of the repository,
   which simply runs `yarn install` in each package to ensure all dependencies are installed.
   
### Run Example Project's

1. Follow the [Installation](#Installation) steps above
2. Ensure you have [Yalc](https://www.google.com/search?client=firefox-b-d&q=yalc) installed
3. Run `yarn run dev-publish` to publish all packages in your local 'npm store'
4. Execute `yarn install` in the Example Project to install its dependencies like AgileTs
5. If you made your desired changes. Run `yarn run dev-push` to push your updated changes into your local 'npm store' <br />
   _ProTip:_ To make realtime changes, run `yarn run watch`, which automatically runs `yarn run dev-push` everytime you update a file in a package.
   

## ☄️ Pull Request

### Your First Pull Request

So you have also decided to merge code back to the upstream by opening a PR.
You've invested a good chunk of time, and we appreciate it. 
We will do our best to work with you and get the PR looked at.

_Working on your first Pull Request?_ You can learn how, from this free video series:

[**How to Contribute to an Open Source Project on GitHub**](https://egghead.io/courses/how-to-contribute-to-an-open-source-project-on-github)

We have a list of [beginner friendly issues](https://github.com/agile-ts/agile/labels/good%20first%20issue) to help you to get your feet wet in the AgileTs codebase 
and familiar with our contribution process. This is a great place to get started.

### Proposing a Change

If you would like to request a new feature or enhancement but you only want to give an impulse and don't want to implement it, 
feel free to create an issue that follows the [feature template](https://github.com/agile-ts/agile/issues/new?template=feature_request.md).

If you're only fixing a bug, it's fine to submit a pull request right away, 
but we still recommend creating an [issue](https://github.com/agile-ts/agile/issues/new?template=bug_report.md) detailing what you're fixing. 
This is helpful in case we don't accept that specific changes, but want to keep track of the issue.

### Sending a Pull Request

Keep in mind that small pull requests are much easier to review and more likely to get merged.
Make sure your PR only solves one problem (issue), otherwise please split it up in multiple PR's for a better overview.
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

The core Team of AgileTs is constantly monitoring pull requests and merges them if they seem correct. 
Help us to keep pull requests consistent by following the guidelines above.


## 🌟 Style Guide

[Prettier](https://prettier.io) will catch most styling issues that may exist in your code. 
You can check the status of your code styling by simply running `yarn prettier`.

**Most important:** Look around. Match the style you see used in the rest of the project(formatting, naming, ..).


## 📄 License
By contributing to AgileTs, you agree that your contributions will be licensed under its **MIT license**.


## 🎉 Credits
This File is inspired by the [Docusaurus CONTRIBUTING.md](https://github.com/facebook/docusaurus/blob/master/CONTRIBUTING.md).

