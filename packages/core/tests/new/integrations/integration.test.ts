import { Integration } from "../../../src";

describe("Integration Tests", () => {
  it("should instantiate Integration", () => {
    const methods = {
      bind: () => Promise.resolve(true),
      updateMethod: () => {},
    };
    const integrationConfig = {
      frameworkInstance: { react: "native" },
      key: "test",
      ...methods,
    };
    const integration = new Integration(integrationConfig);

    expect(integration.ready).toBeFalsy();
    expect(integration.integrated).toBeFalsy();
    expect(integration._key).toBe("test");
    expect(integration.frameworkInstance).toStrictEqual({ react: "native" });
    expect(integration.methods).toStrictEqual(methods);
  });
});
