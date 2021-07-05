# 🚀️ Benchmarks

The `Benchmark Test Suites` are supposed to showcase where AgileTs is roughly located in terms of performance.
I know a counter doesn't really show real world app performance, 
but it is better than nothing.

### What do the results from benchmark js mean?
https://stackoverflow.com/questions/28524653/what-do-the-results-from-benchmark-js-mean

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
// 1 Field
Agile Collection x 13,729 ops/sec ±3.42% (60 runs sampled) [updatedFieldsCount: 76468, renderFieldsCount: 73]
Agile State x 19,008 ops/sec ±1.87% (66 runs sampled) [updatedFieldsCount: 103559, renderFieldsCount: 72]
Agile nested State x 21,119 ops/sec ±1.45% (64 runs sampled) [updatedFieldsCount: 116226, renderFieldsCount: 72]
Hookstate x 20,026 ops/sec ±0.68% (64 runs sampled) [updatedFieldsCount: 112513, renderFieldsCount: 112513]
Jotai x 16,372 ops/sec ±3.34% (63 runs sampled) [updatedFieldsCount: 90275, renderFieldsCount: 90275]
Mobx x 15,892 ops/sec ±3.42% (60 runs sampled) [updatedFieldsCount: 82400, renderFieldsCount: 82400]
Nano Stores x 21,455 ops/sec ±1.00% (66 runs sampled) [updatedFieldsCount: 114136, renderFieldsCount: 114136]
Recoil x 11,504 ops/sec ±3.44% (63 runs sampled) [updatedFieldsCount: 61553, renderFieldsCount: 61554]
Redux x 13,070 ops/sec ±2.73% (62 runs sampled) [updatedFieldsCount: 69239, renderFieldsCount: 69240]
Valtio x 9,962 ops/sec ±2.60% (60 runs sampled) [updatedFieldsCount: 54290, renderFieldsCount: 108579]

// 10 Fields
Agile Collection x 10,651 ops/sec ±4.14% (58 runs sampled) [updatedFieldsCount: 56668, renderFieldsCount: 582]
Agile State x 16,175 ops/sec ±1.55% (65 runs sampled) [updatedFieldsCount: 87481, renderFieldsCount: 80]
Agile nested State x 20,703 ops/sec ±1.27% (65 runs sampled) [updatedFieldsCount: 113946, renderFieldsCount: 712]
Hookstate x 18,733 ops/sec ±3.14% (59 runs sampled) [updatedFieldsCount: 105792, renderFieldsCount: 105801]
Jotai x 15,602 ops/sec ±3.65% (61 runs sampled) [updatedFieldsCount: 85977, renderFieldsCount: 85986]
Mobx x 9,283 ops/sec ±3.16% (52 runs sampled) [updatedFieldsCount: 50806, renderFieldsCount: 508060]
Nano Stores x 20,125 ops/sec ±1.62% (62 runs sampled) [updatedFieldsCount: 108704, renderFieldsCount: 108713]
Recoil x 11,103 ops/sec ±4.50% (61 runs sampled) [updatedFieldsCount: 62920, renderFieldsCount: 62939]
Redux x 8,728 ops/sec ±1.61% (64 runs sampled) [updatedFieldsCount: 50794, renderFieldsCount: 507950]
Valtio x 3,557 ops/sec ±2.96% (23 runs sampled) [updatedFieldsCount: 22473, renderFieldsCount: 449450]

// 100 Fields
Agile Collection x 3,897 ops/sec ±3.01% (25 runs sampled) [updatedFieldsCount: 24427, renderFieldsCount: 2502]
Agile State x 8,355 ops/sec ±0.85% (67 runs sampled) [updatedFieldsCount: 46249, renderFieldsCount: 173]
Agile nested State x 18,641 ops/sec ±1.17% (63 runs sampled) [updatedFieldsCount: 98669, renderFieldsCount: 6802]
Hookstate x 14,865 ops/sec ±2.51% (61 runs sampled) [updatedFieldsCount: 81616, renderFieldsCount: 81715]
Jotai x 12,676 ops/sec ±3.09% (61 runs sampled) [updatedFieldsCount: 65930, renderFieldsCount: 66029]
Mobx x 1,812 ops/sec ±1.49% (63 runs sampled) [updatedFieldsCount: 9639, renderFieldsCount: 963900]
Nano Stores x 16,283 ops/sec ±1.39% (62 runs sampled) [updatedFieldsCount: 84772, renderFieldsCount: 84871]
Recoil x 9,418 ops/sec ±2.94% (62 runs sampled) [updatedFieldsCount: 52425, renderFieldsCount: 52624]
Redux x 1,896 ops/sec ±1.74% (62 runs sampled) [updatedFieldsCount: 10133, renderFieldsCount: 1013400]
Valtio x 472 ops/sec ±2.97% (61 runs sampled) [updatedFieldsCount: 2494, renderFieldsCount: 498700]

// 1000 Fields
Agile Collection x 503 ops/sec ±2.23% (62 runs sampled) [updatedFieldsCount: 2616, renderFieldsCount: 3520]
Agile State x 1,437 ops/sec ±1.48% (59 runs sampled) [updatedFieldsCount: 7569, renderFieldsCount: 1061]
Agile nested State x 9,411 ops/sec ±1.54% (56 runs sampled) [updatedFieldsCount: 46693, renderFieldsCount: 33243]
Hookstate x 4,539 ops/sec ±3.61% (27 runs sampled) [updatedFieldsCount: 26381, renderFieldsCount: 27380]
Jotai x 4,014 ops/sec ±5.35% (53 runs sampled) [updatedFieldsCount: 20390, renderFieldsCount: 21389]
Mobx x 151 ops/sec ±0.75% (59 runs sampled) [updatedFieldsCount: 786, renderFieldsCount: 786000]
Nano Stores x 5,511 ops/sec ±6.27% (32 runs sampled) [updatedFieldsCount: 31266, renderFieldsCount: 32265]
Recoil x 3,562 ops/sec ±3.16% (58 runs sampled) [updatedFieldsCount: 18503, renderFieldsCount: 20502]
Redux x 165 ops/sec ±1.40% (57 runs sampled) [updatedFieldsCount: 858, renderFieldsCount: 859000]
Valtio x 38.76 ops/sec ±5.50% (42 runs sampled) [updatedFieldsCount: 215, renderFieldsCount: 429000]
```

## Computed

```ts
Agile Hard Coded     x 23,201 ops/sec ±1.39% (64 runs sampled)
Agile Auto Tracking  x 22,661 ops/sec ±3.31% (60 runs sampled)
Jotai                x 18,489 ops/sec ±5.43% (62 runs sampled)
Recoil               x 10,312 ops/sec ±2.57% (64 runs sampled)
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
