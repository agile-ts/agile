const baseConfig = require('./jest.base.config.js');

module.exports = {
  ...baseConfig,
  projects: ['<rootDir>/packages/**/jest.config.js'],
};
