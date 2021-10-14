import {
  Agile,
  assignSharedAgileInstance,
  Computed,
  createComputed,
} from '../../../src';
import { LogMock } from '../../helper/logMock';

jest.mock('../../../src/computed/computed');

describe('Computed Index Tests', () => {
  let sharedAgileInstance: Agile;

  beforeEach(() => {
    LogMock.mockLogs();

    sharedAgileInstance = new Agile();
    assignSharedAgileInstance(sharedAgileInstance);

    jest.clearAllMocks();
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
          agileInstance: sharedAgileInstance, // Not required but passed for simplicity
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
        {
          ...computedConfig,
          agileInstance: sharedAgileInstance, // Not required but passed for simplicity
        }
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
      expect(ComputedMock).toHaveBeenCalledWith(agile, computedFunction, {
        ...computedConfig,
        agileInstance: agile, // Not required but passed for simplicity
      });
    });
  });
});
