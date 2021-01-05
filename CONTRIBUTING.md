# Contributing to AgileTs
We are open to, and grateful for, any contribution made by the community. 
If you're interested in contributing to AgileTs, this document might make the process for you more clear.

The [Open Source Guides](https://opensource.guide/) website has a collection of resources for individuals, 
communities, and companies who want to learn how to run and contribute to an open source project. 
Contributors and people new to open source will find the following guides especially useful:

- [How to Contribute to Open Source](https://opensource.guide/how-to-contribute/)
- [Building Welcoming Communities](https://opensource.guide/building-community/)


## [Code of Conduct](https://code.fb.com/codeofconduct)

Please read [the full text](https://code.fb.com/codeofconduct) so that you can understand what interpersonal actions will and will not be tolerated.


## Get Involved
There are many ways to contribute to AgileTs, and some of them do not involve writing any code. 
Here are a few ideas to get started:
- Just start using AgileTs. Does everything work as expected? If not, we're always looking for improvements. Let us know by [opening an issue](#reporting-new-issues).
- Help to solve [open issues](https://github.com/agile-ts/agile/issues) by suggesting workarounds or fixing them.
  Issues tagged as [_Good first issue_](https://github.com/agile-ts/agile/labels/Good%20first%20issue) are a good place to get started.
- [Improve open issues](#improve-issues-and-pull-requests) to make them more clear and understandable for others.
- Read through the [AgileTs docs](https://agile-ts.org/docs). If you find anything that is confusing or can be improved, feel free to  make edits by clicking "Edit" at the bottom of the doc page. 
- Take a look at the [features requested](https://github.com/agile-ts/agile/labels/enhancement) by others and consider opening a pull request if you see something you want to work on.

### Join our Discord Server
Contributions are very welcome. 
If you think you need help planning your contribution, 
don't mind joining our [Discord Community](TODO) and let us know if you are looking for a bit of help.

### Improve Issues and Pull Requests

One great way you can contribute without writing _any_ code is to help to improve open issues and pull requests.

- Ask for more information if you believe the issue does not provide all the details required to solve it.
- Suggest [labels](https://github.com/agile-ts/agile/labels) that can help categorize issues/pull-requests.
- Flag issues that are stale or that should be closed.

## Our Development Process

AgileTs uses Github as it's source of truth. 
All changes made so far and which will made in the future are and will remain publicly accessible.

### Branch Organization

AgileTs has two primary branches: `master` and `develop`

`master` contains the latest released code

`develop` is where development takes place

## Bugs

We use [GitHub Issues](https://github.com/agile-ts/agile/issues) for our public bugs. 
If you would like to report a problem, **take a look around and see if someone already opened an issue about it**. 
If you are certain this is a new unreported bug, you can submit a [bug report](#reporting-new-issues).


## Reporting New Issues

When [opening a new issue](https://github.com/agile-ts/agile/issues/new/choose), always make sure to fill out the issue template. 
**This step is very important!** Not doing so may result in your issue not managed in a timely fashion. 
Don't take this personally if this happens, and feel free to open a new issue once you've gathered all the information required by the template.

- **One issue, one bug** Please report a single bug per issue.
- **Provide reproduction steps** List all the steps necessary to reproduce the issue. The person reading your bug report should be able to follow these steps to reproduce your issue with minimal effort.

## Installation

1. Ensure you have [Yarn](https://yarnpkg.com/) installed
2. After cloning the repository, run `yarn run install-packages` in the root of the repository
   which simply runs `yarn install` in each package.
   
### Run Example Project

1. Follow the Installation steps
2. Ensure you have [Yalc](https://www.google.com/search?client=firefox-b-d&q=yalc) installed
3. Run `yarn run dev-publish` to publish all packages in your local 'npm store'
4. Run `yarn run dev-push` to push your changes into your local 'npm store'..
   to see live changes run `yarn run watch` which automatically pushes the changes to your local 'npm store' if a package updates
   
## Pull Request

   
