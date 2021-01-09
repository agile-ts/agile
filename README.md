 <img src="https://raw.githubusercontent.com/agile-ts/agile/master/static/header_background.png" alt="AgileTs">
 
 > **Spacy, Simple, Scalable State Management Framework**
 
 <br />

 <a href="https://github.com/agile-ts/agile">
  <img src="https://img.shields.io/github/license/agile-ts/agile.svg" alt="GitHub License"></a>
<a href="https://npm.im/@agile-ts/core">
  <img src="https://img.shields.io/bundlephobia/min/@agile-ts/core.svg" alt="npm minified size"></a>

<br />

<a href="https://github.com/agile-ts/agile/actions?query=workflow%3ARelease">
   <img src="https://github.com/agile-ts/agile/workflows/Release/badge.svg?style=flat-square" alt="Build Status"></a>
<a href="https://github.com/agile-ts/agile/actions?query=workflow%3A%22Test+All+Packages%22">
   <img src="https://github.com/agile-ts/agile/workflows/Test%20All%20Packages/badge.svg" alt="Build Status"></a>
<a href="https://codeclimate.com/github/agile-ts/agile/coverage">
   <img src="https://codeclimate.com/github/agile-ts/agile/badges/gpa.svg" alt="Maintainability"></a>

<br />

<a href="https://npm.im/@agile-ts/core">
  <img src="https://img.shields.io/npm/dm/@agile-ts/core.svg" alt="npm monthly downloads"></a>
<a href="https://npm.im/@agile-ts/core">
  <img src="https://img.shields.io/npm/dt/@agile-ts/core.svg" alt="npm total downloads"></a>
    


<br />


<br />
<img src="https://raw.githubusercontent.com/agile-ts/agile/master/static/how_to_create_state_header.png" alt="How to create a State?">

```tsx
// -- core.js ------------------------------------------

// Let's start by creating an Instance of AgileTs
const App = new Agile();

// Than we can build our first State
const MY_FIRST_STATE = App.State("Hello Stranger!");

// -- myComponent.whatever ------------------------------------------

// Now we are able to bind our State to nearly any UI-Component
// And wolla its reactive. Everytime the State mutates the Component gets rerendered
const myFirstState = useAgile(MY_FIRST_STATE); // returns value of State ("Hello Stranger!")
```
To find out more checkout our [documentation](https://agile-ts.org/docs).

### ⛳️ Sandbox
Test AgileTs yourself, it's only one click away. Just select your preferred Framework below.
- [React](https://codesandbox.io/s/agilets-first-state-f12cz)
- Vue (coming soon)
- Angular (coming soon)


<br />


<br />
<img src="https://raw.githubusercontent.com/agile-ts/agile/master/static/why_should_i_use_agile.png" alt="Why should I use AgileTs?">

### 🚅 Straightforward
Write minimalistic, boilerplate free code that captures your intent. 

**Some straightforward syntax examples:**
- Store State in the Local Storage
  ```ts
  MY_STATE.persist("storage-key")
  ```
- Create reactive Collection of States
  ```ts
  const MY_COLLECTION = App.Collection();
  MY_COLLECTION.collect({id: 1, name: "Frank"});
  MY_COLLECTION.collect({id: 2, name: "Dieter"});
  ```
- Mutate or Check States with simple Functions
  ```ts
  MY_STATE.undo(); // Undo last change
  MY_STATE.is({hello: "jeff"}); // Check if State has the Value {hello: "jeff"}
  ```

### 🤸‍ Flexible
- Works in nearly every UI-Framework. Check [here](https://agile-ts.org/docs/frameworks) if the Framework you are using is supported, too.
- Surly behaves with the workflow that suits you best.
  No need for _reducers_, _actions_, ..
- Has **no** external dependencies

### 🌌 Centralize
Manage your Application Logic in a central place outside any UI-Framework.
This makes your code more decoupled, portable, and above all, easily testable.

### 🎯 Easy to Use
Learn the powerful tools of AgileTs in a short amount of time.
A good place to start is in our [documentation](https://agile-ts.org/docs).

### 🍃 Lightweight
AgileTs has an unpacked size of [52.7kB](https://bundlephobia.com/result?p=@agile-ts/core@0.0.6) 
and [0 dependencies](https://www.npmjs.com/package/@agile-ts/core).


<br />


<br />
<img src="https://raw.githubusercontent.com/agile-ts/agile/master/static/installation_header.png" alt="Installation">

To use AgileTs properly, in an UI-Framework we have to install **2** packages.

- The _Core Package_, which is the brain of AgileTs and handles your States, Collections, ..
  ```
  npm install @agile-ts/core
  ```

- A _fitting integration_ for the UI-Framework you are using.. in my case [React](https://www.npmjs.com/package/@agile-ts/react).
  Check [here](https://agile-ts/docs/framework) your Framework is supported, too.
  ```
  npm install @agile-ts/react
  ```
  

<br />


<br />
<img src="https://raw.githubusercontent.com/agile-ts/agile/master/static/documentation_header.png" alt="Documentation">

If AgileTs sounds interesting to you.
Checkout our **[docs](https://agile-ts.org/docs/)**. 
And I am sure you will be able to use it in no time.
In case you have any questions don't mind joining our [Discord Community](https://discord.gg/FTqeMNCxw7).


<br />


<br />
<img src="https://raw.githubusercontent.com/agile-ts/agile/master/static/contribute_header.png" alt="Contribute">

Get a part of AgileTs and start contributing. To find out more read the [CONTRIBUTING.md](./CONTRIBUTING.md).


<br />


<br />
<img src="https://raw.githubusercontent.com/agile-ts/agile/master/static/packages_of_agile.png" alt="Packages of Agile">

| Name                                                                     |                                                                               Latest Version                                                                                | Description                               |
| ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| [@agile-ts/core](/packages/core)                                         |               [![badge](https://img.shields.io/npm/v/@agile-ts/core.svg?style=flat-square)](https://www.npmjs.com/package/@agile-ts/core)                                   | Brain of Agile                            |
| [@agile-ts/react](/packages/react)                                       |               [![badge](https://img.shields.io/npm/v/@agile-ts/react.svg?style=flat-square)](https://www.npmjs.com/package/@agile-ts/react)                                 | React Integration                         |
| [@agile-ts/api](/packages/api)                                           |               [![badge](https://img.shields.io/npm/v/@agile-ts/api.svg?style=flat-square)](https://www.npmjs.com/package/@agile-ts/api)                                     | Promise based Api                         |
| [@agile-ts/multieditor](/packages/multieditor)                           |               [![badge](https://img.shields.io/npm/v/@agile-ts/multieditor.svg?style=flat-square)](https://www.npmjs.com/package/@agile-ts/multieditor)                     | Simple Form Manager                       |


<br />


<br />
<img src="https://raw.githubusercontent.com/agile-ts/agile/master/static/credits_header.png" alt="Credits">

AgileTs is inspired by [PulseJs](https://github.com/pulse-framework/pulse)
