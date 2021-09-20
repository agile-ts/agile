// https://babeljs.io/docs/en/config-files#config-function-api
export default function getBabelConfig() {
  return {
    ignore: ['./node_modules'],
    presets: ['@babel/preset-env'],
    // https://stackoverflow.com/questions/33527653/babel-6-regeneratorruntime-is-not-defined
    plugins: ['@babel/transform-runtime'],
  };
}
