import "mocha";
import { expect } from "chai";
import { Agile } from "../../../src";

describe("GetValueById Function Tests", () => {
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

  it("Can getValueById", () => {
    const item = MY_COLLECTION.getValueById(1);

    expect(JSON.stringify(item)).to.eq(
      JSON.stringify({ id: 1, name: "jeff" }),
      "item has correct value"
    );
  });

  it("Can't getValueById with not existing item id", () => {
    const item = MY_COLLECTION.findById(5);

    expect(item).to.eq(undefined, "item is undefined");
  });
});
