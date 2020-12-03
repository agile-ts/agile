import { Agile, Integration, Integrations } from "../../../src";

describe("Integrations Tests", () => {
  let dummyAgile: Agile;

  beforeEach(() => {
    console.error = jest.fn();
    console.warn = jest.fn();
    dummyAgile = new Agile({ localStorage: false });
    Agile.initialIntegrations = [];
  });

  it("should create Integrations", () => {
    const integrations = new Integrations(dummyAgile);

    expect(integrations.integrations.size).toBe(0);
  });

  it("should create Integrations and integrate Agile initialIntegrations", () => {
    const dummyIntegration1 = new Integration({
      key: "initialIntegration1",
    });
    const dummyIntegration2 = new Integration({
      key: "initialIntegration2",
    });
    Agile.initialIntegrations.push(dummyIntegration1);
    Agile.initialIntegrations.push(dummyIntegration2);

    const integrations = new Integrations(dummyAgile);

    // Sleep 5ms because initialIntegrations get integrated async
    return new Promise((resolve) => setTimeout(resolve, 5)).then(() => {
      expect(integrations.integrations.size).toBe(2);
      expect(integrations.integrations.has(dummyIntegration1)).toBeTruthy();
      expect(integrations.integrations.has(dummyIntegration2)).toBeTruthy();
    });
  });

  describe("Integrations Function Tests", () => {
    let integrations: Integrations;
    let dummyIntegration1: Integration;
    let dummyIntegration2: Integration;

    beforeEach(() => {
      integrations = new Integrations(dummyAgile);
      dummyIntegration1 = new Integration({
        key: "dummyIntegration1",
      });
      dummyIntegration2 = new Integration({
        key: "dummyIntegration2",
      });
    });

    describe("integrate function tests", () => {
      it("should integrate valid integration with no bind function", () => {
        integrations.integrate(dummyIntegration1).then((success) => {
          expect(success).toBeTruthy();
          expect(integrations.integrations.has(dummyIntegration1)).toBeTruthy();
          expect(dummyIntegration1.ready).toBeTruthy();
          expect(dummyIntegration1.integrated).toBeTruthy();
        });
      });

      it("should integrate valid integration with bind function that returns true", () => {
        dummyIntegration1.methods.bind = jest.fn(() => Promise.resolve(true));

        integrations.integrate(dummyIntegration1).then((success) => {
          expect(success).toBeTruthy();
          expect(integrations.integrations.has(dummyIntegration1)).toBeTruthy();
          expect(dummyIntegration1.ready).toBeTruthy();
          expect(dummyIntegration1.integrated).toBeTruthy();

          expect(dummyIntegration1.methods.bind).toHaveBeenCalledWith(
            dummyAgile
          );
        });
      });

      it("should integrate valid integration with bind function that returns false", () => {
        dummyIntegration1.methods.bind = jest.fn(() => Promise.resolve(false));

        integrations.integrate(dummyIntegration1).then((success) => {
          expect(success).toBeTruthy();
          expect(integrations.integrations.has(dummyIntegration1)).toBeTruthy();
          expect(dummyIntegration1.ready).toBeFalsy();
          expect(dummyIntegration1.integrated).toBeTruthy();

          expect(dummyIntegration1.methods.bind).toHaveBeenCalledWith(
            dummyAgile
          );
        });
      });

      it("shouldn't integrate Integration with no key", () => {
        dummyIntegration1.key = undefined;

        integrations.integrate(dummyIntegration1).then((success) => {
          expect(success).toBeFalsy();
          expect(integrations.integrations.has(dummyIntegration1)).toBeFalsy();
          expect(dummyIntegration1.ready).toBeFalsy();
          expect(dummyIntegration1.integrated).toBeFalsy();

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
        integrations.integrate(dummyIntegration1);
        integrations.integrate(dummyIntegration2);
      });

      it("should call updateMethod on each ready Integration", () => {
        dummyIntegration1.ready = false;
        dummyIntegration1.methods.updateMethod = jest.fn();
        dummyIntegration2.methods.updateMethod = jest.fn();

        integrations.update(componentInstance, updatedData);

        expect(dummyIntegration1.methods.updateMethod).not.toHaveBeenCalled();
        expect(dummyIntegration2.methods.updateMethod).toHaveBeenCalledWith(
          componentInstance,
          updatedData
        );

        expect(console.warn).toHaveBeenCalledWith(
          "Agile Warn: Integration 'dummyIntegration1' isn't ready yet!"
        );
      });
    });

    describe("hasIntegration function tests", () => {
      it("should return false if Integrations has no integrated Integration", () => {
        expect(integrations.hasIntegration()).toBeFalsy();
      });

      it("should return true if Integrations has at least one integrated Integration", () => {
        integrations.integrate(dummyIntegration1);

        expect(integrations.hasIntegration()).toBeTruthy();
      });
    });
  });
});
