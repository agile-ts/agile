import Agile, { Integration } from '@agile-ts/core';
import Vue from 'vue';

const vueIntegration = new Integration({
  key: 'vue',
  frameworkInstance: Vue,
  bind: (agile) => {
    // https://vuejs.org/v2/guide/plugins.html
    Vue.use({
      install: (vue) => {
        // https://vuejs.org/v2/guide/mixins.html
        vue.mixin({
          created: function () {
            agile.subController.registerSubscription(this);
          },
        });
      },
    });
    return Promise.resolve(true);
  },
});
Agile.initialIntegrations.push(vueIntegration);

export default vueIntegration;
