import dotenv from 'dotenv';
import esbuild from 'esbuild';
import playwright from 'playwright';
import chalk from 'chalk';

// Loads environment variables from the '.env' file
dotenv.config();

// https://nodejs.org/docs/latest/api/process.html#process_process_argv
// Extract entry (at third parameter) from the executed command
// yarn run ./path/to/entry -> './path/to/entry' is extracted
const entry = process.argv.slice(2)[0];
if (entry == null) {
  throw new Error(
    "No valid entry was provided! Valid entry example: 'yarn run ./benchmarks/react/counter'"
  );
}

const startBenchmark = async () => {
  console.log(chalk.blue('Starting the benchmark server..\n'));

  // Bundle Benchmark Test Suite
  // and launch the server on which the Test Suite is executed
  const server = await esbuild.serve(
    {
      servedir: 'public',
      port: 3003,
      host: '127.0.0.1', // localhost
    },
    {
      inject: ['./lodash.ts'], // https://esbuild.github.io/api/#inject
      entryPoints: [entry], // https://esbuild.github.io/api/#entry-points
      outfile: './public/bundle.js',
      target: 'es2015',
      format: 'cjs', // https://esbuild.github.io/api/#format-commonjs
      platform: 'browser',
      minify: true, // https://esbuild.github.io/api/#minify
      bundle: true, // https://esbuild.github.io/api/#bundle
      sourcemap: 'external', // https://esbuild.github.io/api/#sourcemap// https://github.com/evanw/esbuild/issues/69
    }
  );
  const serverUrl = `http://${server.host}:${server.port}`;

  console.log(
    `${chalk.blue('[i]')} ${chalk.gray(
      `Server is running at port: ${chalk.blueBright.bold(server.port)}`
    )}`
  );

  // Launch Chrome as browser to run the Benchmark Test Suite in
  const browser = await playwright.chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  // Option to open and test the Benchmark Test Suite in the browser manually
  if (process.env.MANUAL_BENCHMARK === 'true') {
    console.log(
      `${chalk.blue('[i]')} ${chalk.gray(
        `Benchmark is running at ${chalk.blueBright.bold(serverUrl)}`
      )}`
    );

    await server.wait;
  }

  console.log('\n');

  // Setup 'pageerror' listener to throw occurring errors in the local console
  // https://playwright.dev/docs/api/class-page/#page-event-page-error
  page.on('pageerror', (error) => {
    throw error;
  });

  // Setup 'console' listener to transfer the browser logs into the local console
  // https://playwright.dev/docs/api/class-page/#page-event-console
  page.on('console', (...message) => {
    const stringMessages = message.map((m) => m.text());
    const colorMessage = stringMessages[0];
    stringMessages.shift(); // Remove 'colorMessage' (first argument) from 'stringMessages' array

    // Parse color message to work in chalck
    // https://stackoverflow.com/questions/56526522/gulp-chalk-pass-string-template-through-method
    const parsedColorMessage = [colorMessage];
    // @ts-ignore
    parsedColorMessage.raw = [colorMessage];

    console.log(chalk(parsedColorMessage), ...stringMessages);
  });

  // Open the url the server is running on
  await page.goto(serverUrl);

  // Wait for tests to be executed (indicator is when 'window.TESTS.ended' is set to true)
  // https://playwright.dev/docs/api/class-frame#frame-wait-for-function
  await page.waitForFunction(
    // @ts-ignore
    () => window.TEST?.ended,
    undefined,
    {
      timeout: 0,
      polling: 100,
    }
  );

  // Close browser and stop server
  await browser.close();
  server.stop();
};

// Execute the Benchmark
startBenchmark();
