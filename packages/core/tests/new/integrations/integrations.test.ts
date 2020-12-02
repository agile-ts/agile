import { Agile, Integration, Integrations } from "../../../src";

describe("Integrations Tests", () => {
  let agile: Agile;

  beforeEach(() => {
    console.error = jest.fn();
    console.warn = jest.fn();
    agile = new Agile({ localStorage: false });
    Agile.initialIntegrations = [];
  });

  it("should create Integrations", () => {
    const integrations = new Integrations(agile);

    expect(integrations.integrations.size).toBe(0);
  });

  it("should create Integrations and integrate Agile initialIntegrations", () => {
    const integration1 = new Integration({
      key: "initialIntegration1",
    });
    const integration2 = new Integration({
      key: "initialIntegration2",
    });
    Agile.initialIntegrations.push(integration1);
    Agile.initialIntegrations.push(integration2);

    const integrations = new Integrations(agile);

    // Sleep 5ms because initialIntegrations get integrated async
    return new Promise((resolve) => setTimeout(resolve, 5)).then(() => {
      expect(integrations.integrations.size).toBe(2);
      expect(integrations.integrations.has(integration1)).toBeTruthy();
      expect(integrations.integrations.has(integration2)).toBeTruthy();
    });
  });

  describe("Default Integrations Tests", () => {
    let integrations: Integrations;
    let integration1: Integration;
    let integration2: Integration;

    beforeEach(() => {
      integrations = new Integrations(agile);
      integration1 = new Integration({
        key: "TestIntegration1",
      });
      integration2 = new Integration({
        key: "TestIntegration2",
      });
    });

    describe("integrate function tests", () => {
      it("should integrate valid integration with no bind function", () => {
        integrations.integrate(integration1).then((success) => {
          expect(success).toBeTruthy();
          expect(integrations.integrations.has(integration1)).toBeTruthy();
          expect(integration1.ready).toBeTruthy();
          expect(integration1.integrated).toBeTruthy();
        });
      });

      it("should integrate valid integration with bind function that returns true", () => {
        integration1.methods.bind = jest.fn(() => Promise.resolve(true));

        integrations.integrate(integration1).then((success) => {
          expect(success).toBeTruthy();
          expect(integrations.integrations.has(integration1)).toBeTruthy();
          expect(integration1.ready).toBeTruthy();
          expect(integration1.integrated).toBeTruthy();

          expect(integration1.methods.bind).toHaveBeenCalledWith(agile);
        });
      });

      it("should integrate valid integration with bind function that returns false", () => {
        integration1.methods.bind = jest.fn(() => Promise.resolve(false));

        integrations.integrate(integration1).then((success) => {
          expect(success).toBeTruthy();
          expect(integrations.integrations.has(integration1)).toBeTruthy();
          expect(integration1.ready).toBeFalsy();
          expect(integration1.integrated).toBeTruthy();

          expect(integration1.methods.bind).toHaveBeenCalledWith(agile);
        });
      });

      it("shouldn't integrate Integration with no key", () => {
        integration1.key = undefined;

        integrations.integrate(integration1).then((success) => {
          expect(success).toBeFalsy();
          expect(integrations.integrations.has(integration1)).toBeFalsy();
          expect(integration1.ready).toBeFalsy();
          expect(integration1.integrated).toBeFalsy();

          expect(console.error).toHaveBeenCalledWith(
            "Agile Error: Failed to integrate framework!"
          );
        });
      });
    });

    describe("update function tests", () => {
      const componentInstance = { my: "component" };
      const updatedData = { my: "updatedData" };

      beforeEach(() => {
        integrations.integrate(integration1);
        integrations.integrate(integration2);
      });

      it("should call updateMethod on each ready Integration", () => {
        integration1.ready = false;
        integration1.methods.updateMethod = jest.fn();
        integration2.methods.updateMethod = jest.fn();

        integrations.update(componentInstance, updatedData);

        expect(integration1.methods.updateMethod).not.toHaveBeenCalled();
        expect(integration2.methods.updateMethod).toHaveBeenCalledWith(
          componentInstance,
          updatedData
        );

        expect(console.warn).toHaveBeenCalledWith(
          "Agile Warn: Integration 'TestIntegration1' isn't ready yet!"
        );
      });
    });

    describe("hasIntegration function tests", () => {
      it("should return false if Integrations has no integrated Integration", () => {
        expect(integrations.hasIntegration()).toBeFalsy();
      });

      it("should return true if Integrations has at least one integrated Integration", () => {
        integrations.integrate(integration1);

        expect(integrations.hasIntegration()).toBeTruthy();
      });
    });
  });
});
