import mockConsole from 'jest-mock-console';

describe('Proxy Tree Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockConsole(['error', 'warn']);
  });
});
