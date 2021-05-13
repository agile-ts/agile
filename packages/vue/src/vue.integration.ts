import Agile, { Integration } from '@agile-ts/core';
import Vue from 'vue';
import { getBindAgileInstanceMethod } from './bindAgileInstances';

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
            // @ts-ignore
            this.bindAgileInstances = getBindAgileInstanceMethod(agile, this);
            // @ts-ignore
            this.test = (value: string) => ({ test: value });
          },
        });
      },
    });
    return Promise.resolve(true);
  },
});
Agile.initialIntegrations.push(vueIntegration);

export default vueIntegration;
