import {
  EnhancedState,
  Collection,
  DefaultItem,
  ItemKey,
  normalizeArray,
  Item,
  copy,
  CollectionPersistent,
  StatePersistentConfigInterface,
  isValidObject,
  PersistentKey,
  ComputedTracker,
  StateIngestConfigInterface,
  removeProperties,
  LogCodeManager,
  StateObserversInterface,
  GroupObserver,
  StateObserver,
  defineConfig,
  GroupIngestConfigInterface,
} from '../../internal';

export class Group<
  DataType extends Object = DefaultItem,
  ValueType = Array<ItemKey> // To extract the Group Type Value in Integration methods like 'useAgile()'
> extends EnhancedState<Array<ItemKey>> {
  // Collection the Group belongs to
  collection: () => Collection<DataType>;

  static rebuildGroupSideEffectKey = 'rebuildGroup';

  // Item values represented by the Group
  public _output: Array<DataType> = [];
  // Next output of the Group (which can be used for dynamic Group updates)
  public nextGroupOutput: Array<DataType> = [];
  // Precise itemKeys of the Group only include itemKeys
  // that actually exist in the corresponding Collection
  public _preciseItemKeys: Array<ItemKey> = [];

  // Manages dependencies to other States and subscriptions of UI-Components.
  // It also serves as an interface to the runtime.
  public observers: GroupObservers<ItemKey[], DataType> = {} as any;

  // Keeps track of all Item identifiers for Items that couldn't be found in the Collection
  public notFoundItemKeys: Array<ItemKey> = [];

  // Whether the initial value was loaded from the corresponding Persistent
  // https://github.com/agile-ts/agile/issues/155
  public loadedInitialValue = true;

  /**
   * An extension of the State Class that categorizes and preserves the ordering of structured data.
   * It allows us to cluster together data from a Collection as an array of Item keys.
   *
   * Note that a Group doesn't store the actual Items. It only keeps track of the Item keys
   * and retrieves the fitting Items when needed.
   *
   * [Learn more..](https://agile-ts.org/docs/core/collection/group/)
   *
   * @public
   * @param collection - Collection to which the Group belongs.
   * @param initialItems - Key/Name identifiers of the Items to be clustered by the Group.
   * @param config - Configuration object
   */
  constructor(
    collection: Collection<DataType>,
    initialItems: Array<ItemKey> = [],
    config: GroupConfigInterface = {}
  ) {
    super(collection.agileInstance(), initialItems, config);
    // Have to redefine the value Observer (observers['value']) again,
    // although it was technically set in the State Parent
    // https://github.com/microsoft/TypeScript/issues/1617
    this.observers['value'] = new StateObserver<ItemKey[]>(this, {
      key: config.key,
    });
    this.observers['output'] = new GroupObserver(this, {
      key: config.key,
    });
    this.collection = () => collection;

    // Add side effect to Group
    // that rebuilds the Group whenever the Group value changes
    this.addSideEffect(Group.rebuildGroupSideEffectKey, (state, config) => {
      this.rebuild(config?.any?.trackedChanges || [], config);
    });

    // Initial rebuild
    this.rebuild();
  }

  /**
   * Returns the values of the Items clustered by the Group.
   *
   * [Learn more..](https://agile-ts.org/docs/core/collection/group/properties#output)
   *
   * @public
   */
  public get output(): Array<DataType> {
    ComputedTracker.tracked(this.observers['output']);
    return copy(this._output);
  }

  public set output(value: DataType[]) {
    LogCodeManager.log('1C:03:00', [this._key]);
  }

  /**
   * Returns a boolean indicating whether an Item with the specified `itemKey`
   * is clustered in the Group or not.
   *
   * [Learn more..](https://agile-ts.org/docs/core/collection/group/methods/#has)
   *
   * @public
   * @param itemKey - Key/Name identifier of the Item.
   */
  public has(itemKey: ItemKey) {
    return this.value.indexOf(itemKey) !== -1;
  }

  /**
   * Returns the count of Items clustered by the Group.
   *
   * [Learn more..](https://agile-ts.org/docs/core/collection/group/properties#size)
   *
   * @public
   */
  public get size(): number {
    return this.value.length;
  }

  /**
   * Removes an Item with the specified key/name identifier from the Group,
   * if it exists in the Group.
   *
   * [Learn more..](https://agile-ts.org/docs/core/collection/group/methods#remove)
   *
   * @public
   * @param itemKeys - Key/Name identifier/s of the Item/s to be removed.
   * @param config - Configuration object
   */
  public remove(
    itemKeys: ItemKey | ItemKey[],
    config: GroupRemoveConfigInterface = {}
  ): this {
    const _itemKeys = normalizeArray<ItemKey>(itemKeys);
    const notExistingItemKeysInCollection: Array<ItemKey> = [];
    const notExistingItemKeys: Array<ItemKey> = [];
    let newGroupValue = copy(this.nextStateValue);
    // Need to temporary update the preciseItemKeys
    // since in the rebuild one action (trackedChanges) is performed after the other
    // which requires a dynamic updated index
    const updatedPreciseItemKeys = copy(this._preciseItemKeys);
    config = defineConfig(config, {
      softRebuild: true,
      any: {},
    });
    config.any['trackedChanges'] = []; // TODO might be improved since the 'any' property is very vague

    // Remove itemKeys from Group
    _itemKeys.forEach((itemKey) => {
      const exists = newGroupValue.includes(itemKey);

      // Check if itemKey exists in Group
      if (!exists) {
        notExistingItemKeys.push(itemKey);
        notExistingItemKeysInCollection.push(itemKey);
        return;
      }

      // Track changes to soft rebuild the Group when rebuilding the Group in a side effect
      if (config.softRebuild) {
        const index = updatedPreciseItemKeys.findIndex((ik) => ik === itemKey);
        if (index !== -1) {
          updatedPreciseItemKeys.splice(index, 1);
          config.any['trackedChanges'].push({
            index,
            method: TrackedChangeMethod.REMOVE,
            key: itemKey,
          });
        }
      }

      // Check if itemKey exists in Collection
      if (!this.collection().getItem(itemKey))
        notExistingItemKeysInCollection.push(itemKey);

      // Remove itemKey from Group
      newGroupValue = newGroupValue.filter((key) => key !== itemKey);
    });

    // Return if none of the specified itemKeys exists
    if (notExistingItemKeys.length >= _itemKeys.length) return this;

    // If all removed itemKeys don't exist in the Collection
    // -> no rerender necessary since the output won't change
    if (notExistingItemKeysInCollection.length >= _itemKeys.length)
      config.background = true;

    this.set(newGroupValue, removeProperties(config, ['softRebuild']));

    return this;
  }

  /**
   * Appends new Item/s to the end of the Group.
   *
   * [Learn more..](https://agile-ts.org/docs/core/collection/group/methods#add)
   *
   * @public
   * @param itemKeys - Key/Name identifier/s of Item/s to be added.
   * @param config - Configuration object
   */
  public add(
    itemKeys: ItemKey | ItemKey[],
    config: GroupAddConfigInterface = {}
  ): this {
    const _itemKeys = normalizeArray<ItemKey>(itemKeys);
    const notExistingItemKeysInCollection: Array<ItemKey> = [];
    const existingItemKeys: Array<ItemKey> = [];
    const newGroupValue = copy(this.nextStateValue);
    // Need to temporary update the preciseItemKeys
    // since in the rebuild one action (trackedChanges) is performed after the other
    // which requires a dynamic updated index
    const updatedPreciseItemKeys = copy(this._preciseItemKeys);
    config = defineConfig(config, {
      method: 'push',
      softRebuild: true,
      any: {},
    });
    config.any['trackedChanges'] = []; // TODO might be improved since the 'any' property is very vague

    // Add itemKeys to Group
    _itemKeys.forEach((itemKey) => {
      const exists = newGroupValue.includes(itemKey);

      // Check if itemKey exists in Collection
      if (!this.collection().getItem(itemKey))
        notExistingItemKeysInCollection.push(itemKey);

      // Handle existing Item
      if (exists) {
        existingItemKeys.push(itemKey);
        return;
      }

      // Track changes to soft rebuild the Group when rebuilding the Group in a side effect
      if (config.softRebuild) {
        const index =
          config.method === 'push' ? updatedPreciseItemKeys.length : 0;
        updatedPreciseItemKeys.push(itemKey);
        config.any['trackedChanges'].push({
          index,
          method: TrackedChangeMethod.ADD,
          key: itemKey,
        });
      }

      // Add new itemKey to Group
      newGroupValue[config.method || 'push'](itemKey);
    });

    // Return if all specified itemKeys already exist
    if (existingItemKeys.length >= _itemKeys.length) return this;

    // If all added itemKeys don't exist in the Collection
    // -> no rerender necessary since the output won't change
    if (
      notExistingItemKeysInCollection.concat(existingItemKeys).length >=
      _itemKeys.length
    )
      config.background = true;

    this.set(
      newGroupValue,
      removeProperties(config, ['method', 'softRebuild'])
    );

    return this;
  }

  /**
   * Replaces the old `itemKey` with a new specified `itemKey`.
   *
   * [Learn more..](https://agile-ts.org/docs/core/collection/group/methods#replace)
   *
   * @public
   * @param oldItemKey - Old `itemKey` to be replaced.
   * @param newItemKey - New `itemKey` to replace the before specified old `itemKey`.
   * @param config - Configuration object
   */
  public replace(
    oldItemKey: ItemKey,
    newItemKey: ItemKey,
    config: StateIngestConfigInterface = {}
  ): this {
    const newGroupValue = copy(this._value);
    newGroupValue.splice(newGroupValue.indexOf(oldItemKey), 1, newItemKey);
    this.set(newGroupValue, config);
    return this;
  }

  /**
   * Retrieves all existing Items of the Group from the corresponding Collection and returns them.
   * Items that aren't present in the Collection are skipped.
   *
   * [Learn more..](https://agile-ts.org/docs/core/collection/group/methods#getitems)
   *
   * @public
   */
  public getItems(): Array<Item<DataType>> {
    return this.value
      .map((itemKey) => this.collection().getItem(itemKey))
      .filter((item): item is Item<DataType> => item !== undefined);
  }

  /**
   * Preserves the Group `value` in the corresponding external Storage.
   *
   * The Group key/name is used as the unique identifier for the Persistent.
   * If that is not desired or the Group has no unique identifier,
   * please specify a separate unique identifier for the Persistent.
   *
   * [Learn more..](https://agile-ts.org/docs/core/state/methods/#persist)
   *
   * @public
   * @param config - Configuration object
   */
  public persist(config?: GroupPersistConfigInterface): this;
  /**
   * Preserves the Group `value` in the corresponding external Storage.
   *
   * The specified key is used as the unique identifier for the Persistent.
   *
   * [Learn more..](https://agile-ts.org/docs/core/state/methods/#persist)
   *
   * @public
   * @param key - Key/Name identifier of Persistent.
   * @param config - Configuration object
   */
  public persist(
    key?: PersistentKey,
    config?: GroupPersistConfigInterface
  ): this;
  public persist(
    keyOrConfig: PersistentKey | GroupPersistConfigInterface = {},
    config: GroupPersistConfigInterface = {}
  ): this {
    let _config: GroupPersistConfigInterface;
    let key: PersistentKey | undefined;

    if (isValidObject(keyOrConfig)) {
      _config = keyOrConfig as GroupPersistConfigInterface;
      key = this._key;
    } else {
      _config = config || {};
      key = keyOrConfig as PersistentKey;
    }

    _config = defineConfig(_config, {
      loadValue: true,
      followCollectionPersistKeyPattern: true,
      storageKeys: [],
      defaultStorageKey: null as any,
    });

    // Create storageItemKey based on Collection key/name identifier
    if (_config.followCollectionPersistKeyPattern) {
      key = CollectionPersistent.getGroupStorageKey(
        key || this._key,
        this.collection()._key
      );
    }

    // Persist Group
    super.persist(key, {
      loadValue: _config.loadValue,
      storageKeys: _config.storageKeys,
      defaultStorageKey: _config.defaultStorageKey,
    });

    return this;
  }

  /**
   * Rebuilds the output of the Group
   * and ingests it into the runtime.
   *
   * In doing so, it traverses the Group `value` (Item identifiers)
   * and fetches the fitting Items accordingly.
   *
   * [Learn more..](https://agile-ts.org/docs/core/collection/group/methods#rebuild)
   *
   * @internal
   * @param trackedChanges - Changes that were tracked between two rebuilds.
   * @param config - Configuration object
   */
  public rebuild(
    trackedChanges: TrackedChangeInterface[] = [],
    config: GroupIngestConfigInterface = {}
  ): this {
    // Don't rebuild Group if Collection isn't correctly instantiated yet
    // (because only after a successful instantiation the Collection
    // contains the Items which are essential for a proper rebuild)
    if (!this.collection().isInstantiated) return this;

    // Item keys that couldn't be found in the Collection
    const notFoundItemKeys: Array<ItemKey> = [];

    // Soft rebuild the Collection (-> rebuild only parts of the Collection)
    if (trackedChanges.length > 0) {
      trackedChanges.forEach((change) => {
        const item = this.collection().getItem(change.key);

        switch (change.method) {
          case TrackedChangeMethod.ADD:
            this._preciseItemKeys.splice(change.index, 0, change.key);
            // this._value.splice(change.index, 0, change.key); // Already updated in 'add' method
            if (item != null) {
              this.nextGroupOutput.splice(change.index, 0, copy(item._value));
            } else {
              notFoundItemKeys.push(change.key);
            }
            break;
          case TrackedChangeMethod.UPDATE:
            if (item != null) {
              this.nextGroupOutput[change.index] = copy(item._value);
            } else {
              notFoundItemKeys.push(change.key);
            }
            break;
          case TrackedChangeMethod.REMOVE:
            this._preciseItemKeys.splice(change.index, 1);
            // this._value.splice(change.index, 1); // Already updated in 'remove' method
            this.nextGroupOutput.splice(change.index, 1);
            break;
          default:
            break;
        }
      });
      this.observers['output'].ingest(config);
    }
    // Hard rebuild the whole Collection
    else {
      const groupItemValues: Array<DataType> = [];

      // Reset precise itemKeys array to rebuild it from scratch
      this._preciseItemKeys = [];

      // Fetch Items from Collection
      this._value.forEach((itemKey) => {
        const item = this.collection().getItem(itemKey);
        if (item != null) {
          groupItemValues.push(item._value);
          this._preciseItemKeys.push(itemKey);
        } else notFoundItemKeys.push(itemKey);
      });

      // Ingest rebuilt Group output into the Runtime
      this.observers['output'].ingestOutput(groupItemValues, config);
    }

    // Logging
    if (notFoundItemKeys.length > 0 && this.loadedInitialValue) {
      LogCodeManager.log(
        '1C:02:00',
        [this.collection()._key, this._key],
        notFoundItemKeys
      );
    }

    this.notFoundItemKeys = notFoundItemKeys;

    return this;
  }
}

export type GroupKey = string | number;

export interface GroupObservers<ValueType = any, DataType = any>
  extends StateObserversInterface<ValueType> {
  /**
   * Observer responsible for the output of the Group.
   */
  output: GroupObserver<DataType>;
}

export interface GroupAddConfigInterface extends StateIngestConfigInterface {
  /**
   * In which way the `itemKey` should be added to the Group.
   * - 'push' =  at the end
   * - 'unshift' = at the beginning
   * https://www.tutorialspoint.com/what-are-the-differences-between-unshift-and-push-methods-in-javascript
   * @default 'push'
   */
  method?: 'unshift' | 'push';
  /**
   * Whether to soft rebuild the Group.
   * -> only rebuild the parts of the Group that have actually changed
   * instead of rebuilding the whole Group.
   * @default true
   */
  softRebuild?: boolean;
}

export interface GroupRemoveConfigInterface extends StateIngestConfigInterface {
  /**
   * Whether to soft rebuild the Group.
   * -> only rebuild the parts of the Group that have actually changed
   * instead of rebuilding the whole Group.
   * @default true
   */
  softRebuild?: boolean;
}

export interface GroupConfigInterface {
  /**
   * Key/Name identifier of the Group.
   * @default undefined
   */
  key?: GroupKey;
  /**
   * Whether the Group should be a placeholder
   * and therefore should only exist in the background.
   * @default false
   */
  isPlaceholder?: boolean;
}

export interface GroupPersistConfigInterface
  extends StatePersistentConfigInterface {
  /**
   * Whether to format the specified Storage key following the Collection Group Storage key pattern.
   * `_${collectionKey}_group_${groupKey}`
   * @default true
   */
  followCollectionPersistKeyPattern?: boolean;
}

export enum TrackedChangeMethod {
  ADD,
  REMOVE,
  UPDATE,
}

export interface TrackedChangeInterface {
  /**
   * TODO
   */
  method: TrackedChangeMethod;
  /**
   * TODO
   */
  key: ItemKey;
  /**
   * TODO
   */
  index: number;
}
