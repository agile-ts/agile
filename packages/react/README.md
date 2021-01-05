# React Integration

> Combines Agile with React or React-Native

<a href="https://npm.im/@agile-ts/react">
  <img src="https://img.shields.io/npm/v/@agile-ts/react.svg" alt="npm version"></a>
 <a href="https://github.com/agile-ts/agile">
  <img src="https://img.shields.io/github/license/agile-ts/agile.svg" alt="GitHub License"></a>
<a href="https://npm.im/@agile-ts/react">
  <img src="https://img.shields.io/npm/dm/@agile-ts/react.svg" alt="npm monthly downloads"></a>
<a href="https://npm.im/@agile-ts/react">
  <img src="https://img.shields.io/npm/dt/@agile-ts/react.svg" alt="npm total downloads"></a>
<a href="https://npm.im/@agile-ts/react">
  <img src="https://img.shields.io/bundlephobia/min/@agile-ts/react.svg" alt="npm minified size"></a>

## ❓ Why a React Integration
We need this Integration to bind Agile Instances to Components.
This is necessary because a Component needs to rerender
if an Agile Instance mutates otherwise the Application wouldn't be reactive.
Unfortunately it isn't possible to find out which Agile Instance has been bound to the Component from outside. 
-> Agile wouldn't know which Component has to be rerender when which Agile Instance changes.

  
## ⬇️ Installation
```
npm install @agile-ts/react
```
_Be aware that this is no standalone package!_ <br />
To use Agile with this React-Extension you have to install the [Agile Core](https://www.npmjs.com/package/@agile-ts/core). <br />
To find out more take a look into the [docs](https://www.agile-ts.org/docs).
    
## 🎚 Functional Components: `useAgile`
`useAgile` is a React Hook that helps you to bind an Agile Instance (State, Collection, ..) to a React Component.
This is necessary to cause rerender on the Component if the bound Instance mutates.
This Hook does return the current `output` of the subscribed Agile Instance.
```ts
const myCoolState = useAgile(MY_COOL_STATE); 
```
-> If `MY_COOL_STATE` has the Value _"Frank"_ the `useAgile` Hook returns _"Frank"_.
It is also possible to bind more than one Agile Instance to a Component at once.
```ts
  const [myCoolState1, myCoolStat2] = useAgile([MY_COOL_STATE1, MY_COOL_STATE2]);
  ```

#### 🛠 [Simple Example](https://codesandbox.io/s/agilets-first-state-f12cz?file=/src/RandomComponent.js)
```tsx
  const App = new Agile();
  const MY_FIRST_STATE = App.State("Hello Stranger!");
  
  const RandomComponent = () => {
      // With 'useAgile' we bind our State to the 'RandomComponent'
      const myFirstState = useAgile(MY_FIRST_STATE); // Returns "Hello Stranger!"
                                                                //       ^
      return (                                                  //       |
          <div>                                                 //       |  Through the 'set' action the State Value 
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

## 🗿 Class Component: `AgileHOC`
`AgileHOC` is a class that gets wrapped around a Component Class, to update the props of the Component
based on the Agile Instances Output (State, Collection, ..) and to cause rerender on it.
```tsx
class Component extends React.Component {
  render() {
    return <h1>Hi {this.props.myCoolState}</h1>;
  }
}

export default AgileHOC(Component, [MY_COOL_STATE]);
```
If `MY_COOL_STATE` has a value of _"Frank"_ `this.props.myCoolState` returns the value _"Frank"_.
The name `myCoolState` is based on the State Key! 
If an Agile Instance has no `output` it won't be listed in the props!

## 🔑 Fitting Versions
| @agile-ts/react | @agile-ts/core          | NPM Version              | Supported React versions | Supports hook based components    |
| --------------- | ----------------------- | ------------------------ | -------------------------|---------------------------------- |
| v0.0.7          | v0.0.7+                 | v6+                      | 16.8+                    | Yes                               |
| v0.0.6          | v0.0.3 - v0.0.6         | v6+                      | 16.8+                    | Yes                               | 
_Other Versions aren't supported anymore_

## 📄 Documentation
The React Integration Docs are located [here](https://agile-ts.org/docs/)