import "mocha";
import { expect } from "chai";
import { Agile } from "../../../../src";

describe("Reset Function Tests", () => {
  // Define Agile
  const App = new Agile();

  interface UserInterface {
    id: string;
    name: string;
  }

  // Create State
  const MY_COLLECTION = App.Collection<UserInterface>();
  MY_COLLECTION.collect({ id: "1", name: "frank" });
  MY_COLLECTION.collect({ id: "2", name: "Günter" });
  MY_COLLECTION.collect({ id: "3", name: "Hans" });
  MY_COLLECTION.createGroup("friends", ["1"]);
  MY_COLLECTION.createSelector("bestFriend", "1");
  MY_COLLECTION.getGroup("friends").add("3");

  it("Has correct initial values", () => {
    expect(JSON.stringify(MY_COLLECTION.data["1"].value)).to.eq(
      JSON.stringify({ id: "1", name: "frank" }),
      "MY_COLLECTION Item with id 1 exists"
    );
    expect(JSON.stringify(MY_COLLECTION.data["2"].value)).to.eq(
      JSON.stringify({ id: "2", name: "Günter" }),
      "MY_COLLECTION Item with id 2 exists"
    );
    expect(JSON.stringify(MY_COLLECTION.data["3"].value)).to.eq(
      JSON.stringify({ id: "3", name: "Hans" }),
      "MY_COLLECTION Item with id 3 exists"
    );
    expect(MY_COLLECTION.size).to.eq(3, "MY_COLLECTION has correct size");

    expect(JSON.stringify(MY_COLLECTION.groups["default"].value)).to.eq(
      JSON.stringify(["1", "2", "3"]),
      "MY_COLLECTION has friends Group"
    );
    expect(JSON.stringify(MY_COLLECTION.groups["friends"].value)).to.eq(
      JSON.stringify(["1", "3"]),
      "MY_COLLECTION has default Group"
    );

    expect(MY_COLLECTION.selectors["bestFriend"].itemKey).to.eq(
      "1",
      "MY_COLLECTION has best Friend Selector"
    );
  });

  it("Can reset Collection", async () => {
    // Reset Collection
    MY_COLLECTION.reset();

    // Needs some time to call callbackFunction
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(MY_COLLECTION.data["2"]).to.eq(
      undefined,
      "MY_COLLECTION Item with id 2 doesn't exists"
    );
    expect(MY_COLLECTION.data["3"]).to.eq(
      undefined,
      "MY_COLLECTION Item with id 3 doesn't exists"
    );
    expect(JSON.stringify(MY_COLLECTION.data["1"].value)).to.eq(
      JSON.stringify({ id: "1", dummy: true }),
      "MY_COLLECTION Item with id 1 exists as Placeholder because of Selector"
    );
    expect(MY_COLLECTION.data["1"].isPlaceholder).to.eq(
      true,
      "MY_COLLECTION Item with id 1 is Placeholder"
    );
    expect(MY_COLLECTION.size).to.eq(0, "MY_COLLECTION size got reset");

    expect(JSON.stringify(MY_COLLECTION.groups["default"].value)).to.eq(
      JSON.stringify([]),
      "MY_COLLECTION default Group got reset"
    );
    expect(JSON.stringify(MY_COLLECTION.groups["friends"].value)).to.eq(
      JSON.stringify(["1"]),
      "MY_COLLECTION friends Group got reset"
    );

    expect(MY_COLLECTION.selectors["bestFriend"].itemKey).to.eq(
      "1",
      "MY_COLLECTION Selector got reset"
    );
  });
});
