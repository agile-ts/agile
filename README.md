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


## 🚀 Look how easy it is 
Blow example is based on React
```tsx
// At first we have to create an Instance of Agile
const App = new Agile();

// Now we can create a State which has an initial Value of "Hello Stranger!"
const MY_FIRST_STATE = App.State("Hello Stranger!");

// Our cool React Component
const RandomComponent = () => {
    // With 'useAgile' we bind the State to the 'RandomComponent'
    const myFirstState = useAgile(MY_FIRST_STATE); // Returns "Hello Stranger!"
                                                              //       ^
    return (                                                  //       |
        <div>                                                 //       |  Throught the 'set' action the State Value 
            <p>{myFirstState}</p>                             //       |  gets changed to "Hello Friend!" 
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
<br />
or do you want to find out [more](https://www.agile-ts.org/docs)?


## ❓ Why Agile

#### 🚅 Straightforward
Write minimalistic, boilerplate free code that captures your intent. <br />
_Do you want to store a State in the Local Storage?_
```ts
const MY_STORED_STATE = App.State("Jeff").persist("storage-key")
```
_or do you need a reactive Collection of States?_
```ts
const MY_COLLECTION = App.Collection();
MY_COLLECTION.collect({id: 1, name: "Frank"});
MY_COLLECTION.collect({id: 2, name: "Dieter"});
```

#### 🤸‍ Flexible
Agile can be used in nearly every UI-Framework 
and surly works with the workflow that suits you best, 
since Agile is not bound to dispatches, reducers, ..

#### 🎯 Easy to Use
Learn the powerful and simple tools of Agile in a short amount of time.

#### ⛳️ Centralize
Manage your Application Logic outside of any UI-Framework in a central place. <br />
This makes your application logic decoupled, portable, and above all, easily testable. 

#### 🍃 Lightweight
Agile has an unpacked size of [52.7kB](https://bundlephobia.com/result?p=@agile-ts/core@0.0.6) 
and 0 dependencies.


## ⬇️ Installation

```
npm install @agile-ts/core
```
To use Agile we have to install the _core_ package, it's the brain and handles your States, Collections, ..
<br />
```
npm install @agile-ts/react
```
In addition, we need to install a _fitting integration_ for the Framework we are using.. in my case React.


## 📄 Documentation
The Agile Docs are located [here](https://agile-ts.org/docs/)


## 🗂 Packages of Agile
| Name                                                                     |                                                                               Latest Version                                                                                | Description                               |
| ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| [@agile-ts/core](/packages/core)                                         |               [![badge](https://img.shields.io/npm/v/@agile-ts/core.svg?style=flat-square)](https://www.npmjs.com/package/@agile-ts/core)                                   | Brain of Agile                            |
| [@agile-ts/react](/packages/react)                                       |               [![badge](https://img.shields.io/npm/v/@agile-ts/react.svg?style=flat-square)](https://www.npmjs.com/package/@agile-ts/react)                                 | React Integration                         |
| [@agile-ts/api](/packages/api)                                           |               [![badge](https://img.shields.io/npm/v/@agile-ts/api.svg?style=flat-square)](https://www.npmjs.com/package/@agile-ts/api)                                     | Simple Api                                |
| [@agile-ts/multieditor](/packages/multieditor)                           |               [![badge](https://img.shields.io/npm/v/@agile-ts/multieditor.svg?style=flat-square)](https://www.npmjs.com/package/@agile-ts/multieditor)                     | Simple Form Manager                       |


## 👨‍💻 Contribute
Feel free to contribute


## 🌠 Credits
AgileTs is inspired by [PulseJs](https://github.com/pulse-framework/pulse)
