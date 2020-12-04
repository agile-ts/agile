import { Agile, CallbackSubscriptionContainer } from "../../../../../src";

describe("CallbackSubscriptionContainer Tests", () => {
  let dummyAgile: Agile;

  beforeEach(() => {
    dummyAgile = new Agile();
  });

  it("should create CallbackSubscriptionContainer", () => {
    const dummyIntegration = () => {};

    const subscriptionContainer = new CallbackSubscriptionContainer(
      dummyIntegration
    );

    expect(subscriptionContainer.callback).toBe(dummyIntegration);
  });
});
