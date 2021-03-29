module.exports = {
  testEnvironment: 'node',
  coveragePathIgnorePatterns: ['(tests/.*.mock).(jsx?|tsx?)$'],
  modulePathIgnorePatterns: ['dist', 'examples'],
  testMatch: ['<rootDir>/packages/**/tests/**/*.test.ts'],
  transform: {
    '^.+\\.ts?$': 'ts-jest',
  },
};
