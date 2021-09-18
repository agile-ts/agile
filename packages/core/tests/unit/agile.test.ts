import { Agile, Runtime, SubController, Integrations } from '../../src';
import testIntegration from '../helper/test.integration';
import { LogMock } from '../helper/logMock';

// https://github.com/facebook/jest/issues/5023
jest.mock('../../src/runtime/runtime', () => {
  return {
    // https://jestjs.io/docs/mock-function-api#mockfnmockimplementationfn
    Runtime: jest.fn(),
  };
});
jest.mock('../../src/runtime/subscription/sub.controller', () => {
  return {
    SubController: jest.fn(),
  };
});

// https://gist.github.com/virgs/d9c50e878fc69832c01f8085f2953f12
// https://medium.com/@masonlgoetz/mock-static-class-methods-in-jest-1ceda967b47f
jest.mock('../../src/integrations/integrations', () => {
  const mockedInstances = {
    // https://jestjs.io/docs/mock-function-api#mockfnmockimplementationfn
    Integrations: jest.fn().mockImplementation(() => {
      return {
        integrate: jest.fn(),
        hasIntegration: jest.fn(),
      };
    }),
  };
  // @ts-ignore
  mockedInstances.Integrations.initialIntegrations = [];

  return mockedInstances;
});

describe('Agile Tests', () => {
  const RuntimeMock = Runtime as jest.MockedClass<typeof Runtime>;
  const SubControllerMock = SubController as jest.MockedClass<
    typeof SubController
  >;
  const IntegrationsMock = Integrations as jest.MockedClass<
    typeof Integrations
  >;

  beforeEach(() => {
    LogMock.mockLogs();

    // Clear specified mocks
    RuntimeMock.mockClear();
    SubControllerMock.mockClear();
    IntegrationsMock.mockClear();

    // Reset globalThis
    globalThis[Agile.globalKey] = undefined;

    jest.spyOn(Agile.prototype, 'integrate');

    jest.clearAllMocks();
  });

  it('should instantiate Agile (default config)', () => {
    const agile = new Agile();

    expect(agile.config).toStrictEqual({
      waitForMount: true,
      bucket: true,
    });
    expect(agile.key).toBeUndefined();
    expect(IntegrationsMock).toHaveBeenCalledWith(agile, {
      autoIntegrate: true,
    });
    // expect(agile.integrations).toBeInstanceOf(Integrations); // Because 'Integrations' is completely overwritten with a mock (mockImplementation)
    expect(RuntimeMock).toHaveBeenCalledWith(agile);
    // expect(agile.runtime).toBeInstanceOf(Runtime); // Because 'Runtime' is completely overwritten with a mock (mockImplementation)
    expect(SubControllerMock).toHaveBeenCalledWith(agile);
    expect(agile.subController).toBeInstanceOf(SubController);

    // Check if Agile Instance got bound globally
    expect(globalThis[Agile.globalKey]).toBeUndefined();
  });

  it('should instantiate Agile (specific config)', () => {
    const agile = new Agile({
      waitForMount: false,
      bucket: false,
      bindGlobal: true,
      key: 'jeff',
      autoIntegrate: false,
    });

    expect(agile.config).toStrictEqual({
      waitForMount: false,
      bucket: false,
    });
    expect(agile.key).toBe('jeff');
    expect(IntegrationsMock).toHaveBeenCalledWith(agile, {
      autoIntegrate: false,
    });
    // expect(agile.integrations).toBeInstanceOf(Integrations); // Because 'Integrations' is completely overwritten with a mock (mockImplementation)
    expect(RuntimeMock).toHaveBeenCalledWith(agile);
    // expect(agile.runtime).toBeInstanceOf(Runtime); // Because 'Runtime' is completely overwritten with a mock (mockImplementation)
    expect(SubControllerMock).toHaveBeenCalledWith(agile);
    expect(agile.subController).toBeInstanceOf(SubController);

    // Check if Agile Instance got bound globally
    expect(globalThis[Agile.globalKey]).toBe(agile);
  });

  it(
    'should instantiate second Agile Instance ' +
      'and print warning when an attempt is made to set the second Agile Instance globally ' +
      'although the previously defined Agile Instance is already globally set',
    () => {
      const agile1 = new Agile({
        bindGlobal: true,
      });

      const agile2 = new Agile({
        bindGlobal: true,
      });

      expect(agile1).toBeInstanceOf(Agile);
      expect(agile2).toBeInstanceOf(Agile);

      expect(globalThis[Agile.globalKey]).toBe(agile1);
      LogMock.hasLoggedCode('10:02:00');
    }
  );

  describe('Agile Function Tests', () => {
    let agile: Agile;

    beforeEach(() => {
      agile = new Agile();
      jest.clearAllMocks(); // Because creating the Agile Instance calls some mocks
    });

    describe('integrate function tests', () => {
      it('should integrate provided Framework', () => {
        const returnedAgile = agile.integrate(testIntegration);

        expect(returnedAgile).toBe(agile);
        expect(agile.integrations.integrate).toHaveBeenCalledWith(
          testIntegration
        );
      });
    });

    describe('hasIntegration function tests', () => {
      it('should check if Agile has any registered Integration', () => {
        agile.hasIntegration();

        expect(agile.integrations.hasIntegration).toHaveBeenCalled();
      });
    });
  });
});
