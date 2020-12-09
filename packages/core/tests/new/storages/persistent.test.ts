import { Agile, Persistent, Storage } from "../../../src";
// jest.mock("../../../src/storages/persistent"); // // Can't mock Persistent because mocks get instantiated before everything else -> I got the good old not loaded Object error https://github.com/kentcdodds/how-jest-mocking-works

describe("Persistent Tests", () => {
  let dummyAgile: Agile;

  beforeEach(() => {
    console.error = jest.fn();
    dummyAgile = new Agile({ localStorage: false });
  });

  it("should create Persistent (default config)", () => {
    const persistent = new Persistent(dummyAgile);

    expect(persistent).toBeInstanceOf(Persistent);
    /* Couldn't figure out how to mock anything in the Constructor
    expect(persistent.instantiatePersistent).toHaveBeenCalledWith({
      storageKeys: [],
      key: undefined,
    });
     */
    expect(
      dummyAgile.storages.persistentInstances.has(persistent)
    ).toBeTruthy();

    expect(persistent.key).toBe(Persistent.placeHolderKey);
    expect(persistent.ready).toBeFalsy();
    expect(persistent.isPersisted).toBeFalsy();
    expect(persistent.onLoad).toBeUndefined();
    expect(persistent.storageKeys).toStrictEqual([]);
    expect(persistent.defaultStorageKey).toBe(undefined);

    expect(console.error).toHaveBeenCalledWith(
      "Agile Error: No valid persist Key found! Please provide a Key or assign one to the parent instance."
    );
  });

  it("should create Persistent (config.instantiate = false)", () => {
    const persistent = new Persistent(dummyAgile, { instantiate: false });

    expect(persistent).toBeInstanceOf(Persistent);
    /* Couldn't figure out how to mock anything in the Constructor
    expect(persistent.instantiatePersistent).not.toHaveBeenCalled();
     */
    expect(
      dummyAgile.storages.persistentInstances.has(persistent)
    ).toBeTruthy();

    expect(persistent.key).toBe(Persistent.placeHolderKey);
    expect(persistent.ready).toBeFalsy();
    expect(persistent.isPersisted).toBeFalsy();
    expect(persistent.onLoad).toBeUndefined();
    expect(persistent.storageKeys).toStrictEqual([]);
    expect(persistent.defaultStorageKey).toBe(undefined);

    expect(console.error).not.toHaveBeenCalled();
  });

  it("should create Persistent (config.key)", () => {
    const persistent = new Persistent(dummyAgile, { key: "coolKey" });

    expect(persistent).toBeInstanceOf(Persistent);
    /* Couldn't figure out how to mock anything in the Constructor
    expect(persistent.instantiatePersistent).toHaveBeenCalledWith({
      storageKeys: [],
      key: "coolKey",
    });
     */
    expect(
      dummyAgile.storages.persistentInstances.has(persistent)
    ).toBeTruthy();

    expect(persistent.key).toBe("coolKey"); // x
    expect(persistent.ready).toBeFalsy();
    expect(persistent.isPersisted).toBeFalsy();
    expect(persistent.onLoad).toBeUndefined();
    expect(persistent.storageKeys).toStrictEqual([]);
    expect(persistent.defaultStorageKey).toBe(undefined);

    expect(console.error).toHaveBeenCalledWith(
      "Agile Error: No persist Storage Key found! Please provide at least one Storage Key."
    );
  });

  it("should create Persistent (config.storageKeys)", () => {
    const persistent = new Persistent(dummyAgile, {
      storageKeys: ["test1", "test2"],
    });

    expect(persistent).toBeInstanceOf(Persistent);
    /* Couldn't figure out how to mock anything in the Constructor
    expect(persistent.instantiatePersistent).toHaveBeenCalledWith({
      storageKeys: ["test1", "test2"],
      key: undefined,
    });
     */
    expect(
      dummyAgile.storages.persistentInstances.has(persistent)
    ).toBeTruthy();

    expect(persistent.key).toBe(Persistent.placeHolderKey);
    expect(persistent.ready).toBeFalsy();
    expect(persistent.isPersisted).toBeFalsy();
    expect(persistent.onLoad).toBeUndefined();
    expect(persistent.storageKeys).toStrictEqual(["test1", "test2"]); // x
    expect(persistent.defaultStorageKey).toBe("test1"); // x

    expect(console.error).toHaveBeenCalledWith(
      "Agile Error: No valid persist Key found! Please provide a Key or assign one to the parent instance."
    );
  });

  it("should create Persistent (config.key, config.storageKeys)", () => {
    const persistent = new Persistent(dummyAgile, {
      key: "coolKey",
      storageKeys: ["test1", "test2"],
    });

    expect(persistent).toBeInstanceOf(Persistent);
    /* Couldn't figure out how to mock anything in the Constructor
    expect(persistent.instantiatePersistent).toHaveBeenCalledWith({
      storageKeys: ["test1", "test2"],
      key: "coolKey",
    });
     */
    expect(
      dummyAgile.storages.persistentInstances.has(persistent)
    ).toBeTruthy();

    expect(persistent.key).toBe("coolKey"); // x
    expect(persistent.ready).toBeTruthy(); // x
    expect(persistent.isPersisted).toBeFalsy();
    expect(persistent.onLoad).toBeUndefined();
    expect(persistent.storageKeys).toStrictEqual(["test1", "test2"]); // x
    expect(persistent.defaultStorageKey).toBe("test1"); // x

    expect(console.error).not.toHaveBeenCalled();
  });

  it("should create Persistent (config.key, config.storageKeys, config.instantiate = false)", () => {
    const persistent = new Persistent(dummyAgile, {
      instantiate: false,
      storageKeys: ["hello", "there"],
      key: "coolKey",
    });

    expect(persistent).toBeInstanceOf(Persistent);
    /* Couldn't figure out how to mock anything in the Constructor
    expect(persistent.instantiatePersistent).not.toHaveBeenCalled();
     */
    expect(
      dummyAgile.storages.persistentInstances.has(persistent)
    ).toBeTruthy();

    // Might be weired outputs.. BUT the persistent hasn't got instantiated yet
    expect(persistent.key).toBe(Persistent.placeHolderKey);
    expect(persistent.ready).toBeFalsy();
    expect(persistent.isPersisted).toBeFalsy();
    expect(persistent.onLoad).toBeUndefined();
    expect(persistent.storageKeys).toStrictEqual([]);
    expect(persistent.defaultStorageKey).toBeUndefined();

    expect(
      dummyAgile.storages.persistentInstances.has(persistent)
    ).toBeTruthy();

    expect(console.error).not.toHaveBeenCalled();
  });

  describe("Persistent Function Tests", () => {
    // Note: InstantiatePersistent function got more or less tested in constructor
    describe("instantiatePersistent function tests", () => {
      let persistent: Persistent;

      beforeEach(() => {
        persistent = new Persistent(dummyAgile, { instantiate: false });
      });

      it("should be possible to instantiate Persistent after the 'real' instantiation", () => {
        const persistent = new Persistent(dummyAgile, {
          instantiate: false,
        });

        persistent.instantiatePersistent({
          key: "myCoolPersistent",
          storageKeys: ["myName", "is", "jeff"],
        });

        expect(persistent).toBeInstanceOf(Persistent);
        expect(persistent.key).toBe("myCoolPersistent");
        expect(persistent.ready).toBeTruthy();
        expect(persistent.isPersisted).toBeFalsy();
        expect(persistent.onLoad).toBeUndefined();
        expect(persistent.storageKeys).toStrictEqual(["myName", "is", "jeff"]);
        expect(persistent.defaultStorageKey).toBe("myName");

        expect(
          dummyAgile.storages.persistentInstances.has(persistent)
        ).toBeTruthy();
      });
    });

    describe("validatePersistent function tests", () => {
      let persistent: Persistent;

      beforeEach(() => {
        persistent = new Persistent(dummyAgile);
        persistent.key = Persistent.placeHolderKey;
        persistent.defaultStorageKey = undefined;
        persistent.storageKeys = [];
      });

      it("should return false if no set key and no set StorageKeys", () => {
        const isValid = persistent.validatePersistent();

        expect(isValid).toBeFalsy();
        expect(persistent.ready).toBeFalsy();

        expect(console.error).toHaveBeenCalledWith(
          "Agile Error: No valid persist Key found! Please provide a Key or assign one to the parent instance."
        );
      });

      it("should return false if set key and no set StorageKeys", () => {
        persistent.key = "test";

        const isValid = persistent.validatePersistent();

        expect(isValid).toBeFalsy();
        expect(persistent.ready).toBeFalsy();

        expect(console.error).toHaveBeenCalledWith(
          "Agile Error: No persist Storage Key found! Please provide at least one Storage Key."
        );
      });

      it("should return false if no set key and set StorageKeys", () => {
        persistent.defaultStorageKey = "test";
        persistent.storageKeys = ["test"];

        const isValid = persistent.validatePersistent();

        expect(isValid).toBeFalsy();
        expect(persistent.ready).toBeFalsy();

        expect(console.error).toHaveBeenCalledWith(
          "Agile Error: No valid persist Key found! Please provide a Key or assign one to the parent instance."
        );
      });

      it("should return true if set key and set StorageKeys", () => {
        persistent.key = "test";
        persistent.defaultStorageKey = "test";
        persistent.storageKeys = ["test"];

        const isValid = persistent.validatePersistent();

        expect(isValid).toBeTruthy();
        expect(persistent.ready).toBeTruthy();
      });
    });

    describe("assignStorageKeys function tests", () => {
      let persistent: Persistent;

      beforeEach(() => {
        persistent = new Persistent(dummyAgile);
      });

      it("should assign StorageKeys and make first one as default StorageKey", () => {
        persistent.assignStorageKeys(["test1", "test2", "test3"]);

        expect(persistent.storageKeys).toStrictEqual([
          "test1",
          "test2",
          "test3",
        ]);
        expect(persistent.defaultStorageKey).toBe("test1");
      });

      it("should try to get default StorageKey if no StorageKeys passed", () => {
        dummyAgile.storages.register(
          new Storage({
            key: "storage1",
            methods: {
              get: (key) => {},
              set: (key, value) => {},
              remove: (key) => {},
            },
          }),
          { default: true }
        );

        persistent.assignStorageKeys([]);

        expect(persistent.storageKeys).toStrictEqual(["storage1"]);
        expect(persistent.defaultStorageKey).toBe("storage1");
      });
    });

    describe("initialLoading function tests", () => {
      let persistent: Persistent;
      let onLoadSuccess = undefined;

      beforeEach(() => {
        persistent = new Persistent(dummyAgile);
        persistent.onLoad = (success) => {
          onLoadSuccess = success;
        };
        jest.spyOn(persistent, "updateValue");
      });

      it("shouldn't call updateValue if value got loaded", () => {
        persistent.loadValue = jest.fn(() => Promise.resolve(true));

        persistent.initialLoading().then(() => {
          expect(persistent.loadValue).toHaveBeenCalled();
          expect(persistent.updateValue).not.toHaveBeenCalled();
          expect(onLoadSuccess).toBeTruthy();
        });
      });

      it("should call updateValue if value doesn't got loaded", () => {
        persistent.loadValue = jest.fn(() => Promise.resolve(false));

        persistent.initialLoading().then(() => {
          expect(persistent.loadValue).toHaveBeenCalled();
          expect(persistent.updateValue).toHaveBeenCalled();
          expect(onLoadSuccess).toBeFalsy();
        });
      });
    });

    describe("functions that get overwritten tests | because Persistent is no stand alone class", () => {
      let persistent: Persistent;

      beforeEach(() => {
        persistent = new Persistent(dummyAgile);
      });

      describe("onLoad function tests", () => {
        it("should print error", () => {
          persistent.loadValue();

          expect(console.error).toHaveBeenCalledWith(
            "Agile Error: Load Value function isn't Set in Persistent! Be aware that Persistent is no stand alone class!"
          );
        });
      });

      describe("updateValue function tests", () => {
        it("should print error", () => {
          persistent.updateValue();

          expect(console.error).toHaveBeenCalledWith(
            "Agile Error: Update Value function isn't Set in Persistent! Be aware that Persistent is no stand alone class!"
          );
        });
      });

      describe("removeValue function tests", () => {
        it("should print error", () => {
          persistent.removeValue();

          expect(console.error).toHaveBeenCalledWith(
            "Agile Error: Remove Value function isn't Set in Persistent! Be aware that Persistent is no stand alone class!"
          );
        });
      });

      describe("formatKey function tests", () => {
        it("shouldn't formatKey", () => {
          expect(persistent.formatKey("test")).toBe("test");
        });
      });
    });
  });
});
