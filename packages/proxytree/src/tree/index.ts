import { Branch, BranchKey, DefaultProxyTreeObject } from './branch';
import { isObject } from '../utils';

export * from './branch';

export class ProxyTree<T extends Object = DefaultProxyTreeObject> {
  public rootBranch: Branch<T>; // Root Branch of the proxy tree
  public proxy: T; // Target object wrapped in proxy

  /**
   * @public
   * ProxyTree - Class that wraps around a target object, and its nested objects as you access them
   * in order to keep track of which properties were accessed via get/has proxy handlers.
   * @param target - Target Object
   */
  constructor(target: T) {
    this.rootBranch = this.createBranch<T>(target) as any;
    this.proxy = (this.rootBranch?.proxy || null) as any;
  }

  /**
   * @public
   * Creates a new Branch of the ProxyTree which represents the passed target object.
   * @param target - Target Object
   */
  public createBranch<X extends Object = DefaultProxyTreeObject>(
    target: X
  ): Branch<X> | null {
    if (!isObject(target)) {
      console.error(
        "ProxyTree: The ProxyTree accepts only values from the type 'object' and 'array'! " +
          `The passed type was '${typeof target}'! ` +
          'Learn more here: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy'
      );
      return null;
    }
    return new Branch<X>(this, target);
  }

  /**
   * @public
   * Transforms Proxy Tree into an easily processable object.
   */
  public transformTreeToBranchObject(): BranchObject {
    let rootBranchUses = 0;

    // Calculate root Branch uses
    this.rootBranch.childBranches.forEach(
      (childBranch) => (rootBranchUses += childBranch.timesAccessed)
    );

    // Create root BranchObject
    const rootBranch: BranchObject = {
      key: 'root',
      timesAccessed: rootBranchUses,
      branches: [],
    };

    // Method that walks deeper into the Proxy Tree
    const walk = (branch: Branch<any>, currentBranchObject: BranchObject) => {
      const childBranches = branch.childBranches;

      // Check if Branch has any sub Branches
      if (childBranches.size > 0) {
        // Go through sub Branches and transform them to BranchObjects
        childBranches.forEach((branchRoute) => {
          const newBranchObject: BranchObject = {
            key: branchRoute.key,
            timesAccessed: branchRoute.timesAccessed,
            branches: [],
          };

          // Add Sub Branch to the parent Branch ('branches' array)
          currentBranchObject.branches.push(newBranchObject);

          // Check if Route leads to any sub Branch.
          // If so the Tree doesn't end here (-> sub object).
          // So walk deeper and transform the deeper Branches into BranchObjects.
          // Otherwise the Tree ends here and the Route leads to a primitive value like a number.
          if (branchRoute.branch) {
            walk(branchRoute.branch, newBranchObject);
          }
        });
      }
    };

    // Start walking through the Proxy Tree
    walk(this.rootBranch, rootBranch);

    return rootBranch;
  }

  /**
   * @public
   * Returns the Paths to the accessed properties in array shape.
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
   *
   * Be aware that this path points are only tracked if the accordingly property was actually accessed.
   * The Proxy Tree isn't aware of not accessed properties and thereby doesn't know the path to them
   * as they aren't relevant yet.
   */
  public getUsedRoutes(): Path[] {
    const usedRoutes: Path[] = [];

    // Checks if path/route already exists in 'usedRoutes'
    const inRoutes = (path: Path): boolean => {
      for (const route of usedRoutes) {
        if (JSON.stringify(route) === JSON.stringify(path)) return true;
      }
      return false;
    };

    // Transform Proxy Tree into simple accessible object
    const rootBranchObject = this.transformTreeToBranchObject();

    const walk = (branchObject: BranchObject, path?: BranchKey[]) => {
      // Check if Branch Children where accessed.
      // Otherwise here is an end, because whatever is behind this Branch got already tracked or was never accessed
      let branchChildRoutesTimesUsed = 0;
      branchObject.branches.forEach(
        (childBranch) =>
          (branchChildRoutesTimesUsed += childBranch.timesAccessed)
      );

      // Check if Branch has any sub Branches and got accessed.
      // If so walk deeper into the Proxy Tree.
      // Otherwise push the path into the 'usedRoutes' array because this particular Path/Route ends here
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

          // Decrease times accessed (because we passed this Branch in order to get to the child Branch)
          branchObject.timesAccessed -= 1;
        });
      } else {
        // Push discovered Path into 'usedRoutes'
        if (path && !inRoutes(path)) usedRoutes.push(path);

        // Decrease times accessed
        if (branchObject.timesAccessed > 0) branchObject.timesAccessed -= 1;
      }
    };

    // Start walking through the Proxy Tree.
    // Therefore walk through the Tree until the root Branch property 'timesAccessed' = 0.
    // Everytime it passes a Branch it decreases the 'timesAccessed' property.
    // This way it is able to reconstruct each used route to the acceded properties.
    while (rootBranchObject.timesAccessed > 0) {
      walk(rootBranchObject);
    }

    return usedRoutes;
  }
}

/**
 * @param key - Property key leading to this Sub Branch in the parent Branch (object)
 * @param timesAccessed - How often the Branch was accessed
 * @param branch - Sub Branches of this Branch
 */
export interface BranchObject {
  key: BranchKey;
  timesAccessed: number;
  branches: BranchObject[];
}

export type Path = BranchKey[];
