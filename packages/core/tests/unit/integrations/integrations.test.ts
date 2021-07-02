import { Agile, Integration, Integrations } from '../../../src';
import { LogMock } from '../../helper/logMock';

describe('Integrations Tests', () => {
  let dummyAgile: Agile;

  beforeEach(() => {
    jest.clearAllMocks();
    LogMock.mockLogs();

    dummyAgile = new Agile({ localStorage: false });

    jest.spyOn(Integrations.prototype, 'integrate');
  });

  it('should create Integrations', () => {
    const integrations = new Integrations(dummyAgile);

    expect(Array.from(integrations.integrations)).toStrictEqual([]);
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

    describe('onRegisteredExternalIntegration', () => {
      let dummyIntegration1: Integration;
      let dummyIntegration2: Integration;

      beforeEach(() => {
        dummyIntegration1 = new Integration({
          key: 'initialIntegration1',
        });
        dummyIntegration2 = new Integration({
          key: 'initialIntegration2',
        });
      });

      it('should register callback and fire it, when an external Integration was added', () => {
        const callback = jest.fn();

        Integrations.onRegisteredExternalIntegration(callback);

        Integrations.initialIntegrations.push(dummyIntegration1);
        Integrations.initialIntegrations.push(undefined as any);
        Integrations.initialIntegrations.push(dummyIntegration2);

        expect(callback).toHaveBeenCalledTimes(2);
        expect(callback).toHaveBeenCalledWith(dummyIntegration1);
        expect(callback).toHaveBeenCalledWith(dummyIntegration2);
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

        LogMock.hasLoggedCode(
          '18:03:00',
          [dummyIntegration1._key],
          dummyIntegration1
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

        LogMock.hasLoggedCode('18:02:00', ['dummyIntegration1']);
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
