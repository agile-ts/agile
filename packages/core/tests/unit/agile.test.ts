import {
  Agile,
  State,
  Runtime,
  SubController,
  Integrations,
  Storage,
  Event,
  Computed,
  Collection,
  Logger,
  Storages,
} from '../../src';
import testIntegration from '../helper/test.integration';

jest.mock('../../src/runtime/index');
jest.mock('../../src/runtime/subscription/sub.controller');
jest.mock('../../src/storages/index');
jest.mock('../../src/integrations/index');
jest.mock('../../src/storages/storage');
jest.mock('../../src/collection/index');
jest.mock('../../src/computed/index');
jest.mock('../../src/event/index');
/* Can't mock Logger because I somehow can't overwrite a static get method
jest.mock("../../src/logger/index", () => {
  return class {
    static get level() {
      return {
        TRACE: 1,
        DEBUG: 2,
        LOG: 5,
        TABLE: 5,
        INFO: 10,
        WARN: 20,
        ERROR: 50,
      };
    }
  };
});
 */
// jest.mock("../../src/state/index"); // Can't mock State because mocks get instantiated before everything else -> I got the good old not loaded Object error https://github.com/kentcdodds/how-jest-mocking-works

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
    RuntimeMock.mockClear();
    SubControllerMock.mockClear();
    StoragesMock.mockClear();
    IntegrationsMock.mockClear();

    // Reset Global This
    globalThis['__agile__'] = undefined;
  });

  it('should instantiate Agile (default config)', () => {
    const agile = new Agile();

    // Check if Agile properties got instantiated properly
    expect(agile.config).toStrictEqual({
      waitForMount: true,
    });
    expect(IntegrationsMock).toHaveBeenCalledWith(agile);
    expect(agile.integrations).toBeInstanceOf(Integrations);
    expect(RuntimeMock).toHaveBeenCalledWith(agile);
    expect(agile.runtime).toBeInstanceOf(Runtime);
    expect(SubControllerMock).toHaveBeenCalledWith(agile);
    expect(agile.subController).toBeInstanceOf(SubController);
    expect(StoragesMock).toHaveBeenCalledWith(agile, {
      localStorage: true,
    });
    expect(agile.storages).toBeInstanceOf(Storages);

    // Check if Static Logger has correct config
    expect(Agile.logger.config).toStrictEqual({
      prefix: 'Agile',
      level: Logger.level.WARN,
      canUseCustomStyles: true,
      timestamp: false,
    });
    expect(Agile.logger.allowedTags).toStrictEqual([
      'runtime',
      'storage',
      'subscription',
      'multieditor',
    ]);
    expect(Agile.logger.isActive).toBeTruthy();

    // Check if global Agile Instance got created
    expect(globalThis['__agile__']).toBe(agile);
  });

  it('should instantiate Agile with specific config', () => {
    const agile = new Agile({
      waitForMount: false,
      localStorage: false,
      logConfig: {
        level: Logger.level.DEBUG,
        active: false,
        prefix: 'Jeff',
        timestamp: true,
      },
    });

    // Check if Agile properties got instantiated properly
    expect(agile.config).toStrictEqual({
      waitForMount: false,
    });
    expect(IntegrationsMock).toHaveBeenCalledWith(agile);
    expect(agile.integrations).toBeInstanceOf(Integrations);
    expect(RuntimeMock).toHaveBeenCalledWith(agile);
    expect(agile.runtime).toBeInstanceOf(Runtime);
    expect(SubControllerMock).toHaveBeenCalledWith(agile);
    expect(agile.subController).toBeInstanceOf(SubController);
    expect(StoragesMock).toHaveBeenCalledWith(agile, {
      localStorage: false,
    });
    expect(agile.storages).toBeInstanceOf(Storages);

    // Check if Static Logger has correct config
    expect(Agile.logger.config).toStrictEqual({
      prefix: 'Jeff',
      level: Logger.level.DEBUG,
      canUseCustomStyles: true,
      timestamp: true,
    });
    expect(Agile.logger.allowedTags).toStrictEqual([
      'runtime',
      'storage',
      'subscription',
      'multieditor',
    ]);
    expect(Agile.logger.isActive).toBeFalsy();

    // Check if global Agile Instance got created
    expect(globalThis['__agile__']).toBe(agile);
  });

  describe('Agile Function Tests', () => {
    let agile: Agile;

    beforeEach(() => {
      agile = new Agile();
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
        const computed = agile.createComputed(computedFunction, []);

        expect(computed).toBeInstanceOf(Computed);
        expect(ComputedMock).toHaveBeenCalledWith(agile, computedFunction, {
          computedDeps: [],
        });
      });

      it('should create Computed with config', () => {
        const computed = agile.createComputed(
          computedFunction,
          { key: 'jeff', isPlaceholder: false },
          []
        );

        expect(computed).toBeInstanceOf(Computed);
        expect(ComputedMock).toHaveBeenCalledWith(agile, computedFunction, {
          key: 'jeff',
          isPlaceholder: false,
          computedDeps: [],
        });
      });
    });

    describe('createEvent function tests', () => {
      const EventMock = Event as jest.MockedClass<typeof Event>;

      beforeEach(() => {
        EventMock.mockClear();
      });

      it('should create Event', () => {
        const eventConfig = {
          rerender: true,
          delay: 1000,
          enabled: true,
          key: 'myCoolEvent',
        };

        const event = agile.createEvent(eventConfig);

        expect(event).toBeInstanceOf(Event);
        expect(EventMock).toHaveBeenCalledWith(agile, eventConfig);
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
