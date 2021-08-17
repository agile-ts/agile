// https://medium.com/@hamidihamza/optimize-react-web-apps-with-webpack-bundle-analyzer-6ecb9f162c76
// Note: Webpack Bundle Analyzer doesn't show accurately which bundles were tree shaken
//       (See: https://github.com/webpack-contrib/webpack-bundle-analyzer/issues/161)

// https://nodejs.org/docs/latest/api/process.html#process_process_argv
const isDev = process.argv.includes('--dev');

console.log(
  `Start bundling a '${isDev ? 'development' : 'production'}' build!`
);

process.env.NODE_ENV = isDev ? 'development' : 'production';

const webpack = require('webpack');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer')
  .BundleAnalyzerPlugin;
const webpackConfigProd = require('react-scripts/config/webpack.config')(
  'production'
);
const webpackConfigDev = require('react-scripts/config/webpack.config')(
  'development'
);

// Add Bundle Analyzer Plugin to React webpack config
webpackConfigProd.plugins.push(new BundleAnalyzerPlugin());
webpackConfigDev.plugins.push(new BundleAnalyzerPlugin());

// Build project with webpack
webpack(isDev ? webpackConfigDev : webpackConfigProd, (err, stats) => {
  if (err || stats.hasErrors()) {
    console.error(err);
  }
});
