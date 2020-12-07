import {
  Agile,
  Computed,
  Observer,
  State,
  StateObserver,
  SubscriptionContainer,
} from "../../../src";
// jest.mock("../../../src/runtime/observer"); // Can't mock Observer because mocks get instantiated before everything else -> I got the good old not loaded Object error https://github.com/kentcdodds/how-jest-mocking-works

describe("StateObserver Tests", () => {
  let dummyAgile: Agile;
  let dummyState: State;

  beforeEach(() => {
    dummyAgile = new Agile({ localStorage: false });
    dummyState = new State(dummyAgile, "dummyValue", { key: "dummyState" });
  });

  it("should create StateObserver (default config)", () => {
    const stateObserver = new StateObserver(dummyState);

    expect(stateObserver).toBeInstanceOf(StateObserver);
    expect(stateObserver.nextStateValue).toBe("dummyValue");
    /*
    expect(Observer).toHaveBeenCalledWith(dummyAgile, {
      deps: [],
      value: "dummyValue",
      key: undefined,
      subs: [],
    });
     */
    expect(stateObserver.value).toBe("dummyValue");
    expect(stateObserver.state()).toBe(dummyState);
    expect(stateObserver._key).toBeUndefined();
    expect(stateObserver.deps.size).toBe(0);
    expect(stateObserver.subs.size).toBe(0);
  });

  it("should create StateObserver with specific config", () => {
    const dummyObserver1 = new Observer(dummyAgile, { key: "dummyObserver1" });
    const dummyObserver2 = new Observer(dummyAgile, { key: "dummyObserver2" });
    const dummySubscription1 = new SubscriptionContainer();
    const dummySubscription2 = new SubscriptionContainer();

    const stateObserver = new StateObserver(dummyState, {
      key: "testKey",
      deps: [dummyObserver1, dummyObserver2],
      subs: [dummySubscription1, dummySubscription2],
    });

    expect(stateObserver).toBeInstanceOf(StateObserver);
    expect(stateObserver.nextStateValue).toBe("dummyValue");
    /*
    expect(Observer).toHaveBeenCalledWith(dummyAgile, {
      deps: [dummyObserver1, dummyObserver2],
      value: "dummyValue",
      key: "testKey",
      subs: [dummySubscription1, dummySubscription2],
    });
     */
    expect(stateObserver.value).toBe("dummyValue");
    expect(stateObserver.state()).toBe(dummyState);
    expect(stateObserver._key).toBe("testKey");
    expect(stateObserver.deps.size).toBe(2);
    expect(stateObserver.deps.has(dummyObserver2)).toBeTruthy();
    expect(stateObserver.deps.has(dummyObserver1)).toBeTruthy();
    expect(stateObserver.subs.size).toBe(2);
    expect(stateObserver.subs.has(dummySubscription1)).toBeTruthy();
    expect(stateObserver.subs.has(dummySubscription2)).toBeTruthy();
  });

  describe("StateObserver Function Tests", () => {
    let stateObserver: StateObserver;
    let computedObserver: StateObserver;
    let dummyComputed: Computed;

    beforeEach(() => {
      dummyComputed = new Computed(dummyAgile, () => {}, {
        key: "dummyComputed",
      });
      stateObserver = new StateObserver(dummyState, {
        key: "stateObserverKey",
      });
      computedObserver = new StateObserver(dummyComputed, {
        key: "computedObserverKey",
      });
      dummyAgile.runtime.ingest = jest.fn();
    });

    describe("ingest function tests", () => {
      it("should call ingestValue with nextStateValue (default config)", () => {
        dummyState.nextStateValue = "nextValue";
        stateObserver.ingestValue = jest.fn();

        stateObserver.ingest();

        expect(stateObserver.ingestValue).toHaveBeenCalledWith("nextValue", {});
      });

      it("should call ingestValue with nextStateValue (specific config)", () => {
        dummyState.nextStateValue = "nextValue";
        stateObserver.ingestValue = jest.fn();

        stateObserver.ingest({
          force: true,
          key: "coolKey",
          storage: false,
          sideEffects: false,
          background: true,
          perform: false,
        });

        expect(stateObserver.ingestValue).toHaveBeenCalledWith("nextValue", {
          force: true,
          key: "coolKey",
          storage: false,
          sideEffects: false,
          background: true,
          perform: false,
        });
      });

      it("should call ingestValue with computedValue if observer belongs to a ComputedState (default config)", () => {
        dummyComputed.computeFunction = () => "computedValue";
        computedObserver.ingestValue = jest.fn();

        computedObserver.ingest();

        expect(computedObserver.ingestValue).toHaveBeenCalledWith(
          "computedValue",
          {}
        );
      });
    });

    describe("ingestValue function tests", () => {
      it("should ingest State into Runtime if newValue isn't equal to the current State Value (default config)", () => {
        stateObserver.ingestValue("updatedDummyValue");

        expect(stateObserver.nextStateValue).toBe("updatedDummyValue");
        expect(dummyAgile.runtime.ingest).toHaveBeenCalledWith(stateObserver, {
          perform: true,
          background: false,
          sideEffects: true,
          force: false,
          storage: true,
        });
      });

      it("shouldn't ingest State into Runtime if newValue is equal to the current State Value (default config)", () => {
        dummyState._value = "updatedDummyValue";
        stateObserver.ingestValue("updatedDummyValue");

        expect(stateObserver.nextStateValue).toBe("updatedDummyValue");
        expect(dummyAgile.runtime.ingest).not.toHaveBeenCalled();
      });

      it("should ingest State into Runtime if newValue is equal to the current State Value (config.force = true)", () => {
        dummyState._value = "updatedDummyValue";
        stateObserver.ingestValue("updatedDummyValue", { force: true });

        expect(stateObserver.nextStateValue).toBe("updatedDummyValue");
        expect(dummyAgile.runtime.ingest).toHaveBeenCalledWith(stateObserver, {
          perform: true,
          background: false,
          sideEffects: true,
          force: true,
          storage: true,
        });
      });

      it("should ingest State into Runtime and compute newStateValue if State compute Function is set (default config)", () => {
        dummyState.computeMethod = (value) => `cool value '${value}'`;
        stateObserver.ingestValue("updatedDummyValue");

        expect(stateObserver.nextStateValue).toBe(
          "cool value 'updatedDummyValue'"
        );
        expect(dummyAgile.runtime.ingest).toHaveBeenCalledWith(stateObserver, {
          perform: true,
          background: false,
          sideEffects: true,
          force: false,
          storage: true,
        });
      });
    });

    describe("perform function tests", () => {
      // TODO
    });
  });
});
