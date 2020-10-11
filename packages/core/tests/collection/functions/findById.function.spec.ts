import "mocha";
import { expect } from "chai";
import { State, Agile } from "../../../src";

describe("FindById Function Tests", () => {
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
  MY_COLLECTION.collect({ id: 2, name: "hans" });

  it("Has correct initial values", () => {
    expect(JSON.stringify(MY_COLLECTION.data[1].value)).to.eq(
      JSON.stringify({
        id: 1,
        name: "jeff",
      }),
      "MY_COLLECTION has correct data"
    );
    expect(JSON.stringify(MY_COLLECTION.data[2].value)).to.eq(
      JSON.stringify({
        id: 2,
        name: "hans",
      }),
      "MY_COLLECTION has correct data"
    );
    expect(MY_COLLECTION.size).to.eq(2, "MY_COLLECTION has correct size");
  });

  it("Can findById", () => {
    const item = MY_COLLECTION.findById(1);

    expect(item instanceof State).to.eq(true, "item is instanceof State");
    expect(JSON.stringify(item?.value)).to.eq(
      JSON.stringify({ id: 1, name: "jeff" }),
      "item has correct value"
    );
  });

  it("Can't findById not existing item", () => {
    const item = MY_COLLECTION.findById(5);

    expect(item).to.eq(undefined, "item is undefined");
  });
});
