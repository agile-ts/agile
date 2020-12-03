import { Agile, Persistent, Storage } from "../../../src";

describe("Persistent Tests", () => {
  let agile: Agile;

  beforeEach(() => {
    console.error = jest.fn();
    agile = new Agile({ localStorage: false });
  });

  it("should create Persistent with default Settings", () => {
    const persistent = new Persistent(agile);

    expect(persistent).toBeInstanceOf(Persistent);
    expect(persistent.key).toBe(Persistent.placeHolderKey);
    expect(persistent.ready).toBeFalsy();
    expect(persistent.isPersisted).toBeFalsy();
    expect(persistent.onLoad).toBeUndefined();
    expect(persistent.storageKeys).toStrictEqual([]);
    expect(persistent.defaultStorageKey).toBe(undefined);

    expect(agile.storages.persistentInstances.has(persistent)).toBeTruthy();

    expect(console.error).toHaveBeenCalledWith(
      "Agile Error: No valid persist Key found! Please provide a Key or assign one to the parent instance."
    );
  });

  it("should create Persistent with config.instantiate = false", () => {
    const persistent = new Persistent(agile, { instantiate: false });

    expect(persistent).toBeInstanceOf(Persistent);
    expect(persistent.key).toBe(Persistent.placeHolderKey);
    expect(persistent.ready).toBeFalsy();
    expect(persistent.isPersisted).toBeFalsy();
    expect(persistent.onLoad).toBeUndefined();
    expect(persistent.storageKeys).toStrictEqual([]);
    expect(persistent.defaultStorageKey).toBe(undefined);

    expect(agile.storages.persistentInstances.has(persistent)).toBeTruthy();

    expect(console.error).not.toHaveBeenCalled();
  });

  it("should create Persistent with config.key", () => {
    const persistent = new Persistent(agile, { key: "coolKey" });

    expect(persistent).toBeInstanceOf(Persistent);
    expect(persistent.key).toBe("coolKey");
    expect(persistent.ready).toBeFalsy();
    expect(persistent.isPersisted).toBeFalsy();
    expect(persistent.onLoad).toBeUndefined();
    expect(persistent.storageKeys).toStrictEqual([]);
    expect(persistent.defaultStorageKey).toBe(undefined);

    expect(agile.storages.persistentInstances.has(persistent)).toBeTruthy();

    expect(console.error).toHaveBeenCalledWith(
      "Agile Error: No persist Storage Key found! Please provide at least one Storage Key."
    );
  });

  it("should create Persistent with config.storageKeys", () => {
    const persistent = new Persistent(agile, {
      storageKeys: ["test1", "test2"],
    });

    expect(persistent).toBeInstanceOf(Persistent);
    expect(persistent.key).toBe(Persistent.placeHolderKey);
    expect(persistent.ready).toBeFalsy();
    expect(persistent.isPersisted).toBeFalsy();
    expect(persistent.onLoad).toBeUndefined();
    expect(persistent.storageKeys).toStrictEqual(["test1", "test2"]);
    expect(persistent.defaultStorageKey).toBe("test1");

    expect(agile.storages.persistentInstances.has(persistent)).toBeTruthy();

    expect(console.error).toHaveBeenCalledWith(
      "Agile Error: No valid persist Key found! Please provide a Key or assign one to the parent instance."
    );
  });

  it("should create Persistent with config.key and config.storageKeys", () => {
    const persistent = new Persistent(agile, {
      key: "coolKey",
      storageKeys: ["test1", "test2"],
    });

    expect(persistent).toBeInstanceOf(Persistent);
    expect(persistent.key).toBe("coolKey");
    expect(persistent.ready).toBeTruthy();
    expect(persistent.isPersisted).toBeFalsy();
    expect(persistent.onLoad).toBeUndefined();
    expect(persistent.storageKeys).toStrictEqual(["test1", "test2"]);
    expect(persistent.defaultStorageKey).toBe("test1");

    expect(agile.storages.persistentInstances.has(persistent)).toBeTruthy();

    expect(console.error).not.toHaveBeenCalled();
  });

  it("should create Persistent with config.key, config.storageKeys config.instantiate = false", () => {
    const persistent = new Persistent(agile, {
      instantiate: false,
      storageKeys: ["hello", "there"],
      key: "coolKey",
    });

    expect(persistent).toBeInstanceOf(Persistent);

    // Might be weired outputs.. BUT the persistent hasn't got instantiated yet
    expect(persistent.key).toBe(Persistent.placeHolderKey);
    expect(persistent.ready).toBeFalsy();
    expect(persistent.isPersisted).toBeFalsy();
    expect(persistent.onLoad).toBeUndefined();
    expect(persistent.storageKeys).toStrictEqual([]);
    expect(persistent.defaultStorageKey).toBeUndefined();

    expect(agile.storages.persistentInstances.has(persistent)).toBeTruthy();

    expect(console.error).not.toHaveBeenCalled();
  });

  describe("Persistent Function Tests", () => {
    describe("instantiatePersistent function tests", () => {
      let persistent: Persistent;

      beforeEach(() => {
        persistent = new Persistent(agile, { instantiate: false });
      });

      it("should be possible to instantiate Persistent later", () => {
        const persistent = new Persistent(agile, {
          instantiate: false,
        });

        expect(persistent.ready).toBeFalsy();

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

        expect(agile.storages.persistentInstances.has(persistent)).toBeTruthy();
      });
    });

    describe("validatePersistent function tests", () => {
      let persistent: Persistent;

      beforeEach(() => {
        persistent = new Persistent(agile);
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
        persistent = new Persistent(agile);
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
        agile.storages.register(
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
        persistent = new Persistent(agile);
        persistent.onLoad = (success) => {
          onLoadSuccess = success;
        };
      });

      it("shouldn't call updateValue if value got loaded", () => {
        persistent.loadValue = jest.fn(() => Promise.resolve(true));
        persistent.updateValue = jest.fn();

        persistent.initialLoading().then(() => {
          expect(persistent.loadValue).toHaveBeenCalled();
          expect(persistent.updateValue).not.toHaveBeenCalled();
          expect(onLoadSuccess).toBeTruthy();
        });
      });

      it("should call updateValue if value doesn't got loaded", () => {
        persistent.loadValue = jest.fn(() => Promise.resolve(false));
        persistent.updateValue = jest.fn();

        persistent.initialLoading().then(() => {
          expect(persistent.loadValue).toHaveBeenCalled();
          expect(persistent.updateValue).toHaveBeenCalled();
          expect(onLoadSuccess).toBeFalsy();
        });
      });
    });

    describe("function that get overwritten tests | because Persistent is no stand alone class", () => {
      let persistent: Persistent;

      beforeEach(() => {
        persistent = new Persistent(agile);
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
