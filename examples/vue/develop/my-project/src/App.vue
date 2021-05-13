<template>
  <div id="app">
    <img alt="Vue logo" src="./assets/logo.png" />
    <p>myState: {{ myState }}</p>
    <p>Test: {{ test }}</p>
    <HelloWorld msg="Welcome to Your Vue.js App!" />
  </div>
</template>

<script>
import HelloWorld from './components/HelloWorld.vue';
import { MY_STATE } from '@/main';

export default {
  name: 'App',
  components: {
    HelloWorld,
  },
  data: function () {
    console.log(this);
    return {
      ...this.test('hi'),
      ...this.bindAgileInstances({
        myState: MY_STATE,
      }),
    };
  },
};
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
