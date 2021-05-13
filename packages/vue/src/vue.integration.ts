import Agile, { Integration } from '@agile-ts/core';
import Vue from 'vue';
import { bindAgileInstances, DepsType } from './bindAgileInstances';

declare module 'vue/types/vue' {
  interface VueConstructor {
    bindAgileInstances: (deps: DepsType) => { [key: string]: any };
    $agile: Agile;
  }
}

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
            this.$agile = agile;
          },
          methods: {
            bindAgileInstances: function (deps: DepsType) {
              return bindAgileInstances(deps, agile, this);
            },
          },
        });
      },
    });
    return Promise.resolve(true);
  },
});
Agile.initialIntegrations.push(vueIntegration);

export default vueIntegration;
