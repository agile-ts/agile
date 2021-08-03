import { Agile, runsOnServer } from './internal';

/**
 * Shared Agile Instance that is used when no Agile Instance was specified.
 */
let sharedAgileInstance = new Agile({
  key: 'shared',
  localStorage: !runsOnServer(),
});
export { sharedAgileInstance as shared };

/**
 * Assigns the specified Agile Instance as the shared Agile Instance.
 *
 * @param agileInstance - Agile Instance to become the new shared Agile Instance.
 */
// https://stackoverflow.com/questions/32558514/javascript-es6-export-const-vs-export-let
export function assignSharedAgileInstance(agileInstance: Agile): void {
  sharedAgileInstance = agileInstance;
}

export interface CreateAgileSubInstanceInterface {
  /**
   * Instance of Agile the Instance belongs to.
   * @default sharedAgileInstance
   */
  agileInstance?: Agile;
}
