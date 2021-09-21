// https://babeljs.io/docs/en/config-files#config-function-api
export default function getBabelConfig() {
  return {
    ignore: ['./node_modules'],
    presets: [
      [
        '@babel/preset-env',
        {
          targets: {
            // Only targeting browsers supporting ES Modules (https://babeljs.io/docs/en/babel-preset-env)
            // Why?: https://github.com/babel/babel/issues/9849#issuecomment-592668815
            esmodules: true,
          },
        },
      ],
    ],
    // https://stackoverflow.com/questions/53558916/babel-7-referenceerror-regeneratorruntime-is-not-defined/61517521#61517521
    // Unfortunately this plugin requires an external (prod) dependency '@babel/runtime'.
    // However the required dependency is also modular and shrinks the bundle size in general due to function reuses.
    // (See: https://babeljs.io/docs/en/babel-runtime)
    // Note: Required when using "babelHelpers: 'runtime'" in the 'rollup.config.default.js'
    //       and to support browsers that do not support ES Modules like 'IE11'
    // plugins: ['@babel/transform-runtime'],
  };
}
