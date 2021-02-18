# MultiEditor Example

This Example represents the basic features of the `multieditor` package in a **functional component** based react environment.

## Setup `multieditor-ts`

### Requirements
- [nodejs](https://nodejs.org/en/)
- [yalc](https://www.npmjs.com/package/yalc)
- [yarn](https://yarnpkg.com/)

### Steps

#### 1. Run `npm install` at the root of Agile
At first, we have to install some 'global' dependencies of AgileTs.

#### 2. Run `npm run install-all` at the root of Agile
Then we install the dependencies of all AgileTs Packages (core, react, api, ..)

#### 3. Run `npm run dev-publish` at the root of Agile
As next step we `publish` all AgileTs Packages to our local `yalc` repository,
to import them later in our examples.

#### 4. Run `npm run install-agile` in this Project
To run the example we have to install the dependencies of it, too.
We aren't using `npm install`, because we want to add the just published AgileTs Packages properly.

#### 5. Run `npm run dev-push` at the root of Agile
After 'publishing' the AgileTs Packages and installing the dependencies of the example, we can push our changes,
which we might have made for instance in the core package, to yalc by running this command.
All projects having a dependency of the pushed package will receive the changes immediately.

## Good To Know

## Yalc Packages Location
`C:\Users\'your_name'\AppData\Roaming\npm\node_modules\@agile-ts\core`