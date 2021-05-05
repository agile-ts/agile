import { ProxyTree } from './index';
import { isObject } from './utils';

export class Branch<T extends object = DefaultProxyTreeObject> {
  public proxy: T; // Target object wrapped in proxy
  public target: T; // Target object

  public proxyTree: ProxyTree; // ProxyTree the Branch belongs to
  public childBranches: Set<BranchRoute> = new Set([]); // Child Branches of this Branch

  /**
   * @public
   * Branch - Represents a target object wrapped into a Proxy.
   * It keeps track of all of its sub Branches (objects)
   * @param proxyTree - Proxy Tree the Branch belongs to
   * @param target - Target Object the Branch represents
   */
  constructor(proxyTree: ProxyTree, target: T) {
    this.proxyTree = proxyTree;
    this.target = target;

    // Create Handler Methods which will be called by the Proxy in order to intercepts specific Events
    const handler = {
      // get() handler intercepts an attempt to access a property of the target object (object this branch represents)
      get: (target: T, key: BranchKey) => {
        return this.recordUsage(target, key);
      },
    };

    // Wrap Proxy around target object
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy
    this.proxy = new Proxy(target, handler);
  }

  /**
   * @private
   * Record usage of an accessed key in a target object
   * @param target - Target Object in which a key got accessed
   * @param key - Key that got accessed in the target Object
   */
  private recordUsage(target: T, key: BranchKey): T | undefined {
    if (key in target) {
      const value = target[key];

      // Check if property was accessed before and therefore has an existing Route to a Branch or value
      const branchRoute = this.getBranchRouteAtKey(key);

      // If Branch exists, increment the 'timesUsed' property in order to keep track of how often it was accessed
      if (branchRoute) {
        branchRoute.timesAccessed += 1;
        return branchRoute.branch?.proxy || target[key];
      }

      // If Branch doesn't exist, create new Route and a sub Branch if no final value got reached
      const newRoute: BranchRoute = {
        key,
        timesAccessed: 1,
        branch:
          (isObject(value) &&
            this.proxyTree.createBranch<typeof value>(value)) ||
          null,
      };
      this.childBranches.add(newRoute);

      // Return proxyfied object of created Branch or the final value if the Route doesn't lead to a sub Branch
      return newRoute.branch?.proxy || target[key];
    }

    return undefined;
  }

  /**
   * @public
   * Checks if a Route with a specific key already exists
   * @param key - Key of the Route
   */
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
export interface BranchRoute<T extends object = DefaultProxyTreeObject> {
  key: BranchKey;
  timesAccessed: number;
  branch: Branch<T> | null;
}

export type BranchKey = string | number | symbol;

export type DefaultProxyTreeObject = Record<string, any>; // same as { [key: string]: any };
