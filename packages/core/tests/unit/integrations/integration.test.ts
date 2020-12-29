import { Integration } from "../../../src";

describe("Integration Tests", () => {
  it("should create Integration", () => {
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

    expect(integration._key).toBe("test");
    expect(integration.frameworkInstance).toStrictEqual({ react: "native" });
    expect(integration.ready).toBeFalsy();
    expect(integration.integrated).toBeFalsy();
    expect(integration.methods).toStrictEqual(methods);
  });

  describe("Integration Function Tests", () => {
    let integration: Integration;

    beforeEach(() => {
      integration = new Integration({ key: "dummyIntegration" });
    });

    describe("key set function tests", () => {
      it("should update key in Integration", () => {
        integration.key = "myCoolKey";

        expect(integration._key).toBe("myCoolKey");
      });
    });

    describe("key get function tests", () => {
      it("should return current key of Integration", () => {
        integration._key = "myCoolKey";

        expect(integration.key).toBe("myCoolKey");
      });
    });
  });
});
