import Benchmark, { Suite, Options } from 'benchmark';
import ReactDOM from 'react-dom';

// Files to run the Benchmark on
import agileCollection from './bench/agile/collection';
import agileState from './bench/agile/state';
import agileNestedState from './bench/agile/nestedState';
import hookstate from './bench/hookstate';
import jotai from './bench/jotai';
import mobx from './bench/mobx';
import recoil from './bench/recoil';
import redux from './bench/redux';
import valtio from './bench/valtio';

// @ts-ignore
// Benchmark.js requires an instance of itself globally
window.Benchmark = Benchmark;

// Create new Benchmark Test Suite
const suite = new Suite('1000 Fields');

// Retrieve the Element to render the Benchmark Test Suite in
const target = document.getElementById('bench')!;

// Configures a single Benchmark Test
function configTest(renderElement: (target: HTMLElement) => void): Options {
  return {
    fn() {
      // Retrieve Input field to update
      const fieldToUpdate = Math.floor(Math.random() * 1000);
      const input = target.querySelectorAll('input')[fieldToUpdate];

      // Update retrieved Input value
      const evt = document.createEvent('HTMLEvents');
      evt.initEvent('input', true, true);
      input.value = '' + Math.random();
      (input as any)._valueTracker.setValue(Math.random());
      input.dispatchEvent(evt);
    },
    onStart() {
      // Render React Component in the target Element
      renderElement(target);
    },
    onComplete() {
      // Unmount React Component
      ReactDOM.unmountComponentAtNode(target);
      target.innerHTML = '';
    },
  };
}

// Add Tests to the Benchmark Test Suite
suite
  .add('Agile Collection', configTest(agileCollection))
  .add('Agile State', configTest(agileState))
  .add('Agile nested State', configTest(agileNestedState))
  .add('Hookstate', configTest(hookstate))
  .add('Jotai', configTest(jotai))
  .add('Mobx', configTest(mobx))
  .add('Recoil', configTest(recoil))
  .add('Redux', configTest(redux))
  .add('Valtio', configTest(valtio))

  // Add Listener
  .on('start', function (this: any) {
    console.log(`Starting ${this.name}`);
  })
  .on('cycle', (event: any) => {
    console.log(String(event.target));
  })
  .on('complete', function (this: any) {
    console.log(`Fastest is ${this.filter('fastest').map('name')}`);

    // @ts-ignore
    // Notify server that the Benchmark Test Suite has ended
    window.TEST.ended = true;
  })

  // Run Benchmark Test Suite
  .run({ async: true });
