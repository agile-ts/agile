import { Computed, Agile, StateObserver, Observer, State } from "../../../src";

describe("Computed Tests", () => {
  let dummyAgile: Agile;

  beforeEach(() => {
    dummyAgile = new Agile({ localStorage: false });
    console.error = jest.fn();
    jest.spyOn(Computed.prototype, "recompute");
  });

  it("should create Computed (default config)", () => {
    const computedFunction = () => "computedValue";

    const computed = new Computed(dummyAgile, computedFunction);

    expect(computed.computeFunction).toBe(computedFunction);
    expect(computed.deps).toStrictEqual([]);
    expect(computed.hardCodedDeps).toStrictEqual([]);
    expect(computed._key).toBeUndefined();
    expect(computed.valueType).toBeUndefined();
    expect(computed.isSet).toBeFalsy();
    expect(computed.isPlaceholder).toBeFalsy();
    expect(computed.initialStateValue).toBe("computedValue");
    expect(computed._value).toBe("computedValue");
    expect(computed.previousStateValue).toBe("computedValue");
    expect(computed.nextStateValue).toBe("computedValue");
    expect(computed.observer).toBeInstanceOf(StateObserver);
    expect(computed.observer.deps.size).toBe(0);
    expect(computed.observer.key).toBeUndefined();
    expect(computed.sideEffects).toStrictEqual({});
    expect(computed.computeMethod).toBeUndefined();
    expect(computed.isPersisted).toBeFalsy();
    expect(computed.persistent).toBeUndefined();
    expect(computed.watchers).toStrictEqual({});

    expect(computed.recompute).toHaveBeenCalled();
  });

  it("should create Computed (specific config)", () => {
    const dummyObserver1 = new Observer(dummyAgile);
    const dummyObserver2 = new Observer(dummyAgile);
    const dummyState = new State(dummyAgile, undefined);
    const dummyStateObserver = new StateObserver(dummyState);
    dummyState.observer = dummyStateObserver;
    const computedFunction = () => "computedValue";

    const computed = new Computed(dummyAgile, computedFunction, {
      key: "coolComputed",
      deps: [dummyObserver1],
      computedDeps: [dummyObserver2, undefined, dummyState],
    });

    expect(computed.computeFunction).toBe(computedFunction);
    expect(computed.deps).toStrictEqual([dummyObserver2, dummyStateObserver]); // x
    expect(computed.hardCodedDeps).toStrictEqual([
      dummyObserver2,
      dummyStateObserver,
    ]); // x
    expect(computed._key).toBe("coolComputed"); // x
    expect(computed.valueType).toBeUndefined();
    expect(computed.isSet).toBeFalsy();
    expect(computed.isPlaceholder).toBeFalsy();
    expect(computed.initialStateValue).toBe("computedValue");
    expect(computed._value).toBe("computedValue");
    expect(computed.previousStateValue).toBe("computedValue");
    expect(computed.nextStateValue).toBe("computedValue");
    expect(computed.observer).toBeInstanceOf(StateObserver);
    expect(computed.observer.deps.size).toBe(1); // x
    expect(computed.observer.deps.has(dummyObserver1)).toBeTruthy(); // x
    expect(computed.observer.key).toBe("coolComputed"); // x
    expect(computed.sideEffects).toStrictEqual({});
    expect(computed.computeMethod).toBeUndefined();
    expect(computed.isPersisted).toBeFalsy();
    expect(computed.persistent).toBeUndefined();
    expect(computed.watchers).toStrictEqual({});

    expect(computed.recompute).toHaveBeenCalled();
  });

  describe("Computed Function Tests", () => {
    let computed: Computed;
    const dummyComputeFunction = jest.fn(() => "computedValue");

    beforeEach(() => {
      computed = new Computed(dummyAgile, dummyComputeFunction);
    });

    describe("recompute function tests", () => {
      beforeEach(() => {
        computed.ingest = jest.fn();
      });

      it("should ingest Computed into Runtime (default config)", () => {
        computed.recompute();

        expect(computed.ingest).toHaveBeenCalledWith({
          background: false,
          sideEffects: true,
        });
      });

      it("should ingest Computed into Runtime (specific config)", () => {
        computed.recompute({
          background: true,
          sideEffects: false,
        });

        expect(computed.ingest).toHaveBeenCalledWith({
          background: true,
          sideEffects: false,
        });
      });
    });

    describe("updateComputeFunction function tests", () => {
      const newComputeFunction = () => "newComputedValue";
      let dummyObserver: Observer;
      let oldDummyObserver: Observer;
      let dummyStateObserver: StateObserver;
      let dummyState: State;

      beforeEach(() => {
        dummyObserver = new Observer(dummyAgile);
        oldDummyObserver = new Observer(dummyAgile);
        dummyState = new State(dummyAgile, undefined);
        dummyStateObserver = new StateObserver(dummyState);
        dummyState.observer = dummyStateObserver;
        computed.hardCodedDeps = [oldDummyObserver];
      });

      it("should updated computeFunction and overwrite hardCodedDeps (default config)", () => {
        computed.updateComputeFunction(newComputeFunction, [
          dummyState,
          dummyObserver,
        ]);

        expect(computed.hardCodedDeps).toStrictEqual([
          dummyStateObserver,
          dummyObserver,
        ]);
        expect(computed.deps).toStrictEqual([
          dummyStateObserver,
          dummyObserver,
        ]);
        expect(computed.computeFunction).toBe(newComputeFunction);
        expect(computed.recompute).toHaveBeenCalledWith({
          background: false,
          sideEffects: true,
        });
      });

      it("should updated computeFunction and overwrite hardCodedDeps (specific config)", () => {
        computed.updateComputeFunction(newComputeFunction, [], {
          background: true,
          sideEffects: false,
        });

        expect(computed.hardCodedDeps).toStrictEqual([]);
        expect(computed.deps).toStrictEqual([]);
        expect(computed.computeFunction).toBe(newComputeFunction);
        expect(computed.recompute).toHaveBeenCalledWith({
          background: true,
          sideEffects: false,
        });
      });

      it("should updated computeFunction and overwrite hardCodedDeps (config.overwriteDeps = false)", () => {
        computed.updateComputeFunction(
          newComputeFunction,
          [dummyState, dummyObserver],
          { overwriteDeps: false }
        );

        expect(computed.hardCodedDeps).toStrictEqual([
          oldDummyObserver,
          dummyStateObserver,
          dummyObserver,
        ]);
        expect(computed.deps).toStrictEqual([
          oldDummyObserver,
          dummyStateObserver,
          dummyObserver,
        ]);
        expect(computed.computeFunction).toBe(newComputeFunction);
        expect(computed.recompute).toHaveBeenCalledWith({
          background: false,
          sideEffects: true,
        });
      });
    });
  });
});
