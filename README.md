 <img src="static/header_background.png" alt="Banner">
 
 > **Spacy, Simple, Scalable State Management Framework**
 
 <br />

 <a href="https://github.com/agile-ts/agile">
  <img src="https://img.shields.io/github/license/agile-ts/agile.svg" alt="GitHub License"></a>
<a href="https://npm.im/@agile-ts/core">
  <img src="https://img.shields.io/npm/dm/@agile-ts/core.svg" alt="npm monthly downloads"></a>
<a href="https://npm.im/@agile-ts/core">
  <img src="https://img.shields.io/npm/dt/@agile-ts/core.svg" alt="npm total downloads"></a>
<a href="https://npm.im/@agile-ts/core">
  <img src="https://img.shields.io/bundlephobia/min/@agile-ts/core.svg" alt="npm minified size"></a>
<a href="https://github.com/agile-ts/agile">
  <img src="https://img.shields.io/github/languages/code-size/agile-ts/agile.svg" alt="GitHub Code Size"></a>
<a href="https://github.com/agile-ts/agile">
  <img src="https://img.shields.io/github/repo-size/agile-ts/agile.svg" alt="GitHub Repo Size"></a>

<br />

<br />
<img src="static/how_to_create_state_header.png" alt="How to create State Header">
<br />

```tsx
// -- core.js ------------------------------------------

// At first we need an Instance of Agile
const App = new Agile();

// Than we can create our first State
const MY_FIRST_STATE = App.State("Hello Stranger!");

// -- myComponent.whatever ------------------------------------------

// Now we can bind our State to nearly any UI-Component
// And wolla its reactive. Everytime the State mutates the Component gets rerendered
const myFirstState = useAgile(MY_FIRST_STATE); // returns "Hello Stranger!"
```
To find out more checkout our [documentation](https://agile-ts.org/docs).

### ⛳️ Sandbox
Test AgileTs yourself in one click. Just select your preferred Framework below.
- [React](https://codesandbox.io/s/agilets-first-state-f12cz)
- Vue (coming soon)
- Angular (coming soon)

<br />

<br />
<img src="static/why_should_i_use_agile.png" alt="Why should I use AgileTs">
<br />

### 🚅 Straightforward
Write minimalistic, boilerplate free code that captures your intent. 

**Some straightforward syntax examples:**
- Store a State in the Local Storage
  ```ts
  MY_STATE.persist("storage-key")
  ```
- Create a reactive Collection of States
  ```ts
  const MY_COLLECTION = App.Collection();
  MY_COLLECTION.collect({id: 1, name: "Frank"});
  MY_COLLECTION.collect({id: 2, name: "Dieter"});
  ```
- Mutate or Check your States with simple Functions
  ```ts
  MY_STATE.undo(); // Undo last change
  MY_STATE.is({hello: "jeff"}); // Check if State has the Value {hello: "jeff"}
  ```

### 🤸‍ Flexible
- Works in nearly every UI-Framework. Check [here](TODO) if your framework is supported too.
- Surly works with the workflow that suits you best.. 
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
<img src="static/installation_header.png" alt="Installation">
<br />

To use AgileTs in a UI-Framework we have to install 2 packages.

- The Core Package, which is the brain of AgileTs and handles your States, Collections, ..
  ```
  npm install @agile-ts/core
  ```

- A _fitting integration_ for the UI-Framework are using.. in my case [React](https://www.npmjs.com/package/@agile-ts/react).
  ```
  npm install @agile-ts/react
  ```
  
<br />

<br />
<img src="static/documentation_header.png" alt="Installation">
<br />

If AgileTs sounds interesting to you and you want to find out more.
Checkout our [docs](https://agile-ts.org/docs/). If you have any questions don't mind joining our [Discord Community](https://discord.gg/FTqeMNCxw7).


## 🗂 Packages of Agile
| Name                                                                     |                                                                               Latest Version                                                                                | Description                               |
| ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| [@agile-ts/core](/packages/core)                                         |               [![badge](https://img.shields.io/npm/v/@agile-ts/core.svg?style=flat-square)](https://www.npmjs.com/package/@agile-ts/core)                                   | Brain of Agile                            |
| [@agile-ts/react](/packages/react)                                       |               [![badge](https://img.shields.io/npm/v/@agile-ts/react.svg?style=flat-square)](https://www.npmjs.com/package/@agile-ts/react)                                 | React Integration                         |
| [@agile-ts/api](/packages/api)                                           |               [![badge](https://img.shields.io/npm/v/@agile-ts/api.svg?style=flat-square)](https://www.npmjs.com/package/@agile-ts/api)                                     | Promise based Api                         |
| [@agile-ts/multieditor](/packages/multieditor)                           |               [![badge](https://img.shields.io/npm/v/@agile-ts/multieditor.svg?style=flat-square)](https://www.npmjs.com/package/@agile-ts/multieditor)                     | Simple Form Manager                       |


## 👨‍💻 Contribute
Get a part of AgileTs and start contributing. To find out more read the [CONTRIBUTING.md](./CONTRIBUTING.md)


## 🌠 Credits
AgileTs is inspired by [PulseJs](https://github.com/pulse-framework/pulse)
