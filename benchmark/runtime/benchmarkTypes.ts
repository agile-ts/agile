import chalk from 'chalk';
import esbuild from 'esbuild';
import playwright from 'playwright';
import fs from 'fs';

export const startSpeedBench = async (entry: string, isDev: boolean) => {
  console.log(chalk.blue('Starting the speed benchmark server..\n'));

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
      format: 'esm', // https://esbuild.github.io/api/#format-commonjs
      platform: 'browser',
      minify: !isDev, // https://esbuild.github.io/api/#minify
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
  if (isDev) {
    console.log(
      `${chalk.blue('[i]')} ${chalk.gray(
        `Development mode is ${chalk.green(`active`)}`
      )}`
    );
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

export const startBundleBench = async (entry: string, isDev: boolean) => {
  const bundle = await esbuild.build({
    inject: ['./lodash.ts'], // https://esbuild.github.io/api/#inject
    entryPoints: [entry], // https://esbuild.github.io/api/#entry-points
    outfile: './public/bundle.js',
    target: 'es2015',
    format: 'esm', // https://esbuild.github.io/api/#format-commonjs
    platform: 'browser',
    minify: !isDev, // https://esbuild.github.io/api/#minify
    bundle: true, // https://esbuild.github.io/api/#bundle
    sourcemap: 'external', // https://esbuild.github.io/api/#sourcemap// https://github.com/evanw/esbuild/issues/69
    metafile: true, // https://esbuild.github.io/api/#metafile
  });

  console.log(
    `${chalk.blue('[i]')} ${chalk.gray(
      `Entry was ${chalk.green(`successfully`)} bundled`
    )}`
  );

  if (isDev) {
    console.log(
      `${chalk.blue('[i]')} ${chalk.gray(
        `Development mode is ${chalk.green(`active`)}`
      )}`
    );
  }

  // Extract metafile from bundle (https://esbuild.github.io/api/#metafile)
  const metafile = bundle.metafile;

  // Calculate bundle file size
  let bundleSize = 0;
  bundle.outputFiles?.map((file) => {
    const stats = fs.statSync(file.path);
    const fileSizeInBytes = stats.size;
    const fileSizeInKilobytes = fileSizeInBytes / 1024;
    bundleSize += fileSizeInKilobytes;
  });

  console.log(
    `${chalk.blue('[i]')} ${chalk.gray(
      `Total bundle size of the bundle is ${chalk.blueBright.bold(bundleSize)}`
    )}`
  );

  console.log(metafile);
  // TODO analyze metafile
};
