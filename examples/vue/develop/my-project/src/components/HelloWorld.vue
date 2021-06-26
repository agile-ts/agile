<template>
  <div class="hello">
    <h1>{{ msg }}</h1>
    <h3>Simple TODO List</h3>
    <input type='text' v-model='currentInput'>
    <input type='submit' value='Add' @click='addTodo'>
    <div v-for='todo in sharedState.todos' v-bind:key='todo.id' class='todoItem'>
      <div>{{todo.name}}</div>
      <button @click='removeTodo(todo.id)'>Remove</button>
    </div>
    <div>{{sharedState.todoValues}}</div>
  </div>
</template>

<script>
import { TODOS } from '@/core';
import { generateId } from '@agile-ts/core';

export default {
  name: 'HelloWorld',
  props: {
    msg: String
  },
  data: function () {
    return {
      // ...this.bindAgileOutputs({
      //   todos: TODOS
      // }),
      ...this.bindAgileValues({
        todoValues: TODOS
      }),
      ...this.bindAgileInstances({
        todos: TODOS
      }),
      currentInput: ''
    };
  },
  methods: {
    addTodo: function(){
      if (this.currentInput === "") return;

      // Add new Todo to the Collection based on the current Input
      TODOS.collect({ id: generateId(), name: this.currentInput }, [], {
        method: "unshift" // to add todo at the beginning of the Collection
      });

      this.currentInput = '';
    },
    removeTodo: function(id) {
      // Remove Todo at specific primary Key
      TODOS.remove(id).everywhere();
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
h3 {
  margin: 40px 0 10px 0;
}

.todoItem {
  margin-bottom: 10px;
}
</style>
