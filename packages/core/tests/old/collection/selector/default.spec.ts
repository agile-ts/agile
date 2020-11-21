import "mocha";
import { expect } from "chai";
import { Agile, Selector, Item } from "../../../../src";
import testIntegration from "../../../helper/test.integration";

describe("Default Selector Tests", () => {
  // Define Agile
  const App = new Agile().use(testIntegration);

  describe("Selector", () => {
    let rerenderCount = 0;

    // Object Interface
    interface userInterface {
      id: number;
      name: string;
    }

    // Create Collection
    const MY_COLLECTION = App.Collection<userInterface>((collection) => ({
      selectors: {
        selector1: collection.Selector(1),
      },
    }));

    // Subscribe Instance for testing callback call functionality
    App.subController.subscribeWithSubsArray(() => {
      rerenderCount++;
    }, [MY_COLLECTION.getSelectorWithReference("selector1").observer]);

    it("Has correct initial values", () => {
      expect(MY_COLLECTION.selectors["selector1"] instanceof Selector).to.eq(
        true,
        "MY_COLLECTION selector1 Selector has been created"
      );
      expect(
        MY_COLLECTION.selectors["selector1"]?.observer.subs.size === 1
      ).to.eq(true, "MY_COLLECTION selector1 Selector has correct subs size");
      expect(MY_COLLECTION.selectors["selector1"].key).to.eq(
        "selector1",
        "selector1 Selector has correct initial key"
      );
      expect(MY_COLLECTION.selectors["selector1"].itemKey).to.eq(
        1,
        "selector1 Selector has correct initial id"
      );
      expect(MY_COLLECTION.selectors["selector1"].exists).to.eq(
        false,
        "selector1 Selector does exist"
      );
      expect(JSON.stringify(MY_COLLECTION.selectors["selector1"].value)).to.eq(
        JSON.stringify(undefined),
        "selector1 Selector has correct initial value"
      );

      expect(MY_COLLECTION.data[1] instanceof Item).to.eq(
        true,
        "MY_COLLECTION data at id 1 has been created"
      );
      expect(MY_COLLECTION.data[1].exists).to.eq(
        false,
        "MY_COLLECTION data at id 1 doesn't exist"
      );
      expect(MY_COLLECTION.data[1].key).to.eq(
        1,
        "MY_COLLECTION data at id 1 has correct initial key"
      );
      expect(JSON.stringify(MY_COLLECTION.data[1].value)).to.eq(
        JSON.stringify({
          id: 1,
          dummy: true,
        }),
        "MY_COLLECTION data at id 1 has correct initial value"
      );
      expect(JSON.stringify(MY_COLLECTION.data[1].previousStateValue)).to.eq(
        JSON.stringify({
          id: 1,
          dummy: true,
        }),
        "MY_COLLECTION data at id 1 has correct previousStateValue"
      );
      expect(JSON.stringify(MY_COLLECTION.data[1].initialStateValue)).to.eq(
        JSON.stringify({
          id: 1,
          dummy: true,
        }),
        "MY_COLLECTION data at id 1 has correct initialStateValue"
      );

      expect(rerenderCount).to.eq(0, "rerenderCount has correct value");
    });

    it("Has correct values after collecting items", async () => {
      // Collect Data
      MY_COLLECTION.collect([
        { id: 1, name: "jeff" },
        { id: 2, name: "hans" },
      ]);

      // Needs some time to call callbackFunction
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(MY_COLLECTION.selectors["selector1"].exists).to.eq(
        true,
        "selector1 Selector exists"
      );
      expect(JSON.stringify(MY_COLLECTION.selectors["selector1"].value)).to.eq(
        JSON.stringify({
          id: 1,
          name: "jeff",
        }),
        "selector1 Selector has correct initial value"
      );

      expect(MY_COLLECTION.data[1].exists).to.eq(
        true,
        "MY_COLLECTION data at id 1 exists"
      );
      expect(JSON.stringify(MY_COLLECTION.data[1].value)).to.eq(
        JSON.stringify({
          id: 1,
          name: "jeff",
        }),
        "MY_COLLECTION data at id 1 has correct initial value"
      );
      expect(JSON.stringify(MY_COLLECTION.data[1].previousStateValue)).to.eq(
        JSON.stringify({
          id: 1,
          name: "jeff",
        }),
        "MY_COLLECTION data at id 1 has correct previousStateValue"
      );
      expect(JSON.stringify(MY_COLLECTION.data[1].initialStateValue)).to.eq(
        JSON.stringify({
          id: 1,
          name: "jeff",
        }),
        "MY_COLLECTION data at id 1 has correct initialStateVaoue"
      );

      expect(rerenderCount).to.eq(1, "rerenderCount has been increased by 1");
    });
  });

  describe("Selector with key", () => {
    // Object Interface
    interface userInterface {
      id: number;
      name: string;
    }

    // Create Collection
    const MY_COLLECTION = App.Collection<userInterface>((collection) => ({
      selectors: {
        selector1: collection.Selector(1, { key: "mywierdselector" }),
      },
    }));

    it("Has correct initial values", () => {
      expect(MY_COLLECTION.selectors["selector1"] instanceof Selector).to.eq(
        true,
        "MY_COLLECTION selector1 Selector has been created"
      );
      expect(MY_COLLECTION.selectors["selector1"].key).to.eq(
        "mywierdselector",
        "selector1 has correct key"
      );
    });
  });
});