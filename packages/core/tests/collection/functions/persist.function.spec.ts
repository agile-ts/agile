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
          console.log(`SET '${key}'`, value);
          myStorage[key] = value;
        },
        remove: (key) => {
          console.log(`DELETE '${key}'`);
          delete myStorage[key];
        },
      },
    },
  });

  interface User {
    id: number;
    name: string;
  }

  describe("Collection", () => {
    it("Can persist Collection", async () => {
      // Create Collection
      const MY_COLLECTION = App.Collection<User>();
      MY_COLLECTION.persist("myCollection");
      MY_COLLECTION.collect({ id: 2, name: "hans" });
      MY_COLLECTION.collect({ id: 1, name: "frank" });
      MY_COLLECTION.createGroup("stuipidPeople", [1, 2]).persist({
        followCollectionPattern: true,
      });

      // Needs some time to persist value
      await new Promise((resolve) => setTimeout(resolve, 100));

      console.log("MyStorage ", myStorage);
      MY_COLLECTION.collect({ id: 3, name: "günter" });

      // Needs some time to collect value
      await new Promise((resolve) => setTimeout(resolve, 100));

      console.log("MyStorage ", myStorage);

      MY_COLLECTION.update(3, { name: "Benno" });

      // Needs some time to update value
      await new Promise((resolve) => setTimeout(resolve, 100));

      console.log("MyStorage ", myStorage);

      MY_COLLECTION.update(1, { id: 37, name: "Arne" });

      // Needs some time to update value
      await new Promise((resolve) => setTimeout(resolve, 100));

      console.log("MyStorage ", myStorage);
      expect(myStorage !== undefined).to.eq(true);
    });

    it("Can load persisted Collection", async () => {
      // Create Collection
      const MY_COLLECTION = App.Collection<User>();
      MY_COLLECTION.persist("myCollection");

      // Needs some time to persist value
      await new Promise((resolve) => setTimeout(resolve, 100));

      console.log("MyStorage ", myStorage);
      console.log(MY_COLLECTION);

      MY_COLLECTION.update(3, { name: "Angela" });
      MY_COLLECTION.collect({ id: 4, name: "Paul" });
      MY_COLLECTION.collect({ id: 99, name: "Jeff" });

      // Needs some time to collect/update value
      await new Promise((resolve) => setTimeout(resolve, 100));

      console.log("MyStorage ", myStorage);

      expect(myStorage !== undefined).to.eq(true);
    });

    it("Can remove persisted Collection", async () => {
      // Create Collection
      const MY_COLLECTION = App.Collection<User>();
      MY_COLLECTION.persist("myCollection");

      // Needs some time to persist value
      await new Promise((resolve) => setTimeout(resolve, 100));

      console.log("MyStorage ", myStorage);
      console.log(MY_COLLECTION);

      MY_COLLECTION.persistent?.removeValue();

      // Needs some time to remove value
      await new Promise((resolve) => setTimeout(resolve, 100));

      console.log("MyStorage ", myStorage);
      console.log(MY_COLLECTION);
    });
  });
});
