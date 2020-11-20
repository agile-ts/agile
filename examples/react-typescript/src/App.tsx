import React, { useEffect, useState } from "react";
import "./App.css";
import { useAgile, useEvent, useWatcher } from "@agile-ts/react";
import {
  multiEditor,
  MY_COLLECTION,
  MY_COMPUTED,
  MY_EVENT,
  MY_STATE,
  MY_STATE_2,
  MY_STATE_3,
} from "./core";
import { globalBind } from "@agile-ts/core";

let rerenderCount = 0;

const App = (props: any) => {
  // Note: Rerenders twice because of React Strickt Mode (also useState does trigger a rerender twice)
  // https://stackoverflow.com/questions/54927622/usestate-do-double-render
  rerenderCount++;

  const myComputed = useAgile(MY_COMPUTED);
  const [myState, myState2, item, mySelector2, myState3] = useAgile([
    MY_STATE,
    MY_STATE_2,
    MY_COLLECTION.getItem("1"),
    MY_COLLECTION.getSelector("mySelector"),
    MY_STATE_3,
  ]);
  const [myCollection] = useAgile([
    MY_COLLECTION.getGroupWithReference("myGroup"),
  ]);

  const mySelector = useAgile(MY_COLLECTION.getSelector("mySelector"));

  useEvent(MY_EVENT, () => {
    console.log("Triggered Event (useEvent)");
  });

  useWatcher(MY_STATE, () => {
    console.log("MY_STATE changes");
  });

  useAgile(multiEditor.deps);

  // Create global Instance of Core (for better debugging)
  useEffect(() => {
    globalBind("__core__", { ...require("./core") });
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <div className={"Container"}>
          <h3 className={"Title"}>My State</h3>
          <button onClick={() => MY_STATE.set("Test10")}>
            {myState}_{myState2}
          </button>
        </div>

        <div className={"Container"}>
          <h3 className={"Title"}>My State_2</h3>
          <button onClick={() => MY_STATE_2.set("Test3")}>
            {myState}_{myState2}
          </button>
        </div>

        <div className={"Container"}>
          <h3 className={"Title"}>My Computed</h3>
          <p>{myComputed}</p>
        </div>

        <div className={"Container"}>
          <h3 className={"Title"}>My Event</h3>
          <button onClick={() => MY_EVENT.trigger({ name: "test" })}>
            Trigger
          </button>
        </div>

        <div className={"Container"}>
          <h3 className={"Title"}>My Collection</h3>
          <div>
            {myCollection.map((item: any) => (
              <p>{item.name}</p>
            ))}
          </div>
          <button
            onClick={() => MY_COLLECTION.collect({ id: "id3", name: "Test3" })}
          >
            Collect
          </button>
          <button onClick={() => MY_COLLECTION.getGroup("myGroup")?.add("id3")}>
            Add to myGroup
          </button>
          <button
            onClick={() =>
              MY_COLLECTION.update("id3", {
                id: "newId3",
                name: "Test3_Changed",
              })
            }
          >
            Update id3
          </button>
          <button onClick={() => MY_COLLECTION.remove("newId3").everywhere()}>
            Remove newId3
          </button>
        </div>

        <p>MySelector: {mySelector?.name}</p>

        <button onClick={() => MY_COLLECTION.removeSelector("mySelector")}>
          Remove mySelector
        </button>
      </header>

      <form>
        <label>Name</label>
        <input
          name={"name"}
          onChange={(e) => {
            multiEditor.setValue("name", e.target.value, { background: false });
          }}
          value={multiEditor.getValueById("name")}
        />
        {multiEditor.getStatus("name")?.type === "error" && (
          <p style={{ color: "red" }}>
            {multiEditor.getStatus("name")?.message}
          </p>
        )}

        <label>Email</label>
        <input
          name={"email"}
          onChange={(e) => multiEditor.setValue("email", e.target.value)}
        />
        {multiEditor.getStatus("email")?.type === "error" && (
          <p style={{ color: "red" }}>
            {multiEditor.getStatus("email")?.message}
          </p>
        )}

        <p>{rerenderCount}</p>
      </form>
      <button
        onClick={() => {
          multiEditor.submit();
        }}
      >
        Submit
      </button>
    </div>
  );
};

export default App;
