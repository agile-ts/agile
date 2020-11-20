import "mocha";
import { expect } from "chai";
import { Agile, Selector, Item } from "../../../../src";

describe("createSelector Function Tests", () => {
  // Define Agile
  const App = new Agile();

  // Object Interface
  interface userInterface {
    id: number;
    name: string;
  }

  // Create Collection
  const MY_COLLECTION = App.Collection<userInterface>();
  MY_COLLECTION.collect({ id: 1, name: "jeff" });

  it("Has correct initial values", () => {
    expect(JSON.stringify(MY_COLLECTION.data[1].value)).to.eq(
      JSON.stringify({
        id: 1,
        name: "jeff",
      }),
      "MY_COLLECTION has correct data"
    );
    expect(JSON.stringify(MY_COLLECTION.selectors)).to.eq(
      JSON.stringify({}),
      "MY_COLLECTION has no initial selectors"
    );
  });

  it("Can create Selector with not existing id", () => {
    // Create Selector
    MY_COLLECTION.createSelector("selector1", 3);

    expect(MY_COLLECTION.selectors["selector1"] instanceof Selector).to.eq(
      true,
      "MY_COLLECTION selector1 has been created"
    );
    expect(MY_COLLECTION.selectors["selector1"].itemKey).to.eq(
      3,
      "selector1 is watching right id"
    );
    expect(MY_COLLECTION.selectors["selector1"].key).to.eq(
      "selector1",
      "selector1 has correct key"
    );

    expect(MY_COLLECTION.data[3] instanceof Item).to.eq(
      true,
      "MY_COLLECTION data contains dummy Item with id 3 (created by Selector)"
    );
    expect(MY_COLLECTION.data[3].isPlaceholder).to.eq(
      true,
      "Item at id 3 is placeholder"
    );
  });

  it("Can create Selector with existing id", () => {
    // Create Selector
    MY_COLLECTION.createSelector("selector2", 1);

    expect(MY_COLLECTION.selectors["selector2"] instanceof Selector).to.eq(
      true,
      "MY_COLLECTION selector1 has been created"
    );
    expect(MY_COLLECTION.selectors["selector2"].itemKey).to.eq(
      1,
      "selector1 is watching right id"
    );
    expect(MY_COLLECTION.selectors["selector2"].key).to.eq(
      "selector2",
      "selector1 has correct key"
    );
  });

  it("Can't overwrite Selector which already exists", () => {
    // Create Selector
    MY_COLLECTION.createSelector("selector1", 2);

    expect(MY_COLLECTION.selectors["selector1"] instanceof Selector).to.eq(
      true,
      "MY_COLLECTION selector1 is still a selector"
    );
    expect(MY_COLLECTION.selectors["selector1"].itemKey).to.eq(
      3,
      "selector1 id stayed the same (3)"
    );
  });
});
