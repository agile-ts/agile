# [WIP] Multi Editor

> Simple Form Manager for UI-Frameworks

<a href="https://npm.im/@agile-ts/multieditor">
  <img src="https://img.shields.io/npm/v/@agile-ts/multieditor.svg" alt="npm version"></a>
 <a href="https://github.com/agile-ts/agile">
  <img src="https://img.shields.io/github/license/agile-ts/agile.svg" alt="GitHub License"></a>
<a href="https://npm.im/@agile-ts/multieditor">
  <img src="https://img.shields.io/npm/dm/@agile-ts/multieditor.svg" alt="npm monthly downloads"></a>
<a href="https://npm.im/@agile-ts/multieditor">
  <img src="https://img.shields.io/npm/dt/@agile-ts/multieditor.svg" alt="npm total downloads"></a>
<a href="https://npm.im/@agile-ts/multieditor">
  <img src="https://img.shields.io/bundlephobia/min/@agile-ts/multieditor.svg" alt="npm minified size"></a>
  
## ⏰ Short Example
```ts
// Let's create our MultiEditor
const multiEditor = new MultiEditor(editor => ({
  data: {
    id: "myId", // Inital Id
    email: undefined, // Inital Email
    name: undefined, // Inital Name
  },
  onSubmit: async (data) => {
    console.log("Submitted ", data);  // <-------------------------------------------    
  },                                                                  //            |
  fixedProperties: ["id"], // Properties that always get passed as data into the onSubmit function
  validateMethods: {
    email: editor.Validator().string().email().required(), // Email is requiered, a string and follows the Email regex
    name: editor.Validator().string().max(10).min(2).required(), // Name is required, a string, has to be below 10 chars and more than 2 chars
  },
  editableProperties: ["email", "name"], // Properties that can be edited
}));

// Now lets update the Email Property
multiEditor.setValue("email", "test@test.com");
```
_[here](https://codesandbox.io/s/agilets-first-state-f12cz?file=/src/RandomComponent.js) you can find a live example._

## ❓ Why Agile MultiEditor
TODO

## ⬇️ Installation
```
npm install @agile-ts/multieditor
```
_Be aware that this is no standalone package!_
  
  
## 🔑 Fitting Versions
| @agile-ts/api   | @agile-ts/core          | NPM Version              | 
| --------------- | ----------------------- | ------------------------ | 
| v0.0.7          | v0.0.7+                 | v6+                      | 
| v0.0.6          | v0.0.6                  | v6+                      | 
_Other Versions aren't supported anymore_
