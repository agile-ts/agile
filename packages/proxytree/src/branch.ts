import { ProxyTree } from './index';
import { isObject } from './utils';

export class Branch<T extends object = DefaultProxyTreeObject> {
  public proxy: T; // Target object wrapped in proxy
  public target: T; // Target object

  public proxyTree: ProxyTree; // ProxyTree the Branch belongs to
  public childBranches: Set<BranchRoute> = new Set([]); // Child Branches of this Branch

  /**
   * @public
   * Branch - Represents a target object wrapped in a Proxy().
   * In doing so, it keeps track of all its properties
   * and transforms them into a sub Branch as soon as they are accessed.
   * The Branch isn't aware of not accessed properties, as they aren't yet relevant.
   * @param proxyTree - Proxy Tree the Branch belongs to
   * @param target - Target Object the Branch represents and wraps a Proxy() around
   */
  constructor(proxyTree: ProxyTree, target: T) {
    this.proxyTree = proxyTree;
    this.target = target;

    // Create Handler Methods which will be called by the Proxy() in order to intercepts specific Events
    const handler = {
      // get() handler intercepts an attempt to access a property of the target object (object this branch represents)
      get: (target: T, key: BranchKey) => {
        // If array.length, don't track it
        if (Array.isArray(target) && key === 'length') return target.length;

        // If key doesn't exists in target, don't track it
        if (!(key in target)) return undefined;

        // If object has no own property at key, don't track it
        // This does the same as (key in target) but also filters method calls like (object.toString(), array.slice(), array.filter(), ..)
        if (!Object.prototype.hasOwnProperty.call(target, key))
          return target[key];

        return this.recordUsage(target, key);
      },
    };

    // Wrap Proxy around target object
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy
    this.proxy = new Proxy(target, handler);
  }

  /**
   * @private
   * Record usage of an accessed property in the passed target object.
   * @param target - Target object in which a property at key was accessed
   * @param key - Key that was accessed in the target object
   */
  private recordUsage(target: T, key: BranchKey): T | undefined {
    if (key in target) {
      const value = target[key];

      // Check if property was accessed before and therefore has an existing Route to a sub Branch or value
      const branchRoute = this.getBranchRouteAtKey(key);

      // If Branch exists, increment the 'timesAccessed' property in order to keep track of how often it was accessed
      if (branchRoute) {
        branchRoute.timesAccessed += 1;
        return branchRoute.branch?.proxy || target[key];
      }

      // If Branch doesn't exist, create new Route and a sub Branch if no final primitive value got reached
      const newRoute: BranchRoute = {
        key,
        timesAccessed: 1,
        branch:
          (isObject(value) &&
            this.proxyTree.createBranch<typeof value>(value)) ||
          null,
      };
      this.childBranches.add(newRoute);

      // Return proxyfied object of created Branch or the final primitive value if the Route doesn't lead to a sub Branch (object)
      return newRoute.branch?.proxy || target[key];
    }

    return undefined;
  }

  /**
   * @public
   * Checks if a Route to a particular property already exists in the sub Branches of this Branch.
   * @param key - Property key of the Route
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
 * @param key - Property key leading to this Sub Branch in the parent Branch (object)
 * @param timesAccessed - How often the Route was used/accessed
 * @param branch - Branch to which the Route leads.
 * If Branch is null it means that the Tree ends here since the Route represents a primitive value (like a number).
 */
export interface BranchRoute<T extends object = DefaultProxyTreeObject> {
  key: BranchKey;
  timesAccessed: number;
  branch: Branch<T> | null;
}

export type BranchKey = string | number | symbol;

export type DefaultProxyTreeObject = Record<string, any>; // same as { [key: string]: any };
