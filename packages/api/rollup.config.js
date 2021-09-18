import {
  createCommonJSConfig,
  createDeclarationConfig,
  createESMConfig,
} from '../rollup.config.default';

const packageRoot = process.cwd();

// https://rollupjs.org/guide/en/#warning-treating-module-as-external-dependency
// Checks whether the specified path is outside of this particular package
function external(path) {
  return (
    !path.startsWith('.') && // Paths that doesn't start with a '.' (e.g. './agile.ts')
    !path.startsWith(packageRoot) // Paths that doesn't start with the package root path (e.g. 'path/to/package/agile.ts')
  );
}

// https://rollupjs.org/guide/en/#configuration-files
export default function () {
  return [
    createDeclarationConfig({ external }),
    createCommonJSConfig({ external }),
    createESMConfig({ external, multiFileOutput: true }),
  ];
}
