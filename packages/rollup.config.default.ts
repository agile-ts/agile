// @ts-ignore
import path from 'path';
import { ExternalOption, RollupOptions } from 'rollup'; // https://rollupjs.org/guide/en/#big-list-of-options
import { babel } from '@rollup/plugin-babel';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import esbuild from 'rollup-plugin-esbuild';
import typescript from '@rollup/plugin-typescript';
import { defineConfig } from '@agile-ts/utils';

// TODO https://javascript.plainenglish.io/building-a-npm-library-with-web-components-using-lerna-rollup-and-jest-9f76f59348ba
// TODO https://github.com/bjerkek/lerna-rollup-npm

export const fileExtensions = ['.js', '.ts', '.tsx'];

export function createEsbuildConfig(config: EsbuildConfigInterface) {
  config = defineConfig(config, {
    target: 'es2015',
    tsconfig: path.resolve('./tsconfig.json'),
  });
  return esbuild({
    minify: false,
    target: config.target,
    tsconfig: config.tsconfig,
  });
}

export function createDeclarationConfig(
  config: DefaultConfigInterface
): RollupOptions {
  config = defineConfig(config, {
    input: 'src/index.ts',
    output: 'dist',
    tsconfig: path.resolve('./tsconfig.json'),
    external: [],
  });

  return {
    input: config.input,
    output: {
      dir: config.output,
    },
    external: config.external,
    plugins: [
      typescript({
        tsconfig: config.tsconfig,
      }),
    ],
  };
}

export function createESMConfig(config: ESMConfigInterface): RollupOptions {
  config = defineConfig(config, {
    input: 'src/index.ts',
    output: 'dist/esm',
    tsconfig: path.resolve('./tsconfig.json'),
    multiFileOutput: true,
    external: [],
  });

  return {
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
    ],
    preserveModules: config.multiFileOutput, // https://stackoverflow.com/questions/55339256/tree-shaking-with-rollup
  };
}

export function createCommonJSConfig(
  config: DefaultConfigInterface
): RollupOptions {
  config = defineConfig(config, {
    input: 'src/index.ts',
    output: 'dist/index.js',
    tsconfig: path.resolve('./tsconfig.json'),
    external: [],
  });

  return {
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
    ],
  };
}

interface ESMConfigInterface extends DefaultConfigInterface {
  multiFileOutput?: boolean;
}

interface DefaultConfigInterface {
  input?: string;
  output?: string;
  tsconfig?: string;
  external?: ExternalOption;
}

interface EsbuildConfigInterface {
  target?: string[] | string;
  tsconfig?: string;
}
