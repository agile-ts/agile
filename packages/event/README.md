# [WIP] Event

> Handy class for emitting UI updates and passing data with them.

<a href="https://npm.im/@agile-ts/api">
  <img src="https://img.shields.io/npm/v/@agile-ts/event.svg" alt="npm version"/></a>
 <a href="https://github.com/agile-ts/agile">
  <img src="https://img.shields.io/github/license/agile-ts/agile.svg" alt="GitHub License"/></a>
<a href="https://npm.im/@agile-ts/api">
  <img src="https://img.shields.io/npm/dm/@agile-ts/event.svg" alt="npm monthly downloads"/></a>
<a href="https://npm.im/@agile-ts/api">
  <img src="https://img.shields.io/npm/dt/@agile-ts/event.svg" alt="npm total downloads"/></a>
<a href="https://npm.im/@agile-ts/api">
  <img src="https://img.shields.io/bundlephobia/min/@agile-ts/event.svg" alt="npm minified size"/></a>
  
## ⏰ Short Example
```ts
const MY_EVENT = App.createEvent();
MY_EVENT.on((data) => {console.log("hello there " + data.name)}); // Print 'hello there jeff' if Event gets triggered
MY_EVENT.trigger({name: "jeff"}); // Trigger Event
```

## ⬇️ Installation
```
npm install @agile-ts/event
```
_Be aware that this is no standalone package!_ <br />
To use the Agile Api you have to install the [Agile Core](https://www.npmjs.com/package/@agile-ts/core). <br />
To find out more take a look into the [docs](https://www.agile-ts.org/docs).


## 🔑 Fitting Versions
| @agile-ts/api   | @agile-ts/core          | NPM Version              | 
| --------------- | ----------------------- | ------------------------ | 
| v0.0.7          | v0.0.1+                 | v6+                      | 
| v0.0.6          | v0.0.1+                 | v6+                      | 
_Other Versions aren't supported anymore_

## 📄 Documentation
The Agile Api Docs are located [here](https://agile-ts.org/docs/)
