import "mocha";
import { expect } from "chai";
import { Agile, Persistent } from "../../../src";

describe("Persist Function Tests", () => {
  const myStorage: any = {};

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
    { default: true }
  );

  describe("State", () => {
    // Create State
    const MY_STATE = App.State<number>(1);

    it("Has correct initial values", () => {
      expect(MY_STATE.value).to.eq(1, "MY_STATE has correct value");
      expect(MY_STATE.isPersisted).to.eq(
        false,
        "MY_STATE has correct isPersisted"
      );
      expect(MY_STATE.persistent).to.eq(
        undefined,
        "MY_STATE has no persistManager"
      );
      expect(
        MY_STATE.persistent !== undefined &&
          App.storages.persistentInstances.has(MY_STATE.persistent)
      ).to.eq(false, "MY_STATE isn't in persistedStates");
    });

    it("Can't persist State without persist Key", () => {
      // Persist State
      MY_STATE.persist();

      expect(MY_STATE.isPersisted).to.eq(
        false,
        "MY_STATE has correct isPersisted"
      );
      expect(MY_STATE.persistent !== undefined).to.eq(
        true,
        "MY_STATE has persistManager"
      );
      expect(MY_STATE.persistent?.ready).to.eq(
        false,
        "MY_STATE persistManager is not ready"
      );
      expect(MY_STATE.persistent?.key).to.eq(
        "unknown",
        "MY_STATE persistManager has 'unknown' key"
      );
      expect(
        MY_STATE.persistent !== undefined &&
          App.storages.persistentInstances.has(MY_STATE.persistent)
      ).to.eq(false, "MY_STATE isn't in persistedStates");
      expect(MY_STATE.key).to.eq(undefined, "MY_STATE has correct key");
      expect(
        MY_STATE.persistent !== undefined &&
          App.storages.persistentInstances.has(MY_STATE.persistent)
      ).to.eq(false, "MY_STATE isn't in persistedStates");
      expect(App.storages.get("mySecondKey")).to.eq(
        undefined,
        "MY_STATE isn't in storage"
      );
    });

    it("Can persist State with persist Key", async () => {
      // Persist State
      MY_STATE.persist("mySecondKey");

      // Needs some time to persist value
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(MY_STATE.isPersisted).to.eq(
        true,
        "MY_STATE has correct isPersisted"
      );
      expect(MY_STATE.persistent !== undefined).to.eq(
        true,
        "MY_STATE has persistManager"
      );
      expect(MY_STATE.persistent?.key).to.eq(
        "mySecondKey",
        "MY_STATE persistManager has correct Key"
      );
      expect(MY_STATE.persistent?.ready).to.eq(
        true,
        "MY_STATE persistManager is ready"
      );
      expect(
        MY_STATE.persistent !== undefined &&
          App.storages.persistentInstances.has(MY_STATE.persistent)
      ).to.eq(true, "MY_STATE is in persistedStates");
      expect(MY_STATE.key).to.eq(
        "mySecondKey",
        "MY_STATE key has been set to persistKey if no key is provided"
      );
      expect(
        MY_STATE.persistent !== undefined &&
          App.storages.persistentInstances.has(MY_STATE.persistent)
      ).to.eq(true, "MY_STATE isn't in persistedStates");
      expect(App.storages.get("mySecondKey")).to.eq(
        1,
        "MY_STATE is in storage"
      );
    });

    describe("Test reset method on persist State", () => {
      it("Removes the State from the Storage if it get reset", () => {
        // Reset State
        MY_STATE.reset();

        expect(MY_STATE.isPersisted).to.eq(
          true,
          "MY_STATE has correct isPersisted"
        );
        expect(MY_STATE.persistent?.isPersisted).to.eq(
          false,
          "MY_STATE persistent has correct isPersisted"
        );
        expect(MY_STATE.key).to.eq("mySecondKey", "MY_STATE has correct key");
        expect(
          App.storages.persistentInstances.has(
            MY_STATE.persistent as Persistent
          )
        ).to.eq(true, "MY_STATE is in persistedStates");
        expect(App.storages.get("mySecondKey")).to.eq(
          undefined,
          "MY_STATE isn't in storage"
        );
      });
    });

    describe("Test set method on persist State", () => {
      it("Updates State in the Storage if it get changed", () => {
        console.log(MY_STATE);
        // Reset State
        MY_STATE.set(5);

        expect(MY_STATE.isPersisted).to.eq(
          true,
          "MY_STATE has correct isPersisted"
        );
        expect(
          MY_STATE.persistent !== undefined &&
            App.storages.persistentInstances.has(MY_STATE.persistent)
        ).to.eq(true, "MY_STATE is in persistedStates");
        expect(App.storages.get("mySecondKey")).to.eq(
          5,
          "MY_STATE_WITH_KEY is in storage and has been updated"
        );
      });
    });
  });

  describe("State with Key", () => {
    // Create State
    const MY_STATE_WITH_KEY = App.State<string>("hello", "myKey");

    it("Has correct initial values", () => {
      expect(MY_STATE_WITH_KEY.value).to.eq(
        "hello",
        "MY_STATE_WITH_KEY has correct value"
      );
      expect(MY_STATE_WITH_KEY.key).to.eq(
        "myKey",
        "MY_STATE_WITH_KEY has correct key"
      );
      expect(MY_STATE_WITH_KEY.isPersisted).to.eq(
        false,
        "MY_STATE_WITH_KEY has correct isPersistState"
      );
      expect(MY_STATE_WITH_KEY.persistent).to.eq(
        undefined,
        "MY_STATE_WITH_KEY has no persistManager"
      );
      expect(
        MY_STATE_WITH_KEY.persistent !== undefined &&
          App.storages.persistentInstances.has(MY_STATE_WITH_KEY.persistent)
      ).to.eq(false, "MY_STATE_WITH_KEY isn't in persistedStates");
      expect(App.storages.get("myKey")).to.eq(
        undefined,
        "MY_STATE_WITH_KEY isn't in storage"
      );
    });

    it("Can persist State without persist Key", async () => {
      // Persist State
      MY_STATE_WITH_KEY.persist();

      // Needs some time to persist value
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(MY_STATE_WITH_KEY.isPersisted).to.eq(
        true,
        "MY_STATE_WITH_KEY has correct isPersistState"
      );
      expect(MY_STATE_WITH_KEY.persistent !== undefined).to.eq(
        true,
        "MY_STATE_WITH_KEY has persistManager"
      );
      expect(MY_STATE_WITH_KEY.persistent?.key).to.eq(
        "myKey",
        "MY_STATE_WITH_KEY persistManager has correct key"
      );
      expect(MY_STATE_WITH_KEY.persistent?.ready).to.eq(
        true,
        "MY_STATE_WITH_KEY persistManager is ready"
      );
      expect(
        MY_STATE_WITH_KEY.persistent !== undefined &&
          App.storages.persistentInstances.has(MY_STATE_WITH_KEY.persistent)
      ).to.eq(true, "MY_STATE_WITH_KEY is in persistedStates");
      expect(App.storages.get("myKey")).to.eq(
        "hello",
        "MY_STATE_WITH_KEY is in storage"
      );
    });

    it("Can persist State with persist Key", async () => {
      // Persist State
      MY_STATE_WITH_KEY.persist("myThirdKey");

      // Needs some time to persist value
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(MY_STATE_WITH_KEY.isPersisted).to.eq(
        true,
        "MY_STATE_WITH_KEY has correct isPersistState"
      );
      expect(MY_STATE_WITH_KEY.persistent !== undefined).to.eq(
        true,
        "MY_STATE_WITH_KEY has persistManager"
      );
      expect(MY_STATE_WITH_KEY.persistent?.key).to.eq(
        "myThirdKey",
        "MY_STATE_WITH_KEY persistManager has correct key"
      );
      expect(MY_STATE_WITH_KEY.persistent?.ready).to.eq(
        true,
        "MY_STATE_WITH_KEY persistManager is ready"
      );
      expect(MY_STATE_WITH_KEY.key).to.eq(
        "myKey",
        "MY_STATE_WITH_KEY has correct key"
      );
      expect(
        MY_STATE_WITH_KEY.persistent !== undefined &&
          App.storages.persistentInstances.has(MY_STATE_WITH_KEY.persistent)
      ).to.eq(true, "MY_STATE_WITH_KEY is in persistedStates");
      expect(App.storages.get("myThirdKey")).to.eq(
        "hello",
        "MY_STATE_WITH_KEY with new key is in storage"
      );
      expect(App.storages.get("myKey")).to.eq(
        undefined,
        "MY_STATE_WITH_KEY with old key isn't in storage"
      );
    });
  });
});
