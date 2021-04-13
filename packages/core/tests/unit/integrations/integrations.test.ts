import { Agile, Integration, Integrations } from '../../../src';
import mockConsole from 'jest-mock-console';

describe('Integrations Tests', () => {
  let dummyAgile: Agile;

  beforeEach(() => {
    jest.clearAllMocks();
    mockConsole(['error', 'warn']);

    dummyAgile = new Agile({ localStorage: false });
    Agile.initialIntegrations = [];

    jest.spyOn(Integrations.prototype, 'integrate');
  });

  it('should create Integrations', () => {
    const integrations = new Integrations(dummyAgile);

    expect(integrations.integrations.size).toBe(0);
  });

  it('should create Integrations and integrate Agile initialIntegrations', async () => {
    const dummyIntegration1 = new Integration({
      key: 'initialIntegration1',
    });
    const dummyIntegration2 = new Integration({
      key: 'initialIntegration2',
    });
    Agile.initialIntegrations.push(dummyIntegration1);
    Agile.initialIntegrations.push(dummyIntegration2);

    const integrations = new Integrations(dummyAgile);

    expect(integrations.integrations.size).toBe(2);
    expect(integrations.integrations.has(dummyIntegration1)).toBeTruthy();
    expect(integrations.integrations.has(dummyIntegration2)).toBeTruthy();

    expect(integrations.integrate).toHaveBeenCalledWith(dummyIntegration1);
    expect(integrations.integrate).toHaveBeenCalledWith(dummyIntegration2);
  });

  describe('Integrations Function Tests', () => {
    let integrations: Integrations;
    let dummyIntegration1: Integration;
    let dummyIntegration2: Integration;

    beforeEach(() => {
      integrations = new Integrations(dummyAgile);
      dummyIntegration1 = new Integration({
        key: 'dummyIntegration1',
      });
      dummyIntegration2 = new Integration({
        key: 'dummyIntegration2',
      });
    });

    describe('integrate function tests', () => {
      it('should integrate valid integration with no bind function', async () => {
        const response = await integrations.integrate(dummyIntegration1);

        expect(response).toBeTruthy();
        expect(integrations.integrations.has(dummyIntegration1)).toBeTruthy();
        expect(dummyIntegration1.ready).toBeTruthy();
        expect(dummyIntegration1.integrated).toBeTruthy();
      });

      it('should integrate valid integration with bind function that returns true', async () => {
        dummyIntegration1.methods.bind = jest.fn(() => Promise.resolve(true));

        const response = await integrations.integrate(dummyIntegration1);

        expect(response).toBeTruthy();
        expect(integrations.integrations.has(dummyIntegration1)).toBeTruthy();
        expect(dummyIntegration1.ready).toBeTruthy();
        expect(dummyIntegration1.integrated).toBeTruthy();
        expect(dummyIntegration1.methods.bind).toHaveBeenCalledWith(dummyAgile);
      });

      it('should integrate valid integration with bind function that returns false', async () => {
        dummyIntegration1.methods.bind = jest.fn(() => Promise.resolve(false));

        const response = await integrations.integrate(dummyIntegration1);

        expect(response).toBeTruthy();
        expect(integrations.integrations.has(dummyIntegration1)).toBeTruthy();
        expect(dummyIntegration1.ready).toBeFalsy();
        expect(dummyIntegration1.integrated).toBeTruthy();
        expect(dummyIntegration1.methods.bind).toHaveBeenCalledWith(dummyAgile);
      });

      it("shouldn't integrate Integration that has no valid Key", async () => {
        dummyIntegration1._key = undefined as any;

        const response = await integrations.integrate(dummyIntegration1);

        expect(response).toBeFalsy();
        expect(integrations.integrations.has(dummyIntegration1)).toBeFalsy();
        expect(dummyIntegration1.ready).toBeFalsy();
        expect(dummyIntegration1.integrated).toBeFalsy();

        expect(console.error).toHaveBeenCalledWith(
          'Agile Error: Failed to integrate framework! Invalid Integration!',
          dummyIntegration1._key
        );
      });
    });

    describe('update function tests', () => {
      const dummyComponentInstance = { my: 'component' };
      const dummyUpdatedData = { my: 'updatedData' };

      beforeEach(() => {
        integrations.integrate(dummyIntegration1);
        integrations.integrate(dummyIntegration2);
      });

      it('should call updateMethod on each ready Integration', () => {
        dummyIntegration1.ready = false;
        dummyIntegration1.methods.updateMethod = jest.fn();
        dummyIntegration2.methods.updateMethod = jest.fn();

        integrations.update(dummyComponentInstance, dummyUpdatedData);

        expect(dummyIntegration1.methods.updateMethod).not.toHaveBeenCalled();
        expect(dummyIntegration2.methods.updateMethod).toHaveBeenCalledWith(
          dummyComponentInstance,
          dummyUpdatedData
        );

        expect(console.warn).toHaveBeenCalledWith(
          "Agile Warn: Integration 'dummyIntegration1' isn't ready yet!"
        );
      });
    });

    describe('hasIntegration function tests', () => {
      it('should return false if Integrations has no integrated Integration', () => {
        expect(integrations.hasIntegration()).toBeFalsy();
      });

      it('should return true if Integrations has at least one integrated Integration', () => {
        integrations.integrate(dummyIntegration1);

        expect(integrations.hasIntegration()).toBeTruthy();
      });
    });
  });
});
