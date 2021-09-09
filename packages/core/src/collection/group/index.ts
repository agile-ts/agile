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

  // Manages dependencies to other States and subscriptions of UI-Components.
  // It also serves as an interface to the runtime.
  public observers: GroupObservers<ItemKey[], DataType> = {} as any;

  // Keeps track of all Item identifiers for Items that couldn't be found in the Collection
  public notFoundItemKeys: Array<ItemKey> = [];

  // Keeps track of all changes made between rebuilds (add, remove, update)
  // Why not rebuilding the Group directly in the add(), remove() method?
  // Because rebuilding the Group is a side effect of the Group.
  // A rebuild should always happen whenever the Group mutates.
  // (-> Simplicity and keeping the current structure to not rewrite all tests)
  public trackedChanges: TrackedChangeInterface[] = [];

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
    this.addSideEffect(Group.rebuildGroupSideEffectKey, () => this.rebuild());

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
    config = defineConfig(config, {
      softRebuild: true,
    });

    // Remove itemKeys from Group
    _itemKeys.forEach((itemKey) => {
      // Check if itemKey exists in Group
      if (!newGroupValue.includes(itemKey)) {
        notExistingItemKeys.push(itemKey);
        notExistingItemKeysInCollection.push(itemKey);
        return;
      }

      if (config.softRebuild) {
        this.trackChange({
          index: newGroupValue.findIndex((ik) => ik === itemKey),
          method: TrackedChangeMethod.REMOVE,
          key: itemKey,
        });
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

    this.set(newGroupValue, config);

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
    let newGroupValue = copy(this.nextStateValue);
    config = defineConfig(config, {
      method: 'push',
      overwrite: false,
      softRebuild: true,
    });

    // Add itemKeys to Group
    _itemKeys.forEach((itemKey) => {
      const exists = newGroupValue.includes(itemKey);

      // Check if itemKey exists in Collection
      if (!this.collection().getItem(itemKey))
        notExistingItemKeysInCollection.push(itemKey);

      // Track changes to soft rebuild the Group when rebuilding the Group
      if (config.softRebuild && (!exists || (exists && config.overwrite))) {
        this.trackChange({
          method: exists ? TrackedChangeMethod.UPDATE : TrackedChangeMethod.ADD,
          key: itemKey,
          index: exists
            ? newGroupValue.findIndex((ik) => ik === itemKey)
            : config.method === 'push'
            ? newGroupValue.length - 1
            : 0,
        });
      }

      // Remove itemKey temporary from newGroupValue
      // if it should be overwritten and already exists in the newGroupValue
      if (exists) {
        if (config.overwrite) {
          newGroupValue = newGroupValue.filter((key) => key !== itemKey);
        } else {
          existingItemKeys.push(itemKey);
          return;
        }
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

    this.set(newGroupValue, removeProperties(config, ['method', 'overwrite']));

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
   * @param config - Configuration object
   */
  public rebuild(config: GroupIngestConfigInterface = {}): this {
    // Don't rebuild Group if Collection isn't correctly instantiated yet
    // (because only after a successful instantiation the Collection
    // contains the Items which are essential for a proper rebuild)
    if (!this.collection().isInstantiated) return this;

    // Soft rebuild the Collection (-> rebuild only parts of the Collection)
    if (this.trackedChanges.length > 0) {
      this.trackedChanges.forEach((change) => {
        const item = this.collection().getItem(change.key);

        switch (change.method) {
          case TrackedChangeMethod.ADD:
            if (item != null) {
              // this._value.splice(change.index, 0, change.key); // Already updated in 'add' method
              this.nextGroupOutput.splice(change.index, 0, copy(item._value));
            }
            break;
          case TrackedChangeMethod.UPDATE:
            if (item != null) {
              this.nextGroupOutput[change.index] = copy(item._value);
            }
            break;
          case TrackedChangeMethod.REMOVE:
            // this._value.splice(change.index, 1); // Already updated in 'remove' method
            this.nextGroupOutput.splice(change.index, 1);
            break;
          default:
        }
      });
      this.trackedChanges = [];
      this.observers['output'].ingest(config);
      return this;
    }

    // Hard rebuild the whole Collection

    const notFoundItemKeys: Array<ItemKey> = []; // Item keys that couldn't be found in the Collection
    const groupItems: Array<Item<DataType>> = [];

    // Fetch Items from Collection
    this._value.forEach((itemKey) => {
      const item = this.collection().getItem(itemKey);
      if (item != null) groupItems.push(item);
      else notFoundItemKeys.push(itemKey);
    });

    // Logging
    if (notFoundItemKeys.length > 0 && this.loadedInitialValue) {
      LogCodeManager.log(
        '1C:02:00',
        [this.collection()._key, this._key],
        notFoundItemKeys
      );
    }

    this.notFoundItemKeys = notFoundItemKeys;

    // Ingest rebuilt Group output into the Runtime
    this.observers['output'].ingestOutput(
      groupItems.map((item) => {
        return item._value;
      }),
      config
    );

    return this;
  }

  /**
   * TODO
   * @param change
   */
  public trackChange(change: TrackedChangeInterface) {
    this.trackedChanges.push(change);
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
   * If the to add `itemKey` already exists,
   * whether its position should be overwritten with the position of the new `itemKey`.
   * @default false
   */
  overwrite?: boolean;
  /**
   * TODO
   * @default true
   */
  softRebuild?: boolean;
}

export interface GroupRemoveConfigInterface extends StateIngestConfigInterface {
  /**
   * TODO
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
