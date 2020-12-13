import { State, Agile, StateObserver, Observer } from "../../../src";
import * as Utils from "../../../src/utils";

describe("State Tests", () => {
  let dummyAgile: Agile;

  beforeEach(() => {
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
    });

    describe("setKey function tests", () => {
      beforeEach(() => {
        numberState.persist();
        numberState.persistent.setKey = jest.fn();
      });

      it("should update existing Key in all instances", () => {
        numberState.persistent._key = "numberStateKey";

        numberState.setKey("newKey");

        expect(numberState.key).toBe("newKey");
        expect(numberState.observer.key).toBe("newKey");
        expect(numberState.persistent.setKey).toHaveBeenCalledWith("newKey");
      });

      it("should update existing Key but shouldn't update Key in persistent if their Keys weren't equal before", () => {
        numberState.persistent._key = "randomKey";

        numberState.setKey("newKey");

        expect(numberState.key).toBe("newKey");
        expect(numberState.observer.key).toBe("newKey");
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
  });
});
