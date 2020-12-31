# Multi Editor

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
  
  ## ⬇️ Installation
  ```
  npm install @agile-ts/multieditor
  ```
  _Be aware that this is no standalone package!_
  
  ## 🛠 Simple Example with React
```ts
const multiEditor = new MultiEditor<string, boolean>((editor) => ({
  data: {
    id: "myId",
    email: undefined,
    name: undefined,
  },
  onSubmit: async (data) => {
    console.log("Submitted ", data);
    return Promise.resolve(true);
  },
  fixedProperties: ["id"],
  validateMethods: {
    email: editor.Validator().string().email().required(),
    name: editor.Validator().string().max(10).min(2).required(),
  },
  editableProperties: ["email", "name"],
}));
```
  
  
  ## 🔑 Fitting Versions
  | @agile-ts/api   | @agile-ts/core          | NPM Version              | Supported React versions | Supports hook based components    |
  | --------------- | ----------------------- | ------------------------ | -------------------------|---------------------------------- |
  | v0.0.7          | v0.0.7+                 | v6+                      | 16.8+                    | Yes                               |
  | v0.0.6          | v0.0.6                  | v6+                      | 16.8+                    | Yes                               | 
  _Other Versions aren't supported anymore_
