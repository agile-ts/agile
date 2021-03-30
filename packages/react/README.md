<img src="https://raw.githubusercontent.com/agile-ts/agile/master/packages/react/static/header_background.png" alt="React Integration">

> Integrate AgileTs into React or React-Native

 <br />

 <a href="https://github.com/agile-ts/agile">
  <img src="https://img.shields.io/github/license/agile-ts/agile.svg?label=license&style=flat&colorA=293140&colorB=4a4872" alt="GitHub License"/></a>
<a href="https://npm.im/@agile-ts/react">
  <img src="https://img.shields.io/npm/v/@agile-ts/react.svg?label=npm&style=flat&colorA=293140&colorB=4a4872" alt="npm version"/></a>
<a href="https://npm.im/@agile-ts/react">
  <img src="https://img.shields.io/bundlephobia/min/@agile-ts/react.svg?label=minified%20size&style=flat&colorA=293140&colorB=4a4872" alt="npm minified size"/></a>
<a href="https://npm.im/@agile-ts/react">
  <img src="https://img.shields.io/npm/dt/@agile-ts/react.svg?label=downloads&style=flat&colorA=293140&colorB=4a4872" alt="npm total downloads"/></a>


<br />


<br />
<img src="https://raw.githubusercontent.com/agile-ts/agile/master/packages/react/static/what_does_this_integration_header.png" alt="What does this Integration?"/>

The `react` package is an Integration of AgileTs into React.
Its main task is to bind States to React Components.
This binding ensures that AgileTs rerender the Component, whenever a bound State mutates.
It also offers some other useful functions that optimize the workflow with AgileTs in a React Environment.

A distinction is made between `Functional` and `Class` Components,
as we prefer using `React Hooks` in Functional Components.
But Hooks aren't supported in Class Components, so we came across other solutions,
to offer the same features there too.

### 🐆 Functional Component
In Function Components we recommend using AgileTs Hooks like `useAgile`,
which allows us to bind any State to our React Component
```ts
// -- myComponent.jsx ------------------------------------------

// Binds MY_FIRST_STATE to myComponent
const myFirstState = useAgile(MY_FIRST_STATE);
```
To find out more about `useAgile`, and other Hooks provided by AgileTs,
checkout the AgileTs Hook [docs](https://agile-ts.org/docs/react/hooks).

### 🦖 Class Component
In Class Component we currently only support the `AgileHOC`,
which helps us binding States to our Component.
It is a Higher order Component that gets wrapped around our React Component.
```ts
// -- myComponent.jsx ------------------------------------------

// Binds MY_FIRST_STATE to myComponent
export default AgileHOC(myComponent, [MY_FIRST_STATE]);
```
To find out more AgileTs in Class Components,
checkout the AgileHOC [docs](https://agile-ts.org/docs/react/AgileHOC).


<br />


<br />
<img src="https://raw.githubusercontent.com/agile-ts/agile/master/packages/react/static/installation_header.png" alt="Installation"/>

```
npm install @agile-ts/react
```
The `react` package is an extension of AgileTs and doesn't work without the [`core`](https://agile-ts.org/docs/core) package,
which functions as the brain of AgileTs and is indispensable.
Unfortunately, we can't combine each `core` with `react` version.
Therefore, we have created a table which shows which versions fit together without restrictions.

| @agile-ts/react | @agile-ts/core          | NPM Version              | Supported React versions | Supports hook based components    |
| --------------- | ----------------------- | ------------------------ | -------------------------|---------------------------------- |
| v0.0.7+         | v0.0.7+                 | v6+                      | 16.8+                    | Yes                               |
| v0.0.6          | v0.0.3 - v0.0.6         | v6+                      | 16.8+                    | Yes                               | 
_Other Versions aren't supported anymore_


<br />


<br />
<img src="https://raw.githubusercontent.com/agile-ts/agile/master/packages/react/static/documentation_header.png" alt="Documentation"/>

Checkout our **[documentation](https://agile-ts.org/docs/introduction)**, to learn more.
In case you have any further questions don't mind joining our [Community Discord](https://discord.gg/T9GzreAwPH).


<br />


<br />
<img src="https://raw.githubusercontent.com/agile-ts/agile/master/packages/react/static/contribute_header.png" alt="Contribute"/>

Get a part of AgileTs and start contributing. We welcome any meaningful contribution 😀
To find out more checkout the [CONTRIBUTING.md](https://github.com/agile-ts/agile/blob/master/CONTRIBUTING.md).
