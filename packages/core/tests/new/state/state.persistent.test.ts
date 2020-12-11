import {
  Agile,
  State,
  StatePersistent,
  Persistent,
  Storage,
} from "../../../src";

describe("StatePersistent Tests", () => {
  let dummyAgile: Agile;
  let dummyState: State;

  beforeEach(() => {
    console.error = jest.fn();
    dummyAgile = new Agile({ localStorage: false });
    dummyState = new State(dummyAgile, "dummyValue");
  });

  it("should create StatePersistent (default config)", () => {
    const statePersistent = new StatePersistent(dummyState);

    expect(statePersistent).toBeInstanceOf(StatePersistent);
    /* Couldn't figure out how to mock anything in the Constructor
    expect(Persistent).toHaveBeenCalledWith(dummyAgile, {
      instantiate: false,
    });
    expect(statePersistent.instantiatePersistent).toHaveBeenCalledWith({
      key: undefined,
      storageKeys: [],
    });
    expect(statePersistent.initialLoading).not.toHaveBeenCalled();
     */

    expect(statePersistent.state()).toBe(dummyState);
    expect(statePersistent.key).toBe(Persistent.placeHolderKey);
    expect(statePersistent.ready).toBeFalsy();
    expect(statePersistent.isPersisted).toBeFalsy();
    expect(statePersistent.onLoad).toBeUndefined();
    expect(statePersistent.storageKeys).toStrictEqual([]);
    expect(statePersistent.defaultStorageKey).toBeUndefined();

    expect(console.error).toHaveBeenCalledWith(
      "Agile Error: No valid persist Key found! Please provide a Key or assign one to the parent instance."
    );

    // Sleep 5ms because initialLoading happens async
    return new Promise((resolve) => setTimeout(resolve, 5)).then(() => {
      expect(dummyState.isPersisted).toBeFalsy();
    });
  });

  it("should create valid StatePersistent (config.key, config.storageKeys)", () => {
    const statePersistent = new StatePersistent(dummyState, {
      key: "statePersistentKey",
      storageKeys: ["test1", "test2"],
    });

    expect(statePersistent).toBeInstanceOf(StatePersistent);
    /* Couldn't figure out how to mock anything in the Constructor
    expect(Persistent).toHaveBeenCalledWith(dummyAgile, {
      instantiate: false,
    });
    expect(statePersistent.instantiatePersistent).toHaveBeenCalledWith({
      key: "statePersistentKey",
      storageKeys: ["test1", "test2"],
    });
    expect(statePersistent.initialLoading).toHaveBeenCalled();
     */

    expect(statePersistent.key).toBe("statePersistentKey"); // x
    expect(statePersistent.ready).toBeTruthy(); // x
    expect(statePersistent.isPersisted).toBeFalsy();
    expect(statePersistent.onLoad).toBeUndefined();
    expect(statePersistent.storageKeys).toStrictEqual(["test1", "test2"]); // x
    expect(statePersistent.defaultStorageKey).toBe("test1"); // x

    // expect(console.error).not.toHaveBeenCalled();

    // Sleep 5ms because initialLoading happens async
    return new Promise((resolve) => setTimeout(resolve, 5)).then(() => {
      expect(dummyState.isPersisted).toBeTruthy(); // x
    });
  });

  it("should create valid StatePersistent (config.key, config.storageKeys, config.instantiate = false)", () => {
    const statePersistent = new StatePersistent(dummyState, {
      key: "statePersistentKey",
      storageKeys: ["test1", "test2"],
      instantiate: false,
    });

    expect(statePersistent).toBeInstanceOf(StatePersistent);
    /* Couldn't figure out how to mock anything in the Constructor
    expect(Persistent).toHaveBeenCalledWith(dummyAgile, {
      instantiate: false,
    });
    expect(statePersistent.instantiatePersistent).toHaveBeenCalledWith({
      key: "statePersistentKey",
      storageKeys: ["test1", "test2"],
    });
    expect(statePersistent.initialLoading).not.toHaveBeenCalled();
     */

    expect(statePersistent.key).toBe("statePersistentKey");
    expect(statePersistent.ready).toBeTruthy();
    expect(statePersistent.isPersisted).toBeFalsy();
    expect(statePersistent.onLoad).toBeUndefined();
    expect(statePersistent.storageKeys).toStrictEqual(["test1", "test2"]);
    expect(statePersistent.defaultStorageKey).toBe("test1");

    // expect(console.error).not.toHaveBeenCalled();

    // Sleep 5ms because initialLoading happens async
    return new Promise((resolve) => setTimeout(resolve, 5)).then(() => {
      expect(dummyState.isPersisted).toBeFalsy(); // x
    });
  });

  describe("StatePersistent Function Tests", () => {
    let statePersistent: StatePersistent;

    beforeEach(() => {
      statePersistent = new StatePersistent(dummyState, {
        key: "statePersistentKey",
        storageKeys: ["dummyStorage"],
      });
      dummyAgile.registerStorage(
        new Storage({
          key: "dummyStorage",
          methods: {
            get: (key) => {},
            remove: (key) => {},
            set: (key, value) => {},
          },
        })
      );
    });

    describe("setKey function tests", () => {
      beforeEach(() => {
        statePersistent.removeValue = jest.fn();
        statePersistent.updateValue = jest.fn();
        statePersistent.initialLoading = jest.fn();
        jest.spyOn(statePersistent, "validatePersistent");
      });

      it("should update key with valid key in ready Persistent", () => {
        statePersistent.ready = true;
        statePersistent._key = "dummyKey";

        return statePersistent.setKey("newKey").then(() => {
          expect(statePersistent._key).toBe("newKey");
          expect(statePersistent.ready).toBeTruthy();
          expect(statePersistent.validatePersistent).toHaveBeenCalled();
          expect(statePersistent.initialLoading).not.toHaveBeenCalled();
          expect(statePersistent.updateValue).toHaveBeenCalledWith("newKey");
          expect(statePersistent.removeValue).toHaveBeenCalledWith("dummyKey");
        });
      });

      it("should update key with not valid key in ready Persistent", () => {
        statePersistent.ready = true;
        statePersistent._key = "dummyKey";

        return statePersistent.setKey().then(() => {
          expect(statePersistent._key).toBe(StatePersistent.placeHolderKey);
          expect(statePersistent.ready).toBeFalsy();
          expect(statePersistent.validatePersistent).toHaveBeenCalled();
          expect(statePersistent.initialLoading).not.toHaveBeenCalled();
          expect(statePersistent.updateValue).not.toHaveBeenCalled();
          expect(statePersistent.removeValue).toHaveBeenCalledWith("dummyKey");
        });
      });

      it("should update key with valid key in not ready Persistent", () => {
        statePersistent.ready = false;

        return statePersistent.setKey("newKey").then(() => {
          expect(statePersistent._key).toBe("newKey");
          expect(statePersistent.ready).toBeTruthy();
          expect(statePersistent.validatePersistent).toHaveBeenCalled();
          expect(statePersistent.initialLoading).toHaveBeenCalled();
          expect(statePersistent.updateValue).not.toHaveBeenCalled();
          expect(statePersistent.removeValue).not.toHaveBeenCalled();
        });
      });

      it("should update key with not valid key in not ready Persistent", () => {
        statePersistent.ready = false;

        return statePersistent.setKey().then(() => {
          expect(statePersistent._key).toBe(StatePersistent.placeHolderKey);
          expect(statePersistent.ready).toBeFalsy();
          expect(statePersistent.validatePersistent).toHaveBeenCalled();
          expect(statePersistent.initialLoading).not.toHaveBeenCalled();
          expect(statePersistent.updateValue).not.toHaveBeenCalled();
          expect(statePersistent.removeValue).not.toHaveBeenCalled();
        });
      });
    });

    // Note: Copied Persist initialLoading Tests, since idk how to mock super/extended class
    describe("initialLoading function tests", () => {
      let onLoadSuccess = undefined;

      beforeEach(() => {
        statePersistent.onLoad = (success) => {
          onLoadSuccess = success;
        };
        jest.spyOn(statePersistent, "updateValue");
      });

      it("shouldn't call updateValue if value got loaded", () => {
        statePersistent.loadValue = jest.fn(() => Promise.resolve(true));

        statePersistent.initialLoading().then(() => {
          expect(statePersistent.loadValue).toHaveBeenCalled();
          expect(statePersistent.updateValue).not.toHaveBeenCalled();
          expect(onLoadSuccess).toBeTruthy();
          expect(dummyState.isPersisted).toBeTruthy();
        });
      });

      it("should call updateValue if value doesn't got loaded", () => {
        statePersistent.loadValue = jest.fn(() => Promise.resolve(false));

        statePersistent.initialLoading().then(() => {
          expect(statePersistent.loadValue).toHaveBeenCalled();
          expect(statePersistent.updateValue).toHaveBeenCalled();
          expect(onLoadSuccess).toBeFalsy();
          expect(dummyState.isPersisted).toBeTruthy();
        });
      });
    });
  });
});
