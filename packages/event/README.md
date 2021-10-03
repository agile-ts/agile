# [WIP] Event

> Handy class for emitting UI Events

 <a href="https://agile-ts.org">
   <img src="https://img.shields.io/badge/Status-Alpha-green.svg" alt="Status"/>
 </a>
<a href="https://npm.im/@agile-ts/event">
  <img src="https://img.shields.io/npm/v/@agile-ts/event.svg" alt="npm version"/></a>
 <a href="https://github.com/agile-ts/agile">
  <img src="https://img.shields.io/github/license/agile-ts/agile.svg" alt="GitHub License"/></a>
<a href="https://npm.im/@agile-ts/event">
  <img src="https://img.shields.io/npm/dm/@agile-ts/event.svg" alt="npm monthly downloads"/></a>
<a href="https://npm.im/@agile-ts/event">
  <img src="https://img.shields.io/npm/dt/@agile-ts/event.svg" alt="npm total downloads"/></a>
<a href="https://npm.im/@agile-ts/event">
  <img src="https://img.shields.io/bundlephobia/min/@agile-ts/event.svg" alt="npm minified size"/></a>
  

## ⏰ Short Example
```ts
const MY_EVENT = createEvent();
MY_EVENT.on((data) => {console.log("hello there " + data.name)}); // Print 'hello there jeff' if Event gets triggered
MY_EVENT.trigger({name: "jeff"}); // Trigger Event
```


## ⬇️ Installation
```
npm install @agile-ts/event
```
The `event` package is an extension of AgileTs and doesn't work without the [`core`](https://agile-ts.org/docs/core) package,
which functions as the brain of AgileTs and is indispensable.
Unfortunately, we can't combine each `core` with `event` version.
Therefore, we have created a table which shows which versions fit together without restrictions.

| @agile-ts/event       | @agile-ts/core          | NPM Version              | Supported React versions | Supports hook based components    |
| ----------------------| ----------------------- | ------------------------ | -------------------------|---------------------------------- |
| v0.0.1+               | v0.0.10+                | v6+                      | 16.8+                    | Yes                               |
_Other Versions aren't supported anymore_


## 📄 Documentation
The Agile Event Docs are located [here](https://agile-ts.org/docs/)
