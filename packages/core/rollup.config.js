import path from 'path';
import { defineConfig } from 'rollup'; // https://rollupjs.org/guide/en/#big-list-of-options
import { babel } from '@rollup/plugin-babel';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import esbuild from 'rollup-plugin-esbuild';
import typescript from '@rollup/plugin-typescript';

const fileExtensions = ['.js', '.ts', '.tsx'];
const { root } = path.parse(process.cwd()); // https://nodejs.org/api/process.html#process_process_cwd

// https://rollupjs.org/guide/en/#warning-treating-module-as-external-dependency
// Checks whether the specified id/path is outside the particular package (-> external)
function external(id) {
  return !id.startsWith('.') && !id.startsWith(root);
}

function createEsbuildConfig(target) {
  return esbuild({
    minify: false,
    target,
    tsconfig: path.resolve('./tsconfig.json'),
  });
}

function createDeclarationConfig(input, output) {
  return defineConfig({
    input,
    output: {
      dir: output,
    },
    external,
    plugins: [
      typescript({
        declaration: true,
        emitDeclarationOnly: true,
        outDir: output,
      }),
    ],
  });
}

function createESMConfig(input, output, multiFileOutput = false) {
  return defineConfig({
    input,
    output: {
      dir: multiFileOutput ? output : undefined,
      file: !multiFileOutput ? output : undefined,
      format: 'esm',
    },
    external,
    plugins: [
      nodeResolve({ extensions: fileExtensions }),
      createEsbuildConfig('es2015'),
      // typescript(), // Not required because the 'esbuild-config' does configure typescript for us
    ],
    preserveModules: multiFileOutput, // https://stackoverflow.com/questions/55339256/tree-shaking-with-rollup
    // treeshake: false,
  });
}

function createCommonJSConfig(input, output) {
  return defineConfig({
    input,
    output: { file: output, format: 'cjs' },
    external,
    plugins: [
      nodeResolve({ extensions: fileExtensions }),
      babel({
        babelHelpers: 'bundled',
        comments: false,
      }),
      typescript(),
    ],
  });
}

// https://rollupjs.org/guide/en/#configuration-files
export default function () {
  return [
    createDeclarationConfig('src/index.ts', 'dist'),
    createCommonJSConfig('src/index.ts', 'dist/index.js'),
    createESMConfig('src/index.ts', 'dist/esm', true),
    // createESMConfig('src/index.ts', 'dist/mjs/index.js', false),
  ];
}
