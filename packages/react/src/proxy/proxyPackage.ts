// TODO https://stackoverflow.com/questions/68148235/require-module-inside-a-function-doesnt-work
export let proxyPackage: any = null;
try {
  proxyPackage = require('@agile-ts/proxytree');
} catch (e) {
  // empty catch block
}
