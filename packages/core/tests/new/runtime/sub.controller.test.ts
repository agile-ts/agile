import {
  Agile,
  CallbackSubscriptionContainer,
  ComponentSubscriptionContainer,
  Observer,
  SubController,
  SubscriptionContainer,
} from "../../../src";

describe("SubController Tests", () => {
  let agile: Agile;

  beforeEach(() => {
    agile = new Agile({ localStorage: false });
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
      let dummySubscriptionContainer: SubscriptionContainer;

      beforeEach(() => {
        dummySubscriptionContainer = new SubscriptionContainer();
        subController.registerSubscription = jest.fn(
          () => dummySubscriptionContainer
        );
        dummyObserver1.subscribe = jest.fn();
        dummyObserver2.subscribe = jest.fn();
      });

      it("should create subContainer and add in Object shape passed observers to it", () => {
        const dummyIntegration = () => {};

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

        expect(subController.registerSubscription).toHaveBeenCalledWith(
          dummyIntegration,
          [dummyObserver1, dummyObserver2],
          "subscribeWithSubsObjectKey"
        );

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
      let dummySubscriptionContainer: SubscriptionContainer;

      beforeEach(() => {
        dummySubscriptionContainer = new SubscriptionContainer();
        subController.registerSubscription = jest.fn(
          () => dummySubscriptionContainer
        );
        dummyObserver1.subscribe = jest.fn();
        dummyObserver2.subscribe = jest.fn();
      });

      it("should create subContainer and add in Array Shape passed observers to it", () => {
        const dummyIntegration = () => {};

        const subscribeWithSubsArrayResponse = subController.subscribeWithSubsArray(
          dummyIntegration,
          [dummyObserver1, dummyObserver2],
          "subscribeWithSubsArrayKey"
        );

        expect(subscribeWithSubsArrayResponse).toBe(dummySubscriptionContainer);

        expect(subController.registerSubscription).toHaveBeenCalledWith(
          dummyIntegration,
          [dummyObserver1, dummyObserver2],
          "subscribeWithSubsArrayKey"
        );

        expect(dummySubscriptionContainer.isObjectBased).toBeFalsy();
        expect(dummySubscriptionContainer.subsObject).toBeUndefined();
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

    describe("registerSubscription function tests", () => {
      let dummySubscriptionContainer: SubscriptionContainer;

      beforeEach(() => {
        dummySubscriptionContainer = new SubscriptionContainer();
        subController.registerCallbackSubscription = jest.fn(
          () => dummySubscriptionContainer as CallbackSubscriptionContainer
        );
        subController.registerComponentSubscription = jest.fn(
          () => dummySubscriptionContainer as ComponentSubscriptionContainer
        );
        dummyObserver1.subscribe = jest.fn();
        dummyObserver2.subscribe = jest.fn();
      });

      it("should call registerCallbackSubscription if passed integrationInstance is Function", () => {
        const dummyIntegration = () => {};

        const subscriptionContainer = subController.registerSubscription(
          dummyIntegration,
          [dummyObserver1, dummyObserver2],
          "niceKey"
        );

        expect(subscriptionContainer).toBe(dummySubscriptionContainer);
        expect(subController.registerCallbackSubscription).toHaveBeenCalledWith(
          dummyIntegration,
          [dummyObserver1, dummyObserver2],
          "niceKey"
        );
        expect(
          subController.registerComponentSubscription
        ).not.toHaveBeenCalled();
      });

      it("should call registerComponentSubscription if passed integrationInstance is Function", () => {
        const dummyIntegration = { dummy: "class" };

        const subscriptionContainer = subController.registerSubscription(
          dummyIntegration,
          [dummyObserver1, dummyObserver2],
          "niceKey"
        );

        expect(subscriptionContainer).toBe(dummySubscriptionContainer);
        expect(
          subController.registerComponentSubscription
        ).toHaveBeenCalledWith(
          dummyIntegration,
          [dummyObserver1, dummyObserver2],
          "niceKey"
        );
        expect(
          subController.registerCallbackSubscription
        ).not.toHaveBeenCalled();
      });
    });

    describe("registerCallbackSubscription function tests", () => {
      it("should return callbackSubscriptionContainer", () => {
        const dummyIntegration = () => {};

        const callbackSubscriptionContainer = subController.registerCallbackSubscription(
          dummyIntegration,
          [dummyObserver1, dummyObserver2],
          "myKey"
        );

        expect(callbackSubscriptionContainer).toBeInstanceOf(
          CallbackSubscriptionContainer
        );
        expect(callbackSubscriptionContainer.key).toBe("myKey");
        expect(callbackSubscriptionContainer.callback).toBe(dummyIntegration);
        expect(callbackSubscriptionContainer.ready).toBeTruthy();
        expect(callbackSubscriptionContainer.subs.size).toBe(2);
        expect(
          callbackSubscriptionContainer.subs.has(dummyObserver1)
        ).toBeTruthy();
        expect(
          callbackSubscriptionContainer.subs.has(dummyObserver2)
        ).toBeTruthy();

        expect(subController.callbackSubs.size).toBe(1);
        expect(
          subController.callbackSubs.has(callbackSubscriptionContainer)
        ).toBeTruthy();
      });
    });

    describe("registerComponentSubscription function tests", () => {
      it("should return ready componentSubscriptionContainer if agileInstance.config.mount = false", () => {
        const dummyIntegration: any = {
          dummy: "integration",
        };

        const componentSubscriptionContainer = subController.registerComponentSubscription(
          dummyIntegration,
          [dummyObserver1, dummyObserver2],
          "myKey"
        );

        expect(componentSubscriptionContainer).toBeInstanceOf(
          ComponentSubscriptionContainer
        );
        expect(componentSubscriptionContainer.key).toBe("myKey");
        expect(componentSubscriptionContainer.component).toStrictEqual(
          dummyIntegration
        );
        expect(componentSubscriptionContainer.ready).toBeTruthy();
        expect(componentSubscriptionContainer.subs.size).toBe(2);
        expect(
          componentSubscriptionContainer.subs.has(dummyObserver1)
        ).toBeTruthy();
        expect(
          componentSubscriptionContainer.subs.has(dummyObserver2)
        ).toBeTruthy();

        expect(subController.componentSubs.size).toBe(1);
        expect(
          subController.componentSubs.has(componentSubscriptionContainer)
        ).toBeTruthy();

        expect(dummyIntegration.componentSubscriptionContainer).toBe(
          componentSubscriptionContainer
        );
      });

      it("should return not ready componentSubscriptionContainer if agileInstance.config.mount = true and componentInstance isn't mounted", () => {
        agile.config.waitForMount = true;
        const dummyIntegration: any = {
          dummy: "integration",
        };

        const componentSubscriptionContainer = subController.registerComponentSubscription(
          dummyIntegration,
          [dummyObserver1, dummyObserver2],
          "myKey"
        );

        expect(componentSubscriptionContainer).toBeInstanceOf(
          ComponentSubscriptionContainer
        );
        expect(componentSubscriptionContainer.ready).toBeFalsy();
      });

      it("should return ready componentSubscriptionContainer if agileInstance.config.mount = true and componentInstance is mounted", () => {
        agile.config.waitForMount = true;
        const dummyIntegration: any = {
          dummy: "integration",
        };
        subController.mount(dummyIntegration);

        const componentSubscriptionContainer = subController.registerComponentSubscription(
          dummyIntegration,
          [dummyObserver1, dummyObserver2],
          "myKey"
        );

        expect(componentSubscriptionContainer).toBeInstanceOf(
          ComponentSubscriptionContainer
        );
        expect(componentSubscriptionContainer.ready).toBeTruthy();
      });
    });

    describe("unsubscribe function tests", () => {
      beforeEach(() => {
        dummyObserver1.unsubscribe = jest.fn();
        dummyObserver2.unsubscribe = jest.fn();
      });

      it("should unsubscribe callbackSubscriptionContainer", () => {
        const dummyIntegration = () => {};
        const callbackSubscriptionContainer = subController.registerCallbackSubscription(
          dummyIntegration,
          [dummyObserver1, dummyObserver2],
          "myKey"
        );

        subController.unsubscribe(callbackSubscriptionContainer);

        expect(subController.callbackSubs.size).toBe(0);
        expect(callbackSubscriptionContainer.ready).toBeFalsy();
        expect(dummyObserver1.unsubscribe).toHaveBeenCalledWith(
          callbackSubscriptionContainer
        );
        expect(dummyObserver2.unsubscribe).toHaveBeenCalledWith(
          callbackSubscriptionContainer
        );
      });

      it("should unsubscribe componentSubscriptionContainer", () => {
        const dummyIntegration: any = {
          dummy: "integration",
        };
        const componentSubscriptionContainer = subController.registerComponentSubscription(
          dummyIntegration,
          [dummyObserver1, dummyObserver2],
          "myKey"
        );

        subController.unsubscribe(componentSubscriptionContainer);

        expect(subController.componentSubs.size).toBe(0);
        expect(componentSubscriptionContainer.ready).toBeFalsy();
        expect(dummyObserver1.unsubscribe).toHaveBeenCalledWith(
          componentSubscriptionContainer
        );
        expect(dummyObserver2.unsubscribe).toHaveBeenCalledWith(
          componentSubscriptionContainer
        );
      });

      it("should unsubscribe componentSubscriptionContainer if passing Object that olds an componentSubscriptionContainer instance", () => {
        const dummyIntegration: any = {
          dummy: "integration",
        };
        const componentSubscriptionContainer = subController.registerComponentSubscription(
          dummyIntegration,
          [dummyObserver1, dummyObserver2],
          "myKey"
        );

        subController.unsubscribe(dummyIntegration);

        expect(subController.componentSubs.size).toBe(0);
        expect(componentSubscriptionContainer.ready).toBeFalsy();
        expect(dummyObserver1.unsubscribe).toHaveBeenCalledWith(
          componentSubscriptionContainer
        );
        expect(dummyObserver2.unsubscribe).toHaveBeenCalledWith(
          componentSubscriptionContainer
        );
      });
    });

    describe("mount function tests", () => {
      it("should add componentInstance to mountedComponents and set its subscriptionContainer to ready", () => {
        agile.config.waitForMount = true;
        const dummyIntegration: any = {
          dummy: "integration",
        };
        const componentSubscriptionContainer = subController.registerComponentSubscription(
          dummyIntegration,
          [dummyObserver1, dummyObserver2],
          "myKey"
        );

        subController.mount(dummyIntegration);

        expect(componentSubscriptionContainer.ready).toBeTruthy();
        expect(subController.mountedComponents.size).toBe(1);
        expect(
          subController.mountedComponents.has(dummyIntegration)
        ).toBeTruthy();
      });
    });

    describe("unmount function tests", () => {
      // TODO
    });
  });
});
