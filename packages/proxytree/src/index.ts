// TODO REFACTOR

export class ProxyTree<T = DefaultObject> {
  public rootBranch: Branch<T>;
  public proxy: T;

  constructor(target: T) {
    this.rootBranch = this.createBranch(target);
    this.proxy = this.rootBranch.proxy;
  }

  public createBranch(target: DefaultObject) {
    return new Branch(this, target);
  }

  public transformTreeToBranchObject() {
    let rootBranchUses = 0;

    // Calculate rootBranch uses
    this.rootBranch.childBranches.forEach(
      (childBranch) => (rootBranchUses += childBranch.timesUsed)
    );

    const rootBranch: BranchObject = {
      key: 'root',
      timesUsed: rootBranchUses,
      branches: [],
    };

    const walk = (branch: Branch<any>, currentBranchObject: BranchObject) => {
      const childBranches = branch.childBranches;

      // Check if branch has any sub Branches
      if (childBranches.size > 0) {
        childBranches.forEach((branchRoute) => {
          const newBranchObject: BranchObject = {
            key: branchRoute.key,
            timesUsed: branchRoute.timesUsed,
            branches: [],
          };

          // Add Sub Branch to parent Branch 'branches' array
          currentBranchObject.branches.push(newBranchObject);

          // Check if route has an Branch (is sub object)
          // If null the Branch end is reached (is value)
          if (branchRoute.branch) {
            walk(branchRoute.branch, newBranchObject);
          }
        });
      }
    };

    // Start walking through the Tree
    walk(this.rootBranch, rootBranch);

    return rootBranch;
  }

  public getUsedRoutes() {
    const usedRoutes: BranchKey[][] = [];
    const rootBranchObject = this.transformTreeToBranchObject();

    const walk = (branchObject: BranchObject, path?: BranchKey[]) => {
      // Check if branch children where used because otherwise here is an end -> push path
      let branchChildRoutesTimesUsed = 0;
      branchObject.branches.forEach(
        (childBranch) => (branchChildRoutesTimesUsed += childBranch.timesUsed)
      );

      // Check if branch has any sub Branches
      if (
        branchObject.branches.length > 0 &&
        branchObject.timesUsed > 0 &&
        branchChildRoutesTimesUsed > 0
      ) {
        // Walk into Children and update path
        branchObject.branches.forEach((branchChildObject) => {
          const newPath = path
            ? [...path, branchChildObject.key]
            : [branchChildObject.key];

          // Go only in sub branch if it is used
          if (branchChildObject.timesUsed > 0) walk(branchChildObject, newPath);

          // Decrease times used
          branchObject.timesUsed -= 1;
        });
      } else {
        if (path) usedRoutes.push(path);

        // Decrease times used
        branchObject.timesUsed -= 1;
      }
    };

    while (rootBranchObject.timesUsed > 0) {
      walk(rootBranchObject);
    }

    return usedRoutes;
  }
}

class Branch<T = DefaultObject> {
  public proxy: T; // Object wrapped in proxy
  public target: T; // Object without proxy wrapper

  public proxyTree: ProxyTree;
  public childBranches: Set<BranchRoutes> = new Set([]);

  constructor(proxyTree: ProxyTree, target: T) {
    this.proxyTree = proxyTree;
    this.target = target;

    // Wrap proxy around target object
    this.proxy = new Proxy(target as any, {
      get: (target, key) => {
        if (key in target) {
          console.log('Get: ', key, target); // TODO ANALYSE WHEN GET GETS CALLED
          const isObject = typeof target[key] === 'object';

          // Search for existing Route
          const branchRoute = this.getBranchRouteAtKey(key);

          // If Route exists, count 'used' in existing Branch Route
          if (branchRoute) {
            branchRoute.timesUsed += 1;
            return branchRoute.branch?.proxy || target[key];
          }

          // Create new Branch Route
          const newRoute: BranchRoutes = {
            key,
            timesUsed: 1,
            branch: isObject && proxyTree.createBranch(target[key] || null),
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
  timesUsed: number; // How often the Route was used
  branch: Branch<T> | null; // Branch to which the route goes
}

interface BranchObject {
  key: BranchKey;
  timesUsed: number;
  branches: BranchObject[];
}

type BranchKey = string | number | symbol;

type DefaultObject = Record<string, any>; // same as { [key: string]: any };
