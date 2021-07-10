import ReactDOM from 'react-dom';
import Benchmark, { Suite, Options } from 'benchmark';
import {
  cycleLog,
  CycleResultInterface,
  endBenchmarkLog,
  getCycleResult,
  startBenchmarkLog,
} from '../../../benchmarkManager';

// Files to run the Benchmark on
import agileAutoTracking from './bench/agilets/autoTracking';
import agileHardCoded from './bench/agilets/hardCoded';
import jotai from './bench/jotai';
import nanostores from './bench/nanostores';
import recoil from './bench/recoil';

// @ts-ignore
// Benchmark.js requires an instance of itself globally
window.Benchmark = Benchmark;

// Create new Benchmark Test Suite
const suite = new Suite('Computed');

// Retrieve the Element to render the Benchmark Test Suite in
const target = document.getElementById('bench')!;

// Increment Element
let increment: HTMLHeadingElement;

// Configures a single Benchmark Test
function configTest(renderElement: (target: HTMLElement) => void): Options {
  return {
    fn() {
      // Execute increment action
      increment.click();
    },
    onStart() {
      // Render React Component in the target Element
      renderElement(target);

      // Retrieve Element to execute the increment action on
      increment = target.querySelector('h1')!;
    },
    onComplete() {
      // Set 'output' in the Benchmark itself to print it later
      (this as any).output = parseInt(
        (target.querySelector('h1') as any)?.innerText,
        10
      );
      (this as any).computedOutput = parseInt(
        (target.querySelector('p') as any)?.innerText,
        10
      );

      // Unmount React Component
      ReactDOM.unmountComponentAtNode(target);
      target.innerHTML = '';
    },
  };
}

const results: CycleResultInterface[] = [];

// Add Tests to the Benchmark Test Suite
suite
  .add('Agile Auto Tracking', configTest(agileAutoTracking))
  .add('Agile Hard Coded', configTest(agileHardCoded))
  .add('Jotai', configTest(jotai))
  .add('Nano Stores', configTest(nanostores))
  .add('Recoil', configTest(recoil))

  // Add Listener
  .on('start', function (this: any) {
    startBenchmarkLog(this.name);
  })
  .on('cycle', (event: any) => {
    const cycleResult = getCycleResult(event);
    cycleLog(
      cycleResult,
      `[Count: ${event.target.output}, ComputedCount: ${event.target.computedOutput}]`
    );
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
