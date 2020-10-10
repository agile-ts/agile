import "mocha";
import { expect } from "chai";
import { Agile } from "../../../src";

describe("Persist Function Tests", () => {
  const myStorage: any = {};

  // Define Agile with Storage
  const App = new Agile({
    storageConfig: {
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
    },
  });

  describe("State", () => {
    // Create State
    const MY_STATE = App.State<number>(1);

    it("Has correct initial values", () => {
      expect(MY_STATE.value).to.eq(1, "MY_STATE has correct value");
      expect(MY_STATE.persistConfig.isPersisted).to.eq(
        false,
        "MY_STATE has correct isPersistState"
      );
      expect(App.storage.persistedStates.has(MY_STATE)).to.eq(
        false,
        "MY_STATE isn't in persistedStates"
      );
      expect(App.storage.persistedStates.has(MY_STATE)).to.eq(
        false,
        "MY_STATE isn't in persistedStates"
      );
    });

    it("Can't persist State without persist Key", () => {
      // Persist State
      MY_STATE.persist();

      expect(MY_STATE.persistConfig.isPersisted).to.eq(
        false,
        "MY_STATE has correct isPersisted"
      );
      expect(MY_STATE.persistConfig.persistKey).to.eq(
        undefined,
        "MY_STATE has correct persistKey"
      );
      expect(MY_STATE.key).to.eq(undefined, "MY_STATE has correct key");
      expect(App.storage.persistedStates.has(MY_STATE)).to.eq(
        false,
        "MY_STATE isn't in persistedStates"
      );
      expect(App.storage.get("mySecondKey")).to.eq(
        undefined,
        "MY_STATE isn't in storage"
      );
    });

    it("Can persist State with persist Key", async () => {
      // Persist State
      MY_STATE.persist("mySecondKey");

      // Needs some time to persist value
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(MY_STATE.persistConfig.isPersisted).to.eq(
        true,
        "MY_STATE has correct isPersisted"
      );
      expect(MY_STATE.persistConfig.persistKey).to.eq(
        "mySecondKey",
        "MY_STATE has correct persistKey"
      );
      expect(MY_STATE.key).to.eq(
        "mySecondKey",
        "MY_STATE key has been set to persistKey if no key is provided"
      );
      expect(App.storage.persistedStates.has(MY_STATE)).to.eq(
        true,
        "MY_STATE isn't in persistedStates"
      );
      expect(App.storage.get("mySecondKey")).to.eq(1, "MY_STATE is in storage");
    });

    describe("Test reset method on persist State", () => {
      it("Removes the State from the Storage if it get reset", () => {
        // Reset State
        MY_STATE.reset();

        expect(MY_STATE.persistConfig.isPersisted).to.eq(
          true,
          "MY_STATE has correct isPersisted"
        );
        expect(MY_STATE.persistConfig.persistKey).to.eq(
          "mySecondKey",
          "MY_STATE has correct persistKey"
        );
        expect(MY_STATE.key).to.eq("mySecondKey", "MY_STATE has correct key");
        expect(App.storage.persistedStates.has(MY_STATE)).to.eq(
          true,
          "MY_STATE is in persistedStates"
        );
        expect(App.storage.get("mySecondKey")).to.eq(
          undefined,
          "MY_STATE isn't in storage"
        );
      });
    });

    describe("Test set method on persist State", () => {
      it("Updates the State in the Storage if it get changed", () => {
        // Reset State
        MY_STATE.set(5);

        expect(MY_STATE.persistConfig.isPersisted).to.eq(
          true,
          "MY_STATE has correct isPersisted"
        );
        expect(MY_STATE.persistConfig.persistKey).to.eq(
          "mySecondKey",
          "MY_STATE_WITH_KEY has correct persistKey"
        );
        expect(App.storage.persistedStates.has(MY_STATE)).to.eq(
          true,
          "MY_STATE_WITH_KEY is in persistedStates"
        );
        expect(App.storage.get("mySecondKey")).to.eq(
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
      expect(MY_STATE_WITH_KEY.persistConfig.isPersisted).to.eq(
        false,
        "MY_STATE_WITH_KEY has correct isPersistState"
      );
      expect(App.storage.persistedStates.has(MY_STATE_WITH_KEY)).to.eq(
        false,
        "MY_STATE_WITH_KEY isn't in persistedStates"
      );
      expect(App.storage.get("myKey")).to.eq(
        undefined,
        "MY_STATE_WITH_KEY isn't in storage"
      );
    });

    it("Can persist State without persist Key", async () => {
      // Persist State
      MY_STATE_WITH_KEY.persist();

      // Needs some time to persist value
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(MY_STATE_WITH_KEY.persistConfig.isPersisted).to.eq(
        true,
        "MY_STATE_WITH_KEY has correct isPersistState"
      );
      expect(MY_STATE_WITH_KEY.persistConfig.persistKey).to.eq(
        "myKey",
        "MY_STATE_WITH_KEY has correct persistKey"
      );
      expect(App.storage.persistedStates.has(MY_STATE_WITH_KEY)).to.eq(
        true,
        "MY_STATE_WITH_KEY is in persistedStates"
      );
      expect(App.storage.get("myKey")).to.eq(
        "hello",
        "MY_STATE_WITH_KEY is in storage"
      );
    });

    it("Can persist State with persist Key", async () => {
      // Persist State
      MY_STATE_WITH_KEY.persist("myThirdKey");

      // Needs some time to persist value
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(MY_STATE_WITH_KEY.persistConfig.isPersisted).to.eq(
        true,
        "MY_STATE_WITH_KEY has correct isPersistState"
      );
      expect(MY_STATE_WITH_KEY.persistConfig.persistKey).to.eq(
        "myThirdKey",
        "MY_STATE_WITH_KEY has correct persistKey"
      );
      expect(MY_STATE_WITH_KEY.key).to.eq(
        "myKey",
        "MY_STATE_WITH_KEY has correct key"
      );
      expect(App.storage.persistedStates.has(MY_STATE_WITH_KEY)).to.eq(
        true,
        "MY_STATE_WITH_KEY is in persistedStates"
      );
      expect(App.storage.get("myThirdKey")).to.eq(
        "hello",
        "MY_STATE_WITH_KEY with new key is in storage"
      );
      expect(App.storage.get("myKey")).to.eq(
        undefined,
        "MY_STATE_WITH_KEY with old key isn't in storage"
      );
    });
  });
});
