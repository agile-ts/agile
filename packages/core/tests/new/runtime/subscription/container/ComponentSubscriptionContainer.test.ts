import { Agile, ComponentSubscriptionContainer } from "../../../../../src";

describe("ComponentSubscriptionContainer Tests", () => {
  let dummyAgile: Agile;

  beforeEach(() => {
    dummyAgile = new Agile();
  });

  it("should create ComponentSubscriptionContainer", () => {
    const dummyIntegration = { dummy: "integration" };

    const subscriptionContainer = new ComponentSubscriptionContainer(
      dummyIntegration
    );

    expect(subscriptionContainer.component).toStrictEqual(dummyIntegration);
  });
});
