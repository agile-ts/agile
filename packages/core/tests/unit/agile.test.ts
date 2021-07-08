import {
  Agile,
  State,
  Runtime,
  SubController,
  Integrations,
  Storage,
  Computed,
  Collection,
  Storages,
} from '../../src';
import testIntegration from '../helper/test.integration';
import { LogMock } from '../helper/logMock';
import * as Shared from '../../src/shared';

// https://github.com/facebook/jest/issues/5023
jest.mock('../../src/runtime', () => {
  return {
    // https://jestjs.io/docs/mock-function-api#mockfnmockimplementationfn
    Runtime: jest.fn().mockImplementation(() => {
      return {
        ingest: jest.fn(),
      };
    }),
  };
});
jest.mock('../../src/runtime/subscription/sub.controller', () => {
  return {
    SubController: jest.fn(),
  };
});
jest.mock('../../src/storages', () => {
  return {
    Storages: jest.fn(),
  };
});

// https://gist.github.com/virgs/d9c50e878fc69832c01f8085f2953f12
// https://medium.com/@masonlgoetz/mock-static-class-methods-in-jest-1ceda967b47f
jest.mock('../../src/integrations', () => {
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
  mockedInstances.Integrations.onRegisteredExternalIntegration = jest.fn();
  // @ts-ignore
  mockedInstances.Integrations.initialIntegrations = [];
  return mockedInstances;
});

describe('Agile Tests', () => {
  const RuntimeMock = Runtime as jest.MockedClass<typeof Runtime>;
  const SubControllerMock = SubController as jest.MockedClass<
    typeof SubController
  >;
  const StoragesMock = Storages as jest.MockedClass<typeof Storages>;
  const IntegrationsMock = Integrations as jest.MockedClass<
    typeof Integrations
  >;

  beforeEach(() => {
    LogMock.mockLogs();

    // Clear specified mocks
    RuntimeMock.mockClear();
    SubControllerMock.mockClear();
    StoragesMock.mockClear();
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
    expect(StoragesMock).toHaveBeenCalledWith(agile, {
      localStorage: false,
    });
    expect(agile.storages).toBeInstanceOf(Storages);

    // Check if Agile Instance got bound globally
    expect(globalThis[Agile.globalKey]).toBeUndefined();
  });

  it('should instantiate Agile (specific config)', () => {
    const agile = new Agile({
      waitForMount: false,
      bucket: false,
      localStorage: true,
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
    expect(StoragesMock).toHaveBeenCalledWith(agile, {
      localStorage: true,
    });
    expect(agile.storages).toBeInstanceOf(Storages);

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

    describe('createStorage function tests', () => {
      beforeEach(() => {
        jest.spyOn(Shared, 'createStorage');
      });

      it('should call createStorage', () => {
        const storageConfig = {
          prefix: 'test',
          methods: {
            get: () => {
              /* empty function */
            },
            set: () => {
              /* empty function */
            },
            remove: () => {
              /* empty function */
            },
          },
          key: 'myTestStorage',
        };

        const response = agile.createStorage(storageConfig);

        expect(response).toBeInstanceOf(Storage);
        expect(Shared.createStorage).toHaveBeenCalledWith(storageConfig);
      });
    });

    describe('createState function tests', () => {
      beforeEach(() => {
        jest.spyOn(Shared, 'createState');
      });

      it('should call createState with the Agile Instance it was called on', () => {
        const response = agile.createState('jeff', { key: 'jeffState' });

        expect(response).toBeInstanceOf(State);
        expect(Shared.createState).toHaveBeenCalledWith('jeff', {
          key: 'jeffState',
          agileInstance: agile,
        });
      });
    });

    describe('createCollection function tests', () => {
      beforeEach(() => {
        jest.spyOn(Shared, 'createCollection');
      });

      it('should call createCollection with the Agile Instance it was called on', () => {
        const collectionConfig = {
          selectors: ['test', 'test1'],
          groups: ['test2', 'test10'],
          defaultGroupKey: 'frank',
          key: 'myCoolCollection',
        };

        const response = agile.createCollection(collectionConfig);

        expect(response).toBeInstanceOf(Collection);
        expect(Shared.createCollection).toHaveBeenCalledWith(
          collectionConfig,
          agile
        );
      });
    });

    describe('createComputed function tests', () => {
      const computedFunction = () => {
        // empty
      };

      beforeEach(() => {
        jest.spyOn(Shared, 'createComputed');
      });

      it('should call createComputed with the Agile Instance it was called on (default config)', () => {
        const response = agile.createComputed(computedFunction, [
          'dummyDep' as any,
        ]);

        expect(response).toBeInstanceOf(Computed);
        expect(Shared.createComputed).toHaveBeenCalledWith(computedFunction, {
          computedDeps: ['dummyDep' as any],
          agileInstance: agile,
        });
      });

      it('should call createComputed with the Agile Instance it was called on (specific config)', () => {
        const computedConfig = {
          key: 'jeff',
          isPlaceholder: false,
          computedDeps: ['dummyDep' as any],
          autodetect: true,
        };

        const response = agile.createComputed(computedFunction, computedConfig);

        expect(response).toBeInstanceOf(Computed);
        expect(Shared.createComputed).toHaveBeenCalledWith(computedFunction, {
          ...computedConfig,
          ...{
            agileInstance: agile,
          },
        });
      });
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

    describe('registerStorage function tests', () => {
      beforeEach(() => {
        agile.storages.register = jest.fn();
      });

      it('should register provided Storage', () => {
        const dummyStorage = new Storage({
          prefix: 'test',
          methods: {
            get: () => {
              /* empty function */
            },
            set: () => {
              /* empty function */
            },
            remove: () => {
              /* empty function */
            },
          },
          key: 'myTestStorage',
        });

        const returnedAgile = agile.registerStorage(dummyStorage, {
          default: false,
        });

        expect(returnedAgile).toBe(agile);
        expect(agile.storages.register).toHaveBeenCalledWith(dummyStorage, {
          default: false,
        });
      });
    });

    describe('hasIntegration function tests', () => {
      it('should check if Agile has any registered Integration', () => {
        agile.hasIntegration();

        expect(agile.integrations.hasIntegration).toHaveBeenCalled();
      });
    });

    describe('hasStorage function tests', () => {
      beforeEach(() => {
        agile.storages.hasStorage = jest.fn();
      });

      it('should check if Agile has any registered Storage', () => {
        agile.hasStorage();

        expect(agile.storages.hasStorage).toHaveBeenCalled();
      });
    });
  });
});
