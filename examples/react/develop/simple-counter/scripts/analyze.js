// https://medium.com/@hamidihamza/optimize-react-web-apps-with-webpack-bundle-analyzer-6ecb9f162c76

process.env.NODE_ENV = 'production';

const webpack = require('webpack');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer')
  .BundleAnalyzerPlugin;
const webpackConfigProd = require('react-scripts/config/webpack.config')(
  'production'
);

// Add Bundle Analyzer Plugin to React webpack config
webpackConfigProd.plugins.push(new BundleAnalyzerPlugin());

// Build project with webpack
webpack(webpackConfigProd, (err, stats) => {
  if (err || stats.hasErrors()) {
    console.error(err);
  }
});
