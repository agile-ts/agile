const baseConfig = require('./jest.config.base.js');

module.exports = {
  ...baseConfig,
  projects: ['<rootDir>/packages/*/jest.config.js'],
};
