import {
  Agile,
  Observer,
  SubController,
  SubscriptionContainer,
} from "../../../src";

describe("SubController Tests", () => {
  let agile: Agile;

  beforeEach(() => {
    agile = new Agile();
  });

  it("should create SubController", () => {
    const subController = new SubController(agile);

    expect(subController.callbackSubs.size).toBe(0);
    expect(subController.callbackSubs.size).toBe(0);
  });

  describe("Normal SubController Tests", () => {
    let subController: SubController;
    let dummyObserver1: Observer;
    let dummyObserver2: Observer;

    beforeEach(() => {
      dummyObserver1 = new Observer(agile, {
        key: "dummyObserver1",
        value: "firstValue",
      });
      dummyObserver2 = new Observer(agile, { key: "dummyObserver2" });
      subController = new SubController(agile);
    });

    describe("subscribeWithSubsObject function tests", () => {
      const dummyIntegration = () => {};
      let dummySubscriptionContainer: SubscriptionContainer;

      beforeEach(() => {
        dummySubscriptionContainer = new SubscriptionContainer();
        subController.registerSubscription = jest.fn(
          () => dummySubscriptionContainer
        );
        dummyObserver1.subscribe = jest.fn();
        dummyObserver2.subscribe = jest.fn();
      });

      it("should create subContainer and add observer in Object Shape to it", () => {
        const subscribeWithSubsResponse = subController.subscribeWithSubsObject(
          dummyIntegration,
          {
            dummyObserver1: dummyObserver1,
            dummyObserver2: dummyObserver2,
          },
          "subscribeWithSubsObjectKey"
        );

        expect(subscribeWithSubsResponse).toStrictEqual({
          props: {
            dummyObserver1: "firstValue",
          },
          subscriptionContainer: dummySubscriptionContainer,
        });

        expect(
          subController.registerSubscription
        ).toHaveBeenCalledWith(dummyIntegration, [
          dummyObserver1,
          dummyObserver2,
        ]);

        expect(dummySubscriptionContainer.isObjectBased).toBeTruthy();
        expect(dummySubscriptionContainer.subsObject).toStrictEqual({
          dummyObserver1: dummyObserver1,
          dummyObserver2: dummyObserver2,
        });
        expect(dummySubscriptionContainer.subs.size).toBe(2);
        expect(
          dummySubscriptionContainer.subs.has(dummyObserver1)
        ).toBeTruthy();
        expect(
          dummySubscriptionContainer.subs.has(dummyObserver2)
        ).toBeTruthy();

        expect(dummyObserver1.subscribe).toHaveBeenCalledWith(
          dummySubscriptionContainer
        );
        expect(dummyObserver2.subscribe).toHaveBeenCalledWith(
          dummySubscriptionContainer
        );
      });
    });

    describe("subscribeWithSubsArray function tests", () => {
      const dummyIntegration = () => {};
      let dummySubscriptionContainer: SubscriptionContainer;

      beforeEach(() => {
        dummySubscriptionContainer = new SubscriptionContainer();
        subController.registerSubscription = jest.fn(
          () => dummySubscriptionContainer
        );
        dummyObserver1.subscribe = jest.fn();
        dummyObserver2.subscribe = jest.fn();
      });

      it("should create subContainer and add observer in Array Shape to it", () => {
        const subscribeWithSubsArrayResponse = subController.subscribeWithSubsArray(
          dummyIntegration,
          [dummyObserver1, dummyObserver2],
          "subscribeWithSubsArrayKey"
        );

        // TODO
      });
    });
  });
});
