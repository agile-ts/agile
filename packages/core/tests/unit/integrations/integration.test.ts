import { Integration } from '../../../src';
import { LogMock } from '../../helper/logMock';

describe('Integration Tests', () => {
  beforeEach(() => {
    LogMock.mockLogs();
    jest.clearAllMocks();
  });

  it('should create Integration', () => {
    const methods = {
      bind: () => Promise.resolve(true),
      updateMethod: () => {
        /* empty function */
      },
    };
    const integrationConfig = {
      frameworkInstance: { react: 'native' },
      key: 'test',
      ...methods,
    };

    const integration = new Integration(integrationConfig);

    expect(integration.key).toBe('test');
    expect(integration.frameworkInstance).toStrictEqual({ react: 'native' });
    expect(integration.ready).toBeFalsy();
    expect(integration.integrated).toBeFalsy();
    expect(integration.methods).toStrictEqual(methods);
  });

  describe('Integration Function Tests', () => {
    let integration: Integration;

    beforeEach(() => {
      integration = new Integration({ key: 'dummyIntegration' });
    });

    describe('key set function tests', () => {
      it('should update key in Integration', () => {
        integration.key = 'myCoolKey';

        expect(integration.key).toBe('myCoolKey');
      });
    });

    describe('key get function tests', () => {
      it('should return current key of Integration', () => {
        integration.key = 'myCoolKey';

        expect(integration.key).toBe('myCoolKey');
      });
    });
  });
});
