export class ProxyTree<T = DefaultObject> {
  public rootBranch: Branch<T>;
  public proxy: T;

  constructor(target: T) {
    this.rootBranch = this.createBranch(target, null);
    this.proxy = this.rootBranch.proxy;
  }

  public createBranch(target: DefaultObject, parentBranch: Branch | null) {
    const branch = new Branch(this, target, parentBranch);

    return branch;
  }

  public transformTreeToArray() {
    const tree: BranchKey[][] = [];

    const walk = (branch: Branch<any>, path?: BranchKey[]) => {
      const childBranches = branch.childBranches;

      // Check if branch has any sub Branches
      if (childBranches.size > 0) {
        childBranches.forEach((branchRoute) => {
          const newPath = path ? [...path, branchRoute.key] : [branchRoute.key];

          // Check if route has an Branch (is object) or the end (is value)
          // If End, push path to tree, otherwise walk deeper into the Tree
          if (branchRoute.branch) {
            walk(branchRoute.branch, newPath);
          } else {
            tree.push(newPath);
          }
        });
      } else {
        if (path) tree.push(path);
      }
    };

    walk(this.rootBranch);

    return tree;
  }
}

class Branch<T = DefaultObject> {
  public proxy: T; // Object wrapped in proxy
  public target: T; // Object without proxy wrapper

  public proxyTree: ProxyTree;
  public childBranches: Set<BranchRoutes> = new Set([]);
  public parentBranch: Branch | null;

  constructor(proxyTree: ProxyTree, target: T, parentBranch: Branch | null) {
    this.proxyTree = proxyTree;
    this.target = target;
    this.parentBranch = parentBranch;

    this.proxy = new Proxy(target as any, {
      get: (target, key) => {
        console.log('Get: ', key, target);

        if (key in target) {
          const isObject = typeof target[key] === 'object';

          // Search for existing Route
          const branchRoute = this.getBranchRouteAtKey(key);

          // Count used in existing Branch Route
          if (branchRoute) {
            branchRoute.used += 1;
            console.log('Count used: ', branchRoute.key, branchRoute.used);
            return branchRoute.branch?.proxy || target[key];
          }

          // Create new Branch Route
          const newRoute = {
            key,
            used: 1,
            branch:
              isObject && proxyTree.createBranch(target[key] || null, this),
          };
          this.childBranches.add(newRoute);

          return newRoute.branch?.proxy || target[key];
        }

        return undefined;
      },
    });
  }

  public getBranchRouteAtKey(key: BranchKey): BranchRoutes | null {
    for (const branchRoute of this.childBranches) {
      if (branchRoute.key === key) {
        return branchRoute;
      }
    }
    return null;
  }
}

interface BranchRoutes<T = DefaultObject> {
  key: BranchKey; // Route to the Branch in object
  used: number; // How often the Route was used
  branch: Branch<T> | null; // Branch to which the route goes
}

type BranchKey = string | number | symbol;

type DefaultObject = Record<string, any>; // same as { [key: string]: any };

/*
class ProxyTree<T extends object = {}> {
  public cache: ProxyCache<T> = new WeakMap();
  constructor(target: T) {}

  public createProxyHandler(target: T): ProxyHandler2<T> {
    return new ProxyHandler2<T>(this, target);
  }

  public createProxy(target: T, affected: WeakMap<object, unknown>) {}
}

class ProxyHandler2<T extends object = {}> {
  public proxy: T;
  public target: T;
  public affected: Affected = new WeakMap();
  public methods: proxyMethods<T>;
  public proxyTree: ProxyTree<T>;

  constructor(proxyTree: ProxyTree<T>, target: T) {
    this.proxyTree = proxyTree;
    this.target = target;
    this.methods = {
      get: (target, key) => {
        this.recordUsage(key);
        return proxyTree.createProxy((target as any)[key], this.affected);
      },
    };

    this.proxy = new Proxy(target, this.methods);
  }

  public recordUsage(key: string | number | symbol) {
    let used = this.affected.get(this.target);
    let timesUsed = 1;
    if (!used) {
      used = new Set();
      this.affected.set(this.target, used);
    } else {
      used.forEach((item) => {
        if (item.key === key) {
          timesUsed += item.used;
        }
      });
    }
    used.add({ key, used: timesUsed });
  }
}

type Affected = WeakMap<
  object,
  Set<{ key: string | number | symbol; used: number }>
>;
type ProxyCache<T extends object> = WeakMap<object, ProxyHandler<T>>;

interface proxyMethods<T extends object> {
  get(target: T, key: string | number | symbol): unknown;
  has?(target: T, key: string | number | symbol): boolean;
  ownKeys?(target: T): (string | number | symbol)[];
  set?(target: T, key: string | number | symbol, value: unknown): boolean;
  deleteProperty?(target: T, key: string | number | symbol): boolean;
}
 */
