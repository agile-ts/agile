import {
  EventObserver,
  Agile,
  Observer,
  SubscriptionContainer,
  Event,
} from "../../../src";

describe("EventObserver Tests", () => {
  let dummyAgile: Agile;
  let dummyEvent: Event;

  beforeEach(() => {
    dummyAgile = new Agile({ localStorage: false });
    dummyEvent = new Event(dummyAgile);
  });

  it("should create EventObserver (default config)", () => {
    const eventObserver = new EventObserver(dummyEvent);

    expect(eventObserver).toBeInstanceOf(EventObserver);
    expect(eventObserver.event()).toBe(dummyEvent);
    /* Couldn't figure out how to mock anything in the Constructor
        expect(Observer).toHaveBeenCalledWith(dummyAgile, {
          deps: [],
          value: "dummyValue",
          key: undefined,
          subs: [],
        });
    */
    expect(eventObserver.value).toBeUndefined();
    expect(eventObserver._key).toBeUndefined();
    expect(eventObserver.deps.size).toBe(0);
    expect(eventObserver.subs.size).toBe(0);
  });

  it("should create EventObserver (specific config)", () => {
    const dummyObserver1 = new Observer(dummyAgile, { key: "dummyObserver1" });
    const dummyObserver2 = new Observer(dummyAgile, { key: "dummyObserver2" });
    const dummySubscription1 = new SubscriptionContainer();
    const dummySubscription2 = new SubscriptionContainer();

    const eventObserver = new EventObserver(dummyEvent, {
      key: "testKey",
      deps: [dummyObserver1, dummyObserver2],
      subs: [dummySubscription1, dummySubscription2],
    });

    expect(eventObserver).toBeInstanceOf(EventObserver);
    expect(eventObserver.event()).toBe(dummyEvent);
    /* Couldn't figure out how to mock anything in the Constructor
        expect(Observer).toHaveBeenCalledWith(dummyAgile, {
          deps: [dummyObserver1, dummyObserver2],
          value: "dummyValue",
          key: "testKey",
          subs: [dummySubscription1, dummySubscription2],
        });
    */
    expect(eventObserver.value).toBeUndefined();
    expect(eventObserver._key).toBe("testKey");
    expect(eventObserver.deps.size).toBe(2);
    expect(eventObserver.deps.has(dummyObserver2)).toBeTruthy();
    expect(eventObserver.deps.has(dummyObserver1)).toBeTruthy();
    expect(eventObserver.subs.size).toBe(2);
    expect(eventObserver.subs.has(dummySubscription1)).toBeTruthy();
    expect(eventObserver.subs.has(dummySubscription2)).toBeTruthy();
  });

  describe("EventObserver Function Tests", () => {
    let eventObserver: EventObserver;

    beforeEach(() => {
      eventObserver = new EventObserver(dummyEvent, {
        key: "eventObserverKey",
      });
    });

    describe("trigger function tests", () => {
      it("should ingest Event into Runtime (default config)", () => {
        dummyAgile.runtime.ingest = jest.fn();

        eventObserver.trigger();

        expect(dummyAgile.runtime.ingest).toHaveBeenCalledWith(
          eventObserver,
          {}
        );
      });

      it("should ingest Event into Runtime (specific config)", () => {
        dummyAgile.runtime.ingest = jest.fn();

        eventObserver.trigger({
          background: true,
          key: "coolKey",
          storage: false,
        });

        expect(dummyAgile.runtime.ingest).toHaveBeenCalledWith(eventObserver, {
          background: true,
          key: "coolKey",
          storage: false,
        });
      });
    });

    describe("perfom function tests", () => {
      // No tests necessary
    });
  });
});
