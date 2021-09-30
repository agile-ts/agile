// TODO https://stackoverflow.com/questions/68148235/require-module-inside-a-function-doesnt-work
export let multieditorPackage: any = null;
try {
  multieditorPackage = require('@agile-ts/multieditor');
} catch (e) {
  // empty catch block
}
