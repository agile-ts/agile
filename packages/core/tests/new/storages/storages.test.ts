import { Storages, Agile, Storage, Persistent } from "../../../src";

describe("Storages Tests", () => {
  const dummyAgile = new Agile({ localStorage: false });

  it("should create Storages with default Settings", () => {
    const storages = new Storages(dummyAgile);

    expect(storages.defaultStorage).toBeUndefined();
    expect(storages.storages).toStrictEqual({});
    expect(storages.persistentInstances.size).toBe(0);
  });

  it("should create Storages with config.localStorage = true and get a warning", () => {
    console.warn = jest.fn();
    const storages = new Storages(dummyAgile, { localStorage: true });

    expect(console.warn).toHaveBeenCalledWith(
      "Agile Warn: Local Storage is here not available, to use Storage functionalities like persist please provide a custom Storage!"
    );
    expect(storages.defaultStorage).toBeUndefined();
    expect(storages.storages).toStrictEqual({});
    expect(storages.persistentInstances.size).toBe(0);
  });

  describe("Storages Function Tests", () => {
    let storages: Storages;
    let myStorage1 = {};
    let myStorage2 = {};
    let myStorage3 = {};
    let dummyStorage1: Storage;
    let dummyStorage2: Storage;
    let dummyStorage3: Storage;

    beforeEach(() => {
      storages = new Storages(dummyAgile);
      dummyAgile.storages = storages;

      myStorage1 = {};
      dummyStorage1 = new Storage({
        key: "storage1",
        methods: {
          get: (key) => myStorage1[key],
          set: (key, value) => {
            myStorage1[key] = value;
          },
          remove: (key) => {
            delete myStorage1[key];
          },
        },
      });

      myStorage2 = {};
      dummyStorage2 = new Storage({
        key: "storage2",
        methods: {
          get: (key) => myStorage2[key],
          set: (key, value) => {
            myStorage2[key] = value;
          },
          remove: (key) => {
            delete myStorage2[key];
          },
        },
      });

      myStorage3 = {};
      dummyStorage3 = new Storage({
        key: "storage3",
        methods: {
          get: (key) => myStorage3[key],
          set: (key, value) => {
            myStorage3[key] = value;
          },
          remove: (key) => {
            delete myStorage3[key];
          },
        },
      });
    });

    describe("register function tests", () => {
      it("should register Storage with default config and should assign it as default Storage", () => {
        const success = storages.register(dummyStorage1);

        expect(storages.storages).toHaveProperty("storage1");
        expect(storages.storages["storage1"]).toBeInstanceOf(Storage);
        expect(storages.storages["storage1"].key).toBe("storage1");

        expect(storages.defaultStorage).toBeInstanceOf(Storage);
        expect(storages.defaultStorage.key).toBe("storage1");

        expect(success).toBeTruthy();
      });

      it("should register Storage with config.default = false and should assign it as default Storage with a warning", () => {
        console.warn = jest.fn();

        const success = storages.register(dummyStorage1, { default: false });

        expect(console.warn).toHaveBeenCalledWith(
          "Agile Warn: Be aware that Agile has to assign the first added Storage as default Storage!"
        );

        expect(storages.storages).toHaveProperty("storage1");
        expect(storages.storages["storage1"]).toBeInstanceOf(Storage);
        expect(storages.storages["storage1"].key).toBe("storage1");

        expect(storages.defaultStorage).toBeInstanceOf(Storage);
        expect(storages.defaultStorage.key).toBe("storage1");

        expect(success).toBeTruthy();
      });

      it("should register second Storage with default config and shouldn't assign it as default Storage", () => {
        const success1 = storages.register(dummyStorage1);
        const success2 = storages.register(dummyStorage2);

        expect(storages.storages).toHaveProperty("storage1");
        expect(storages.storages["storage1"]).toBeInstanceOf(Storage);
        expect(storages.storages["storage1"].key).toBe("storage1");
        expect(storages.storages).toHaveProperty("storage2");
        expect(storages.storages["storage2"]).toBeInstanceOf(Storage);
        expect(storages.storages["storage2"].key).toBe("storage2");

        expect(storages.defaultStorage).toBeInstanceOf(Storage);
        expect(storages.defaultStorage.key).toBe("storage1");

        expect(success1).toBeTruthy();
        expect(success2).toBeTruthy();
      });

      it("should register second Storage with config.default = true and should assign it as default Storage", () => {
        const success1 = storages.register(dummyStorage1);
        const success2 = storages.register(dummyStorage2, { default: true });

        expect(storages.storages).toHaveProperty("storage1");
        expect(storages.storages["storage1"]).toBeInstanceOf(Storage);
        expect(storages.storages["storage1"].key).toBe("storage1");
        expect(storages.storages).toHaveProperty("storage2");
        expect(storages.storages["storage2"]).toBeInstanceOf(Storage);
        expect(storages.storages["storage2"].key).toBe("storage2");

        expect(storages.defaultStorage).toBeInstanceOf(Storage);
        expect(storages.defaultStorage.key).toBe("storage2");

        expect(success1).toBeTruthy();
        expect(success2).toBeTruthy();
      });

      it("shouldn't register Storage with the same key twice", () => {
        console.error = jest.fn();

        const success1 = storages.register(dummyStorage1);
        const success2 = storages.register(dummyStorage1);

        expect(console.error).toHaveBeenCalledWith(
          "Agile Error: Storage with the key/name 'storage1' already exists"
        );

        expect(success1).toBeTruthy();
        expect(success2).toBeFalsy();
      });

      it("should call updateValue method on all persistent Instances that have the new registered StorageKey", () => {
        const persistent = new Persistent(dummyAgile, {
          key: "persistent1",
          storageKeys: ["storage1"],
        });
        persistent.updateValue = jest.fn();

        expect(persistent.ready).toBeTruthy();
        expect(persistent.defaultStorageKey).toBe("storage1");

        const success = storages.register(dummyStorage1);

        expect(persistent.ready).toBeTruthy();
        expect(persistent.defaultStorageKey).toBe("storage1");

        expect(persistent.updateValue).toHaveBeenCalled();

        expect(success).toBeTruthy();
      });

      it("should reassignStorageKeys, revalidate and initialLoad Persistents that have no defined defaultStorage", () => {
        const persistent = new Persistent(dummyAgile, {
          key: "persistent1",
        });
        const assignStorageKeysSpy = jest.spyOn(
          persistent,
          "assignStorageKeys"
        );
        const validatePersistentSpy = jest.spyOn(
          persistent,
          "validatePersistent"
        );
        const initialLoadingSpy = jest.spyOn(persistent, "initialLoading");

        expect(persistent.ready).toBeFalsy();
        expect(persistent.defaultStorageKey).toBeUndefined();

        const success = storages.register(dummyStorage1);

        expect(persistent.ready).toBeTruthy();
        expect(persistent.defaultStorageKey).toBe("storage1");

        expect(assignStorageKeysSpy).toHaveBeenCalled();
        expect(validatePersistentSpy).toHaveBeenCalled();
        expect(initialLoadingSpy).toHaveBeenCalled();

        expect(success).toBeTruthy();
      });
    });

    describe("getStorage function tests", () => {
      beforeEach(() => {
        storages.register(dummyStorage1);
        storages.register(dummyStorage2);
      });

      it("should get existing Storage", () => {
        const s1 = storages.getStorage("storage1");
        const s2 = storages.getStorage("storage2");

        expect(s1).toBeInstanceOf(Storage);
        expect(s1.key).toBe("storage1");
        expect(s2).toBeInstanceOf(Storage);
        expect(s2.key).toBe("storage2");
      });

      it("shouldn't get not existing Storage", () => {
        console.error = jest.fn();
        const storage = storages.getStorage("notExistingStorage");

        expect(storage).toBeUndefined();
        expect(console.error).toHaveBeenCalledWith(
          "Agile Error: Storage with the key/name 'notExistingStorage' doesn't exist"
        );
      });

      it("shouldn't get existing and not ready Storage", () => {
        console.error = jest.fn();
        dummyStorage1.ready = false;
        const storage = storages.getStorage("storage1");

        expect(storage).toBeUndefined();
        expect(console.error).toHaveBeenCalledWith(
          "Agile Error: Storage with the key/name 'storage1' isn't ready"
        );
      });
    });

    describe("get function tests", () => {
      let storage1GetSpy;
      let storage2GetSpy;

      beforeEach(() => {
        storage1GetSpy = jest.spyOn(dummyStorage1, "get");
        storage2GetSpy = jest.spyOn(dummyStorage2, "get");

        storages.register(dummyStorage1);
        storages.register(dummyStorage2);

        dummyStorage1.set("value1", "storage1Value1");
        dummyStorage1.set("value2", "storage1Value2");
        dummyStorage2.set("value1", "storage2Value1");
        dummyStorage2.set("value2", "storage2Value2");
      });

      it("should get existing Value from default Storage", () => {
        return storages.get("value1").then((value) => {
          expect(value).toBe("storage1Value1");
          expect(storage1GetSpy).toHaveBeenCalledWith("value1");
        });
      });

      it("should get existing Value from existing Storage at specific Key", () => {
        return storages.get("value1", "storage2").then((value) => {
          expect(value).toBe("storage2Value1");
          expect(storage2GetSpy).toHaveBeenCalledWith("value1");
        });
      });

      it("should get Value from default Storage if trying to get it from a not existing Storage at specific Key", () => {
        console.error = jest.fn();

        return storages.get("value2", "notExistingStorage").then((value) => {
          expect(value).toBe("storage1Value2");
          expect(console.error).toHaveBeenCalledWith(
            "Agile Error: Storage with the key/name 'notExistingStorage' doesn't exist"
          );
        });
      });

      it("shouldn't get not existing Value from default Storage", () => {
        return storages.get("unknownValue").then((value) => {
          expect(value).toBeUndefined();
          expect(storage1GetSpy).toHaveBeenCalledWith("unknownValue");
        });
      });

      it("shouldn't get any Value from Storages with no registered Storage", () => {
        console.error = jest.fn();
        const storages2 = new Storages(dummyAgile);

        return storages2.get("value1").then((value) => {
          expect(value).toBe(undefined);
          expect(console.error).toHaveBeenCalledWith(
            "Agile Error: No Storage found!"
          );
        });
      });
    });

    describe("set function tests", () => {
      let storage1SetSpy;
      let storage2SetSpy;
      let storage3SetSpy;

      beforeEach(() => {
        storage1SetSpy = jest.spyOn(dummyStorage1, "set");
        storage2SetSpy = jest.spyOn(dummyStorage2, "set");
        storage3SetSpy = jest.spyOn(dummyStorage2, "set");

        storages.register(dummyStorage1);
        storages.register(dummyStorage2);
        storages.register(dummyStorage3);
      });

      it("should set Value in default Storage", () => {
        storages.set("value1", "testValue");

        expect(storage1SetSpy).toHaveBeenCalledWith("value1", "testValue");
        expect(storage2SetSpy).not.toHaveBeenCalled();
        expect(storage3SetSpy).not.toHaveBeenCalled();
      });

      it("should set Value in Storages at specific Keys", () => {
        storages.set("value1", "testValue", ["storage2", "storage3"]);

        expect(storage1SetSpy).not.toHaveBeenCalled();
        expect(storage2SetSpy).toHaveBeenCalledWith("value1", "testValue");
        expect(storage3SetSpy).toHaveBeenCalledWith("value1", "testValue");
      });

      it("shouldn't set Value in Storages with no registered Storage", () => {
        console.error = jest.fn();
        const storages2 = new Storages(dummyAgile);

        storages2.set("value1", "testValue");

        expect(console.error).toHaveBeenCalledWith(
          "Agile Error: No Storage found!"
        );
      });
    });

    describe("remove function tests", () => {
      let storage1RemoveSpy;
      let storage2RemoveSpy;
      let storage3RemoveSpy;

      beforeEach(() => {
        storage1RemoveSpy = jest.spyOn(dummyStorage1, "remove");
        storage2RemoveSpy = jest.spyOn(dummyStorage2, "remove");
        storage3RemoveSpy = jest.spyOn(dummyStorage2, "remove");

        storages.register(dummyStorage1);
        storages.register(dummyStorage2);
        storages.register(dummyStorage3);
      });

      it("should remove Value in default Storage", () => {
        storages.remove("value1");

        expect(storage1RemoveSpy).toHaveBeenCalledWith("value1");
        expect(storage2RemoveSpy).not.toHaveBeenCalled();
        expect(storage3RemoveSpy).not.toHaveBeenCalled();
      });

      it("should remove Value in Storages at specific Keys", () => {
        storages.remove("value1", ["storage2", "storage3"]);

        expect(storage1RemoveSpy).not.toHaveBeenCalled();
        expect(storage2RemoveSpy).toHaveBeenCalledWith("value1");
        expect(storage3RemoveSpy).toHaveBeenCalledWith("value1");
      });

      it("shouldn't remove Value in Storages with no registered Storage", () => {
        console.error = jest.fn();
        const storages2 = new Storages(dummyAgile);

        storages2.remove("value1");

        expect(console.error).toHaveBeenCalledWith(
          "Agile Error: No Storage found!"
        );
      });
    });

    describe("hasStorage function tests", () => {
      it("should return true if Storages has registered Storages", () => {
        storages.register(dummyStorage1);

        expect(storages.hasStorage()).toBeTruthy();
      });

      it("should return false if Storages has no registered Storage", () => {
        expect(storages.hasStorage()).toBeFalsy();
      });
    });
  });
});
