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

**1. Install Core of AgileTs** <br />
_Brain of AgileTs that handles your States, Collections, Events, .._
```
npm install @agile-ts/core
```

**2. Install React Integration** <br />
_Integration for React that helps you subscribing your States in your Components_
```
npm install @agile-ts/react
```

**3. Simple Example** <br />
_If you can't believe the simplicity test it [here](https://agile-ts.org/)_
```ts
// Create an Instance of Agile that holds and handles your States
const App = new Agile();

// Create State that has the initial Value "Hello Stranger!"
const MY_FIRST_STATE = App.State("Hello Stranger!");

// Our React Component
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

| Name                                                                     |                                                                               Latest Version                                                                                |
| ------------------------------------------------------------------------ | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------: |
| [@agile-ts/core](/packages/core)                                         |               [![badge](https://img.shields.io/npm/v/@agile-ts/core.svg?style=flat-square)](https://www.npmjs.com/package/@agile-ts/core)                                   |
| [@agile-ts/react](/packages/react)                                       |               [![badge](https://img.shields.io/npm/v/@agile-ts/react.svg?style=flat-square)](https://www.npmjs.com/package/@agile-ts/react)                                 |
| [@agile-ts/api](/packages/api)                                           |               [![badge](https://img.shields.io/npm/v/@agile-ts/api.svg?style=flat-square)](https://www.npmjs.com/package/@agile-ts/api)                                     |
| [@agile-ts/multieditor](/packages/multieditor)                           |               [![badge](https://img.shields.io/npm/v/@agile-ts/multieditor.svg?style=flat-square)](https://www.npmjs.com/package/@agile-ts/multieditor)                     |            

#### Agile is inspired by [PulseJs](https://github.com/pulse-framework/pulse)
