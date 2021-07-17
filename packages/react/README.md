<img src="https://raw.githubusercontent.com/agile-ts/agile/master/packages/react/static/header_background.png" alt="React Integration">

> Integration for React and React-Native

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

The `react` package is a set of utilities that simplifies the way AgileTs is integrated into a [React](https://reactjs.org/) environment.
Think of it as an extension of AgileTs in the context of React
that serves as an interface to React Components.
The main task of the `react` integration is to bind AgileTs States to React Components.
This ensures that AgileTs will re-render the Component when the bound State changes.
It also provides some other valuable functionalities
that optimize the workflow with AgileTs in a React project.

A distinction is made between `Functional` and `Class` Components.
As we prefer to use [`React Hooks`](https://reactjs.org/docs/hooks-intro.html) in Functional Components,
however, Hooks aren't supported in Class Components.
Therefore, we have created alternatives for Class Components
in order to offer the most essential functionalities there as well.

### 🐆 Functional Component
In `Functional Components` we recommend using AgileTs Hooks like [`useAgile()`](https://agile-ts.org/docs/react/hooks/#useagile).
The `useAgile()` Hook binds [Agile Sub Instances](https://agile-ts.org/docs/introduction#agile-sub-instance) 
(like States or Collections) to React Components for reactivity.
```ts
// -- MyComponent.jsx ------------------------------------------

// Binds MY_FIRST_STATE to 'MyComponent.jsx' for reactivity
const myFirstState = useAgile(MY_FIRST_STATE);
```
To find out more about `useAgile()`, and other Hooks provided by AgileTs,
checkout the [AgileTs Hook documentation](https://agile-ts.org/docs/react/hooks).

### 🦖 Class Component
For `Class Components`, we provide the `AgileHOC`.
The `AgileHOC` is a Higher Order Component that is wrapped around a React Component.
It takes care of binding [Agile Sub Instances](https://agile-ts.org/docs/introduction#agile-sub-instance)
(like States or Collections) to the wrapped React Components for reactivity.
```ts
// -- MyComponent.jsx ------------------------------------------

// Binds MY_FIRST_STATE to 'MyComponent.jsx' for reactivyty
export default AgileHOC(myComponent, [MY_FIRST_STATE]);
```
To find out more about the `AgileHOC` and how to correctly use AgileTs in Class Components,
take a look at the [AgileHOC documentation](https://agile-ts.org/docs/react/AgileHOC).


<br />


<br />
<img src="https://raw.githubusercontent.com/agile-ts/agile/master/packages/react/static/installation_header.png" alt="Installation"/>

```
npm install @agile-ts/react
```
The `react` package is an extension of AgileTs and doesn't work without the [`core`](https://agile-ts.org/docs/core) package,
which functions as the brain of AgileTs and is indispensable.
Unfortunately, we can't combine each `core` with `react` version.
Therefore, we have created a table that shows which versions fit together without restrictions.

| @agile-ts/react  | @agile-ts/core          | NPM Version              | Supported React versions | Supports hook based components    |
| ---------------- | ----------------------- | ------------------------ | -------------------------|---------------------------------- |
| v0.1.2+          | v0.1.2+                 | v6+                      | 16.8+                    | Yes                               |

_Older Versions aren't supported anymore_


<br />


<br />
<img src="https://raw.githubusercontent.com/agile-ts/agile/master/packages/react/static/documentation_header.png" alt="Documentation"/>

Sounds AgileTs interesting to you?
Checkout our **[documentation](https://agile-ts.org/docs/react)**, to learn more.
And I promise you, you will be able to use AgileTs in no time.
If you have any further questions, don't hesitate to join our [Community Discord](https://discord.gg/T9GzreAwPH).


<br />


<br />
<img src="https://raw.githubusercontent.com/agile-ts/agile/master/packages/react/static/contribute_header.png" alt="Contribute"/>

Get a part of AgileTs and start contributing. We welcome any meaningful contribution. 😀
To find out more about contributing, check out the [CONTRIBUTING.md](https://github.com/agile-ts/agile/blob/master/CONTRIBUTING.md).

<a href="https://codeclimate.com/github/agile-ts/agile/coverage.svg">
   <img src="https://codeclimate.com/github/agile-ts/agile/badges/gpa.svg" alt="Maintainability"/>
</a>
