import Vue from 'vue';
import App from './App.vue';
import { Agile, Logger } from '@agile-ts/core';
import vueIntegration from '@agile-ts/vue';

Vue.config.productionTip = false;

const AgileApp = new Agile({
  logConfig: { level: Logger.level.DEBUG },
}).integrate(vueIntegration);

export const MY_STATE = AgileApp.createState('Hello World');

export default new Vue({
  render: (h) => h(App),
}).$mount('#app');
