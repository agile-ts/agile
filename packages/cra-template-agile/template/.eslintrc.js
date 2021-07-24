const OFF = 0;
const WARNING = 1;
const ERROR = 2;

module.exports = {
  extends: ['airbnb', 'airbnb/hooks', 'prettier'],
  plugins: ['prettier'],
  ignorePatterns: ['.eslintrc.js'],
  rules: {
    'react/prop-types': OFF,
    'import/prefer-default-export': OFF,
  },
};
