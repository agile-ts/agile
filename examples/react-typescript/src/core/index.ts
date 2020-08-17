import Agile from 'agile-framework';
import React from "react";

export const Test = 'Test';

console.log("Test");

export const App = new Agile({
    logJobs: true,
});

export const MY_STATE = App.State<string>("MyState").key("my_state");
export const MY_STATE_2 = App.State<string>("MyState2").key("my_state_2");

MY_STATE.watch("test", (value) => {
    console.log("Watch " + value);
})
