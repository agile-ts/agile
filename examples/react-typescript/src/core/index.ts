import { Agile, Collection } from "@agile-ts/core";
import { MultiEditor } from "@agile-ts/multieditor";

export const App = new Agile({
  logJobs: true,
});

export const MY_STATE = App.State<string>("MyState", "my-state"); //.persist();
export const MY_STATE_2 = App.State<string>("MyState2").persist("my-state2");
MY_STATE_2.onLoad(() => {
  console.log("On Load");
});
export const MY_STATE_3 = App.State<number>(1); //.persist("my-state2");

MY_STATE.watch("test", (value: any) => {
  console.log("Watch " + value);
});

export const MY_COMPUTED = App.Computed<string>(() => {
  return "test" + MY_STATE.value + "_computed_" + MY_STATE_2.value;
});

interface collectionValueInterface {
  id: string;
  name: string;
}

export const MY_COLLECTION = App.Collection<collectionValueInterface>(
  (collection: Collection) => ({
    key: "my-collection",
    groups: {
      myGroup: collection.Group(),
    },
    selectors: {
      mySelector: collection.Selector("id3"),
    },
  })
).persist();
MY_COLLECTION.collect({ id: "id1", name: "test" });
MY_COLLECTION.collect({ id: "id2", name: "test2" }, "myGroup");
MY_COLLECTION.update("id1", { id: "id1Updated", name: "testUpdated" });
MY_COLLECTION.getGroup("myGroup").persist({ followCollectionPattern: true });

console.log("Initial: myCollection ", MY_COLLECTION);

export const MY_EVENT = App.Event<{ name: string }>();

MY_EVENT.on(() => {
  console.log("Triggered Event (noId)");
});

MY_EVENT.on("Test", () => {
  console.log("Triggered Event (Test)");
});

// MULTIEDITOR TEST

export const multiEditor = new MultiEditor<string | undefined, boolean>(
  App,
  (editor) => ({
    data: {
      id: "myId",
      email: undefined,
      name: undefined,
    },
    onSubmit: async (data) => {
      console.log("Submitted MultiEditor", data);
      return Promise.resolve(true);
    },
    fixedProperties: ["id"],
    validateMethods: {
      email: editor.Validator().email().required(),
      name: editor.Validator().maxLength(10).minLength(2).required(),
    },
    editableProperties: ["email"],
    reValidateMode: "onChange",
    validate: "editable",
  })
);
