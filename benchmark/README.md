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

## 1000 Fields

```ts
1. Agile nested State  x 9,687 ops/sec ±2.46% (52 runs sampled)
2. Hookstate           x 5,170 ops/sec ±5.77% (31 runs sampled)
3. Jotai               x 4,578 ops/sec ±5.49% (57 runs sampled)
4. Recoil              x 3,790 ops/sec ±3.74% (55 runs sampled)
5. Agile State         x 1,480 ops/sec ±1.39% (12 runs sampled)
6. Agile Collection    x 498 ops/sec ±1.81% (61 runs sampled)
7. Redux               x 150 ops/sec ±1.72% (59 runs sampled)
8. Mobx                x 143 ops/sec ±0.92% (57 runs sampled)
9. Valtio              x 37.44 ops/sec ±5.17% (42 runs sampled)
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
