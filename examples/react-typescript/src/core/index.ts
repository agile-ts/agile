import Agile from 'agile-framework';
import React from "react";

export const App = new Agile({
    logJobs: true,
    framework: React
});

export const MY_STATE = App.State<string>("MyState", "my-state").persist();
export const MY_STATE_2 = App.State<string>("MyState2").persist("my-state2");

MY_STATE.watch("test", (value) => {
    console.log("Watch " + value);
});

export const MY_COMPUTED = App.Computed<string>(() => {
    return "test" + MY_STATE.value + "_computed_" + MY_STATE_2.value;
});

// console.log(JSON.stringify(MY_STATE));
