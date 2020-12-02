import { Observer, Agile, SubscriptionContainer } from "../../../src";

describe("Observer Tests", () => {
  let agile: Agile;
  let dummyObserver1: Observer;
  let dummyObserver2: Observer;
  let dummySubscription1: SubscriptionContainer;
  let dummySubscription2: SubscriptionContainer;

  beforeEach(() => {
    agile = new Agile();
    dummyObserver1 = new Observer(agile, { key: "dummyObserver1" });
    dummyObserver2 = new Observer(agile, { key: "dummyObserver2" });
    dummySubscription1 = new SubscriptionContainer();
    dummySubscription2 = new SubscriptionContainer();
  });

  it("should create Observer", () => {
    const observer = new Observer(agile, {
      key: "testKey",
      subs: [dummySubscription1, dummySubscription2],
      deps: [dummyObserver1, dummyObserver2],
      value: "coolValue",
    });

    expect(observer._key).toBe("testKey");
    expect(observer.value).toBe("coolValue");
    expect(observer.deps.size).toBe(2);
    expect(observer.deps.has(dummyObserver2)).toBeTruthy();
    expect(observer.deps.has(dummyObserver1)).toBeTruthy();
    expect(observer.subs.size).toBe(2);
    expect(observer.subs.has(dummySubscription1)).toBeTruthy();
    expect(observer.subs.has(dummySubscription2)).toBeTruthy();
  });

  describe("Observer Function Tests", () => {
    // TODO
  });
});
