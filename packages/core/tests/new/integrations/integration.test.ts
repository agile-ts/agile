import { Integration } from "../../../src";

describe("Integration Tests", () => {
  it("should instantiate Integration", () => {
    const integrationConfig = { bind: () => true, name: "test" };
    const integration = new Integration(integrationConfig);

    expect(integration.ready).toBe(false);
    expect(integration.config).toStrictEqual(integrationConfig);
  });
});
