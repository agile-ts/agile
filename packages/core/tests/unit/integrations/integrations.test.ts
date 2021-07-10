import { Agile, Integration, Integrations } from '../../../src';
import { LogMock } from '../../helper/logMock';

describe('Integrations Tests', () => {
  let dummyAgile: Agile;
  let dummyIntegration1: Integration;
  let dummyIntegration2: Integration;

  beforeEach(() => {
    LogMock.mockLogs();

    dummyAgile = new Agile({ localStorage: false });
    dummyIntegration1 = new Integration({
      key: 'dummyIntegration1',
    });
    dummyIntegration2 = new Integration({
      key: 'dummyIntegration2',
    });

    Integrations.initialIntegrations = [];

    jest.spyOn(Integrations.prototype, 'integrate');
    jest.spyOn(Integrations, 'onRegisterInitialIntegration');

    jest.clearAllMocks();
  });

  it('should create Integrations with the before specified initial Integrations (default config)', () => {
    Integrations.initialIntegrations = [dummyIntegration1, dummyIntegration2];

    const integrations = new Integrations(dummyAgile);

    expect(Array.from(integrations.integrations)).toStrictEqual([
      dummyIntegration1,
      dummyIntegration2,
    ]);

    expect(Integrations.onRegisterInitialIntegration).toHaveBeenCalledWith(
      expect.any(Function)
    );
    expect(integrations.integrate).toHaveBeenCalledTimes(2);
    expect(integrations.integrate).toHaveBeenCalledWith(dummyIntegration1);
    expect(integrations.integrate).toHaveBeenCalledWith(dummyIntegration2);
  });

  it('should create Integrations without the before specified initial Integrations (autoIntegrate = false)', () => {
    Integrations.initialIntegrations = [dummyIntegration1, dummyIntegration2];

    const integrations = new Integrations(dummyAgile, { autoIntegrate: false });

    expect(Array.from(integrations.integrations)).toStrictEqual([]);

    expect(Integrations.onRegisterInitialIntegration).not.toHaveBeenCalled();
    expect(integrations.integrate).not.toHaveBeenCalled();
  });

  describe('Integrations Function Tests', () => {
    let integrations: Integrations;

    beforeEach(() => {
      integrations = new Integrations(dummyAgile);
    });

    describe('onRegisterInitialIntegration function tests', () => {
      let callback;
      beforeEach(() => {
        callback = jest.fn();
      });

      it(
        'should register specified onRegisterInitialIntegration callback ' +
          'and call it for each tracked initial Integrations',
        () => {
          Integrations.initialIntegrations = [
            dummyIntegration1,
            dummyIntegration2,
          ];

          Integrations.onRegisterInitialIntegration(callback);

          expect(callback).toHaveBeenCalledTimes(2);
          expect(callback).toHaveBeenCalledWith(dummyIntegration1);
          expect(callback).toHaveBeenCalledWith(dummyIntegration2);
        }
      );
    });

    describe('addInitialIntegration function tests', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();

      beforeEach(() => {
        Integrations.onRegisterInitialIntegration(callback1);
        Integrations.onRegisterInitialIntegration(callback2);
      });

      it(
        'should add valid Integration to the initialIntegrations array ' +
          'and fire the onRegisterInitialIntegration callbacks',
        () => {
          Integrations.addInitialIntegration(dummyIntegration1);

          expect(callback1).toHaveBeenCalledTimes(1);
          expect(callback1).toHaveBeenCalledWith(dummyIntegration1);
          expect(callback2).toHaveBeenCalledTimes(1);
          expect(callback2).toHaveBeenCalledWith(dummyIntegration1);
          expect(Integrations.initialIntegrations).toStrictEqual([
            dummyIntegration1,
          ]);
        }
      );

      it(
        "shouldn't add invalid Integration to the initialIntegrations array " +
          "and shouldn't fire the onRegisterInitialIntegration callbacks",
        () => {
          Integrations.addInitialIntegration(undefined as any);

          expect(callback1).not.toHaveBeenCalled();
          expect(callback2).not.toHaveBeenCalled();
          expect(Integrations.initialIntegrations).toStrictEqual([]);
        }
      );
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
          [dummyIntegration1._key, dummyAgile.key],
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
