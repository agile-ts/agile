import "mocha";
import { expect } from "chai";
import { Agile } from "../../src";

describe("Default State Tests", () => {
  // Define Agile
  const App = new Agile();

  describe("State", () => {
    // Create State
    const MY_STATE = App.State<string>("hello");

    it("Has correct initial values", () => {
      expect(MY_STATE.value).to.eq("hello", "MY_STATE has correct value");
      expect(typeof MY_STATE.value === "string").to.eq(
        true,
        "MY_STATE has correct type"
      );
      expect(MY_STATE._value).to.eq("hello", "MY_STATE has correct _value");
      expect(MY_STATE.previousState).to.eq(
        "hello",
        "MY_STATE has correct previousState"
      );
      expect(MY_STATE.key).to.eq(undefined, "MY_STATE has correct key");
      expect(MY_STATE._key).to.eq(undefined, "My_STATE has correct _key");
      expect(JSON.stringify(MY_STATE.sideEffects)).to.eq(
        JSON.stringify({}),
        "MY_STATE has no sideEffects"
      );
      expect(MY_STATE.nextState).to.eq(
        "hello",
        "MY_STATE has correct nextState"
      );
      expect(MY_STATE.initialState).to.eq(
        "hello",
        "MY_STATE has correct initialState"
      );
      expect(MY_STATE.exists).to.eq(true, "MY_STATE has correct exists");
      expect(MY_STATE.isSet).to.eq(false, "MY_STATE has correct isSet");
      expect(MY_STATE.isPersisted).to.eq(
        false,
        "MY_STATE has correct isPersisted"
      );
      expect(MY_STATE.persistManager).to.eq(
        undefined,
        "MY_STATE has no persistManager"
      );
      expect(MY_STATE.isPlaceholder).to.eq(
        false,
        "MY_STATE has correct isPlaceholder"
      );
      expect(MY_STATE.valueType).to.eq(
        undefined,
        "MY_STATE has correct valueType"
      );
      expect(MY_STATE.exists).to.eq(true, "MY_STATE exists");
    });

    it("Can change key", () => {
      // Update key
      MY_STATE.key = "myNewKey";

      expect(MY_STATE.key).to.eq("myNewKey", "MY_STATE has correct key");
      expect(MY_STATE._key).to.eq("myNewKey", "My_STATE has correct _key");
    });

    it("Can change value", () => {
      // Update value
      MY_STATE.value = "bye";

      expect(MY_STATE.value).to.eq("bye", "MY_STATE has correct value");
      expect(MY_STATE._value).to.eq("bye", "My_STATE has correct _value");
    });
  });

  describe("State with Key", () => {
    // Create State
    const MY_STATE_WITH_KEY = App.State<boolean>(true, "myKey");

    it("Has correct initial values", () => {
      expect(typeof MY_STATE_WITH_KEY.value === "boolean").to.eq(
        true,
        "MY_STATE_WITH_KEY has correct type"
      );
      expect(MY_STATE_WITH_KEY.key).to.eq(
        "myKey",
        "MY_STATE_WITH_KEY has correct key"
      );
      expect(MY_STATE_WITH_KEY._key).to.eq(
        "myKey",
        "MY_STATE_WITH_KEY has correct _key"
      );
    });

    it("Can change key", () => {
      // Update key
      MY_STATE_WITH_KEY.key = "myNewKey";

      expect(MY_STATE_WITH_KEY.key).to.eq(
        "myNewKey",
        "MY_STATE_WITH_KEY has correct key"
      );
      expect(MY_STATE_WITH_KEY._key).to.eq(
        "myNewKey",
        "MY_STATE_WITH_KEY has correct _key"
      );
    });

    it("Can change value", () => {
      // Update value
      MY_STATE_WITH_KEY.value = false;

      expect(MY_STATE_WITH_KEY.value).to.eq(
        false,
        "MY_STATE_WITH_KEY has correct value"
      );
      expect(MY_STATE_WITH_KEY._value).to.eq(
        false,
        "MY_STATE_WITH_KEY has correct _value"
      );
    });
  });
});
