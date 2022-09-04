import { defineConfig } from '@agile-ts/utils';
import {
  CreateStatePersistentConfigInterface,
  EnhancedState,
  StateKey,
  StateRuntimeJobConfigInterface,
} from '../../state';
import type { Collection, DefaultItem } from '../collection';
import type { SelectorKey } from '../selector';
import { CollectionPersistent } from '../collection.persistent';

export class Item<
  DataType extends DefaultItem = DefaultItem
> extends EnhancedState<DataType> {
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
  public persist(config: ItemPersistConfigInterface<DataType> = {}): this {
    config = defineConfig(config, {
      key: this._key,
      followCollectionPersistKeyPattern: true,
    });

    // Create storageItemKey based on Collection key/name identifier
    if (config.followCollectionPersistKeyPattern) {
      config.key = CollectionPersistent.getItemStorageKey(
        config.key || this._key,
        this.collection()._key
      );
    }

    super.persist(config);
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

export interface ItemPersistConfigInterface<DataType = any>
  extends CreateStatePersistentConfigInterface<DataType> {
  /**
   * Whether to format the specified Storage key following the Collection Item Storage key pattern.
   * `_${collectionKey}_item_${itemKey}`
   * @default true
   */
  followCollectionPersistKeyPattern?: boolean;
}
