const baseConfig = require('../../jest.base.config');
const packageJson = require('./package.json');
const packageName = packageJson.name.split('@agile-ts/').pop();

module.exports = {
  ...baseConfig,
  rootDir: '../..',
  roots: [`<rootDir>/packages/${packageName}`],
  name: packageName,
  displayName: packageName,
};
