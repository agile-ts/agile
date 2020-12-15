import { Event, Agile, Observer, EventObserver } from "../../../src";
import * as Utils from "../../../src/utils";

describe("Event Tests", () => {
  let dummyAgile: Agile;

  beforeEach(() => {
    dummyAgile = new Agile({ localStorage: false });
    console.error = jest.fn();
  });

  it("should create Event (default config)", () => {
    const event = new Event(dummyAgile);

    expect(event.config).toStrictEqual({
      maxUses: undefined,
      delay: undefined,
      rerender: false,
    });
    expect(event._key).toBeUndefined();
    expect(event.uses).toBe(0);
    expect(event.callbacks).toStrictEqual({});
    expect(event.enabled).toBeTruthy();
    expect(event.observer).toBeInstanceOf(EventObserver);
    expect(event.observer.deps.size).toBe(0);
    expect(event.observer.key).toBeUndefined();
    expect(event.currentTimeout).toBeUndefined();
    expect(event.queue).toStrictEqual([]);
    expect(event.payload).toBeUndefined();
  });

  it("should create Event (specific config)", () => {
    const dummyObserver = new Observer(dummyAgile);

    const event = new Event(dummyAgile, {
      key: "coolEvent",
      deps: [dummyObserver],
      delay: 20,
      maxUses: 40,
      enabled: false,
      rerender: true,
    });

    expect(event.config).toStrictEqual({
      maxUses: 40,
      delay: 20,
      rerender: true,
    });
    expect(event._key).toBe("coolEvent");
    expect(event.uses).toBe(0);
    expect(event.callbacks).toStrictEqual({});
    expect(event.enabled).toBeFalsy();
    expect(event.observer).toBeInstanceOf(EventObserver);
    expect(event.observer.deps.size).toBe(1);
    expect(event.observer.deps.has(dummyObserver)).toBeTruthy();
    expect(event.observer.key).toBe("coolEvent");
    expect(event.currentTimeout).toBeUndefined();
    expect(event.queue).toStrictEqual([]);
    expect(event.payload).toBeUndefined();
  });

  describe("Event Function Tests", () => {
    let event: Event;

    beforeEach(() => {
      event = new Event(dummyAgile, {
        key: "eventKey",
      });
    });

    describe("key set function tests", () => {
      it("should call setKey with passed value", () => {
        event.setKey = jest.fn();

        event.key = "newKey";

        expect(event.setKey).toHaveBeenCalledWith("newKey");
      });
    });

    describe("key get function tests", () => {
      it("should return current State Key", () => {
        expect(event.key).toBe("eventKey");
      });
    });

    describe("setKey function tests", () => {
      it("should update existing Key in all instances", () => {
        event.setKey("newKey");

        expect(event.key).toBe("newKey");
        expect(event.observer.key).toBe("newKey");
      });
    });

    describe("on function tests", () => {
      const dummyCallbackFunction1 = () => {};
      const dummyCallbackFunction2 = () => {};

      it("should add passed callbackFunction to callbacks at passed key", () => {
        const response = event.on("dummyKey", dummyCallbackFunction1);

        expect(response).toBe(event);
        expect(event.callbacks).toHaveProperty("dummyKey");
        expect(event.callbacks["dummyKey"]).toBe(dummyCallbackFunction1);
      });

      it("should add passed callbackFunction to callbacks at random key if no key passed and return that generated key", () => {
        jest.spyOn(Utils, "generateId").mockReturnValue("randomKey");

        const response = event.on(dummyCallbackFunction1);

        expect(response).toBe("randomKey");
        expect(event.callbacks).toHaveProperty("randomKey");
        expect(event.callbacks["randomKey"]).toBe(dummyCallbackFunction1);
        expect(Utils.generateId).toHaveBeenCalled();
      });

      it("shouldn't add passed invalid callbackFunction to callbacks at passed key", () => {
        const response = event.on("dummyKey", "noFunction hehe" as any);

        expect(response).toBe(event);
        expect(event.callbacks).not.toHaveProperty("dummyKey");
        expect(console.error).toHaveBeenCalledWith(
          "Agile Error: A Event Callback Function has to be typeof Function!"
        );
      });

      it("shouldn't add passed callbackFunction to callbacks at passed key if passed key is already occupied", () => {
        event.callbacks["dummyKey"] = dummyCallbackFunction2;

        const response = event.on("dummyKey", dummyCallbackFunction1);

        expect(response).toBe(event);
        expect(event.callbacks).toHaveProperty("dummyKey");
        expect(event.callbacks["dummyKey"]).toBe(dummyCallbackFunction2);
        expect(console.error).toHaveBeenCalledWith(
          "Agile Error: Event Callback Function with the key/name 'dummyKey' already exists!"
        );
      });
    });

    describe("trigger function tests", () => {
      // TODO
    })
  });
});
