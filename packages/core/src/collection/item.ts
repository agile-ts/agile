import {
  State,
  Collection,
  StateKey,
  StateRuntimeJobConfigInterface,
  SelectorKey,
  PersistentKey,
  isValidObject,
  CollectionPersistent,
  StatePersistentConfigInterface,
  DefaultItem,
  defineConfig,
} from '../internal';

export class Item<DataType extends Object = DefaultItem> extends State<
  DataType
> {
  // Collection the Group belongs to
  public collection: () => Collection<DataType>;

  static updateGroupSideEffectKey = 'rebuildGroup';

  // Key/Name identifiers of Selectors which have selected the Item
  public selectedBy: Set<SelectorKey> = new Set();

  /**
   * An extension of the State Class that represents a single data object of a Collection.
   *
   * It can be used independently, but is always synchronized with the Collection.
   *
   * @public
   * @param collection - Collection to which the Item belongs.
   * @param data - Data object to be represented by the Item.
   * @param config - Configuration object
   */
  constructor(
    collection: Collection<DataType>,
    data: DataType,
    config: ItemConfigInterface = {}
  ) {
    super(collection.agileInstance(), data, {
      isPlaceholder: config.isPlaceholder,
      key: data[collection.config.primaryKey], // Set key/name of Item to identifier at primaryKey property
    });
    this.collection = () => collection;

    // Add side effect to Item
    // that rebuilds all Groups containing the Item whenever it changes
    if (this._key != null) {
      this.addRebuildGroupThatIncludeItemKeySideEffect(this._key);
    }
  }

  /**
   * Updates the key/name identifier of Item.
   *
   * @internal
   * @param value - New key/name identifier.
   * @param config - Configuration object
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

    // Update 'rebuildGroupsThatIncludeItemKey' side effect to the new itemKey
    this.removeSideEffect(Item.updateGroupSideEffectKey);
    this.addRebuildGroupThatIncludeItemKeySideEffect(value);

    // Update itemKey in Item value
    // (After updating the side effect, because otherwise it would call the old side effect)
    this.patch({ [this.collection().config.primaryKey]: value }, config);

    return this;
  }

  /**
   * Preserves the Item `value` in the corresponding external Storage.
   *
   * The Item key/name is used as the unique identifier for the Persistent.
   * If that is not desired or the Item has no unique identifier,
   * please specify a separate unique identifier for the Persistent.
   *
   * [Learn more..](https://agile-ts.org/docs/core/state/methods/#persist)
   *
   * @public
   * @param config - Configuration object
   */
  public persist(config?: ItemPersistConfigInterface): this;
  /**
   * Preserves the Item `value` in the corresponding external Storage.
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
      followCollectionPersistKeyPattern: true,
      storageKeys: [],
      defaultStorageKey: null as any,
    });

    // Create storageItemKey based on Collection key/name identifier
    if (_config.followCollectionPersistKeyPattern) {
      key = CollectionPersistent.getItemStorageKey(
        key || this._key,
        this.collection()._key
      );
    }

    // Persist Item
    super.persist(key, {
      loadValue: _config.loadValue,
      storageKeys: _config.storageKeys,
      defaultStorageKey: _config.defaultStorageKey,
    });

    return this;
  }

  /**
   * Adds side effect to Item
   * that rebuilds all Groups containing the specified Item identifier
   * whenever the Item changes.
   *
   * @internal
   * @param itemKey - Item identifier that has to be contained in Groups.
   */
  public addRebuildGroupThatIncludeItemKeySideEffect(itemKey: StateKey) {
    this.addSideEffect<Item<DataType>>(
      Item.updateGroupSideEffectKey,
      (instance, config) => {
        // TODO optimise this because currently the whole Group rebuilds
        //  although only one Item value has changed which definitely needs no complete rebuild
        //   https://github.com/agile-ts/agile/issues/113
        instance.collection().rebuildGroupsThatIncludeItemKey(itemKey, config);
      },
      { weight: 100 }
    );
  }
}

export interface ItemConfigInterface {
  /**
   * Whether the Item should be a placeholder
   * and therefore should only exist in the background.
   * @default false
   */
  isPlaceholder?: boolean;
}

export interface ItemPersistConfigInterface
  extends StatePersistentConfigInterface {
  /**
   * Whether to format the specified Storage key following the Collection Item Storage key pattern.
   * `_${collectionKey}_item_${itemKey}`
   * @default true
   */
  followCollectionPersistKeyPattern?: boolean;
}
