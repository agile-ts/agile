import { ProxyTree } from './index';

export class Branch<T = DefaultProxyTreeObject> {
  public proxy: T; // Target object wrapped in proxy
  public target: T; // Target object

  public proxyTree: ProxyTree; // ProxyTree the Branch belongs to
  public childBranches: Set<BranchRoute> = new Set([]); // Child Branches of this Branch

  /**
   * @public
   * Branch - Represents a target object wrapped into a Proxy
   * and keeps track of all its sub Branches (objects)
   * @param proxyTree - Proxy Tree the Branch belongs to
   * @param target - Target Object the Branch represents
   */
  constructor(proxyTree: ProxyTree, target: T) {
    this.proxyTree = proxyTree;
    this.target = target;

    // Wrap proxy around target object
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy
    this.proxy = new Proxy(target as any, {
      // get() handler intercepts an attempt to access a property of the target object (object this branch represents)
      get: (target, key) => {
        if (key in target) {
          const isObject = typeof target[key] === 'object';

          // Check if property was accessed before and therefore has an existing Branch
          const branchRoute = this.getBranchRouteAtKey(key);

          // If Branch exists, increment the 'timesUsed' property in order to see how often it was accessed
          if (branchRoute) {
            branchRoute.timesAccessed += 1;
            return branchRoute.branch?.proxy || target[key];
          }

          // If Branch doesn't exist, create new Branch Route
          const newRoute: BranchRoute = {
            key,
            timesAccessed: 1,
            branch: isObject && proxyTree.createBranch(target[key] || null),
          };
          this.childBranches.add(newRoute);

          return newRoute.branch?.proxy || target[key];
        }

        return undefined;
      },
    });
  }

  public getBranchRouteAtKey(key: BranchKey): BranchRoute | null {
    for (const branchRoute of this.childBranches) {
      if (branchRoute.key === key) {
        return branchRoute;
      }
    }
    return null;
  }
}

/**
 * @param key - Property leading to the this Sub Branch in the parent Branch (object)
 * @param timesAccessed - How often the Route was used/accessed
 * @param branch - Branch to which the Route leads
 */
export interface BranchRoute<T = DefaultProxyTreeObject> {
  key: BranchKey;
  timesAccessed: number;
  branch: Branch<T> | null;
}

export type BranchKey = string | number | symbol;

export type DefaultProxyTreeObject = Record<string, any>; // same as { [key: string]: any };
