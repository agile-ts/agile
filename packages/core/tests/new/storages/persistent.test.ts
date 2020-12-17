import { Agile, Persistent, Storage } from "../../../src";

describe("Persistent Tests", () => {
  let dummyAgile: Agile;

  beforeEach(() => {
    jest.clearAllMocks();
    console.error = jest.fn();
    dummyAgile = new Agile({ localStorage: false });
    jest.spyOn(Persistent.prototype, "instantiatePersistent");
  });

  it("should create Persistent (default config)", () => {
    // Overwrite persistent once to not call it
    jest
      .spyOn(Persistent.prototype, "instantiatePersistent")
      .mockReturnValueOnce(undefined);

    const persistent = new Persistent(dummyAgile);

    expect(persistent).toBeInstanceOf(Persistent);
    expect(persistent.instantiatePersistent).toHaveBeenCalledWith({
      storageKeys: [],
      key: undefined,
    });
    expect(
      dummyAgile.storages.persistentInstances.has(persistent)
    ).toBeTruthy();

    expect(persistent._key).toBe(Persistent.placeHolderKey);
    expect(persistent.ready).toBeFalsy();
    expect(persistent.isPersisted).toBeFalsy();
    expect(persistent.onLoad).toBeUndefined();
    expect(persistent.storageKeys).toStrictEqual([]);
    expect(persistent.defaultStorageKey).toBeUndefined();
  });

  it("should create Persistent (specific config)", () => {
    // Overwrite instantiatePersistent once to not call it
    jest
      .spyOn(Persistent.prototype, "instantiatePersistent")
      .mockReturnValueOnce(undefined);

    const persistent = new Persistent(dummyAgile, {
      storageKeys: ["test1", "test2"],
      key: "persistentKey",
    });

    expect(persistent).toBeInstanceOf(Persistent);
    expect(persistent.instantiatePersistent).toHaveBeenCalledWith({
      storageKeys: ["test1", "test2"],
      key: "persistentKey",
    });
    expect(
      dummyAgile.storages.persistentInstances.has(persistent)
    ).toBeTruthy();

    expect(persistent._key).toBe(Persistent.placeHolderKey);
    expect(persistent.ready).toBeFalsy();
    expect(persistent.isPersisted).toBeFalsy();
    expect(persistent.onLoad).toBeUndefined();
    expect(persistent.storageKeys).toStrictEqual([]);
    expect(persistent.defaultStorageKey).toBeUndefined();
  });

  it("should create Persistent (config.instantiate = false)", () => {
    // Overwrite instantiatePersistent once to not call it
    jest
      .spyOn(Persistent.prototype, "instantiatePersistent")
      .mockReturnValueOnce(undefined);

    const persistent = new Persistent(dummyAgile, { instantiate: false });

    expect(persistent).toBeInstanceOf(Persistent);
    expect(persistent.instantiatePersistent).not.toHaveBeenCalled();
    expect(
      dummyAgile.storages.persistentInstances.has(persistent)
    ).toBeTruthy();

    expect(persistent._key).toBe(Persistent.placeHolderKey);
    expect(persistent.ready).toBeFalsy();
    expect(persistent.isPersisted).toBeFalsy();
    expect(persistent.onLoad).toBeUndefined();
    expect(persistent.storageKeys).toStrictEqual([]);
    expect(persistent.defaultStorageKey).toBeUndefined();
  });

  describe("Persistent Function Tests", () => {
    let persistent: Persistent;

    beforeEach(() => {
      persistent = new Persistent(dummyAgile);
    });

    describe("key set function tests", () => {
      it("should call setKey with passed value", () => {
        persistent.setKey = jest.fn();

        persistent.key = "dummyKey";

        expect(persistent.setKey).toHaveBeenCalledWith("dummyKey");
      });
    });

    describe("ket get function tests", () => {
      it("should get key property of Persistent", () => {
        persistent._key = "dummyKey";

        expect(persistent.key).toBe("dummyKey");
      });
    });

    describe("instantiatePersistent function tests", () => {
      it("should call assign key to formatKey and call assignStorageKeys, validatePersistent", () => {
        jest.spyOn(persistent, "formatKey");
        jest.spyOn(persistent, "assignStorageKeys");
        jest.spyOn(persistent, "validatePersistent");

        persistent.instantiatePersistent({
          key: "persistentKey",
          storageKeys: ["myName", "is", "jeff"],
        });

        expect(persistent._key).toBe("persistentKey");
        expect(persistent.formatKey).toHaveBeenCalledWith("persistentKey");
        expect(persistent.assignStorageKeys).toHaveBeenCalledWith([
          "myName",
          "is",
          "jeff",
        ]);
        expect(persistent.validatePersistent).toHaveBeenCalled();
      });
    });

    describe("validatePersistent function tests", () => {
      beforeEach(() => {
        persistent.key = Persistent.placeHolderKey;
        persistent.defaultStorageKey = undefined;
        persistent.storageKeys = [];
        persistent.ready = undefined;
      });

      it("should return false and print error if no set key and no set StorageKeys", () => {
        const isValid = persistent.validatePersistent();

        expect(isValid).toBeFalsy();
        expect(persistent.ready).toBeFalsy();

        expect(console.error).toHaveBeenCalledWith(
          "Agile Error: No valid persist Key found! Please provide a Key or assign one to the parent instance."
        );
      });

      it("should return false and print error if set key and no set StorageKeys", () => {
        persistent._key = "persistentKey";

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
        persistent._key = "persistentKey";
        persistent.defaultStorageKey = "test";
        persistent.storageKeys = ["test"];

        const isValid = persistent.validatePersistent();

        expect(isValid).toBeTruthy();
        expect(persistent.ready).toBeTruthy();
      });
    });

    describe("assignStorageKeys function tests", () => {
      it("should assign passed StorageKeys and set first one as default StorageKey", () => {
        persistent.assignStorageKeys(["test1", "test2", "test3"]);

        expect(persistent.storageKeys).toStrictEqual([
          "test1",
          "test2",
          "test3",
        ]);
        expect(persistent.defaultStorageKey).toBe("test1");
      });

      it("should try to get default StorageKey from Agile if no StorageKeys passed", () => {
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

        persistent.assignStorageKeys();

        expect(persistent.storageKeys).toStrictEqual(["storage1"]);
        expect(persistent.defaultStorageKey).toBe("storage1");
      });
    });

    describe("initialLoading function tests", () => {
      beforeEach(() => {
        persistent.onLoad = jest.fn();
        persistent.loadPersistedValue = jest.fn();
        persistent.persistValue = jest.fn();
      });

      it("shouldn't call persistValue if value got successful loaded", async () => {
        persistent.loadPersistedValue = jest.fn(() => Promise.resolve(true));

        await persistent.initialLoading();

        expect(persistent.loadPersistedValue).toHaveBeenCalled();
        expect(persistent.persistValue).not.toHaveBeenCalled();
        expect(persistent.onLoad).toHaveBeenCalledWith(true);
      });

      it("should call persistValue if value doesn't got successful loaded", async () => {
        persistent.loadPersistedValue = jest.fn(() => Promise.resolve(false));

        await persistent.initialLoading();

        expect(persistent.loadPersistedValue).toHaveBeenCalled();
        expect(persistent.persistValue).toHaveBeenCalled();
        expect(persistent.onLoad).toHaveBeenCalledWith(false);
      });
    });

    describe("loadPersistedValue function tests", () => {
      it("should print error", () => {
        persistent.loadPersistedValue();

        expect(console.error).toHaveBeenCalledWith(
          "Agile Error: 'loadPersistedValue' function isn't Set in Persistent! Be aware that Persistent is no stand alone class!"
        );
      });
    });

    describe("persistValue function tests", () => {
      it("should print error", () => {
        persistent.persistValue();

        expect(console.error).toHaveBeenCalledWith(
          "Agile Error: 'persistValue' function isn't Set in Persistent! Be aware that Persistent is no stand alone class!"
        );
      });
    });

    describe("removePersistedValue function tests", () => {
      it("should print error", () => {
        persistent.removePersistedValue();

        expect(console.error).toHaveBeenCalledWith(
          "Agile Error: 'removePersistedValue' function isn't Set in Persistent! Be aware that Persistent is no stand alone class!"
        );
      });

      describe("formatKey function tests", () => {
        it("should return passed key", () => {
          expect(persistent.formatKey("test")).toBe("test");
        });
      });
    });
  });
});
