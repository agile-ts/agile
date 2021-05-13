<template>
  <div id="app">
    <img alt="Vue logo" src="./assets/logo.png" />
    <p>myState: {{ myState }}</p>
    <button v-on:click="changeMyState">Change State</button>
    <HelloWorld msg="Welcome to Your Vue.js App!" />
  </div>
</template>

<script>
import HelloWorld from './components/HelloWorld.vue';
import { MY_STATE } from '@/main';
import { generateId } from '@agile-ts/core';

export default {
  name: 'App',
  components: {
    HelloWorld,
  },
  data: function () {
    return {
      ...this.bindAgileInstances({
        myState: MY_STATE,
      }),
    };
  },
  methods: {
    changeMyState: function(){
      MY_STATE.set(generateId());
    }
  }
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
