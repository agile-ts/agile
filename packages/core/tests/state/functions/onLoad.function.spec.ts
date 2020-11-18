import { Agile } from "../../../src";
import { expect } from "chai";

describe("OnLoad Function Tests", () => {
  const myStorage: any = {};
  let calledOnLoadCount = 0;

  // Define Agile with Storage
  const App = new Agile();
  App.registerStorage(
    App.Storage({
      key: "testStorage",
      prefix: "test",
      methods: {
        get: (key) => {
          return myStorage[key];
        },
        set: (key, value) => {
          myStorage[key] = value;
        },
        remove: (key) => {
          delete myStorage[key];
        },
      },
    }),
    { default: false }
  );

  // Create State
  const MY_STATE = App.State<number>(1);

  it("Has correct initial values", () => {
    expect(MY_STATE.isPersisted).to.eq(
      false,
      "MY_STATE has correct isPersisted"
    );

    expect(calledOnLoadCount).to.eq(0, "calledOnLoadCount has correct Value");
  });

  it("Can't register onLoad before persisting Value", async () => {
    MY_STATE.onLoad(() => {
      calledOnLoadCount++;
    });
    MY_STATE.persist("myState");

    // Needs some time to persist value
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(MY_STATE.isPersisted).to.eq(true, "MY_STATE is persisted");

    expect(calledOnLoadCount).to.eq(0, "calledOnLoadCount has correct Value");
  });

  it("Can register onLoad after persisting Value", async () => {
    MY_STATE.onLoad(() => {
      calledOnLoadCount++;
    });

    expect(MY_STATE.isPersisted).to.eq(true, "MY_STATE is persisted");

    expect(calledOnLoadCount).to.eq(1, "calledOnLoadCount got increased by 1");
  });
});
