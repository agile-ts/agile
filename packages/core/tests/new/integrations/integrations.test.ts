import { Agile, Integration, Integrations } from "../../../src";

describe("Integrations Tests", () => {
  let agile: Agile;

  beforeEach(() => {
    agile = new Agile({ localStorage: false });
  });

  it("should instantiate Integrations", () => {
    const integrations = new Integrations(agile);

    expect(integrations.integrations.size).toBe(0);
  });

  it("should instantiate Integrations and integrate Agile initialIntegrations", () => {
    const integration1 = new Integration({ bind: () => true, name: "test" });
    const integration2 = new Integration({ bind: () => true, name: "tes2" });
    Agile.initialIntegrations.push(integration1);
    Agile.initialIntegrations.push(integration2);
    const integrations = new Integrations(agile);

    expect(integrations.integrations.size).toBe(2);
    expect(integrations.integrations.has(integration1)).toBeTruthy();
    expect(integrations.integrations.has(integration2)).toBeTruthy();
  });

  describe("Default Integrations Tests", () => {
    // TODO

    describe("integration function tests", () => {});
  });
});
