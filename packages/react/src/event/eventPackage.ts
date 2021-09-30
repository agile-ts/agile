// TODO https://stackoverflow.com/questions/68148235/require-module-inside-a-function-doesnt-work
export let eventPackage: any = null;
try {
  eventPackage = require('@agile-ts/event');
} catch (e) {
  // empty catch block
}
