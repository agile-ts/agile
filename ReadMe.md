 <img src="https://agile-ts.org/img/header_background.svg" alt="Banner">
 
 > Spacy State Management Framework for reactive Applications

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
  
## ❓ Why Agile

#### 🚅 Straightforward
Write minimalistic, boilerplate free code with a moderate lerning curve.

**For Instance**  <br />

Store State in Storage
```
const MY_STATE = App.State("Hello there").persist("persist-key");
```

Create an Collection of States
```
const MY_COLLECTION = App.Collection();
MY_COLLECTION.collect({id: "1", name: "Jeff"});
MY_COLLECTION.collect({id: "2", name: "Hans"});
```

#### 🎯 Easy to Use
Learn the powerfull tools of Agile in a short amount of time.

#### 🤸‍ Flexible
Use any UI-Layer and the workflow that suits you the best.

#### ⛳️ Centralize
Manage your Application Logic central outside of any UI-Framework.

## 🚀 Get Started (React)

**1. ⬇️ Install Core** <br />
_Brain of AgileTs that handles your States, Collections, Events, .._
```
npm install @agile-ts/core
```

**2. ⬇️ Install React Integration** <br />
_Integration for React that helps you subscribing your States in your Components_
```
npm install @agile-ts/react
```

**3. 🎲 Simple Example** <br />
_If you can't believe the simplicity, convince yourself [here](https://codesandbox.io/s/agilets-first-state-f12cz?file=/src/RandomComponent.js)_
```ts
// Create an Instance of Agile that holds and handles your States
const App = new Agile();

// Create State that has a initial Value of "Hello Stranger!"
const MY_FIRST_STATE = App.State("Hello Stranger!");

// Your React Component
const RandomComponent = () => {
    // Subscribe State to Component and get current Value from It
    const myFirstState = useAgile(MY_FIRST_STATE); // Returns "Hello Stranger!"
                                                              //       ^
    return (                                                  //       |
        <div>                                                 //       |  Now the State Value gets changed to
            <p>{myFirstState}</p>                             //       |  "Hello Friend!" and causes a rerender 
            <button                                           //       |  on this Component.
                onClick={() => {                              //       |  -> myFirstState has the Value "Hello Friend"
                    // Update State Value to "Hello Friend!"  //       |
                    MY_FIRST_STATE.set("Hello Friend!") // -------------
                }}
            >
                Update State
            </button>
        </div>
    );
}
```
If you want to find out more checkout the [documentation](https://agile-ts.org/docs/)


## 🗂 Packages of Agile
| Name                                                                     |                                                                               Latest Version                                                                                | Description                               |
| ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| [@agile-ts/core](/packages/core)                                         |               [![badge](https://img.shields.io/npm/v/@agile-ts/core.svg?style=flat-square)](https://www.npmjs.com/package/@agile-ts/core)                                   | Brain of Agile                            |
| [@agile-ts/react](/packages/react)                                       |               [![badge](https://img.shields.io/npm/v/@agile-ts/react.svg?style=flat-square)](https://www.npmjs.com/package/@agile-ts/react)                                 | React Integration                         |
| [@agile-ts/api](/packages/api)                                           |               [![badge](https://img.shields.io/npm/v/@agile-ts/api.svg?style=flat-square)](https://www.npmjs.com/package/@agile-ts/api)                                     | Simple Api                                |
| [@agile-ts/multieditor](/packages/multieditor)                           |               [![badge](https://img.shields.io/npm/v/@agile-ts/multieditor.svg?style=flat-square)](https://www.npmjs.com/package/@agile-ts/multieditor)                     | Simple Form Manager                       |

## 📄 Documentation
The Agile Docs are located [here](https://agile-ts.org/docs/)


## 😎 Inspiration
- Syntax of Agile is Inspired by [PulseJs](https://github.com/pulse-framework/pulse)
