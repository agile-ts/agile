import { createState, globalBind, shared } from '@agile-ts/core';
import queryString from 'query-string';

export type StopwatchStateType =
  | 'paused' // Stopwatch is paused
  | 'running' // Stopwatch is running
  | 'initial'; // Stopwatch is reset

// Create Query Storage to store the State in the query (url)
const queryUrlStorage = shared.createStorage({
  key: 'query-url',
  methods: {
    set: (key, value) => {
      const parsed = queryString.parse(location.search);
      parsed[key] = value;
      history.replaceState(null, '', `?${queryString.stringify(parsed)}`);
    },
    get: (key) => {
      const parsed = queryString.parse(location.search);
      return parsed[key];
    },
    remove: (key) => {
      const parsed = queryString.parse(location.search);
      delete parsed[key];
      history.replaceState(null, '', `?${queryString.stringify(parsed)}`);
    },
  },
  async: false,
  prefix: '',
});

// Register Query Storage to the shared Agile Instance and set it as default
shared.registerStorage(queryUrlStorage, { default: true });

// State to keep track of the current time of the Stopwatch
const TIME = createState(
  { s: 0, m: 0, h: 0 },
  { key: 'stopwatch-time' },
).persist();

// State to keep track of the current state of the Stopwatch
const STATE = createState<StopwatchStateType>('initial', {
  key: 'stopwatch-state',
}).persist();

const startStopwatch = () => {
  TIME.interval((value) => {
    const newValue = { ...value };
    if (newValue.m === 60) {
      newValue.h += 1;
      newValue.m = 0;
    }

    if (newValue.s === 60) {
      newValue.m += 1;
      newValue.s = 0;
    }

    newValue.s += 1;

    return newValue;
  }, 1000);
  STATE.set('running');
};

const clearStopwatch = () => {
  TIME.clearInterval();
};

const resetStopwatch = () => {
  clearStopwatch();
  TIME.set({ h: 0, m: 0, s: 0 });
  STATE.set('initial');
};

const resumeStopwatch = () => {
  startStopwatch();
};

const pauseStopwatch = () => {
  clearStopwatch();
  STATE.set('paused');
};

// Export bundled the associated methods and variables of the Stopwatch
export const StopwatchCore = {
  TIME,
  STATE,
  start: startStopwatch,
  reset: resetStopwatch,
  resume: resumeStopwatch,
  pause: pauseStopwatch,
  clear: clearStopwatch,
};

// Globally bind bundled Stopwatch functionalities
// for better debugging in the browser console
globalBind('__core__', StopwatchCore);
