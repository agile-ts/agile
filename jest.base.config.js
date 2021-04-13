module.exports = {
  testEnvironment: 'node',
  coveragePathIgnorePatterns: ['(tests/.*.mock).(jsx?|tsx?)$'],
  modulePathIgnorePatterns: ['dist', 'examples', 'node_modules'],
  collectCoverageFrom: ['**/*.ts', '!**/node_modules/**', '!**/dist/**'],
  coverageDirectory: '<rootDir>/coverage/',
  testMatch: ['<rootDir>/packages/**/tests/**/*.test.ts'],
  transform: {
    '^.+\\.ts?$': 'ts-jest',
  },
  // https://github.com/bpedersen/jest-mock-console#readme
  setupFilesAfterEnv: ['jest-mock-console/dist/setupTestFramework.js'],
  /* https://stackoverflow.com/questions/63904196/esmoduleinterop-flag-set-still-getting-default-import-error */
  globals: {
    'ts-jest': {
      tsconfig: '<rootDir>/packages/tsconfig.default.json',
    },
  },
};
