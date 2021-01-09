<img src="static/header_background.png" alt="React Integration">

> **Use AgileTs with React and React-Native**

 <br />

 <a href="https://github.com/agile-ts/agile">
  <img src="https://img.shields.io/github/license/agile-ts/agile.svg" alt="GitHub License"></a>
<a href="https://npm.im/@agile-ts/react">
  <img src="https://img.shields.io/npm/v/@agile-ts/react.svg" alt="npm version"></a>
<a href="https://npm.im/@agile-ts/react">
  <img src="https://img.shields.io/bundlephobia/min/@agile-ts/react.svg" alt="npm minified size"></a>
<a href="https://npm.im/@agile-ts/react">
  <img src="https://img.shields.io/npm/dt/@agile-ts/react.svg" alt="npm total downloads"></a>


<br />


<br />
<img src="static/what_does_this_integration_header.png" alt="What does this Integration?">

Well, this Integration binds AgileTs Instances to React Components.
Through that binding AgileTs is able to rerender the Component if an Instance mutates.

Here is a simple example how such a binding might look like
```ts
// -- myComponent.whatever ------------------------------------------

// Binds MY_FIRST_STATE to myComponent.whatever
 const myFirstState = useAgile(MY_FIRST_STATE);
```


<br />


<br />
<img src="static/installation_header.png" alt="Installation">

```
npm install @agile-ts/react
```
_Be aware that this is no standalone package!_ <br />
To use AgileTs with React properly, we have to install the [Core Package](https://www.npmjs.com/package/@agile-ts/core) too,
but be aware that we can't combine each version. 
Below you can find a table which defines which Core Version you should use with which React Version.

| @agile-ts/react | @agile-ts/core          | NPM Version              | Supported React versions | Supports hook based components    |
| --------------- | ----------------------- | ------------------------ | -------------------------|---------------------------------- |
| v0.0.7          | v0.0.7+                 | v6+                      | 16.8+                    | Yes                               |
| v0.0.6          | v0.0.3 - v0.0.6         | v6+                      | 16.8+                    | Yes                               | 
_Other Versions aren't supported anymore_

To find out more take a look into the [docs](https://www.agile-ts.org/docs).


## 🎚 Functional Components: `useAgile`
For Function Component Users we recommend using the `useAgile` Hook.
With that Hook you are able to bind an Agile Instance to your Component.
This ensures that your Component rerender, when the bound AgileInstance mutates.
`useAgile` returns the current `output` of the passed Agile Instance.
```ts
const myCoolState = useAgile(MY_COOL_STATE); 
```
For instance if `MY_COOL_STATE` has the Value _"Frank"_ the `useAgile` Hook returns _"Frank"_.
It is also possible to bind more than one Agile Instance to a Component at once.
```ts
  const [myCoolState1, myCoolStat2] = useAgile([MY_COOL_STATE1, MY_COOL_STATE2]);
```

### 🛠 Straightforward Example

```tsx
  const App = new Agile();
  const MY_FIRST_STATE = App.State("Hello Stranger!");
  
  const RandomComponent = () => {
      // With 'useAgile' we bind our State to our 'RandomComponent'
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

### ⛳️ Sandbox
Test the `useAgile` yourself, it's only [one click](https://codesandbox.io/s/agilets-first-state-f12cz) away.


## 🗿 Class Component: `AgileHOC`
For Class Components Users we recommend using the `AgileHOC`.
At first what is a HOC, well it's a [Higher Order Component](https://reactjs.org/docs/higher-order-components.html)
that gets wrapped around our Class. 
By warping our Component into the `AgileHOC`, you are able to bind Agile Instances to it.
This ensures that your Class Component rerender, when a bound Agile Instance mutates. 
The `output` of the Agile Instance gets merged into the `props` of the Class Component.
```tsx
class RandomComponent extends React.Component {
  render() {
    return <h1>Hi {this.props.myCoolState}</h1>;
  }
}

// Warapping AgileHOC around our Component, and binding MY_COOL_STATE to it
export default AgileHOC(RandomComponent, [MY_COOL_STATE]);
```
For instance if `MY_COOL_STATE` has the Value _"Frank"_ `this.props.myCoolState` returns _"Frank"_.
This is possible because the output of `MY_COOL_STATE` gets merged into the RandomComponent props.
The name `myCoolState` is based on the State Key which can be set with `MY_COOL_STATE.setKey("myCoolState")`.

### ⛳️ Sandbox
Test the `AgileHOC` yourself, it's only [one click](TODO) away.


<br />


<br />
<img src="static/documentation_header.png" alt="Documentation">

If you want to find out more about the React Integration.
Checkout our **[docs](https://agile-ts.org/docs/)**.
And I am sure you will be able to use it in no time.
If you have any questions don't mind joining our [Discord Community](https://discord.gg/FTqeMNCxw7).


<br />


<br />
<img src="static/contribute_header.png" alt="Contribute">

Get a part of AgileTs and start contributing. To find out more read the [CONTRIBUTING.md](./CONTRIBUTING.md).

