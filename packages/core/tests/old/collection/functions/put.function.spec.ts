import "mocha";
import { expect } from "chai";
import { Agile } from "../../../../src";

describe("Put Function Tests", () => {
  // Define Agile
  const App = new Agile();

  interface UserInterface {
    id: number;
    name: string;
  }

  const MY_COLLECTION = App.Collection<UserInterface>((collection) => ({
    groups: {
      group1: collection.Group([1]),
      group2: collection.Group([1, 2]),
      group3: collection.Group([]),
    },
  }));
  MY_COLLECTION.collect({ id: 1, name: "Frank" });
  MY_COLLECTION.collect({ id: 2, name: "Günter" });
  MY_COLLECTION.collect({ id: 3, name: "Hans" });
  MY_COLLECTION.collect({ id: 4, name: "Michael" });

  it("Has correct initial Value", () => {
    expect(JSON.stringify(MY_COLLECTION.groups["group1"].value)).to.eq(
      JSON.stringify([1]),
      "group1 has correct initial value"
    );
    expect(JSON.stringify(MY_COLLECTION.groups["group2"].value)).to.eq(
      JSON.stringify([1, 2]),
      "group2 has correct initial value"
    );
    expect(JSON.stringify(MY_COLLECTION.groups["group3"].value)).to.eq(
      JSON.stringify([]),
      "group3 has correct initial value"
    );
    expect(JSON.stringify(MY_COLLECTION.groups["default"].value)).to.eq(
      JSON.stringify([1, 2, 3, 4]),
      "default has correct initial value"
    );
    expect(MY_COLLECTION.size).to.eq(4, "MY_COLLECTION has correct size");
  });

  it("Can put Items into Groups", async () => {
    MY_COLLECTION.put([1, 4, 3], ["group1", "group3"]);

    // Needs some time to call callbackFunction
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(JSON.stringify(MY_COLLECTION.groups["group1"].value)).to.eq(
      JSON.stringify([1, 4, 3]),
      "group1 has correct initial value"
    );
    expect(JSON.stringify(MY_COLLECTION.groups["group2"].value)).to.eq(
      JSON.stringify([1, 2]),
      "group2 has correct initial value"
    );
    expect(JSON.stringify(MY_COLLECTION.groups["group3"].value)).to.eq(
      JSON.stringify([1, 4, 3]),
      "group3 has correct initial value"
    );
    expect(JSON.stringify(MY_COLLECTION.groups["default"].value)).to.eq(
      JSON.stringify([1, 2, 3, 4]),
      "default has correct initial value"
    );
  });
});
