const OFF = 0;
const WARNING = 1;
const ERROR = 2;

module.exports = {
  plugins: ['@typescript-eslint'],
  extends: ['airbnb-typescript', 'prettier'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: ['./tsconfig.json'],
  },
  ignorePatterns: ['.eslintrc.js'], // https://stackoverflow.com/questions/63002127/parsing-error-parseroptions-project-has-been-set-for-typescript-eslint-parser
  rules: {
    'react/prop-types': OFF,
  },
};
