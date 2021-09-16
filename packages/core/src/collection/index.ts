import { Collection, CollectionConfig, DefaultItem } from './collection';
import { Agile } from '../agile';
import { shared } from '../shared';

export * from './collection';
export * from './collection.persistent';
export * from './group';
export * from './group/group.observer';
export * from './item';
export * from './selector';

/**
 * Returns a newly created Collection.
 *
 * A Collection manages a reactive set of Information
 * that we need to remember globally at a later point in time.
 * While providing a toolkit to use and mutate this set of Information.
 *
 * It is designed for arrays of data objects following the same pattern.
 *
 * Each of these data object must have a unique `primaryKey` to be correctly identified later.
 *
 * You can create as many global Collections as you need.
 *
 * [Learn more..](https://agile-ts.org/docs/core/agile-instance/methods#createcollection)
 *
 * @public
 * @param config - Configuration object
 * @param agileInstance - Instance of Agile the Collection belongs to.
 */
export function createCollection<DataType extends Object = DefaultItem>(
  config?: CollectionConfig<DataType>,
  agileInstance: Agile = shared
): Collection<DataType> {
  return new Collection<DataType>(agileInstance, config);
}
