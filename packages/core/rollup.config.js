import path from 'path';
import {
  createCommonJSConfig,
  createDeclarationConfig,
  createESMConfig,
} from '../rollup.config.default';

const { root } = path.parse(process.cwd()); // https://nodejs.org/api/process.html#process_process_cwd

console.log(root, process.cwd()); // TODO REMOVE

// https://rollupjs.org/guide/en/#warning-treating-module-as-external-dependency
// Checks whether the specified id/path is outside the particular package (-> external)
function external(id) {
  return !id.startsWith('.') && !id.startsWith(root);
}

// https://rollupjs.org/guide/en/#configuration-files
export default function () {
  return [
    createDeclarationConfig({ external }),
    createCommonJSConfig({ external }),
    createESMConfig({ external, multiFileOutput: true }),
  ];
}
