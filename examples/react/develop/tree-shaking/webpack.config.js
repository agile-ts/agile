const path = require('path');
const packageJson = require('./package.json');
const dependencies = packageJson.dependencies || {};

module.exports = {
  mode: 'production',
  entry: './src/index.js',
  externals: Object.keys(dependencies),
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'app.js',
  },
  resolve: { extensions: ['.js', '.jsx'] },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [['@babel/env', { modules: false }], '@babel/react'],
          },
        },
      },
    ],
  },
  optimization: {
    providedExports: true,
    usedExports: true,
  },
};
