import {
  Agile,
  State,
  Runtime,
  SubController,
  Integrations,
  Storage,
  Computed,
  Collection,
  Logger,
  Storages,
} from '../../src';
import testIntegration from '../helper/test.integration';
import { LogMock } from '../helper/logMock';
import * as Utils from '../../src/utils';

// https://github.com/facebook/jest/issues/5023
// https://medium.com/@masonlgoetz/mock-static-class-methods-in-jest-1ceda967b47f
// https://gist.github.com/virgs/d9c50e878fc69832c01f8085f2953f12
jest.mock('../../src/integrations', () => {
  const mockedInstances = {
    Integrations: jest.fn().mockImplementation(() => {
      return {
        integrate: jest.fn(),
      };
    }),
  };
  // @ts-ignore
  mockedInstances.Integrations.onRegisteredExternalIntegration = jest.fn();
  return mockedInstances;
});
jest.mock('../../src/runtime', () => {
  return {
    Runtime: jest.fn(),
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
jest.mock('../../src/storages/storage');
jest.mock('../../src/collection');
jest.mock('../../src/computed');
// Can't mock State because mocks get instantiated before everything else
// -> I got the good old not loaded Object error https://github.com/kentcdodds/how-jest-mocking-works
// jest.mock("../../src/state/index");

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
    jest.clearAllMocks();
    LogMock.mockLogs();

    // Clear specified mocks
    RuntimeMock.mockClear();
    SubControllerMock.mockClear();
    StoragesMock.mockClear();
    IntegrationsMock.mockClear();

    // Reset globalThis
    globalThis[Agile.globalKey] = undefined;

    jest.spyOn(Agile.prototype, 'configureLogger');
  });

  it('should instantiate Agile (default config)', () => {
    const agile = new Agile();

    // Check if Agile properties got instantiated properly
    expect(agile.config).toStrictEqual({
      waitForMount: true,
    });
    expect(IntegrationsMock).toHaveBeenCalledWith(agile);
    // expect(agile.integrations).toBeInstanceOf(Integrations); // Because 'Integrations' is completely overwritten with a mock
    expect(RuntimeMock).toHaveBeenCalledWith(agile);
    expect(agile.runtime).toBeInstanceOf(Runtime);
    expect(SubControllerMock).toHaveBeenCalledWith(agile);
    expect(agile.subController).toBeInstanceOf(SubController);
    expect(StoragesMock).toHaveBeenCalledWith(agile, {
      localStorage: true,
    });
    expect(agile.storages).toBeInstanceOf(Storages);

    // Check if Logger was configured correctly
    expect(agile.configureLogger).toHaveBeenCalledWith({});

    // Check if Agile Instance got bound globally
    expect(globalThis[Agile.globalKey]).toBeUndefined();
  });

  it('should instantiate Agile with (specific config)', () => {
    const agile = new Agile({
      waitForMount: false,
      localStorage: false,
      logConfig: {
        level: Logger.level.DEBUG,
        active: false,
        prefix: 'Jeff',
        timestamp: true,
      },
      bindGlobal: true,
    });

    // Check if Agile properties got instantiated properly
    expect(agile.config).toStrictEqual({
      waitForMount: false,
    });
    expect(IntegrationsMock).toHaveBeenCalledWith(agile);
    // expect(agile.integrations).toBeInstanceOf(Integrations); // Because 'Integrations' is completely overwritten with a mock
    expect(RuntimeMock).toHaveBeenCalledWith(agile);
    expect(agile.runtime).toBeInstanceOf(Runtime);
    expect(SubControllerMock).toHaveBeenCalledWith(agile);
    expect(agile.subController).toBeInstanceOf(SubController);
    expect(StoragesMock).toHaveBeenCalledWith(agile, {
      localStorage: false,
    });
    expect(agile.storages).toBeInstanceOf(Storages);

    // Check if Logger was configured correctly
    expect(agile.configureLogger).toHaveBeenCalledWith({
      active: false,
      level: Logger.level.DEBUG,
      prefix: 'Jeff',
      timestamp: true,
    });

    // Check if Agile Instance got bound globally
    expect(globalThis[Agile.globalKey]).toBe(agile);
  });

  it('should instantiate second Agile Instance and print warning if config.bindGlobal is set both times to true', () => {
    const agile1 = new Agile({
      bindGlobal: true,
    });

    const agile2 = new Agile({
      bindGlobal: true,
    });

    expect(globalThis[Agile.globalKey]).toBe(agile1);
    LogMock.hasLoggedCode('10:02:00');
  });

  describe('Agile Function Tests', () => {
    let agile: Agile;

    beforeEach(() => {
      agile = new Agile();
      jest.clearAllMocks(); // Because creating Agile executes some mocks
    });

    describe('configureLogger function tests', () => {
      it('should overwrite the static Logger with a new Logger Instance (runsOnServer = true)', () => {
        jest.spyOn(Utils, 'runsOnServer').mockReturnValueOnce(true);
        Agile.logger.config = 'outdated' as any;

        agile.configureLogger({
          active: true,
          level: 0,
        });

        expect(Agile.logger.config).toStrictEqual({
          canUseCustomStyles: true,
          level: 0,
          prefix: '',
          timestamp: false,
        });
        expect(Agile.logger.isActive).toBeFalsy();
        expect(Agile.logger.allowedTags).toStrictEqual([]);
      });

      it('should overwrite the static Logger with a new Logger Instance (runsOnServer = false)', () => {
        jest.spyOn(Utils, 'runsOnServer').mockReturnValueOnce(false);
        Agile.logger.config = 'outdated' as any;

        agile.configureLogger({
          active: true,
          level: 0,
        });

        expect(Agile.logger.config).toStrictEqual({
          canUseCustomStyles: true,
          level: 0,
          prefix: 'Agile',
          timestamp: false,
        });
        expect(Agile.logger.isActive).toBeTruthy();
        expect(Agile.logger.allowedTags).toStrictEqual([
          'runtime',
          'storage',
          'subscription',
          'multieditor',
        ]);
      });
    });

    describe('createStorage function tests', () => {
      const StorageMock = Storage as jest.MockedClass<typeof Storage>;

      beforeEach(() => {
        StorageMock.mockClear();
      });

      it('should create Storage', () => {
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
        const storage = agile.createStorage(storageConfig);

        expect(storage).toBeInstanceOf(Storage);
        expect(StorageMock).toHaveBeenCalledWith(storageConfig);
      });
    });

    describe('state function tests', () => {
      it('should create State', () => {
        const state = agile.createState('testValue', {
          key: 'myCoolState',
        });

        expect(state).toBeInstanceOf(State);
      });
    });

    describe('createCollection function tests', () => {
      const CollectionMock = Collection as jest.MockedClass<typeof Collection>;

      beforeEach(() => {
        CollectionMock.mockClear();
      });

      it('should create Collection', () => {
        const collectionConfig = {
          selectors: ['test', 'test1'],
          groups: ['test2', 'test10'],
          defaultGroupKey: 'frank',
          key: 'myCoolCollection',
        };

        const collection = agile.createCollection(collectionConfig);

        expect(collection).toBeInstanceOf(Collection);
        expect(CollectionMock).toHaveBeenCalledWith(agile, collectionConfig);
      });
    });

    describe('createComputed function tests', () => {
      const ComputedMock = Computed as jest.MockedClass<typeof Computed>;
      const computedFunction = () => {
        // console.log("Hello Jeff");
      };

      beforeEach(() => {
        ComputedMock.mockClear();
      });

      it('should create Computed', () => {
        const computed = agile.createComputed(computedFunction, [
          'dummyDep' as any,
        ]);

        expect(computed).toBeInstanceOf(Computed);
        expect(ComputedMock).toHaveBeenCalledWith(agile, computedFunction, {
          computedDeps: ['dummyDep' as any],
        });
      });

      it('should create Computed with config', () => {
        const computed = agile.createComputed(computedFunction, {
          key: 'jeff',
          isPlaceholder: false,
          computedDeps: ['dummyDep' as any],
          autodetect: true,
        });

        expect(computed).toBeInstanceOf(Computed);
        expect(ComputedMock).toHaveBeenCalledWith(agile, computedFunction, {
          key: 'jeff',
          isPlaceholder: false,
          computedDeps: ['dummyDep' as any],
          autodetect: true,
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
      it('should check if Agile has any registered Storage', () => {
        agile.hasStorage();

        expect(agile.storages.hasStorage).toHaveBeenCalled();
      });
    });
  });
});
