// No Typescript because https://stackoverflow.com/questions/69212224/modularize-rollup-config-error-could-not-resolve-path-to-module-from-rol

import path from 'path';
import { defineConfig } from 'rollup';
import { babel } from '@rollup/plugin-babel'; // https://rollupjs.org/guide/en/#babel
import { nodeResolve } from '@rollup/plugin-node-resolve'; // https://rollupjs.org/guide/en/#rollupplugin-node-resolve
import esbuild from 'rollup-plugin-esbuild';
import typescript from '@rollup/plugin-typescript';
import bundleSize from 'rollup-plugin-bundle-size';
import getBabelConfig from './babel.config';

export const fileExtensions = ['.ts'];

function createBabelConfig() {
  // https://github.com/rollup/plugins/tree/master/packages/babel#running-babel-on-the-generated-code
  return babel({
    // 'babelHelpers' option 'runtime' is recommended for libraries.
    // However using the 'runtime' options requires an external (prod) dependency ('@babel/runtime') which we want to avoid at this point in time.
    // (See: https://github.com/rollup/plugins/tree/master/packages/babel#babelhelpers)
    // Therefore we decided against it and only support browsers that support ES modules.
    babelHelpers: 'bundled',
    comments: false,
    extensions: fileExtensions, // https://github.com/rollup/rollup-plugin-babel/issues/255
    ...getBabelConfig(),
  });
}

export function createEsbuildConfig(config) {
  config = {
    target: 'es2015',
    additionalOptions: {},
    ...config,
  };
  return esbuild({
    minify: false,
    target: config.target,
    ...config.additionalOptions,
  });
}

export function createDeclarationConfig(config) {
  config = {
    input: 'src/index.ts',
    output: 'dist',
    tsconfig: path.resolve('./tsconfig.json'),
    external: [],
    additionalOptions: {},
    additionalPlugins: [],
    ...config,
  };

  return defineConfig({
    input: config.input,
    output: {
      dir: config.output,
    },
    external: config.external,
    plugins: [
      typescript({
        tsconfig: config.tsconfig,
      }),
      ...config.additionalPlugins,
    ],
    ...config.additionalOptions,
  });
}

export function createESMConfig(config) {
  config = {
    input: 'src/index.ts',
    output: 'dist/esm',
    tsconfig: path.resolve('./tsconfig.json'),
    multiFileOutput: true,
    external: [],
    additionalOptions: {},
    additionalPlugins: [],
    ...config,
  };

  return defineConfig({
    input: config.input,
    output: {
      [config.multiFileOutput ? 'dir' : 'file']: config.output,
      format: 'esm',
    },
    external: config.external,
    plugins: [
      nodeResolve({ extensions: fileExtensions }),
      createEsbuildConfig({ target: 'es2015' }),
      // typescript(), // Not required because esbuild takes care of configuring typescript
      // babel(/* */), // Not required because esbuild takes care of converting ES2015+ modules into compatible JavaScript files
      !config.multiFileOutput && bundleSize(),
      ...config.additionalPlugins,
    ],
    preserveModules: config.multiFileOutput, // https://stackoverflow.com/questions/55339256/tree-shaking-with-rollup
    ...config.additionalOptions,
  });
}

export function createCommonJSConfig(config) {
  config = {
    input: 'src/index.ts',
    output: 'dist/index.js',
    tsconfig: path.resolve('./tsconfig.json'),
    external: [],
    additionalOptions: {},
    additionalPlugins: [],
    ...config,
  };

  return defineConfig({
    input: config.input,
    output: {
      file: config.output,
      format: 'cjs',
      sourcemap: true,
    },
    external: config.external,
    plugins: [
      nodeResolve({ extensions: fileExtensions }),
      createBabelConfig(),
      typescript(), // Only so that Rollup can work with typescript (Not for generating any 'declaration' files)
      bundleSize(),
      ...config.additionalPlugins,
    ],
    ...config.additionalOptions,
  });
}
