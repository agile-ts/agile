import mockConsole from 'jest-mock-console';
import { ProxyTree } from '../../src';

describe('Proxy Tree Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockConsole(['error', 'warn']);
  });

  it('should track 2 layers deep properties', () => {
    const original = {
      a: [{ b: 1 }, { 1000: 'value' }, '3rd'],
      b: { c: { d: 'hi' } },
      c: { a: 'hi' },
    };

    // Create proxy tree
    const proxyTree = new ProxyTree(original);
    const proxyfiedOrginal = proxyTree.proxy;

    // Call properties in proxified Orginal (these route should be tracked by the proxyTree)
    proxyfiedOrginal.a;
    proxyfiedOrginal.a[0];
    proxyfiedOrginal.c.a;

    expect(proxyTree.transformTreeToBranchObject()).toStrictEqual({
      key: 'root',
      timesAccessed: 3,
      branches: [
        {
          key: 'a',
          timesAccessed: 2,
          branches: [{ key: '0', timesAccessed: 1, branches: [] }],
        },
        {
          key: 'c',
          timesAccessed: 1,
          branches: [{ key: 'a', timesAccessed: 1, branches: [] }],
        },
      ],
    });

    expect(proxyTree.getUsedRoutes()).toStrictEqual([
      ['a', '0'],
      ['c', 'a'],
      ['a'],
    ]);
  });

  it('should track 3 layers deep properties', () => {
    const original = {
      a: [{ b: 1 }, { 1000: 'value' }, '3rd'],
      b: { c: { d: 'hi' } },
      c: { a: 'hi' },
    };

    // Create proxy tree
    const proxyTree = new ProxyTree(original);
    const proxyfiedOrginal = proxyTree.proxy;

    // Call properties in proxified Orginal (these route should be tracked by the proxyTree)
    proxyfiedOrginal.a;
    proxyfiedOrginal.a[0]['b'];
    proxyfiedOrginal.c.a;
    proxyfiedOrginal.b;

    expect(proxyTree.transformTreeToBranchObject()).toStrictEqual({
      key: 'root',
      timesAccessed: 4,
      branches: [
        {
          key: 'a',
          timesAccessed: 2,
          branches: [
            {
              key: '0',
              timesAccessed: 1,
              branches: [{ key: 'b', timesAccessed: 1, branches: [] }],
            },
          ],
        },
        {
          key: 'c',
          timesAccessed: 1,
          branches: [{ key: 'a', timesAccessed: 1, branches: [] }],
        },
        {
          key: 'b',
          timesAccessed: 1,
          branches: [],
        },
      ],
    });

    expect(proxyTree.getUsedRoutes()).toStrictEqual([
      ['a', '0', 'b'],
      ['c', 'a'],
      ['b'],
      ['a'],
    ]);
  });
});
