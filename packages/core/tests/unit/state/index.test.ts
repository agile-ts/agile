// https://github.com/facebook/jest/issues/5023
import {
  Agile,
  assignSharedAgileInstance,
  createState,
  createLightState,
  State,
  EnhancedState,
} from '../../../src';
import { LogMock } from '../../helper/logMock';

// https://github.com/facebook/jest/issues/5023
jest.mock('../../../src/state/state', () => {
  return {
    State: jest.fn(),
  };
});
// https://github.com/facebook/jest/issues/5023
jest.mock('../../../src/state/state.enhanced', () => {
  return {
    EnhancedState: jest.fn(),
  };
});

describe('State Index Tests', () => {
  let sharedAgileInstance: Agile;

  beforeEach(() => {
    LogMock.mockLogs();

    sharedAgileInstance = new Agile();
    assignSharedAgileInstance(sharedAgileInstance);

    jest.clearAllMocks();
  });

  describe('createState function tests', () => {
    const EnhancedStateMock = EnhancedState as jest.MockedClass<
      typeof EnhancedState
    >;

    beforeEach(() => {
      EnhancedStateMock.mockClear();
    });

    it('should create enhanced State with the shared Agile Instance', () => {
      const state = createState('testValue', {
        key: 'myCoolState',
      });

      // expect(state).toBeInstanceOf(EnhancedState); // Because 'State' is completely overwritten with a mock (mockImplementation)
      expect(EnhancedStateMock).toHaveBeenCalledWith(
        sharedAgileInstance,
        'testValue',
        {
          key: 'myCoolState',
          agileInstance: sharedAgileInstance, // Not required but passed for simplicity
        }
      );
    });

    it('should create enhanced State with a specified Agile Instance', () => {
      const agile = new Agile();

      const state = createState('testValue', {
        key: 'myCoolState',
        agileInstance: agile,
      });

      // expect(state).toBeInstanceOf(EnhancedState); // Because 'State' is completely overwritten with a mock (mockImplementation)
      expect(EnhancedStateMock).toHaveBeenCalledWith(agile, 'testValue', {
        key: 'myCoolState',
        agileInstance: agile, // Not required but passed for simplicity
      });
    });
  });

  describe('createLightState function tests', () => {
    const StateMock = State as jest.MockedClass<typeof State>;

    beforeEach(() => {
      StateMock.mockClear();
    });

    it('should create State with the shared Agile Instance', () => {
      const state = createLightState('testValue', {
        key: 'myCoolState',
      });

      // expect(state).toBeInstanceOf(State); // Because 'State' is completely overwritten with a mock (mockImplementation)
      expect(StateMock).toHaveBeenCalledWith(sharedAgileInstance, 'testValue', {
        key: 'myCoolState',
        agileInstance: sharedAgileInstance, // Not required but passed for simplicity
      });
    });

    it('should create State with a specified Agile Instance', () => {
      const agile = new Agile();

      const state = createLightState('testValue', {
        key: 'myCoolState',
        agileInstance: agile,
      });

      // expect(state).toBeInstanceOf(State); // Because 'State' is completely overwritten with a mock (mockImplementation)
      expect(StateMock).toHaveBeenCalledWith(agile, 'testValue', {
        key: 'myCoolState',
        agileInstance: agile, // Not required but passed for simplicity
      });
    });
  });
});
