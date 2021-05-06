# ProxyTree

> Create Proxy Tree based on the accessed properties

 <br />

 <a href="https://github.com/agile-ts/agile">
  <img src="https://img.shields.io/github/license/agile-ts/agile.svg?label=license&style=flat&colorA=293140&colorB=4a4872" alt="GitHub License"/></a>
<a href="https://npm.im/@agile-ts/proxytree">
  <img src="https://img.shields.io/npm/v/@agile-ts/proxytree.svg?label=npm&style=flat&colorA=293140&colorB=4a4872" alt="npm version"/></a>
<a href="https://npm.im/@agile-ts/proxytree">
  <img src="https://img.shields.io/bundlephobia/min/@agile-ts/proxytree.svg?label=minified%20size&style=flat&colorA=293140&colorB=4a4872" alt="npm minified size"/></a>
<a href="https://npm.im/@agile-ts/proxytree">
  <img src="https://img.shields.io/npm/dt/@agile-ts/proxytree.svg?label=downloads&style=flat&colorA=293140&colorB=4a4872" alt="npm total downloads"/></a>

<br />

## ❓ What is it for?

The Proxy Tree is an internal library of [AgileTs](https://agile-ts.org).
It is used to wrap a proxy around the target object and its nested objects as you access them,
in order to keep track of which properties were accessed via get/has proxy handlers.
This makes it possible to restrict the path to accessed properties
and AgileTs rerenders only a Component when a property accessed in the Component changes.
Thus, the number of rerenders in a Component are reduced.

### 🌳 Construction of Proxy Tree

First, the `orginal` object is converted into the root Branch (`.rootBranch`).
Each Branch represents a particular object that is wrapped in a `Proxy()` 
and keeps track of its child Branches.
These child Branches are created as soon as a certain property in the parent Branch has been accessed.
Then the accessed property will be transformed into a sub Branch of the parent Branch and is part of the Proxy Tree.
This way, only accessed properties are added to the Proxy Tree.
The Proxy Tree is not aware of the other properties, as they aren't yet relevant for it.
As soon as not unrecognised property is accessed, it is added to the Proxy Tree.
```ts
// Orginal Object with sub Objects
const original = {
  a: [{ b: 1 }, { 1000: { a: { b: 1 } } }, '3rd'],
  b: { c: { d: 'hi' } },
  c: { a: 'hi' },
};

// Create Proxy Tree
const proxyTree = new ProxyTree(original);
const proxyfiedOrginal = proxyTree.proxy;  

// Access Properties
proxyfiedOrginal.a;
proxyfiedOrginal.a[0];
proxyfiedOrginal.c.a;

// Proxy Tree would look like that
Branch({
  a: Branch([Branch({ b: 1 }), { 1000: { a: { b: 1 } } }, '3rd']),
  b: { c: { d: 'hi' } },
  c: Branch({ a: Branch('hi') }),
});

// Access more Properties
proxyfiedOrginal.b;
proxyfiedOrginal.a[2];

// Proxy Tree would look like that
Branch({
  a: Branch([Branch({ b: 1 }), { 1000: { a: { b: 1 } } }, Branch('3rd')]),
  b: Branch({ c: { d: 'hi' } }),
  c: Branch({ a: Branch('hi') }),
});
```

## ⚡️ Usage

```ts
// Orginal Object with sub Objects
const original = {
  a: [{ b: 1 }, { 1000: { a: { b: 1 } } }, '3rd'],
  b: { c: { d: 'hi' } },
  c: { a: 'hi' },
};

// Create Proxy Tree
const proxyTree = new ProxyTree(original);
const proxyfiedOrginal = proxyTree.proxy;

// Access Properties
proxyfiedOrginal.a;
proxyfiedOrginal.a[0]['b'];
proxyfiedOrginal.a[1][1000]['a']['b'];
proxyfiedOrginal.c.a;
proxyfiedOrginal.b;

// Get route to accessed Properties
console.log(proxyTree.getUsedRoutes()); // Returns (see below)
// [
//   ['a', '0', 'b'],
//   ['a', '1', '1000', 'a', 'b'],
//   ['c', 'a'],
//   ['b'],
//   ['a'],
// ]
```
