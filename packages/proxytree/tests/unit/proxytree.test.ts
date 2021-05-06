import mockConsole from 'jest-mock-console';
import { ProxyTree, Branch } from '../../src';

describe('ProxyTree Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockConsole(['error', 'warn']);
  });

  it('should create ProxyTree with passed object', () => {
    const dummyObject = { a: { b: 'c' }, b: 'c' };

    jest.spyOn(ProxyTree.prototype, 'createBranch');

    const proxyTree = new ProxyTree(dummyObject);

    expect(proxyTree.proxy).toStrictEqual(dummyObject);
    expect(proxyTree.createBranch).toHaveBeenCalledWith(dummyObject);
    expect(proxyTree.rootBranch.target).toStrictEqual(dummyObject);
    expect(proxyTree.rootBranch.proxyTree).toStrictEqual(proxyTree);

    expect(console.error).not.toHaveBeenCalled();
  });

  it('should create ProxyTree with passed array', () => {
    const dummyArray = ['a', { a: 'b' }];

    jest.spyOn(ProxyTree.prototype, 'createBranch');

    const proxyTree = new ProxyTree(dummyArray);

    expect(proxyTree.proxy).toStrictEqual(dummyArray);
    expect(proxyTree.createBranch).toHaveBeenCalledWith(dummyArray);
    expect(proxyTree.rootBranch.target).toStrictEqual(dummyArray);
    expect(proxyTree.rootBranch.proxyTree).toStrictEqual(proxyTree);

    expect(console.error).not.toHaveBeenCalled();
  });

  it("shouldn't create ProxyTree with string", () => {
    const dummyString = 'hello my name is jeff';

    jest.spyOn(ProxyTree.prototype, 'createBranch');

    const proxyTree = new ProxyTree(dummyString as any);

    expect(proxyTree.proxy).toBe(null);
    expect(proxyTree.createBranch).toHaveBeenCalledWith(dummyString);
    expect(proxyTree.rootBranch).toBe(null);

    expect(console.error).toHaveBeenCalledWith(
      "ProxyTree: The ProxyTree accepts only values from the type 'object' and 'array'! " +
        "The passed type was 'string'! " +
        'Learn more here: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy'
    );
  });

  it("shouldn't create ProxyTree with number", () => {
    const dummyNumber = 10;

    jest.spyOn(ProxyTree.prototype, 'createBranch');

    const proxyTree = new ProxyTree(dummyNumber as any);

    expect(proxyTree.proxy).toBe(null);
    expect(proxyTree.createBranch).toHaveBeenCalledWith(dummyNumber);
    expect(proxyTree.rootBranch).toBe(null);

    expect(console.error).toHaveBeenCalledWith(
      "ProxyTree: The ProxyTree accepts only values from the type 'object' and 'array'! " +
        "The passed type was 'number'! " +
        'Learn more here: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy'
    );
  });

  describe('ProxyTree Function Tests', () => {
    const original = {
      a: [{ b: 1 }, { 1000: { a: { b: 1 } } }, '3rd'],
      b: { c: { d: 'hi' } },
      c: { a: 'hi' },
    };
    let proxyTree: ProxyTree;

    beforeEach(() => {
      proxyTree = new ProxyTree(original);
    });

    describe('createBranch function tests', () => {
      it('should create a Branch with a valid object', () => {
        const branch = proxyTree.createBranch(original);

        expect(branch).toBeInstanceOf(Branch);
        expect(branch?.target).toStrictEqual(original);
        expect(branch?.proxyTree).toBe(proxyTree);
        expect(console.error).not.toHaveBeenCalled();
      });

      it("shouldn't create a Branch with a not valid object", () => {
        const branch = proxyTree.createBranch('not valid object' as any);

        expect(branch).toBe(null);
        expect(console.error).toHaveBeenCalledWith(
          "ProxyTree: The ProxyTree accepts only values from the type 'object' and 'array'! " +
            "The passed type was 'string'! " +
            'Learn more here: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy'
        );
      });
    });

    describe('transformTreeToBranchObject function tests', () => {
      it('should transform 2 layer deep accessed object properties', () => {
        const proxyfiedOrginal = proxyTree.proxy;

        // Access Properties
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
      });

      it('should transform 3 layer deep accessed object properties', () => {
        const proxyfiedOrginal = proxyTree.proxy;

        // Access Properties
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
      });
    });

    it('should transform 5 layer deep accessed object properties', () => {
      const proxyfiedOrginal = proxyTree.proxy;

      // Access Properties
      proxyfiedOrginal.a;
      proxyfiedOrginal.a[0]['b'];
      proxyfiedOrginal.a[1][1000]['a']['b'];
      proxyfiedOrginal.c.a;
      proxyfiedOrginal.b;

      expect(proxyTree.transformTreeToBranchObject()).toStrictEqual({
        branches: [
          {
            branches: [
              {
                branches: [
                  {
                    branches: [],
                    key: 'b',
                    timesAccessed: 1,
                  },
                ],
                key: '0',
                timesAccessed: 1,
              },
              {
                branches: [
                  {
                    branches: [
                      {
                        branches: [
                          {
                            branches: [],
                            key: 'b',
                            timesAccessed: 1,
                          },
                        ],
                        key: 'a',
                        timesAccessed: 1,
                      },
                    ],
                    key: '1000',
                    timesAccessed: 1,
                  },
                ],
                key: '1',
                timesAccessed: 1,
              },
            ],
            key: 'a',
            timesAccessed: 3,
          },
          {
            branches: [
              {
                branches: [],
                key: 'a',
                timesAccessed: 1,
              },
            ],
            key: 'c',
            timesAccessed: 1,
          },
          {
            branches: [],
            key: 'b',
            timesAccessed: 1,
          },
        ],
        key: 'root',
        timesAccessed: 5,
      });
    });

    describe('transformTreeToBranchObject function tests', () => {
      beforeEach(() => {
        jest.spyOn(proxyTree, 'transformTreeToBranchObject');
      });

      it('should track 2 layer deep accessed object properties', () => {
        const proxyfiedOrginal = proxyTree.proxy;

        // Access Properties
        proxyfiedOrginal.a;
        proxyfiedOrginal.a[0];
        proxyfiedOrginal.c.a;

        expect(proxyTree.getUsedRoutes()).toStrictEqual([
          ['a', '0'],
          ['c', 'a'],
          ['a'],
        ]);
        expect(proxyTree.transformTreeToBranchObject).toHaveBeenCalledTimes(1);
      });

      it('should track 3 layer deep accessed object properties', () => {
        const proxyfiedOrginal = proxyTree.proxy;

        // Access Properties
        proxyfiedOrginal.a;
        proxyfiedOrginal.a[0]['b'];
        proxyfiedOrginal.c.a;
        proxyfiedOrginal.b;

        expect(proxyTree.getUsedRoutes()).toStrictEqual([
          ['a', '0', 'b'],
          ['c', 'a'],
          ['b'],
          ['a'],
        ]);
        expect(proxyTree.transformTreeToBranchObject).toHaveBeenCalledTimes(1);
      });

      it('should track 5 layer deep accessed object properties', () => {
        const proxyfiedOrginal = proxyTree.proxy;

        // Access Properties
        proxyfiedOrginal.a;
        proxyfiedOrginal.a[0]['b'];
        proxyfiedOrginal.a[1][1000]['a']['b'];
        proxyfiedOrginal.c.a;
        proxyfiedOrginal.b;

        expect(proxyTree.getUsedRoutes()).toStrictEqual([
          ['a', '0', 'b'],
          ['a', '1', '1000', 'a', 'b'],
          ['c', 'a'],
          ['b'],
          ['a'],
        ]);
        expect(proxyTree.transformTreeToBranchObject).toHaveBeenCalledTimes(1);
      });
    });
  });
});
