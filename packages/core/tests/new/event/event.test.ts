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
    let event: Event<string>;

    beforeEach(() => {
      event = new Event<string>(dummyAgile, {
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
      beforeEach(() => {
        event.delayedTrigger = jest.fn();
        event.normalTrigger = jest.fn();
      });

      it("should call normalTrigger if Event is enabled (config.delay = false)", () => {
        event.enabled = true;
        event.config.delay = undefined;

        event.trigger("myPayload", ["specificKey"]);

        expect(event.normalTrigger).toHaveBeenCalledWith("myPayload", [
          "specificKey",
        ]);
        expect(event.delayedTrigger).not.toHaveBeenCalled();
      });

      it("shouldn't call normalTrigger if Event isn't enabled (config.delay = false)", () => {
        event.enabled = false;
        event.config.delay = undefined;

        event.trigger("myPayload", ["specificKey"]);

        expect(event.normalTrigger).not.toHaveBeenCalled();
        expect(event.delayedTrigger).not.toHaveBeenCalled();
      });

      it("should call normalTrigger if Event is enabled (config.delay = false)", () => {
        event.enabled = true;
        event.config.delay = 10;

        event.trigger("myPayload", ["specificKey"]);

        expect(event.delayedTrigger).toHaveBeenCalledWith("myPayload", 10, [
          "specificKey",
        ]);
        expect(event.normalTrigger).not.toHaveBeenCalled();
      });

      it("shouldn't call normalTrigger if Event isn't enabled (config.delay = false)", () => {
        event.enabled = false;
        event.config.delay = 10;

        event.trigger("myPayload", ["specificKey"]);

        expect(event.delayedTrigger).not.toHaveBeenCalled();
        expect(event.normalTrigger).not.toHaveBeenCalled();
      });
    });

    describe("disable function tests", () => {
      it("should disable Event", () => {
        event.enabled = undefined;

        event.disable();

        expect(event.enabled).toBeFalsy();
      });
    });

    describe("enable function tests", () => {
      it("should enable Event", () => {
        event.enabled = undefined;

        event.enable();

        expect(event.enabled).toBeTruthy();
      });
    });

    describe("reset function tests", () => {
      it("should reset enabled, uses and the currentTimeout", () => {
        const timeout = setTimeout(() => {}, 1000);
        // @ts-ignore
        clearTimeout = jest.fn();
        event.enabled = undefined;
        event.uses = 100;
        event.currentTimeout = timeout;

        event.reset();

        expect(event.enabled).toBeTruthy();
        expect(event.uses).toBe(0);
        expect(event.currentTimeout).toBeUndefined();
        expect(clearTimeout).toHaveBeenCalledWith(timeout);
      });
    });

    describe("removeCallback function tests", () => {
      beforeEach(() => {
        event.callbacks["dummyKey"] = () => {};
      });

      it("should remove callback at key from Event", () => {
        event.removeCallback("dummyKey");

        expect(event.callbacks).not.toHaveProperty("dummyKey");
      });
    });

    describe("normalTrigger function tests", () => {
      const dummyPayload = "123";
      const dummyCallbackFunction1 = jest.fn();
      const dummyCallbackFunction2 = jest.fn();
      const dummyCallbackFunction3 = jest.fn();

      beforeEach(() => {
        event.observer.trigger = jest.fn();
        event.disable = jest.fn();

        event.callbacks["callback1"] = dummyCallbackFunction1;
        event.callbacks["callback2"] = dummyCallbackFunction2;
        event.callbacks["callback3"] = dummyCallbackFunction3;
      });

      it("should call callback functions at passed keys with passed payload", () => {
        event.config.rerender = false;
        event.uses = 0;

        event.normalTrigger(dummyPayload, ["callback1", "callback3"]);

        expect(dummyCallbackFunction1).toHaveBeenCalledWith(dummyPayload);
        expect(dummyCallbackFunction2).not.toHaveBeenCalled();
        expect(dummyCallbackFunction3).toHaveBeenCalledWith(dummyPayload);
        expect(event.observer.trigger).not.toHaveBeenCalled();
        expect(event.disable).not.toHaveBeenCalled();
        expect(event.uses).toBe(1);
      });

      it("should call all callback functions with passed payload", () => {
        event.config.rerender = false;
        event.uses = 0;

        event.normalTrigger(dummyPayload);

        expect(dummyCallbackFunction1).toHaveBeenCalledWith(dummyPayload);
        expect(dummyCallbackFunction2).toHaveBeenCalledWith(dummyPayload);
        expect(dummyCallbackFunction3).toHaveBeenCalledWith(dummyPayload);
        expect(event.observer.trigger).not.toHaveBeenCalled();
        expect(event.disable).not.toHaveBeenCalled();
        expect(event.uses).toBe(1);
      });

      it("should call all callback functions and trigger a rerender (config.rerender)", () => {
        event.config.rerender = true;
        event.uses = 0;

        event.normalTrigger(dummyPayload);

        expect(dummyCallbackFunction1).toHaveBeenCalledWith(dummyPayload);
        expect(dummyCallbackFunction2).toHaveBeenCalledWith(dummyPayload);
        expect(dummyCallbackFunction3).toHaveBeenCalledWith(dummyPayload);
        expect(event.observer.trigger).toHaveBeenCalled();
        expect(event.disable).not.toHaveBeenCalled();
        expect(event.uses).toBe(1);
      });

      it("should call all callback functions and disable event if maxUses got reached (config.maxUses)", () => {
        event.config.maxUses = 2;
        event.config.rerender = false;
        event.uses = 0;

        event.normalTrigger(dummyPayload);
        event.normalTrigger(dummyPayload);

        expect(dummyCallbackFunction1).toHaveBeenCalledWith(dummyPayload);
        expect(dummyCallbackFunction2).toHaveBeenCalledWith(dummyPayload);
        expect(dummyCallbackFunction3).toHaveBeenCalledWith(dummyPayload);
        expect(event.observer.trigger).not.toHaveBeenCalled();
        expect(event.disable).toHaveBeenCalled();
        expect(event.uses).toBe(2);
      });
    });
  });
});
