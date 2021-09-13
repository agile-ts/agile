const path = require('path');

module.exports = {
  mode: 'development',
  entry: './src/index.js',
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
    usedExports: true,
    innerGraph: true,
    sideEffects: true,
  },
  devtool: false,
};
