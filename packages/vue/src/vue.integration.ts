import Agile, { Integration } from '@agile-ts/core';
import Vue from 'vue';
import { bindAgileInstances, DepsType } from './bindAgileInstances';

// https://vuejs.org/v2/guide/typescript.html
declare module 'vue/types/vue' {
  interface VueConstructor {
    bindAgileInstances: (deps: DepsType) => { [key: string]: any };
    $agile: Agile;
  }
}

const vueIntegration = new Integration<typeof Vue, Vue>({
  key: 'vue',
  frameworkInstance: Vue,
  updateMethod: (componentInstance, updatedData) => {
    // Merge changes into sharedState if some Data updated otherwise force rerender
    if (Object.keys(updatedData).length !== 0) {
      // https://vuejs.org/v2/guide/state-management.html
      componentInstance.$root.$data.sharedState = {
        ...updatedData,
        ...componentInstance.$root.$data.sharedState,
      };
    } else {
      componentInstance.$forceUpdate();
    }

    // TODO REMOVE
    console.log(
      'updateMethod()',
      componentInstance,
      componentInstance.$root.$data.sharedState
    );
  },
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
              return {
                sharedState: {
                  ...(this.$root.$data.sharedState || {}),
                  ...bindAgileInstances(deps, agile, this),
                },
              };
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
