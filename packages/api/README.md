# [WIP] API

> Promise based HTTP request API for Node.js

<a href="https://npm.im/@agile-ts/api">
  <img src="https://img.shields.io/npm/v/@agile-ts/api.svg" alt="npm version"/></a>
 <a href="https://github.com/agile-ts/agile">
  <img src="https://img.shields.io/github/license/agile-ts/agile.svg" alt="GitHub License"/></a>
<a href="https://npm.im/@agile-ts/api">
  <img src="https://img.shields.io/npm/dm/@agile-ts/api.svg" alt="npm monthly downloads"/></a>
<a href="https://npm.im/@agile-ts/api">
  <img src="https://img.shields.io/npm/dt/@agile-ts/api.svg" alt="npm total downloads"/></a>
<a href="https://npm.im/@agile-ts/api">
  <img src="https://img.shields.io/bundlephobia/min/@agile-ts/api.svg" alt="npm minified size"/></a>
  
## ⏰ Short Example
```ts
// Let't create our API
const api = new API({
  baseURL: 'https://myapp.com', // Base Route to the Host
  timeout: 10000, // After which amount of time a request times out
  options: { credentials: 'include' } // Http/s Request Options from type RequestInit
});

// Now we can create our first Request to 'https://myapp.com/hello'
const response = await api.get('/hello');
console.log(response);
/* 
  {
      data: {hello: "Jeff"}; // Response Data
      timedout: false; // If Request has timedout
      status: 200; // Response Status Code
      raw: Response; // Raw Response from type Response
      type: "application/json"; // Response Type
  }
*/
```

## ❓ Why Agile Api

#### 🚅 Straightforward
Write minimalistic, boilerplate free code that captures your intent. <br />
**For instance**
- Automatic transform for JSON data
- Configurable Timeout

#### 🎯 Easy to Use
Learn the powerful and simple tools of Agile Api in a short amount of time.

#### 🍃 Lightweight
Agile Api has an unpacked size of [2kB](https://bundlephobia.com/result?p=@agile-ts/api@0.0.6) 
and [0 external dependencies](https://www.npmjs.com/package/@agile-ts/api).

## ⬇️ Installation
```
npm install @agile-ts/api
```
The `api` package is an extension of AgileTs and doesn't work without the [`core` package](../core/Introduction.md),
which functions as the brain of AgileTs and is indispensable.
Unfortunately, we can't combine each `core` with `api` version.
Therefore, we have created a table which shows which versions fit together without restrictions.

| @agile-ts/api         | @agile-ts/core          | NPM Version              | Supported React versions |
| ----------------------| ----------------------- | ------------------------ | -------------------------|
| v0.0.7+               | v0.0.7+                 | v6+                      | 16.8+                    |
| v0.0.6                | v0.0.3 - v0.0.6         | v6+                      | 16.8+                    | 
_Other Versions aren't supported anymore_
