const OFF = 0;
const WARNING = 1;
const ERROR = 2;

module.exports = {
  root: true,
  env: {
    browser: true,
    commonjs: true,
    jest: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    allowImportExportEverywhere: true,
    ecmaVersion: 12,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint', 'prettier'],
  rules: {
    'func-names': OFF,
    '@typescript-eslint/no-explicit-any': OFF,
    '@typescript-eslint/explicit-module-boundary-types': OFF,
    '@typescript-eslint/ban-types': WARNING,
    '@typescript-eslint/ban-ts-comment': WARNING,
  },
};
