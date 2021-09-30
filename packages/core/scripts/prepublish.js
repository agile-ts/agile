const fs = require('fs-extra');

const run = () => {
  fs.copySync('../../README.md', './README.md');
  fs.copySync('../../LICENSE', './LICENSE');
};

run();
