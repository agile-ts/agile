const baseConfig = require('./jest.base.config.js');

module.exports = {
  ...baseConfig,
  // * = only one directory between (for instance packages/react/jest.config.js)
  // ** = x directories between (for instance packages/core/node_modules/@agile-ts/core/jest.config.js)
  projects: ['<rootDir>/packages/*/jest.config.js'],
};
