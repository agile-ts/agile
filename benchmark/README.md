# 🚀️ Benchmarks

The `Benchmark Test Suites` are supposed to showcase where AgileTs is roughly located in terms of performance.
I know a counter doesn't really show real world app performance, 
but it is better than nothing.

## Counter Benchmark

```ts
1. Zustand        x 30,591 ops/sec ±1.15% (61 runs sampled)
2. Redux          x 30,239 ops/sec ±1.64% (63 runs sampled)
3. Mobx           x 29,032 ops/sec ±1.24% (64 runs sampled)
4. AgileTs        x 28,327 ops/sec ±2.96% (60 runs sampled)
5. Redux-Toolkit  x 22,808 ops/sec ±1.79% (65 runs sampled)
6. Jotai          x 22,479 ops/sec ±5.79% (63 runs sampled)
7. Valtio         x 20,784 ops/sec ±2.75% (63 runs sampled)
8. Recoil         x 14,351 ops/sec ±1.55% (65 runs sampled)
```

## 🏃 Running Benchmarks

The Benchmark tests run on top of the [`benchmark.js` library](https://github.com/bestiejs/benchmark.js/)
via [Playwright](https://github.com/microsoft/playwright) in the Chrome Browser.

Before starting, make sure you are in the `/benchmark` directory.

### 1️⃣ Install dependencies

To prepare the dependencies, run:
```ts
yarn install
```

### 2️⃣ Run Benchmark Test Suite

Execute the benchmark located in `./benchmarks/react/counter`.
```ts
yarn run test:counter
```

## ⭐️ Contribute

Get a part of AgileTs and start contributing. We welcome any meaningful contribution. 😀
To find out more about contributing, check out the [CONTRIBUTING.md](https://github.com/agile-ts/agile/blob/master/CONTRIBUTING.md).

<a href="https://codeclimate.com/github/agile-ts/agile/coverage.svg">
   <img src="https://codeclimate.com/github/agile-ts/agile/badges/gpa.svg" alt="Maintainability"/>
</a>

## 🎉 Credits

The Benchmark CLI is inspired by [`exome`](https://github.com/Marcisbee/exome).
