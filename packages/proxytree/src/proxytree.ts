import { Branch, BranchKey, DefaultProxyTreeObject } from './branch';

export class ProxyTree<T = DefaultProxyTreeObject> {
  public rootBranch: Branch<T>; // Root Branch of the proxy tree
  public proxy: T; // target wrapped with a proxy

  /**
   * @public
   * ProxyTree - A Tree that wraps around the target object and each of its sub object a Proxy
   * @param target - Target Object
   */
  constructor(target: T) {
    this.rootBranch = this.createBranch(target);
    this.proxy = this.rootBranch.proxy;
  }

  /**
   * @public
   * Creates a new Branch of the ProxyTree
   * @param target - Target Object
   */
  public createBranch(target: DefaultProxyTreeObject) {
    return new Branch(this, target);
  }

  /**
   * @public
   * Transforms the ProxyTree into a simple readable object format
   */
  public transformTreeToBranchObject(): BranchObject {
    let rootBranchUses = 0;

    // Calculate root Branch uses
    this.rootBranch.childBranches.forEach(
      (childBranch) => (rootBranchUses += childBranch.timesAccessed)
    );

    // Create root Branch
    const rootBranch: BranchObject = {
      key: 'root',
      timesAccessed: rootBranchUses,
      branches: [],
    };

    const walk = (branch: Branch<any>, currentBranchObject: BranchObject) => {
      const childBranches = branch.childBranches;

      // Check if Branch has any sub Branches
      if (childBranches.size > 0) {
        // Go through sub Branches and transform them to a BranchObject
        childBranches.forEach((branchRoute) => {
          const newBranchObject: BranchObject = {
            key: branchRoute.key,
            timesAccessed: branchRoute.timesAccessed,
            branches: [],
          };

          // Add Sub Branch to parent Branch 'branches' array
          currentBranchObject.branches.push(newBranchObject);

          // Check if Route leads to an sub Branch
          // If so the Tree doesn't end here (-> sub object)
          // If not so the Tree ends here so the route leads into a basic value like a number
          // If Route has sub Branch go deeper and transform the deeper Branches into BranchObjects
          if (branchRoute.branch) {
            walk(branchRoute.branch, newBranchObject);
          }
        });
      }
    };

    // Start walking through the ProxyTree
    walk(this.rootBranch, rootBranch);

    return rootBranch;
  }

  /**
   * @public
   * Returns the path to the tracked properties in array shape
   * For example, an object `{ a: [{ b: 'c' }, { 1000: 'value' }, 'b'] }`,
   * has got the following paths pointing to existing properties:
   *
   * - `[]`
   * - `['a']`
   * - `['a', 0]`
   * - `['a', 0, 'b']`
   * - `['a', 1]`
   * - `['a', 1, 1000]`
   * - `['a', 2]`
   */
  public getUsedRoutes(): Path[] {
    const usedRoutes: Path[] = [];

    // Transform Proxy Tree into simple accessible object
    const rootBranchObject = this.transformTreeToBranchObject();

    const walk = (branchObject: BranchObject, path?: BranchKey[]) => {
      // Check if Branch Children where accessed.
      // Otherwise here is an end, because whatever is behind the Branch got already tracked or got never accessed
      let branchChildRoutesTimesUsed = 0;
      branchObject.branches.forEach(
        (childBranch) =>
          (branchChildRoutesTimesUsed += childBranch.timesAccessed)
      );

      // Check if Branch has any sub Branches
      // and got accessed
      // If so walk deeper into the ProxyTree
      // If not so push the path into the 'usedRoutes' array since this Path/Route ends here
      if (
        branchObject.branches.length > 0 &&
        branchObject.timesAccessed > 0 &&
        branchChildRoutesTimesUsed > 0
      ) {
        // Go through sub Branches and walk into them if they got accessed
        branchObject.branches.forEach((branchChildObject) => {
          if (branchChildObject.timesAccessed > 0) {
            walk(
              branchChildObject,
              path ? [...path, branchChildObject.key] : [branchChildObject.key]
            );
          }

          // Decrease times accessed
          branchObject.timesAccessed -= 1;
        });
      } else {
        // Push discovered Path into 'usedRoutes'
        if (path) usedRoutes.push(path);

        // Decrease times accessed
        if (branchObject.timesAccessed > 0) branchObject.timesAccessed -= 1;
      }
    };

    // Start walking through the ProxyTree
    // Therefore walk through the tree until the root 'timesAccessed' = 0
    // Everytime it passed the branch it decreases the 'timesAccessed' property
    while (rootBranchObject.timesAccessed > 0) {
      walk(rootBranchObject);
    }

    return usedRoutes;
  }
}

/**
 * @param key - Property leading to the this Sub Branch in the parent Branch (object)
 * @param timesAccessed - How often the Branch was accessed
 * @param branch - Sub Branches of this Branch
 */
export interface BranchObject {
  key: BranchKey;
  timesAccessed: number;
  branches: BranchObject[];
}

export type Path = BranchKey[];
