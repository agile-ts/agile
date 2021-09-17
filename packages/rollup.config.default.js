// No Typescript because https://stackoverflow.com/questions/69212224/modularize-rollup-config-error-could-not-resolve-path-to-module-from-rol

import path from 'path';
import { defineConfig as rollupDefineConfig } from 'rollup';
import { babel } from '@rollup/plugin-babel'; // https://rollupjs.org/guide/en/#babel
import { nodeResolve } from '@rollup/plugin-node-resolve'; // https://rollupjs.org/guide/en/#rollupplugin-node-resolve
import esbuild from 'rollup-plugin-esbuild';
import typescript from '@rollup/plugin-typescript';
import { defineConfig } from '@agile-ts/utils';

export const fileExtensions = ['.js', '.ts', '.tsx'];

export function createEsbuildConfig(config) {
  config = defineConfig(config, {
    target: 'es2015',
    tsconfig: path.resolve('./tsconfig.json'),
    additionalOptions: {},
  });
  return esbuild({
    minify: false,
    target: config.target,
    tsconfig: config.tsconfig,
    ...config.additionalOptions,
  });
}

export function createDeclarationConfig(config) {
  config = defineConfig(config, {
    input: 'src/index.ts',
    output: 'dist',
    tsconfig: path.resolve('./tsconfig.json'),
    external: [],
    additionalOptions: {},
    additionalPlugins: [],
  });

  return rollupDefineConfig({
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
  config = defineConfig(config, {
    input: 'src/index.ts',
    output: 'dist/esm',
    tsconfig: path.resolve('./tsconfig.json'),
    multiFileOutput: true,
    external: [],
    additionalOptions: {},
    additionalPlugins: [],
  });

  return rollupDefineConfig({
    input: config.input,
    output: {
      [config.multiFileOutput ? 'dir' : 'file']: config.output,
      format: 'esm',
    },
    external: config.external,
    plugins: [
      nodeResolve({ extensions: fileExtensions }),
      createEsbuildConfig({ target: 'es2015', tsconfig: config.tsconfig }),
      // typescript(), // Not required because the 'esbuild-config' does configure typescript for us
      ...config.additionalPlugins,
    ],
    preserveModules: config.multiFileOutput, // https://stackoverflow.com/questions/55339256/tree-shaking-with-rollup
    ...config.additionalOptions,
  });
}

export function createCommonJSConfig(config) {
  config = defineConfig(config, {
    input: 'src/index.ts',
    output: 'dist/index.js',
    tsconfig: path.resolve('./tsconfig.json'),
    external: [],
    additionalOptions: {},
    additionalPlugins: [],
  });

  return rollupDefineConfig({
    input: config.input,
    output: { file: config.output, format: 'cjs' },
    external: config.external,
    plugins: [
      nodeResolve({ extensions: fileExtensions }),
      babel({
        babelHelpers: 'bundled',
        comments: false,
      }),
      typescript({ tsconfig: config.tsconfig }),
      ...config.additionalPlugins,
    ],
    ...config.additionalOptions,
  });
}
