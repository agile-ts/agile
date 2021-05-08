 <img src="https://raw.githubusercontent.com/agile-ts/agile/master/static/header_background.png" alt="AgileTs">

> Global, simple, spacy State and Logic Framework

 <br />

<p align="left">
 <a href="https://github.com/agile-ts/agile">
   <img src="https://img.shields.io/github/license/agile-ts/agile.svg?label=license&style=flat&colorA=293140&colorB=4a4872" alt="GitHub License"/>
 </a>
 <a href="https://npm.im/@agile-ts/core">
   <img src="https://img.shields.io/bundlephobia/min/@agile-ts/core.svg?label=bundle%20size&style=flat&colorA=293140&colorB=4a4872" alt="npm minified size"/>
 </a>
 <a href="https://npm.im/@agile-ts/core">
   <img src="https://img.shields.io/npm/dt/@agile-ts/core.svg?label=downloads&style=flat&colorA=293140&colorB=4a4872" alt="npm total downloads"/>
 </a>
</p>

<p align="left">
 <a href="https://github.com/agile-ts/agile/actions?query=workflow%3ARelease">
   <img src="https://github.com/agile-ts/agile/workflows/Release/badge.svg" alt="Build Status"/>
 </a>
 <a href="https://github.com/agile-ts/agile/actions?query=workflow%3A%22Test+All+Packages%22">
   <img src="https://github.com/agile-ts/agile/workflows/Test%20All%20Packages/badge.svg" alt="Build Status"/>
 </a>
 <a href="https://coveralls.io/github/agile-ts/agile?branch=master">
   <img src="https://coveralls.io/repos/github/agile-ts/agile/badge.svg?branch=master" alt="Coverage Badge"/>
 </a>
</p>

<p align="left">
 <a href="https://twitter.com/intent/tweet?text=I%20just%20discovered%20AgileTs%3B%20a%20global%2C%20spacy%20and%20overall%20easy%20to%20use%20State%20Manager.%0A%60%60%60ts%0Aconst%20MY_STATE%20%3D%20App.createState(%22Hello%20stranger%22)%3B%0AMY_STATE.set(%22Hello%20friend%22)%3B%0A%60%60%60%0Ahttps%3A%2F%2Fgithub.com%2Fagile-ts%2Fagile%2F%20%0A%0A%40AgileFramework%20%0A%23agilets%20%23statemanagement%20%23webdev%20"><img src="http://randojs.com/images/tweetShield.svg" alt="Tweet" height="20"/>
 </a>
 <a href="https://discord.gg/T9GzreAwPH">
   <img src="https://img.shields.io/discord/795291052897992724.svg?label=&logo=discord&logoColor=ffffff&color=7389D8&labelColor=6A7EC2" alt="Join Discord"/>
 </a>
</p> 

<br />
<img src="https://raw.githubusercontent.com/agile-ts/agile/master/static/how_to_create_state_header.png" alt="How to create a State?"/>

```tsx
// -- core.js ------------------------------------------

// 1️⃣ Create Instance of AgileTs
const App = new Agile();

// 2️⃣ Create State with help of before defined Agile Instance
const MY_FIRST_STATE = App.createState("Hello Friend!");


// -- myComponent.whatever ------------------------------------------

// 3️⃣ Bind initialized State to desired UI-Component
// And wolla, it's reactive. Everytime the State mutates the Component rerenders
const myFirstState = useAgile(MY_FIRST_STATE); // Returns value of State ("Hello Friend!")
```
To learn out more, check out our [Quick Start Guides](https://agile-ts.org/docs/Installation.md).

### ⛳️ Sandbox
Test AgileTs yourself in a [codesandbox](https://codesandbox.io/s/agilets-first-state-f12cz).
It's only one click away. Just select your preferred Framework below.

- [React](https://codesandbox.io/s/agilets-first-state-f12cz)
- [React-Native](https://snack.expo.io/@bennodev/agilets-first-state)
- Vue (coming soon)
- Angular (coming soon)

More examples can be found in the [Example Section](https://agile-ts.org/docs/examples).


<br />


<br />
<img src="https://raw.githubusercontent.com/agile-ts/agile/master/static/why_should_i_use_agile.png" alt="Why should I use AgileTs?"/>

AgileTs is a global, simple, well-tested State Management Framework implemented in Typescript.
It offers a reimagined API that focuses on **developer experience** and allows you to **quickly** and **easily** manage your States.
Besides States, AgileTs offers some other powerful APIs that make your life easier.
The philosophy behind AgileTs is simple:

### 🚅 Straightforward
Write minimalistic, boilerplate-free code that captures your intent.

**Some straightforward syntax examples:**

- Mutate and Check States with simple Functions
  ```ts
  MY_STATE.undo(); // Undo latest change
  MY_STATE.is({hello: "jeff"}); // Check if State has the Value '{hello: "jeff"}'
  MY_STATE.watch((value) => {console.log(value);}); // Watch on State changes
  ```
- Store State in any Storage, like [Local Storage](https://www.w3schools.com/html/html5_webstorage.asp)
  ```ts
  MY_STATE.persist("storage-key");
  ```
- Create a reactive Array of States
  ```ts
  const MY_COLLECTION = App.createCollection();
  MY_COLLECTION.collect({id: 1, name: "Frank"});
  MY_COLLECTION.collect({id: 2, name: "Dieter"});
  ```
- Compute State depending on other States
  ```ts
  const MY_INTRODUCTION = App.createComputed(() => {
     return `Hello I am '${MY_NAME.vale}' and I use ${MY_STATE_MANAGER.value} for State Management.`;
  });
  ```

### 🤸‍ Flexible

- Works in nearly any UI-Layer. Check [here](https://agile-ts.org/docs/Frameworks) if your preferred Framework is supported too.
- Surly behaves with the workflow which suits you best. No need for _reducers_, _actions_, ..
- Has **0** external dependencies

### ⛳️ Centralize

AgileTs is designed to take all business logic out of UI-Components and put them in a central place, often called `core`.
The benefit of keeping logic separate to UI-Components is to make your code more decoupled, portable, and above all, easily testable.

### 🎯 Easy to Use

Learn the powerful tools of AgileTs in a short amount of time. An excellent place to start are
our [Quick Start](https://agile-ts.org/docs/Installation) Guides, or if you don't like to follow any tutorials,
you can jump straight into our [Example](https://agile-ts.org/docs/examples/Introduction) Section.


<br />


<br />
<img src="https://raw.githubusercontent.com/agile-ts/agile/master/static/installation_header.png" alt="Installation"/>

To properly use AgileTs, in a UI-Framework, we need to install **two** packages.

- The _Core Package_, which acts as the brain of AgileTs and manages all your States
  ```
  npm install @agile-ts/core
  ```

- and a _fitting Integration_ for your preferred UI-Framework. In my case, the [React Integration](https://www.npmjs.com/package/@agile-ts/react).
  Check [here](https://agile-ts.org/docs/frameworks) if your desired Framework is supported, too.
  ```
  npm install @agile-ts/react
  ```


<br />


<br />
<img src="https://raw.githubusercontent.com/agile-ts/agile/master/static/documentation_header.png" alt="Documentation"/>

Sounds AgileTs interesting to you?
Checkout our **[documentation](https://agile-ts.org/docs/introduction)**, to learn more.
And I promise you. You will be able to use AgileTs in no time.
In case you have any further questions, don't hesitate to join our [Community Discord](https://discord.gg/T9GzreAwPH).


<br />


<br />
<img src="https://raw.githubusercontent.com/agile-ts/agile/master/static/contribute_header.png" alt="Contribute"/>

Get a part of AgileTs and start contributing. We welcome any meaningful contribution. 😀
To find out more, check out the [CONTRIBUTING.md](https://github.com/agile-ts/agile/blob/master/CONTRIBUTING.md).

<a href="https://codeclimate.com/github/agile-ts/agile/coverage.svg">
   <img src="https://codeclimate.com/github/agile-ts/agile/badges/gpa.svg" alt="Maintainability"/>
</a>


<br />


<br />
<img src="https://raw.githubusercontent.com/agile-ts/agile/master/static/packages_of_agile.png" alt="Packages of Agile"/>

| Name                                                                     |                                                                               Latest Version                                                                                | Description                               |
| ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| [@agile-ts/core](/packages/core)                                         |               [![badge](https://img.shields.io/npm/v/@agile-ts/core.svg?style=flat-square)](https://www.npmjs.com/package/@agile-ts/core)                                   | State Manager                             |
| [@agile-ts/react](/packages/react)                                       |               [![badge](https://img.shields.io/npm/v/@agile-ts/react.svg?style=flat-square)](https://www.npmjs.com/package/@agile-ts/react)                                 | React Integration                         |
| [@agile-ts/api](/packages/api)                                           |               [![badge](https://img.shields.io/npm/v/@agile-ts/api.svg?style=flat-square)](https://www.npmjs.com/package/@agile-ts/api)                                     | Promise based API                         |
| [@agile-ts/multieditor](/packages/multieditor)                           |               [![badge](https://img.shields.io/npm/v/@agile-ts/multieditor.svg?style=flat-square)](https://www.npmjs.com/package/@agile-ts/multieditor)                     | Simple Form Manager                       |
| [@agile-ts/event](/packages/event)                                       |               [![badge](https://img.shields.io/npm/v/@agile-ts/event.svg?style=flat-square)](https://www.npmjs.com/package/@agile-ts/event)                                 | Handy class for emitting UI Events        |


<br />


<br />
<img src="https://raw.githubusercontent.com/agile-ts/agile/master/static/credits_header.png" alt="Credits"/>

AgileTs is inspired by [MVVM Frameworks](https://de.wikipedia.org/wiki/Model_View_ViewModel) like [MobX](https://mobx.js.org/README.html) and [PulseJs](https://github.com/pulse-framework/pulse).