import Benchmark, { Suite } from 'benchmark';
import {
  cycleLog,
  CycleResultInterface,
  endBenchmarkLog,
  getCycleResult,
  startBenchmarkLog,
} from '../../../benchmarkManager';

// Files to run the Benchmark on
import * as referencer from './bench/referencer';
import * as spreader from './bench/spreader';

interface ConfigInterface {
  x1?: boolean;
  x2?: string;
  x3?: number;
  x4?: boolean;
  x5?: string;
}

const defaultConfig: ConfigInterface = { x1: true, x2: undefined };

// @ts-ignore
// Benchmark.js requires an instance of itself globally
window.Benchmark = Benchmark;

// Create new Benchmark Test Suite
const suite = new Suite('define config');

const results: CycleResultInterface[] = [];

// Add Tests to the Benchmark Test Suite
suite
  .add('Primitiver', function () {
    let config = defaultConfig;
    config = {
      x1: false,
      x2: 'jeff',
      x3: 10,
      x4: false,
      x5: 'hans',
      ...config,
    };
  })
  .add('Referencer', function () {
    const config = defaultConfig;
    referencer.defineConfig(config, {
      x1: false,
      x2: 'jeff',
      x3: 10,
      x4: false,
      x5: 'hans',
    });
  })
  .add('Spreader', function () {
    let config = defaultConfig;
    config = spreader.defineConfig(config, {
      x1: false,
      x2: 'jeff',
      x3: 10,
      x4: false,
      x5: 'hans',
    });
  })

  // Add Listener
  .on('start', function (this: any) {
    startBenchmarkLog(this.name);
  })
  .on('cycle', (event: any) => {
    const cycleResult = getCycleResult(event);
    cycleLog(cycleResult);
    results.push(cycleResult);
  })
  .on('complete', function (this: any) {
    endBenchmarkLog(this.name, results, this.filter('fastest').map('name'));

    // @ts-ignore
    // Notify server that the Benchmark Test Suite has ended
    window.TEST.ended = true;
  })

  // Run Benchmark Test Suite
  .run({ async: true });
