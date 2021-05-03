export class ProxyTree<T extends object = {}> {
  public rootBranch: Branch<T>;
  public proxy: T;

  constructor(target: T) {
    this.rootBranch = this.createBranch(target);
    this.proxy = this.rootBranch.proxy;
  }

  public createBranch(target: object) {
    const branch = new Branch(this, target);

    return branch;
  }
}

class Branch<T extends object> {
  public proxyTree: ProxyTree;
  public proxy: T;
  public routes: Set<BranchRoutes> = new Set([]);
  public target: T;

  constructor(proxyTree: ProxyTree, target: T) {
    this.proxyTree = proxyTree;
    this.target = target;

    this.proxy = new Proxy(target, {
      get: (target, key) => {
        if (typeof target[key] === 'object') {
          const route = { route: key, used: 1 };

          // Search if route already exists and remove it if so
          for (const branchRoute of this.routes) {
            if (branchRoute.route === route.route) {
              route.used += branchRoute.used;
              this.routes.delete(branchRoute);
            }
          }

          // Add route to routes
          this.routes.add(route);

          return proxyTree.createBranch(target).proxy;
        }

        return target[key];
      },
    });
  }
}

interface BranchRoutes {
  route: string | number | symbol;
  used: number;
}

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
