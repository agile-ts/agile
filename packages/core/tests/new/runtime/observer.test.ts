import { Observer, Agile, SubscriptionContainer, Job } from "../../../src";

describe("Observer Tests", () => {
  let agile: Agile;
  let dummyObserver1: Observer;
  let dummyObserver2: Observer;
  let dummySubscription1: SubscriptionContainer;
  let dummySubscription2: SubscriptionContainer;

  beforeEach(() => {
    console.warn = jest.fn();
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
    let observer: Observer;

    beforeEach(() => {
      observer = new Observer(agile, { key: "observer" });
    });

    describe("depend function tests", () => {
      let dummyObserver1: Observer;
      let dummyObserver2: Observer;

      beforeEach(() => {
        dummyObserver1 = new Observer(agile, { key: "dummyObserver1" });
        dummyObserver2 = new Observer(agile, { key: "dummyObserver2" });
      });

      it("should add observer to deps", () => {
        observer.depend(dummyObserver1);
        observer.depend(dummyObserver2);

        expect(observer.deps.size).toBe(2);
        expect(observer.deps.has(dummyObserver1));
        expect(observer.deps.has(dummyObserver2));
      });

      it("shouldn't add same observer twice to deps", () => {
        observer.depend(dummyObserver1);
        observer.depend(dummyObserver1);

        expect(observer.deps.size).toBe(1);
        expect(observer.deps.has(dummyObserver1));
      });
    });

    describe("subscribe function tests", () => {
      let dummySubscriptionContainer1: SubscriptionContainer;
      let dummySubscriptionContainer2: SubscriptionContainer;

      beforeEach(() => {
        dummySubscriptionContainer1 = new SubscriptionContainer();
        dummySubscriptionContainer2 = new SubscriptionContainer();
      });

      it("should add subscriptionContainer to subs", () => {
        observer.subscribe(dummySubscriptionContainer1);
        observer.subscribe(dummySubscriptionContainer2);

        expect(observer.subs.size).toBe(2);
        expect(observer.subs.has(dummySubscriptionContainer1));
        expect(observer.subs.has(dummySubscriptionContainer2));
      });

      it("shouldn't add same subscriptionContainer twice to subs", () => {
        observer.subscribe(dummySubscriptionContainer1);
        observer.subscribe(dummySubscriptionContainer1);

        expect(observer.subs.size).toBe(1);
        expect(observer.subs.has(dummySubscriptionContainer1));
      });
    });

    describe("unsubscribe function tests", () => {
      let dummySubscriptionContainer1: SubscriptionContainer;
      let dummySubscriptionContainer2: SubscriptionContainer;

      beforeEach(() => {
        dummySubscriptionContainer1 = new SubscriptionContainer();
        dummySubscriptionContainer2 = new SubscriptionContainer();
        observer.subscribe(dummySubscriptionContainer1);
        observer.subscribe(dummySubscriptionContainer2);
      });

      it("should remove subscriptionContainer from subs", () => {
        observer.unsubscribe(dummySubscriptionContainer1);

        expect(observer.subs.size).toBe(1);
        expect(observer.subs.has(dummySubscriptionContainer1));
      });
    });

    describe("function that get overwritten tests | because Observer is no stand alone class", () => {
      describe("perform function tests", () => {
        it("should print warning", () => {
          const job = new Job(observer);
          observer.perform(job);

          expect(console.warn).toHaveBeenCalledWith(
            "Agile Warn: Perform function isn't Set in Observer! Be aware that Observer is no stand alone class!"
          );
        });
      });
    });
  });
});
