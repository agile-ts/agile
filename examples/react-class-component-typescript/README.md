Because of some issues with `npm link` I am using 
<a href="https://github.com/whitecolor/yalc">yalc<a/>
which is like a local npm remote registry.

## Setup React-Typescript Example

#### 1. Run `npm install` at the root of Agile
At first, we have to install some 'global' dependencies of Agile

#### 2. Run `npm run install` at the root of Agile
This will install the dependencies of the Agile packages (core, react, api)

#### 3. Run `npm run dev-publish` at the root of Agile
As a next step we have to `publish` the Agile packages to the `yalc` repository.

#### 4. Run `npm run dev-push` at the root of Agile
After 'publishing' the Agile Packages we can apply changes to it by running this command. /
Which builds the Agile packages and push them to `yalc`. /
All projects that are using the Agile `yalc` dependency will receive the changes.

#### 5. Run `npm run install-agile` in this Project
As last step we want to install the Agile dependencies and of course also the other deps.

##### Global installed packages will end here: 
`C:\Users\'your_name'\AppData\Roaming\npm\node_modules\@agile-ts\core`