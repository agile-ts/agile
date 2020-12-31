 <img src="https://agile-ts.org/img/header_background.svg" alt="Banner">
 
 > **Spacy**, **Simple**, **Scalable** State Management Framework
 
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

## 🚀 Look how easy it is (React)
```tsx
// At first we have to create an Instance of Agile
const App = new Agile();

// Now we can create a State which has a initial Value of "Hello Stranger!"
const MY_FIRST_STATE = App.State("Hello Stranger!");

// Our cool React Component
const RandomComponent = () => {
    // With 'useAgile' we can bind the State to this Component
    const myFirstState = useAgile(MY_FIRST_STATE); // Returns "Hello Stranger!"
                                                              //       ^
    return (                                                  //       |
        <div>                                                 //       |  Throught the 'set' action the State Value 
            <p>{myFirstState}</p>                             //       |  gets changed  to "Hello Friend!" 
            <button                                           //       |  and causes a rerender on this Component.
                onClick={() => {                              //       |  -> myFirstState has the Value "Hello Friend!"
                    // Lets's update the State Value          //       |
                    MY_FIRST_STATE.set("Hello Friend!") // -------------
                }}
            >
                Update State
            </button>
        </div>
    );
}
```
_You can't believe the simplicity?! Convince yourself [here](https://codesandbox.io/s/agilets-first-state-f12cz?file=/src/RandomComponent.js)_


## ❓ Why Agile

#### 🚅 Straightforward
Write minimalistic, boilerplate free code that captures your intent. <br />
Do you want to store a State in the Local Storage? No Problem 
```ts
const MY_STORED_STATE = App.State("Jeff").persist("storage-key")
```
or do you need a reactive Collection of States? Nothing easier than that
```ts
const MY_COLLECTION = App.Collection();
MY_COLLECTION.collect(id: 1, name: "Frank");
MY_COLLECTION.collect(id: 2, name: "Dieter");
```

#### 🤸‍ Flexible
Use Agile with any UI-Layer and a workflow that suits you the best. <br />
-> You are NOT bound to reducers, actions, dispatches, ..

#### 🎯 Easy to Use
Learn the powerful and simple tools of Agile in a short amount of time.

#### ⛳️ Centralize
Manage your Application Logic central, outside of any UI-Framework.
This makes your code decoupled, portable, and above all, easily testable. 


## ⬇️ Installation

```
npm install @agile-ts/core
```
To use Agile we need the 'core', its the Brain of Agile and handles your States, Collections, ..

```
npm install @agile-ts/react
```
Now we have to install a fitting integration for the Framework we are using.. in my case React.
<br />
<br />
_And that't it.. if you want to find out more take a look into the [docs](https://agile-ts.org/docs/)_


## 🗂 Packages of Agile
| Name                                                                     |                                                                               Latest Version                                                                                | Description                               |
| ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| [@agile-ts/core](/packages/core)                                         |               [![badge](https://img.shields.io/npm/v/@agile-ts/core.svg?style=flat-square)](https://www.npmjs.com/package/@agile-ts/core)                                   | Brain of Agile                            |
| [@agile-ts/react](/packages/react)                                       |               [![badge](https://img.shields.io/npm/v/@agile-ts/react.svg?style=flat-square)](https://www.npmjs.com/package/@agile-ts/react)                                 | React Integration                         |
| [@agile-ts/api](/packages/api)                                           |               [![badge](https://img.shields.io/npm/v/@agile-ts/api.svg?style=flat-square)](https://www.npmjs.com/package/@agile-ts/api)                                     | Simple Api                                |
| [@agile-ts/multieditor](/packages/multieditor)                           |               [![badge](https://img.shields.io/npm/v/@agile-ts/multieditor.svg?style=flat-square)](https://www.npmjs.com/package/@agile-ts/multieditor)                     | Simple Form Manager                       |

## 📄 Documentation
The Agile Docs are located [here](https://agile-ts.org/docs/)

## 👨‍💻 Contribute
Feel free to contribute


## 🌠 Credits
AgileTs is inspired by [PulseJs](https://github.com/pulse-framework/pulse)
