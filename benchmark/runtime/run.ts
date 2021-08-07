import dotenv from 'dotenv';
import { startSpeedBench } from './benchmarkTypes';

// Loads environment variables from the '.env' file
dotenv.config();

// TODO implement yargs https://yargs.js.org/

// https://nodejs.org/docs/latest/api/process.html#process_process_argv
// Extract entry (at third parameter) from the executed command
// yarn run ./path/to/entry -> './path/to/entry' is extracted
const entry = process.argv.slice(2)[0];
const isDev =
  process.argv.slice(2)[1] === '--dev' || process.env.DEV === 'true';
if (entry == null) {
  throw new Error(
    "No valid entry was provided! Valid entry example: 'yarn run ./benchmarks/react/counter'"
  );
}

// Execute the Benchmark
startSpeedBench(entry, isDev);
