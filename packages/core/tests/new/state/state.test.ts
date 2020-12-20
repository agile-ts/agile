import {
  State,
  Agile,
  StateObserver,
  Observer,
  StatePersistent,
  ComputedTracker,
} from "../../../src";
import * as Utils from "../../../src/utils";

jest.mock("../../../src/state/state.persistent");

describe("State Tests", () => {
  let dummyAgile: Agile;

  beforeEach(() => {
    jest.clearAllMocks();

    dummyAgile = new Agile({ localStorage: false });

    console.error = jest.fn();
    console.warn = jest.fn();
  });

  it("should create State (default config)", () => {
    const state = new State(dummyAgile, "coolValue");

    expect(state._key).toBeUndefined();
    expect(state.valueType).toBeUndefined();
    expect(state.isSet).toBeFalsy();
    expect(state.isPlaceholder).toBeFalsy();
    expect(state.initialStateValue).toBe("coolValue");
    expect(state._value).toBe("coolValue");
    expect(state.previousStateValue).toBe("coolValue");
    expect(state.nextStateValue).toBe("coolValue");
    expect(state.observer).toBeInstanceOf(StateObserver);
    expect(state.observer.deps.size).toBe(0);
    expect(state.observer._key).toBeUndefined();
    expect(state.sideEffects).toStrictEqual({});
    expect(state.computeMethod).toBeUndefined();
    expect(state.isPersisted).toBeFalsy();
    expect(state.persistent).toBeUndefined();
    expect(state.watchers).toStrictEqual({});
  });

  it("should create State (specific config)", () => {
    const dummyObserver = new Observer(dummyAgile);

    const state = new State(dummyAgile, "coolValue", {
      key: "coolState",
      deps: [dummyObserver],
    });

    expect(state._key).toBe("coolState"); // x
    expect(state.valueType).toBeUndefined();
    expect(state.isSet).toBeFalsy();
    expect(state.isPlaceholder).toBeFalsy();
    expect(state.initialStateValue).toBe("coolValue");
    expect(state._value).toBe("coolValue");
    expect(state.previousStateValue).toBe("coolValue");
    expect(state.nextStateValue).toBe("coolValue");
    expect(state.observer).toBeInstanceOf(StateObserver);
    expect(state.observer.deps.size).toBe(1); // x
    expect(state.observer.deps.has(dummyObserver)).toBeTruthy(); // x
    expect(state.observer._key).toBe("coolState"); // x
    expect(state.sideEffects).toStrictEqual({});
    expect(state.computeMethod).toBeUndefined();
    expect(state.isPersisted).toBeFalsy();
    expect(state.persistent).toBeUndefined();
    expect(state.watchers).toStrictEqual({});
  });

  describe("State Function Tests", () => {
    let numberState: State<number>;
    let objectState: State<{ name: string; age: number }>;
    let arrayState: State<string[]>;
    let booleanState: State<boolean>;

    beforeEach(() => {
      numberState = new State<number>(dummyAgile, 10, {
        key: "numberStateKey",
      });
      objectState = new State<{ name: string; age: number }>(
        dummyAgile,
        { name: "jeff", age: 10 },
        {
          key: "objectStateKey",
        }
      );
      arrayState = new State<string[]>(dummyAgile, ["jeff"], {
        key: "arrayStateKey",
      });
      booleanState = new State<boolean>(dummyAgile, false, {
        key: "booleanStateKey",
      });
    });

    describe("value set function tests", () => {
      it("should call set function with passed value", () => {
        numberState.set = jest.fn();

        numberState.value = 20;

        expect(numberState.set).toHaveBeenCalledWith(20);
      });
    });

    describe("value get function tests", () => {
      it("should return current value", () => {
        expect(numberState.value).toBe(10);
        ComputedTracker.tracked = jest.fn();
      });

      it("should return current value", () => {
        const value = numberState.value;

        expect(value).toBe(10);
        expect(ComputedTracker.tracked).toHaveBeenCalledWith(
          numberState.observer
        );
      });
    });

    describe("key set function tests", () => {
      it("should call setKey with passed value", () => {
        numberState.setKey = jest.fn();

        numberState.key = "newKey";

        expect(numberState.setKey).toHaveBeenCalledWith("newKey");
      });
    });

    describe("key get function tests", () => {
      it("should return current State Key", () => {
        expect(numberState.key).toBe("numberStateKey");
      });
    });

    describe("setKey function tests", () => {
      beforeEach(() => {
        numberState.persist();

        numberState.persistent.setKey = jest.fn();
      });

      it("should update existing Key in all instances", () => {
        numberState.persistent.key = "numberStateKey";

        numberState.setKey("newKey");

        expect(numberState.key).toBe("newKey");
        expect(numberState.observer._key).toBe("newKey");
        expect(numberState.persistent.setKey).toHaveBeenCalledWith("newKey");
      });

      it("should update existing Key but shouldn't update Key in persistent if their Keys weren't equal before", () => {
        numberState.persistent.key = "randomKey";

        numberState.setKey("newKey");

        expect(numberState.key).toBe("newKey");
        expect(numberState.observer._key).toBe("newKey");
        expect(numberState.persistent.setKey).not.toHaveBeenCalled();
      });
    });

    describe("set function tests", () => {
      beforeEach(() => {
        jest.spyOn(numberState.observer, "ingestValue");
      });

      it("should set value if currentValue isn't equal to newValue and has the correct type (default config)", () => {
        numberState.set(20);

        expect(numberState._value).toBe(20);
        expect(numberState.initialStateValue).toBe(10);
        expect(numberState.previousStateValue).toBe(10);
        expect(numberState.nextStateValue).toBe(20);

        expect(numberState.observer.ingestValue).toHaveBeenCalledWith(20, {
          sideEffects: true,
          background: false,
          force: false,
          storage: true,
        });
      });

      it("should set value if currentValue isn't equal to newValue and has the correct type (specific config)", () => {
        numberState.set(20, {
          sideEffects: false,
          background: true,
          storage: false,
        });

        expect(numberState._value).toBe(20);
        expect(numberState.initialStateValue).toBe(10);
        expect(numberState.previousStateValue).toBe(10);
        expect(numberState.nextStateValue).toBe(20);

        expect(numberState.observer.ingestValue).toHaveBeenCalledWith(20, {
          sideEffects: false,
          background: true,
          force: false,
          storage: false,
        });
      });

      it("shouldn't set value if currentValue is equal to newValue and has the correct type (default config)", () => {
        numberState.set(10);

        expect(numberState._value).toBe(10);
        expect(numberState.initialStateValue).toBe(10);
        expect(numberState.previousStateValue).toBe(10);
        expect(numberState.nextStateValue).toBe(10);

        expect(numberState.observer.ingestValue).not.toHaveBeenCalled();
      });

      it("should set value if currentValue is equal to newValue and has the correct type (config.force = true)", () => {
        numberState.set(10, { force: true });

        expect(numberState._value).toBe(10);
        expect(numberState.initialStateValue).toBe(10);
        expect(numberState.previousStateValue).toBe(10);
        expect(numberState.nextStateValue).toBe(10);

        expect(numberState.observer.ingestValue).toHaveBeenCalledWith(10, {
          sideEffects: true,
          background: false,
          force: true,
          storage: true,
        });
      });

      it("shouldn't set value if currentValue isn't equal to newValue and has wrong type (default config)", () => {
        numberState.type(Number);

        numberState.set("coolString" as any);

        expect(numberState._value).toBe(10);
        expect(numberState.initialStateValue).toBe(10);
        expect(numberState.previousStateValue).toBe(10);
        expect(numberState.nextStateValue).toBe(10);

        expect(numberState.observer.ingestValue).not.toHaveBeenCalled();
        expect(console.error).toHaveBeenCalledWith(
          "Agile Error: Incorrect type (string) was provided."
        );
      });

      it("should set value if currentValue isn't equal to newValue and has wrong type (config.force = true)", () => {
        numberState.type(Number);

        numberState.set("coolString" as any, { force: true });

        expect(numberState._value).toBe("coolString");
        expect(numberState.initialStateValue).toBe(10);
        expect(numberState.previousStateValue).toBe(10);
        expect(numberState.nextStateValue).toBe("coolString");

        expect(numberState.observer.ingestValue).toHaveBeenCalledWith(
          "coolString",
          {
            sideEffects: true,
            background: false,
            force: true,
            storage: true,
          }
        );
        expect(console.warn).toHaveBeenCalledWith(
          "Agile Warn: Incorrect type (string) was provided."
        );
      });

      it("should set value if currentValue isn't equal to newValue and has wrong type and type is not explicit defined (default config)", () => {
        numberState.set("coolString" as any);

        expect(numberState._value).toBe("coolString");
        expect(numberState.initialStateValue).toBe(10);
        expect(numberState.previousStateValue).toBe(10);
        expect(numberState.nextStateValue).toBe("coolString");

        expect(numberState.observer.ingestValue).toHaveBeenCalledWith(
          "coolString",
          {
            sideEffects: true,
            background: false,
            force: false,
            storage: true,
          }
        );
      });
    });

    describe("ingest function tests", () => {
      beforeEach(() => {
        numberState.observer.ingest = jest.fn();
      });

      it("should call ingest function in the observer (default config)", () => {
        numberState.ingest();

        expect(numberState.observer.ingest).toHaveBeenCalledWith({
          sideEffects: true,
          background: false,
          force: false,
        });
      });

      it("should call ingest function in the observer (specific config)", () => {
        numberState.ingest({
          force: true,
          background: true,
        });

        expect(numberState.observer.ingest).toHaveBeenCalledWith({
          sideEffects: true,
          background: true,
          force: true,
        });
      });
    });

    describe("type function tests", () => {
      it("should assign valid Type to State", () => {
        numberState.type(Number);

        expect(numberState.valueType).toBe("number");
      });

      it("shouldn't assign invalid Type to State", () => {
        numberState.type("fuckingType");

        expect(numberState.valueType).toBeUndefined();
        expect(console.warn).toHaveBeenCalledWith(
          "Agile Warn: 'fuckingType' is not supported! Supported types: String, Boolean, Array, Object, Number"
        );
      });
    });

    describe("undo function tests", () => {
      beforeEach(() => {
        numberState.set = jest.fn();
      });

      it("should assign previousStateValue to currentValue (default config)", () => {
        numberState.previousStateValue = 99;

        numberState.undo();

        expect(numberState.set).toHaveBeenCalledWith(
          numberState.previousStateValue,
          {}
        );
      });

      it("should assign previousStateValue to currentValue (specific config)", () => {
        numberState.previousStateValue = 99;

        numberState.undo({
          force: true,
          storage: false,
        });

        expect(numberState.set).toHaveBeenCalledWith(
          numberState.previousStateValue,
          {
            force: true,
            storage: false,
          }
        );
      });
    });

    describe("reset function tests", () => {
      beforeEach(() => {
        numberState.set = jest.fn();
      });

      it("should assign initialStateValue to currentValue (default config)", () => {
        numberState.initialStateValue = 99;

        numberState.reset();

        expect(numberState.set).toHaveBeenCalledWith(
          numberState.initialStateValue,
          {}
        );
      });

      it("should assign initialStateValue to currentValue (specific config)", () => {
        numberState.initialStateValue = 99;

        numberState.reset({
          force: true,
          storage: false,
        });

        expect(numberState.set).toHaveBeenCalledWith(
          numberState.initialStateValue,
          {
            force: true,
            storage: false,
          }
        );
      });
    });

    describe("patch function tests", () => {
      beforeEach(() => {
        objectState.ingest = jest.fn();
        numberState.ingest = jest.fn();
        jest.spyOn(Utils, "flatMerge");
      });

      it("shouldn't patch and ingest passed object based value into a not object based State (default config)", () => {
        numberState.patch({ changed: "object" });

        expect(console.error).toHaveBeenCalledWith(
          "Agile Error: You can't use the patch method on a non object based States!"
        );
        expect(objectState.ingest).not.toHaveBeenCalled();
      });

      it("shouldn't patch and ingest passed not object based value into object based State (default config)", () => {
        objectState.patch("number" as any);

        expect(console.error).toHaveBeenCalledWith(
          "Agile Error: TargetWithChanges has to be an Object!"
        );
        expect(objectState.ingest).not.toHaveBeenCalled();
      });

      it("should patch and ingest passed object based value into a object based State (default config)", () => {
        objectState.patch({ name: "frank" });

        expect(Utils.flatMerge).toHaveBeenCalledWith(
          { age: 10, name: "jeff" },
          { name: "frank" },
          {
            addNewProperties: true,
          }
        );
        expect(objectState.nextStateValue).toStrictEqual({
          age: 10,
          name: "frank",
        });
        expect(objectState.ingest).toHaveBeenCalledWith({
          background: false,
          force: false,
        });
      });

      it("should patch and ingest passed object based value into a object based State (specific config)", () => {
        objectState.patch(
          { name: "frank" },
          {
            addNewProperties: false,
            background: true,
          }
        );

        expect(Utils.flatMerge).toHaveBeenCalledWith(
          { age: 10, name: "jeff" },
          { name: "frank" },
          {
            addNewProperties: false,
          }
        );
        expect(objectState.nextStateValue).toStrictEqual({
          age: 10,
          name: "frank",
        });
        expect(objectState.ingest).toHaveBeenCalledWith({
          background: true,
          force: false,
        });
      });

      it("should patch and shouldn't ingest passed object based value into a object based State if patch result is equal to currentValue (default config)", () => {
        objectState.patch({ name: "jeff" });

        expect(Utils.flatMerge).toHaveBeenCalledWith(
          { age: 10, name: "jeff" },
          { name: "jeff" },
          {
            addNewProperties: true,
          }
        );
        expect(objectState.nextStateValue).toStrictEqual({
          age: 10,
          name: "jeff",
        });
        expect(objectState.ingest).not.toHaveBeenCalled();
      });

      it("should patch and ingest passed object based value into a object based State if patch result is equal to currentValue (config.force = true)", () => {
        objectState.patch({ name: "jeff" }, { force: true });

        expect(Utils.flatMerge).toHaveBeenCalledWith(
          { age: 10, name: "jeff" },
          { name: "jeff" },
          {
            addNewProperties: true,
          }
        );
        expect(objectState.nextStateValue).toStrictEqual({
          age: 10,
          name: "jeff",
        });
        expect(objectState.ingest).toHaveBeenCalledWith({
          background: false,
          force: true,
        });
      });
    });

    describe("watch function tests", () => {
      const dummyCallbackFunction1 = () => {};
      const dummyCallbackFunction2 = () => {};

      it("should add passed watcherFunction to watchers at passed key", () => {
        const response = numberState.watch("dummyKey", dummyCallbackFunction1);

        expect(response).toBe(numberState);
        expect(numberState.watchers).toHaveProperty("dummyKey");
        expect(numberState.watchers["dummyKey"]).toBe(dummyCallbackFunction1);
      });

      it("should add passed watcherFunction to watchers at random key if no key passed and return that generated key", () => {
        jest.spyOn(Utils, "generateId").mockReturnValue("randomKey");

        const response = numberState.watch(dummyCallbackFunction1);

        expect(response).toBe("randomKey");
        expect(numberState.watchers).toHaveProperty("randomKey");
        expect(numberState.watchers["randomKey"]).toBe(dummyCallbackFunction1);
        expect(Utils.generateId).toHaveBeenCalled();
      });

      it("shouldn't add passed invalid watcherFunction to watchers at passed key", () => {
        const response = numberState.watch(
          "dummyKey",
          "noFunction hehe" as any
        );

        expect(response).toBe(numberState);
        expect(numberState.watchers).not.toHaveProperty("dummyKey");
        expect(console.error).toHaveBeenCalledWith(
          "Agile Error: A Watcher Callback Function has to be typeof Function!"
        );
      });

      it("shouldn't add passed watcherFunction to watchers at passed key if passed key is already occupied", () => {
        numberState.watchers["dummyKey"] = dummyCallbackFunction2;

        const response = numberState.watch("dummyKey", dummyCallbackFunction1);

        expect(response).toBe(numberState);
        expect(numberState.watchers).toHaveProperty("dummyKey");
        expect(numberState.watchers["dummyKey"]).toBe(dummyCallbackFunction2);
        expect(console.error).toHaveBeenCalledWith(
          "Agile Error: Watcher Callback Function with the key/name 'dummyKey' already exists!"
        );
      });
    });

    describe("removeWatcher function tests", () => {
      beforeEach(() => {
        numberState.watchers["dummyKey"] = () => {};
      });

      it("should remove watcher at key from State", () => {
        numberState.removeWatcher("dummyKey");

        expect(numberState.watchers).not.toHaveProperty("dummyKey");
      });
    });

    describe("onInaugurated function tests", () => {
      let dummyCallbackFunction;

      beforeEach(() => {
        jest.spyOn(numberState, "watch");
        dummyCallbackFunction = jest.fn();
      });

      it("should add watcher called InauguratedWatcherKey to State that destroys it self after it got called", () => {
        numberState.onInaugurated(dummyCallbackFunction);

        expect(numberState.watch).toHaveBeenCalledWith(
          "InauguratedWatcherKey",
          expect.any(Function)
        );
        expect(numberState.watchers).toHaveProperty("InauguratedWatcherKey");
      });

      it("should remove itself after getting called", () => {
        numberState.onInaugurated(dummyCallbackFunction);

        // Call Inaugurated Watcher
        numberState.watchers["InauguratedWatcherKey"](10);

        expect(dummyCallbackFunction).toHaveBeenCalledWith(10);
        expect(numberState.watchers).not.toHaveProperty(
          "InauguratedWatcherKey"
        );
      });
    });

    describe("hasWatcher function tests", () => {
      beforeEach(() => {
        numberState.watchers["dummyKey"] = () => {};
      });

      it("should return true if Watcher at given Key exists", () => {
        expect(numberState.hasWatcher("dummyKey")).toBeTruthy();
      });

      it("should return false if Watcher at given Key doesn't exists", () => {
        expect(numberState.hasWatcher("notExistingDummyKey")).toBeFalsy();
      });
    });

    describe("persist function tests", () => {
      it("should create persistent with StateKey (default config)", () => {
        numberState.persist();

        expect(numberState.persistent).toBeInstanceOf(StatePersistent);
        expect(StatePersistent).toHaveBeenCalledWith(numberState, {
          instantiate: true,
          storageKeys: [],
          key: numberState._key,
        });
      });

      it("should create persistent with StateKey (specific config)", () => {
        numberState.persist({
          storageKeys: ["test1", "test2"],
          instantiate: false,
        });

        expect(numberState.persistent).toBeInstanceOf(StatePersistent);
        expect(StatePersistent).toHaveBeenCalledWith(numberState, {
          instantiate: false,
          storageKeys: ["test1", "test2"],
          key: numberState._key,
        });
      });

      it("should create persistent with passed Key (default config)", () => {
        numberState.persist("passedKey");

        expect(numberState.persistent).toBeInstanceOf(StatePersistent);
        expect(StatePersistent).toHaveBeenCalledWith(numberState, {
          instantiate: true,
          storageKeys: [],
          key: "passedKey",
        });
      });

      it("should create persistent with passed Key (specific config)", () => {
        numberState.persist("passedKey", {
          storageKeys: ["test1", "test2"],
          instantiate: false,
        });

        expect(numberState.persistent).toBeInstanceOf(StatePersistent);
        expect(StatePersistent).toHaveBeenCalledWith(numberState, {
          instantiate: false,
          storageKeys: ["test1", "test2"],
          key: "passedKey",
        });
      });

      it("should overwrite existing persistent with a warning", () => {
        numberState.persistent = new StatePersistent(numberState);

        numberState.persist({
          instantiate: false,
          storageKeys: ["test1", "test2"],
        });

        expect(numberState.persistent).toBeInstanceOf(StatePersistent);
        expect(StatePersistent).toHaveBeenCalledWith(numberState, {
          instantiate: false,
          storageKeys: ["test1", "test2"],
          key: numberState._key,
        });
        expect(console.warn).toBeCalledWith(
          `Agile Warn: By persisting the State '${numberState._key}' twice you overwrite the old Persistent Instance!`
        );
      });
    });

    describe("onLoad function tests", () => {
      const dummyCallbackFunction = jest.fn();

      it("should set onLoad function if State is persisted and shouldn't call it initially if isPersisted = false", () => {
        numberState.persistent = new StatePersistent(numberState);
        numberState.isPersisted = false;

        numberState.onLoad(dummyCallbackFunction);

        expect(numberState.persistent.onLoad).toBe(dummyCallbackFunction);
        expect(dummyCallbackFunction).not.toHaveBeenCalled();
      });

      it("should set onLoad function if State is persisted and should call it initially if isPersisted = true", () => {
        numberState.persistent = new StatePersistent(numberState);
        numberState.isPersisted = true;

        numberState.onLoad(dummyCallbackFunction);

        expect(numberState.persistent.onLoad).toBe(dummyCallbackFunction);
        expect(dummyCallbackFunction).toBeCalledWith(true);
      });

      it("shouldn't set onLoad function if State isn't persisted and should drop a warning ", () => {
        numberState.onLoad(dummyCallbackFunction);

        expect(dummyCallbackFunction).not.toHaveBeenCalled();
        expect(console.error).toHaveBeenCalledWith(
          "Agile Error: Please make sure you persist the State 'numberStateKey' before using onLoad!"
        );
      });
    });

    describe("copy function tests", () => {
      it("should return a reference free copy of the current State Value", () => {
        jest.spyOn(Utils, "copy");
        const value = numberState.copy();

        expect(value).toBe(10);
        expect(Utils.copy).toHaveBeenCalledWith(10);
      });
    });

    describe("exists get function tests", () => {
      it("should return true if value isn't undefined and State is no placeholder", () => {
        expect(numberState.exists).toBeTruthy();
      });

      it("should return false if value is undefined and State is no placeholder", () => {
        numberState._value = undefined;

        expect(numberState.exists).toBeFalsy();
      });

      it("should return false if value isn't undefined and State is placeholder", () => {
        numberState.isPlaceholder = true;

        expect(numberState.exists).toBeFalsy();
      });
    });

    describe("is function tests", () => {
      beforeEach(() => {
        jest.spyOn(Utils, "equal");
      });

      it("should return true if passed value is equal to the current StateValue", () => {
        const response = numberState.is(10);

        expect(response).toBeTruthy();
        expect(Utils.equal).toHaveBeenCalledWith(10, numberState._value);
      });

      it("should return false if passed value is not equal to the current StateValue", () => {
        const response = numberState.is(20);

        expect(response).toBeFalsy();
        expect(Utils.equal).toHaveBeenCalledWith(20, numberState._value);
      });
    });

    describe("isNot function tests", () => {
      beforeEach(() => {
        jest.spyOn(Utils, "notEqual");
      });

      it("should return false if passed value is equal to the current StateValue", () => {
        const response = numberState.isNot(10);

        expect(response).toBeFalsy();
        expect(Utils.notEqual).toHaveBeenCalledWith(10, numberState._value);
      });

      it("should return true if passed value is not equal to the current StateValue", () => {
        const response = numberState.isNot(20);

        expect(response).toBeTruthy();
        expect(Utils.notEqual).toHaveBeenCalledWith(20, numberState._value);
      });
    });

    describe("invert function tests", () => {
      beforeEach(() => {
        numberState.set = jest.fn();
        booleanState.set = jest.fn();
      });

      it("should invert current value of a boolean based State", () => {
        booleanState.invert();

        expect(booleanState.set).toHaveBeenCalledWith(true);
      });

      it("shouldn't invert current value if not boolean based State and should print a error", () => {
        numberState.invert();

        expect(numberState.set).not.toHaveBeenCalled();
        expect(console.error).toHaveBeenCalledWith(
          "Agile Error: You can only invert boolean based States!"
        );
      });
    });

    describe("compute function tests", () => {
      it("should assign passed function to computeMethod", () => {
        const computeMethod = () => 10;

        numberState.compute(computeMethod);

        expect(numberState.computeMethod).toBe(computeMethod);
      });

      it("shouldn't assign passed invalid function to computeMethod", () => {
        numberState.compute(10 as any);

        expect(numberState.computeMethod).toBeUndefined();
        expect(console.error).toHaveBeenCalledWith(
          "Agile Error: A computeMethod has to be a function!"
        );
      });
    });

    describe("addSideEffect function tests", () => {
      const sideEffectFunction = () => {};

      it("should add passed function to sideEffects at passed key", () => {
        numberState.addSideEffect("dummyKey", sideEffectFunction);

        expect(numberState.sideEffects).toHaveProperty("dummyKey");
        expect(numberState.sideEffects["dummyKey"]).toBe(sideEffectFunction);
      });

      it("shouldn't add passed invalid function to sideEffects at passed key", () => {
        numberState.addSideEffect("dummyKey", 10 as any);

        expect(numberState.sideEffects).not.toHaveProperty("dummyKey");
        expect(console.error).toHaveBeenCalledWith(
          "Agile Error: A sideEffect function has to be a function!"
        );
      });
    });

    describe("removeSideEffect function tests", () => {
      beforeEach(() => {
        numberState.sideEffects["dummyKey"] = jest.fn();
      });

      it("should remove sideEffect at key from State", () => {
        numberState.removeSideEffect("dummyKey");

        expect(numberState.sideEffects).not.toHaveProperty("dummyKey");
      });
    });

    describe("hasSideEffect function tests", () => {
      beforeEach(() => {
        numberState.sideEffects["dummyKey"] = jest.fn();
      });

      it("should return true if SideEffect at given Key exists", () => {
        expect(numberState.hasSideEffect("dummyKey")).toBeTruthy();
      });

      it("should return false if SideEffect at given Key doesn't exists", () => {
        expect(numberState.hasSideEffect("notExistingDummyKey")).toBeFalsy();
      });
    });

    describe("hasCorrectType function tests", () => {
      it("should return true if State Type matches passed type", () => {
        numberState.type(Number);

        expect(numberState.hasCorrectType(10)).toBeTruthy();
      });

      it("should return false if State Type doesn't matches passed type", () => {
        numberState.type(Number);

        expect(numberState.hasCorrectType("stringValue")).toBeFalsy();
      });

      it("should return true if State has no defined Type", () => {
        expect(numberState.hasCorrectType("stringValue")).toBeTruthy();
      });
    });

    describe("getPublicValue function tests", () => {
      it("should return value of State", () => {
        expect(numberState.getPublicValue()).toBe(10);
      });

      it("should return output of State", () => {
        numberState["output"] = 99;

        expect(numberState.getPublicValue()).toBe(99);
      });
    });
  });
});
