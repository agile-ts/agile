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
  Integration,
  shared,
} from '../../src';
import testIntegration from '../helper/test.integration';
import { LogMock } from '../helper/logMock';
import * as AgileFile from '../../src/agile';

// https://github.com/facebook/jest/issues/5023
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

jest.mock('../../src/storages/storage');
jest.mock('../../src/collection');
jest.mock('../../src/computed');

// https://github.com/facebook/jest/issues/5023
jest.mock('../../src/state', () => {
  return {
    State: jest.fn(),
  };
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

  let dummyIntegration: Integration;

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

    dummyIntegration = new Integration({ key: 'dummyIntegrationKey' });

    jest.spyOn(Agile.prototype, 'configureLogger');
    jest.spyOn(Agile.prototype, 'integrate');
  });

  it('should instantiate Agile with initialIntegrations (default config)', () => {
    Integrations.initialIntegrations = [dummyIntegration];

    const agile = new Agile();

    expect(agile.config).toStrictEqual({
      waitForMount: true,
    });
    expect(agile.key).toBeUndefined();
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
    expect(agile.configureLogger).toHaveBeenCalledWith({});

    expect(Integrations.onRegisteredExternalIntegration).toHaveBeenCalledWith(
      expect.any(Function)
    );
    expect(agile.integrate).toHaveBeenCalledWith(dummyIntegration);

    // Check if Agile Instance got bound globally
    expect(globalThis[Agile.globalKey]).toBeUndefined();
  });

  it('should instantiate Agile with initialIntegrations (specific config)', () => {
    Integrations.initialIntegrations = [dummyIntegration];

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
      key: 'jeff',
      autoIntegrate: false,
    });

    expect(agile.config).toStrictEqual({
      waitForMount: false,
    });
    expect(agile.key).toBe('jeff');
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
    expect(agile.configureLogger).toHaveBeenCalledWith({
      active: false,
      level: Logger.level.DEBUG,
      prefix: 'Jeff',
      timestamp: true,
    });

    expect(Integrations.onRegisteredExternalIntegration).not.toHaveBeenCalled();
    expect(agile.integrate).not.toHaveBeenCalled();

    // Check if Agile Instance got bound globally
    expect(globalThis[Agile.globalKey]).toBe(agile);
  });

  it(
    'should instantiate second Agile Instance ' +
      'and print warning when an attempt is made to set the second Instance globally ' +
      'if the previously defined instance has also been set globally',
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

    describe('configureLogger function tests', () => {
      it('should overwrite the static Logger with a new Logger Instance', () => {
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
      beforeEach(() => {
        jest.spyOn(AgileFile, 'createStorage');
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
        expect(AgileFile.createStorage).toHaveBeenCalledWith(storageConfig);
      });
    });

    describe('createState function tests', () => {
      beforeEach(() => {
        jest.spyOn(AgileFile, 'createState');
      });

      it('should call createState with the Agile Instance it was called on', () => {
        const response = agile.createState('jeff', { key: 'jeffState' });

        expect(response).toBeInstanceOf(State);
        expect(AgileFile.createState).toHaveBeenCalledWith({
          key: 'jeffState',
          agileInstance: agile,
        });
      });
    });

    describe('createCollection function tests', () => {
      beforeEach(() => {
        jest.spyOn(AgileFile, 'createCollection');
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
        expect(AgileFile.createCollection).toHaveBeenCalledWith(
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
        jest.spyOn(AgileFile, 'createComputed');
      });

      it('should call createComputed with the Agile Instance it was called on (default config)', () => {
        const response = agile.createComputed(computedFunction, [
          'dummyDep' as any,
        ]);

        expect(response).toBeInstanceOf(Computed);
        expect(AgileFile.createComputed).toHaveBeenCalledWith({
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
        expect(AgileFile.createComputed).toHaveBeenCalledWith({
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

      const storage = AgileFile.createStorage(storageConfig);

      expect(storage).toBeInstanceOf(Storage);
      expect(StorageMock).toHaveBeenCalledWith(storageConfig);
    });
  });

  describe('createState function tests', () => {
    const StateMock = State as jest.MockedClass<typeof State>;

    it('should create State with the shared Agile Instance', () => {
      const state = AgileFile.createState('testValue', {
        key: 'myCoolState',
      });

      expect(state).toBeInstanceOf(State);
      expect(StateMock).toHaveBeenCalledWith(shared, 'testValue', {
        key: 'myCoolState',
      });
    });

    it('should create State with a specified Agile Instance', () => {
      const agile = new Agile();

      const state = AgileFile.createState('testValue', {
        key: 'myCoolState',
        agileInstance: agile,
      });

      expect(state).toBeInstanceOf(State);
      expect(StateMock).toHaveBeenCalledWith(agile, 'testValue', {
        key: 'myCoolState',
      });
    });
  });

  describe('createCollection function tests', () => {
    const CollectionMock = Collection as jest.MockedClass<typeof Collection>;

    beforeEach(() => {
      CollectionMock.mockClear();
    });

    it('should create Collection with the shared Agile Instance', () => {
      const collectionConfig = {
        selectors: ['test', 'test1'],
        groups: ['test2', 'test10'],
        defaultGroupKey: 'frank',
        key: 'myCoolCollection',
      };

      const collection = AgileFile.createCollection(collectionConfig);

      expect(collection).toBeInstanceOf(Collection);
      expect(CollectionMock).toHaveBeenCalledWith(shared, collectionConfig);
    });

    it('should create Collection with a specified Agile Instance', () => {
      const agile = new Agile();
      const collectionConfig = {
        selectors: ['test', 'test1'],
        groups: ['test2', 'test10'],
        defaultGroupKey: 'frank',
        key: 'myCoolCollection',
      };

      const collection = AgileFile.createCollection(collectionConfig, agile);

      expect(collection).toBeInstanceOf(Collection);
      expect(CollectionMock).toHaveBeenCalledWith(agile, collectionConfig);
    });
  });

  describe('createComputed function tests', () => {
    const ComputedMock = Computed as jest.MockedClass<typeof Computed>;
    const computedFunction = () => {
      // empty
    };

    beforeEach(() => {
      ComputedMock.mockClear();
    });

    it('should create Computed with the shared Agile Instance (default config)', () => {
      const response = AgileFile.createComputed(computedFunction, [
        'dummyDep' as any,
      ]);

      expect(response).toBeInstanceOf(Computed);
      expect(ComputedMock).toHaveBeenCalledWith(shared, computedFunction, {
        computedDeps: ['dummyDep' as any],
      });
    });

    it('should create Computed with the shared Agile Instance (specific config)', () => {
      const computedConfig = {
        key: 'jeff',
        isPlaceholder: false,
        computedDeps: ['dummyDep' as any],
        autodetect: true,
      };

      const response = AgileFile.createComputed(
        computedFunction,
        computedConfig
      );

      expect(response).toBeInstanceOf(Computed);
      expect(ComputedMock).toHaveBeenCalledWith(
        shared,
        computedFunction,
        computedConfig
      );
    });

    it('should create Computed with a specified Agile Instance (specific config)', () => {
      const agile = new Agile();
      const computedConfig = {
        key: 'jeff',
        isPlaceholder: false,
        computedDeps: ['dummyDep' as any],
        autodetect: true,
      };

      const response = AgileFile.createComputed(computedFunction, {
        ...computedConfig,
        ...{ agileInstance: agile },
      });

      expect(response).toBeInstanceOf(Computed);
      expect(ComputedMock).toHaveBeenCalledWith(
        agile,
        computedFunction,
        computedConfig
      );
    });
  });
});
