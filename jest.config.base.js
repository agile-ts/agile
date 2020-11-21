module.exports = {
  testEnvironment: "node",
  coveragePathIgnorePatterns: ["(tests/.*.mock).(jsx?|tsx?)$"],
  modulePathIgnorePatterns: ["dist"],
  transform: {
    "^.+\\.ts?$": "ts-jest",
  },
  testMatch: ["**/*.test.*"],
};
