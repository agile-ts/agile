import {
  State,
  Collection,
  StateKey,
  StateRuntimeJobConfigInterface,
  defineConfig,
  SelectorKey,
  PersistentKey,
  isValidObject,
  CollectionPersistent,
  StatePersistentConfigInterface,
  DefaultItem,
} from '../internal';

export class Item<DataType extends Object = DefaultItem> extends State<
  DataType
> {
  static updateGroupSideEffectKey = 'rebuildGroup';
  public selectedBy: Set<SelectorKey> = new Set(); // Keys of Selectors that have selected this Item
  public collection: () => Collection<DataType>;

  /**
   * @public
   * Item of Collection
   * @param collection - Collection to which the Item belongs
   * @param data - Data that the Item holds
   * @param config - Config
   */
  constructor(
    collection: Collection<DataType>,
    data: DataType,
    config: ItemConfigInterface = {}
  ) {
    super(collection.agileInstance(), data, {
      isPlaceholder: config.isPlaceholder,
      key: data[collection.config.primaryKey], // Set Key/Name of Item to primaryKey of Data
    });
    this.collection = () => collection;

    // Add rebuildGroupsThatIncludeItemKey to sideEffects to rebuild Groups that include this Item if it mutates
    this.addRebuildGroupThatIncludeItemKeySideEffect(
      this._key != null ? this._key : 'unknown'
    );
  }

  //=========================================================================================================
  // Set Key
  //=========================================================================================================
  /**
   * @internal
   * Updates Key/Name of State
   * @param value - New Key/Name of State
   * @param config - Config
   */
  public setKey(
    value: StateKey | undefined,
    config: StateRuntimeJobConfigInterface = {}
  ): this {
    super.setKey(value);
    config = defineConfig(config, {
      sideEffects: {
        enabled: true,
        exclude: [],
      },
      background: false,
      force: false,
      storage: true,
      overwrite: false,
    });
    if (value == null) return this;

    // Remove old rebuildGroupsThatIncludeItemKey sideEffect
    this.removeSideEffect(Item.updateGroupSideEffectKey);

    // Add rebuildGroupsThatIncludeItemKey to sideEffects to rebuild Groups that include this Item if it mutates
    this.addRebuildGroupThatIncludeItemKeySideEffect(value);

    // Update ItemKey in ItemValue (After updating the sideEffect because otherwise it calls the old sideEffect)
    this.patch(
      { [this.collection().config.primaryKey]: value },
      {
        sideEffects: config.sideEffects,
        background: config.background,
        force: config.force,
        storage: config.storage,
        overwrite: config.overwrite,
      }
    );
    return this;
  }

  //=========================================================================================================
  // Persist
  //=========================================================================================================
  /**
   * @public
   * Stores Item Value into Agile Storage permanently
   * @param config - Config
   */
  public persist(config?: ItemPersistConfigInterface): this;
  /**
   * @public
   * Stores Item Value into Agile Storage permanently
   * @param key - Key/Name of created Persistent (Note: Key required if Item has no set Key!)
   * @param config - Config
   */
  public persist(
    key?: PersistentKey,
    config?: ItemPersistConfigInterface
  ): this;
  public persist(
    keyOrConfig: PersistentKey | ItemPersistConfigInterface = {},
    config: ItemPersistConfigInterface = {}
  ): this {
    let _config: ItemPersistConfigInterface;
    let key: PersistentKey | undefined;

    if (isValidObject(keyOrConfig)) {
      _config = keyOrConfig as ItemPersistConfigInterface;
      key = this._key;
    } else {
      _config = config || {};
      key = keyOrConfig as PersistentKey;
    }

    _config = defineConfig(_config, {
      loadValue: true,
      followCollectionPattern: false,
      storageKeys: [],
      defaultStorageKey: null,
    });

    // Create storageItemKey based on Collection Name
    if (_config.followCollectionPersistKeyPattern) {
      key = CollectionPersistent.getItemStorageKey(
        key || this._key,
        this.collection()._key
      );
    }

    super.persist(key, {
      loadValue: _config.loadValue,
      storageKeys: _config.storageKeys,
      defaultStorageKey: _config.defaultStorageKey,
    });

    return this;
  }

  //=========================================================================================================
  // Add Rebuild Group That Include ItemKey SideEffect
  //=========================================================================================================
  /**
   * @internal
   * Adds rebuildGroupThatIncludeItemKey to the Item sideEffects
   * @param itemKey - ItemKey at which the groups has to rebuild
   */
  public addRebuildGroupThatIncludeItemKeySideEffect(itemKey: StateKey) {
    this.addSideEffect<Item<DataType>>(
      Item.updateGroupSideEffectKey,
      (instance, config) =>
        instance.collection().rebuildGroupsThatIncludeItemKey(itemKey, config),
      { weight: 100 }
    );
  }
}

/**
 * @param isPlaceholder - If Item is initially a Placeholder
 */
export interface ItemConfigInterface {
  isPlaceholder?: boolean;
}

/**
 * @param useCollectionPattern - If Item storageKey follows the Collection Item StorageKey Pattern
 */
export interface ItemPersistConfigInterface
  extends StatePersistentConfigInterface {
  followCollectionPersistKeyPattern?: boolean;
}
