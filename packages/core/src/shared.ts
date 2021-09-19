import { isFunction } from '@agile-ts/utils';
import { LogCodeManager } from './logCodeManager';
import { Agile } from './agile';

/**
 * Shared Agile Instance that is used when no Agile Instance was specified.
 */
let sharedAgileInstance = new Agile({
  key: 'shared',
});
export { sharedAgileInstance, sharedAgileInstance as shared };

/**
 * Assigns the specified Agile Instance as the shared Agile Instance.
 *
 * @param agileInstance - Agile Instance to become the new shared Agile Instance.
 */
// https://stackoverflow.com/questions/32558514/javascript-es6-export-const-vs-export-let
export function assignSharedAgileInstance(agileInstance: Agile): void {
  sharedAgileInstance = agileInstance;
}

// Note: Not located in 'utils.ts' due circular dependency issues
/**
 * Extracts an Instance of Agile from the specified Instance.
 * When no valid Agile Instance was found,
 * it returns the global bound Agile Instance or `undefined`.
 *
 * @internal
 * @param instance - Instance to extract the Agile Instance from.
 */
export function getAgileInstance(instance: any): Agile | undefined {
  try {
    // Try to get Agile Instance from specified Instance
    if (instance != null) {
      const _agileInstance = isFunction(instance['agileInstance'])
        ? instance['agileInstance']()
        : instance['agileInstance'];
      if (_agileInstance) return _agileInstance;
    }

    // Try to get shared Agile Instance
    if (sharedAgileInstance instanceof Agile) {
      return sharedAgileInstance;
    }

    // Return global bound Agile Instance
    return globalThis[Agile.globalKey];
  } catch (e) {
    LogCodeManager.log('20:03:00', [], instance);
  }

  return undefined;
}

export interface CreateAgileSubInstanceInterface {
  /**
   * Instance of Agile the Instance belongs to.
   * @default sharedAgileInstance
   */
  agileInstance?: Agile;
}
