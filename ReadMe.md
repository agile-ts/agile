# AgileTs

> Spacy State Management Framework for reactive Applications

<a href="https://npm.im/@agile-ts/core">
  <img src="https://img.shields.io/npm/v/@agile-ts/core.svg" alt="npm version"></a>
<a href="https://npm.im/@agile-ts/core">
  <img src="https://img.shields.io/npm/dm/@agile-ts/core.svg" alt="npm monthly downloads"></a>
<a href="https://npm.im/@agile-ts/core">
  <img src="https://img.shields.io/npm/dt/@agile-ts/core.svg" alt="npm total downloads"></a>
<a href="https://npm.im/@agile-ts/core">
  <img src="https://img.shields.io/bundlephobia/min/@agile-ts/core.svg" alt="npm minified size"></a>
  
  
<br />

<a href="https://github.com/agile-ts/agile">
  <img src="https://img.shields.io/github/license/agile-ts/agile.svg" alt="GitHub License"></a>
<a href="https://github.com/agile-ts/agile">
  <img src="https://img.shields.io/github/languages/code-size/agile-ts/agile.svg" alt="GitHub Code Size"></a>
<a href="https://github.com/agile-ts/agile">
  <img src="https://img.shields.io/github/repo-size/agile-ts/agile.svg" alt="GitHub Repo Size"></a>
  
 ### Why Agile?
 
 TODO

### Get started with React

** 1. Install Core of AgileTs ** |
_Brain of AgileTs that handles your States, Collections, Events, .._
```
npm install @agile-ts/core
```

** 2. Install React Integration ** |
_Integration for React to cause rerenders on your components_
```
npm install @agile-ts/react
```

** 3. Simple Example **
```ts
// Create an Instance of Agile that holds and handles all your States
const App = new Agile();

// Create State that has the Value "Hello Stranger"
const MY_STATE = App.State("Hello Stranger");

let helloWorldCount = 0;

// Our React Component
const RandomComponent = () => {
    // Subscribe State and get current Value of It
    const myFirstState = useAgile(MY_FIRST_STATE);

    return (
        <div>
            <p>{myFirstState}</p>
            <button
                onClick={() => {
                    // Update State Value
                    MY_FIRST_STATE.set(`Hello World ${++helloWorldCount}`)
                }}
            >
                Update State
            </button>
        </div>
    );
}
```

| Name                                                                     |                                                                               Latest Version                                                                                |
| ------------------------------------------------------------------------ | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------: |
| [@agile-ts/core](/packages/core)                                         |               [![badge](https://img.shields.io/npm/v/@agile-ts/core.svg?style=flat-square)](https://www.npmjs.com/package/@agile-ts/core)                                   |
| [@agile-ts/react](/packages/react)                                       |               [![badge](https://img.shields.io/npm/v/@agile-ts/react.svg?style=flat-square)](https://www.npmjs.com/package/@agile-ts/react)                                 |
| [@agile-ts/api](/packages/api)                                           |               [![badge](https://img.shields.io/npm/v/@agile-ts/api.svg?style=flat-square)](https://www.npmjs.com/package/@agile-ts/api)                                     |
| [@agile-ts/multieditor](/packages/multieditor)                           |               [![badge](https://img.shields.io/npm/v/@agile-ts/multieditor.svg?style=flat-square)](https://www.npmjs.com/package/@agile-ts/multieditor)                     |            

#### Agile is inspired by [PulseJs](https://github.com/pulse-framework/pulse)
