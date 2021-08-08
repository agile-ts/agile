import dotenv from 'dotenv';
import { startBundleBench, startSpeedBench } from './benchmarkTypes';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

// Loads environment variables from the '.env' file
dotenv.config();

// hideBind handles the 'process.argv.slice' logic
const argv = yargs(hideBin(process.argv))
  .option('_', {
    type: 'string',
    // default: ['./benchmarks/react/counter'],
    description: 'What benchmark to execute',
  })
  .option('dev', {
    type: 'boolean',
    default: false,
    description:
      'Whether to start the benchmark/s in developer mode for better debugging.',
  })
  .option('type', {
    type: 'string',
    default: 'speed',
    description: 'What type of benchmark to be executed',
  }).argv as any;

const entry = argv._[0];
const isDev = argv.dev || process.env.DEV === 'true';
const benchmarkType = argv.type;

if (entry == null) {
  throw new Error(
    "No valid entry was provided! Valid entry example: 'yarn run ./benchmarks/react/counter'"
  );
}

// Benchmarks that can be executed marked with a unique identifier
const benchmarks: {
  [key: string]: (entry: string, isDev: boolean) => Promise<void>;
} = {
  speed: startSpeedBench,
  bundle: startBundleBench,
};

// Execute Benchmark based on the specified Benchmark type
const toExecuteBenchmark = benchmarks[benchmarkType];
if (toExecuteBenchmark != null) toExecuteBenchmark(entry, isDev);
else {
  benchmarks['speed'](entry, isDev);
}
