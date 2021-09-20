// https://babeljs.io/docs/en/config-files#config-function-api
export default function getBabelConfig() {
  return {
    ignore: ['./node_modules'],
    presets: [
      '@babel/preset-env',
      '@babel/preset-typescript',
    ],
    plugins: ['@babel/plugin-transform-typescript'],
  };
}
