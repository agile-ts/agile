# React Native Example

This Example represents the basic features of the `core` package in a **class component** based react-native environment.

## Setup `AwesomeTSProject`

### Requirements
- [nodejs](https://nodejs.org/en/)
- [yalc](https://www.npmjs.com/package/yalc)

### Steps

#### 1. Run `npm install` at the root of Agile
At first, we have to install some 'global' dependencies of AgileTs.

#### 2. Run `npm run install-all` at the root of Agile
Then we install the dependencies of all AgileTs Packages (core, react, api, ..)

#### 3. Run `npm run dev-publish` at the root of Agile
As next step we `publish` all AgileTs Packages to our local `yalc` repository,
to import them later in our examples, like this one.

#### 4. Run `npm run install-agile` in this Project
To run the project we have to install the dependencies, too.
We aren't using `npm install`, because we also want to add the just published AgileTs Packages.

#### 5. Run `npm run dev-push` at the root of Agile
After 'publishing' the Agile Packages and installing the dependencies of the example, we can push our changes, 
which we might have made for instance in the core package, to yalc by running this command,
All projects having a dependency of the pushed package will receive the changes immediately.

## Good To Know

## Yalc Packages Location
`C:\Users\'your_name'\AppData\Roaming\npm\node_modules\@agile-ts\core`