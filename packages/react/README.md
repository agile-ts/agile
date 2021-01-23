<img src="https://raw.githubusercontent.com/agile-ts/agile/master/packages/react/static/header_background.png" alt="React Integration">

> **Use AgileTs with React and React-Native**

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

Well, the main task of this Integration is to bind States, Collection, .. to React Components.
This binding ensures that AgileTs rerender the Component, if a bound Instance mutates.
It also offers some other useful functions that optimize the workflow of AgileTs in React.

Here is a quick example how such a binding might look like:
```ts
// -- myComponent.jsx ------------------------------------------

// Binds MY_FIRST_STATE to myComponent.jsx
 const myFirstState = useAgile(MY_FIRST_STATE);
```

A distinction is made between `Functional` and `Class` Components, 
as we prefer using `React Hooks` in Functional Components. 
But Hooks aren't supported in Class Components, so we came across other solutions,
to offer the same features there too.


<br />


<br />
<img src="https://raw.githubusercontent.com/agile-ts/agile/master/packages/react/static/installation_header.png" alt="Installation"/>

```
npm install @agile-ts/react
```
_Be aware that this is no standalone package!_ <br />

The React Integration is only an extension of AgileTs and doesn't work without the [Core Package](https://www.npmjs.com/package/@agile-ts/core),
which functions as the brain of AgileTs and is indispensable.
Unfortunately, we can't combine every `core` version with `react` version.
Therefore, you can find a table that shows which versions fit together below.

| @agile-ts/react | @agile-ts/core          | NPM Version              | Supported React versions | Supports hook based components    |
| --------------- | ----------------------- | ------------------------ | -------------------------|---------------------------------- |
| v0.0.7+         | v0.0.7+                 | v6+                      | 16.8+                    | Yes                               |
| v0.0.6          | v0.0.3 - v0.0.6         | v6+                      | 16.8+                    | Yes                               | 
_Other Versions aren't supported anymore_

To find out more checkout our [docs](https://www.agile-ts.org/docs).


<br />


<br />
<img src="https://raw.githubusercontent.com/agile-ts/agile/master/packages/react/static/documentation_header.png" alt="Documentation"/>

If you want to find out more about the AgileTs React Integration.
Checkout our **[docs](https://agile-ts.org/docs/react)**.
In case you have any questions don't mind joining our [Discord Community](https://discord.gg/FTqeMNCxw7).


<br />


<br />
<img src="https://raw.githubusercontent.com/agile-ts/agile/master/packages/react/static/contribute_header.png" alt="Contribute"/>

Get a part of AgileTs and start contributing. To find out more read the [CONTRIBUTING.md](https://github.com/agile-ts/agile/blob/master/CONTRIBUTING.md).

