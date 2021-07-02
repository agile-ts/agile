const baseConfig = require('../../jest.base.config.js');
const packageJson = require('./package.json');
const packageName = packageJson.name.split('@agile-ts/').pop();

module.exports = {
  ...baseConfig,
  rootDir: '../..',
  roots: [`<rootDir>/packages/${packageName}`],
  name: packageName,
  displayName: packageName,
  globals: {
    ...baseConfig.globals,
    ...{ window: {} }, // https://stackoverflow.com/questions/46274889/jest-test-fails-with-window-is-not-defined
  },
};
