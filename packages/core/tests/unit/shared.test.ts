import {
  Agile,
  Collection,
  Computed,
  shared,
  State,
  Storage,
  createStorage,
  createState,
  createCollection,
  createComputed,
  assignSharedAgileInstance,
} from '../../src';
import { LogMock } from '../helper/logMock';

jest.mock('../../src/storages/storage');
jest.mock('../../src/collection/collection');
jest.mock('../../src/computed/computed');

// https://github.com/facebook/jest/issues/5023
jest.mock('../../src/state/state', () => {
  return {
    State: jest.fn(),
  };
});

describe('Shared Tests', () => {
  let sharedAgileInstance: Agile;

  beforeEach(() => {
    LogMock.mockLogs();

    sharedAgileInstance = new Agile();
    assignSharedAgileInstance(sharedAgileInstance);

    jest.clearAllMocks();
  });

  describe('assignSharedAgileInstance function tests', () => {
    it('should assign the specified Agile Instance as new shared Agile Instance', () => {
      const newAgileInstance = new Agile({ key: 'notShared' });

      assignSharedAgileInstance(newAgileInstance);

      expect(shared).toBe(newAgileInstance);
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

      const storage = createStorage(storageConfig);

      expect(storage).toBeInstanceOf(Storage);
      expect(StorageMock).toHaveBeenCalledWith(storageConfig);
    });
  });

  describe('createState function tests', () => {
    const StateMock = State as jest.MockedClass<typeof State>;

    it('should create State with the shared Agile Instance', () => {
      const state = createState('testValue', {
        key: 'myCoolState',
      });

      expect(state).toBeInstanceOf(State);
      expect(StateMock).toHaveBeenCalledWith(sharedAgileInstance, 'testValue', {
        key: 'myCoolState',
      });
    });

    it('should create State with a specified Agile Instance', () => {
      const agile = new Agile();

      const state = createState('testValue', {
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

      const collection = createCollection(collectionConfig);

      expect(collection).toBeInstanceOf(Collection);
      expect(CollectionMock).toHaveBeenCalledWith(
        sharedAgileInstance,
        collectionConfig
      );
    });

    it('should create Collection with a specified Agile Instance', () => {
      const agile = new Agile();
      const collectionConfig = {
        selectors: ['test', 'test1'],
        groups: ['test2', 'test10'],
        defaultGroupKey: 'frank',
        key: 'myCoolCollection',
      };

      const collection = createCollection(collectionConfig, agile);

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
      const response = createComputed(computedFunction, ['dummyDep' as any]);

      expect(response).toBeInstanceOf(Computed);
      expect(ComputedMock).toHaveBeenCalledWith(
        sharedAgileInstance,
        computedFunction,
        {
          computedDeps: ['dummyDep' as any],
        }
      );
    });

    it('should create Computed with the shared Agile Instance (specific config)', () => {
      const computedConfig = {
        key: 'jeff',
        isPlaceholder: false,
        computedDeps: ['dummyDep' as any],
        autodetect: true,
      };

      const response = createComputed(computedFunction, computedConfig);

      expect(response).toBeInstanceOf(Computed);
      expect(ComputedMock).toHaveBeenCalledWith(
        sharedAgileInstance,
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

      const response = createComputed(computedFunction, {
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
