import mockConsole from 'jest-mock-console';
import { ProxyTree } from '../../src';

describe('Proxy Tree Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockConsole(['error', 'warn']);
  });

  it('should do what ever', () => {
    const original = {
      a: [{ b: 1 }, { 1000: 'value' }, '3rd'],
      b: { c: { d: 'hi' } },
      c: { a: 'hi' },
    };

    const proxyTree = new ProxyTree(original);

    proxyTree.proxy.a;
    // proxyTree.proxy.a;
    proxyTree.proxy.a[0];
    proxyTree.proxy.c.a;

    console.log(proxyTree.rootBranch);
    console.log(proxyTree.transformTreeToArray());

    expect(proxyTree.transformTreeToArray()).toStrictEqual([
      ['a'],
      ['a', '0'],
      ['c', 'a'],
    ]);
  });
});