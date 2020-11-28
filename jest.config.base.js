module.exports = {
  testEnvironment: "node",
  coveragePathIgnorePatterns: ["(tests/.*.mock).(jsx?|tsx?)$"],
  modulePathIgnorePatterns: ["dist"],
  testMatch: ["<rootDir>/packages/**/tests/**/*.test.ts"],
  transform: {
    "^.+\\.ts?$": "ts-jest",
  },
};
