import {
  Agile,
  Item,
  Group,
  GroupKey,
  Selector,
  SelectorKey,
  State,
  StateKey,
  StorageKey,
  GroupConfigInterface,
  copy,
  defineConfig,
  flatMerge,
  isValidObject,
  normalizeArray,
} from "../internal";
import { persistValue, removeItem, setItem } from "./perstist";

export class Collection<DataType = DefaultItem> {
  public agileInstance: () => Agile;

  public config: CollectionConfigInterface;

  public size: number = 0; // Amount of Items stored in Collection
  public data: { [key: string]: Item<DataType> } = {}; // Collection Data
  public _key?: CollectionKey;
  public isPersisted: boolean = false; // If Collection is stored in Storage

  public groups: { [key: string]: Group<any> } = {};
  public selectors: { [key: string]: Selector<any> } = {};

  /**
   * Class that holds a List of Objects with key and causes rerender on subscribed Components
   * @param agileInstance - An instance
   * @param config - Config
   */
  constructor(agileInstance: Agile, config: CollectionConfig<DataType> = {}) {
    this.agileInstance = () => agileInstance;
    if (typeof config === "function") config = config(this);
    this.config = defineConfig<CollectionConfigInterface>(config, {
      primaryKey: "id",
      groups: {},
      selectors: {},
      defaultGroupKey: "default",
    });
    this._key = this.config.key;

    // Init Sub Instances like groups, selectors
    this.initSubInstances("groups");
    this.initSubInstances("selectors");
  }

  public set key(value: StateKey | undefined) {
    this._key = value;
  }

  public get key(): StateKey | undefined {
    return this._key;
  }

  //=========================================================================================================
  // Init SubInstances
  //=========================================================================================================
  /**
   * @internal
   * Inits SubInstance of Collection like groups and selectors
   * @param type - Type of SubInstance (groups, selectors)
   */
  private initSubInstances(type: "groups" | "selectors") {
    const subInstances = copy(this.config[type]);
    let subInstancesObject: any = {};

    // If SubInstances is Array, transform it to Object
    if (Array.isArray(subInstances)) {
      subInstances.forEach((instanceName) => {
        let instance;
        switch (type) {
          case "groups":
            instance = new Group(this.agileInstance(), this, [], {
              key: instanceName,
            });
            break;
          case "selectors":
            instance = new Selector(this, instanceName, {
              key: instanceName,
            });
            break;
          default:
            instance = "unknown";
        }
        subInstancesObject[instanceName] = instance;
      });
    } else {
      subInstancesObject = subInstances;
    }

    // Add default Group
    if (type === "groups") {
      subInstancesObject[this.config.defaultGroupKey || "default"] = new Group(
        this.agileInstance(),
        this,
        [],
        {
          key: this.config.defaultGroupKey || "default",
        }
      );
    }

    // Set key of subInstance to property Name
    for (let key in subInstancesObject)
      if (!subInstancesObject[key].key) subInstancesObject[key].key = key;

    // Assign subInstance to Collection
    this[type] = subInstancesObject;
  }

  //=========================================================================================================
  // Collect
  //=========================================================================================================
  /**
   * Collect Item/s
   * @param items - Item/s you want to collect
   * @param groups - Add collected Item/s to certain Groups
   * @param config - Config
   */
  public collect(
    items: DataType | Array<DataType>,
    groups?: GroupKey | Array<GroupKey>,
    config: CollectConfigInterface<DataType> = {}
  ): this {
    const _items = normalizeArray<DataType>(items);
    const groupKeys = normalizeArray<GroupKey>(groups);
    const defaultGroupKey = this.config.defaultGroupKey || "default";
    const primaryKey = this.config.primaryKey || "id";

    config = defineConfig<CollectConfigInterface>(config, {
      method: "push",
      background: false,
      patch: false,
    });

    // Add default GroupKey
    if (!groupKeys.includes(defaultGroupKey)) groupKeys.push(defaultGroupKey);

    // Create not existing Groups
    groupKeys.forEach(
      (groupName) => !this.groups[groupName] && this.createGroup(groupName)
    );

    // Handle added Items
    _items.forEach((item, index) => {
      const itemKey = item[primaryKey];
      const itemExists = !!this.data[itemKey];

      // Save Item in Collection
      const success = this.saveData(item, {
        patch: config.patch,
        background: config.background,
      });
      if (!success) return this;

      // Add ItemKey to provided Groups
      groupKeys.forEach((groupKey) => {
        this.groups[groupKey].add(itemKey, {
          method: config.method,
          background: config.background,
        });
      });

      // Ingest Group that includes ItemKey into Runtime that rebuilds the Group and causes rerender
      if (!itemExists) {
        for (let groupKey in this.groups) {
          const group = this.getGroup(groupKey);
          if (group.value.includes(itemKey)) {
            if (!config.background) group.ingest({ forceRerender: true });
          }
        }
      }

      // Call forEachItem Method (config)
      if (config.forEachItem) config.forEachItem(item, itemKey, index);
    });

    return this;
  }

  //=========================================================================================================
  // Update
  //=========================================================================================================
  /**
   * * Update data by updateKey(id) in a Agile Collection
   */
  public update(
    updateKey: ItemKey,
    changes: DefaultItem | DataType,
    options: { addNewProperties?: boolean; background?: boolean } = {}
  ): State | undefined {
    // If item does not exist, return
    if (!this.data.hasOwnProperty(updateKey)) {
      console.error(
        `Agile: PrimaryKey '${updateKey} doesn't exist in collection `,
        this
      );
      return undefined;
    }

    // Assign defaults to config
    options = defineConfig(options, {
      addNewProperties: false,
      background: false,
    });

    const itemState = this.data[updateKey];
    const currentItemValue = copy(itemState.value) as any;
    const primaryKey = this.config.primaryKey || "";

    // Merge current Item value with changes
    const finalItemValue = flatMerge(currentItemValue, changes, {
      addNewProperties: options.addNewProperties,
    });

    // Check if something has changed (stringifying because of possible object or array)
    if (
      JSON.stringify(finalItemValue) ===
      JSON.stringify(itemState.nextStateValue)
    )
      return this.data[finalItemValue[primaryKey]];

    // Assign finalItemStateValue to nextState
    itemState.nextStateValue = finalItemValue;

    // Set State to nextState
    itemState.ingest({ background: options.background });

    // If data key changes update it properly
    if (currentItemValue[primaryKey] !== finalItemValue[primaryKey])
      this.updateItemPrimaryKeys(
        currentItemValue[primaryKey],
        finalItemValue[primaryKey],
        { background: options.background }
      );

    // Rebuild all groups that includes the primaryKey
    this.rebuildGroupsThatIncludePrimaryKey(finalItemValue[primaryKey], {
      background: options.background,
    });

    // Return data at primaryKey (updated State)
    return this.data[finalItemValue[primaryKey]];
  }

  //=========================================================================================================
  // Create Group
  //=========================================================================================================
  /**
   * Create a group instance on this collection
   */
  public createGroup(
    groupName: GroupKey,
    initialItems?: Array<ItemKey>
  ): Group<DataType> {
    // Check if Group already exist
    if (this.groups.hasOwnProperty(groupName)) {
      console.warn(
        `Agile: The Group with the name ${groupName} already exists!`
      );
      return this.groups[groupName];
    }

    // Create new Group
    const group = new Group<DataType>(
      this.agileInstance(),
      this,
      initialItems,
      { key: groupName }
    );

    // Add new Group to groups
    this.groups[groupName] = group;

    // Log Job
    if (this.agileInstance().config.logJobs)
      console.log(`Agile: Created Group called '${groupName}'`, group);

    return group;
  }

  //=========================================================================================================
  // Create Selector
  //=========================================================================================================
  /**
   * Create a selector instance on this collection
   */
  public createSelector(
    selectorName: SelectorKey,
    id: ItemKey
  ): Selector<DataType> {
    // Check if Selector already exist
    if (this.selectors.hasOwnProperty(selectorName)) {
      console.warn(
        `Agile: The Selector with the name ${selectorName} already exists!`
      );
      return this.selectors[selectorName];
    }

    // Create new Selector
    const selector = new Selector<DataType>(this, id, { key: selectorName });

    // Add new Selector to selectors
    this.selectors[selectorName] = selector;

    // Log Job
    if (this.agileInstance().config.logJobs)
      console.log(`Agile: Created Selector called '${selectorName}'`, selector);

    return selector;
  }

  //=========================================================================================================
  // Get Group
  //=========================================================================================================
  /**
   * Return an group from this collection as Group instance (extends State)
   */
  public getGroup(groupName: GroupKey): Group<DataType> {
    // Check if group exists
    if (this.groups[groupName]) return this.groups[groupName];

    console.warn(`Agile: Group with name '${groupName}' doesn't exist!`);

    // Return empty group because it might get annoying to handle with undefined (can check if it exists with group.exists)
    const group = new Group<DataType>(this.agileInstance(), this, [], {
      key: "dummy",
    });
    group.isPlaceholder = true;
    return group;
  }

  //=========================================================================================================
  // Get Selector
  //=========================================================================================================
  /**
   * Return an selector from this collection as Selector instance (extends State)
   */
  public getSelector(
    selectorName: SelectorKey
  ): Selector<DataType> | undefined {
    // Check if selector exists
    if (this.selectors[selectorName]) return this.selectors[selectorName];

    console.warn(`Agile: Selector with name '${selectorName}' doesn't exist!`);

    return undefined;
  }

  //=========================================================================================================
  // Remove
  //=========================================================================================================
  /**
   * Remove fromGroups or everywhere
   */
  public remove(primaryKeys: ItemKey | Array<ItemKey>) {
    return {
      fromGroups: (groups: Array<ItemKey> | ItemKey) =>
        this.removeFromGroups(primaryKeys, groups),
      everywhere: () => this.removeData(primaryKeys),
    };
  }

  //=========================================================================================================
  // Find By Id
  //=========================================================================================================
  /**
   * Return an item from this collection by primaryKey as Item instance (extends State)
   */
  public findById(id: ItemKey): Item<DataType> | undefined {
    if (!this.data.hasOwnProperty(id) || !this.data[id].exists)
      return undefined;

    // Add state to foundState (for auto tracking used states in computed functions)
    if (this.agileInstance().runtime.trackObservers)
      this.agileInstance().runtime.foundObservers.add(this.data[id].observer);

    // Return data by id
    return this.data[id];
  }

  //=========================================================================================================
  // Get Value By Id
  //=========================================================================================================
  /**
   * Return a value from this collection by primaryKey
   */
  public getValueById(id: ItemKey): DataType | undefined {
    let data = this.findById(id);
    if (!data) return undefined;

    return data.value;
  }

  //=========================================================================================================
  // Persist
  //=========================================================================================================
  /**
   * Saves the collection in the local storage or in a own configured storage
   * @param key - the storage key (if no key passed it will take the collection key)
   */
  public persist(key?: StorageKey): this {
    persistValue(this, key).then((value) => {
      this.isPersisted = value;
    });
    return this;
  }

  //=========================================================================================================
  // Group
  //=========================================================================================================
  /**
   * Create a group instance under this collection (can be used in function based config)
   */
  public Group(
    initialItems?: Array<ItemKey>,
    config?: GroupConfigInterface
  ): Group<DataType> {
    return new Group<DataType>(
      this.agileInstance(),
      this,
      initialItems,
      config
    );
  }

  //=========================================================================================================
  // Selector
  //=========================================================================================================
  /**
   * Create a selector instance under this collection (can be used in function based config)
   */
  public Selector(
    initialSelection: ItemKey,
    options?: { key?: SelectorKey }
  ): Selector<DataType> {
    return new Selector<DataType>(this, initialSelection, options);
  }

  //=========================================================================================================
  // Update Data Key
  //=========================================================================================================
  /**
   * @internal
   * This will properly change the key of a collection item
   */
  private updateItemPrimaryKeys(
    oldKey: ItemKey,
    newKey: ItemKey,
    options?: { background?: boolean }
  ): void {
    // If oldKey and newKey are the same, return
    if (oldKey === newKey) return;

    // Assign defaults to config
    options = defineConfig(options, {
      background: false,
    });

    // Create copy of data
    const dataCopy = this.data[oldKey];

    // Delete old reference
    delete this.data[oldKey];

    // Apply the data into data with new key
    this.data[newKey] = dataCopy;

    // Update Groups
    for (let groupName in this.groups) {
      // Get Group
      const group = this.getGroup(groupName);

      // If Group does not contain oldKey, continue
      if (group.value.findIndex((key) => key === oldKey) === -1) continue;

      // Replace the primaryKey at current index
      group.nextStateValue.splice(
        group.nextStateValue.indexOf(oldKey),
        1,
        newKey
      );

      // Set State(Group) to nextState
      group.ingest({ background: options?.background });
    }

    // Update Selector
    for (let selectorName in this.selectors) {
      // Get Selector
      const selector = this.getSelector(selectorName);
      if (!selector) continue;

      // If Selector doesn't watch on the oldKey, continue
      if (selector.id !== oldKey) continue;

      // Replace the oldKey with the newKey
      selector.select(newKey, { background: options?.background });
    }
  }

  //=========================================================================================================
  // Remove From Groups
  //=========================================================================================================
  /**
   * @internal
   * Deletes Data from Groups
   */
  public removeFromGroups(
    primaryKeys: ItemKey | Array<ItemKey>,
    groups: GroupKey | Array<GroupKey>
  ) {
    const _primaryKeys = normalizeArray(primaryKeys);
    const _groups = normalizeArray(groups);

    _groups.forEach((groupKey) => {
      // Return if group doesn't exist in collection
      if (!this.groups[groupKey]) {
        console.error(
          `Agile: Couldn't find group('${groupKey}) in collection`,
          this
        );
        return;
      }

      // Remove primaryKeys from Group
      _primaryKeys.forEach((primaryKey) => {
        const group = this.getGroup(groupKey);
        group.remove(primaryKey);
      });
    });
  }

  //=========================================================================================================
  // Delete Data
  //=========================================================================================================
  /**
   * @internal
   * Deletes data directly form the collection
   */
  public removeData(primaryKeys: ItemKey | Array<ItemKey>) {
    const _primaryKeys = normalizeArray<ItemKey>(primaryKeys);
    const groupKeys = Object.keys(this.groups);
    const selectorKeys = Object.keys(this.selectors);
    const itemKeys = Object.keys(this.data);

    _primaryKeys.forEach((itemKey) => {
      // Check if primaryKey exists in collection, if not return
      if (itemKeys.findIndex((key) => itemKey.toString() === key) === -1) {
        console.error(
          `Agile: Couldn't find primaryKey '${itemKey}' in collection`,
          this
        );
        return;
      }

      // Remove primaryKey from Groups (have to be above deleting the data because.. the remove function needs to know if the data exists or not)
      groupKeys.forEach((groupKey) => {
        this.groups[groupKey].remove(itemKey);
      });

      // Remove Selectors with primaryKey
      selectorKeys.forEach((selectorKey) => {
        delete this.selectors[selectorKey];
      });

      // Remove primaryKey from collection data
      delete this.data[itemKey];

      // Decrease size
      this.size--;

      // Storage
      removeItem(itemKey, this);
    });
  }

  //=========================================================================================================
  // Save Data
  //=========================================================================================================
  /**
   * @internal
   * Save data directly into the collection
   * @param data - Add Item to Collection
   * @param config - Config
   */
  public saveData(
    data: DataType,
    config: { patch?: boolean; background?: boolean } = {}
  ): boolean {
    const _data = data as any; // Transformed Data to any because of unknown Object (DataType)
    const primaryKey = this.config.primaryKey || "id";
    const itemKey = _data[primaryKey];

    config = defineConfig(config, {
      patch: false,
      background: false,
    });

    if (!isValidObject(_data)) {
      console.error("Agile: Collections items has to be an object!");
      return false;
    }

    // Check if data has primaryKey
    if (!_data.hasOwnProperty(primaryKey)) {
      console.error(
        `Agile: Collection Item needs a primary Key property called '${this.config.primaryKey}'!`
      );
      return false;
    }

    // Create reference of data at the data key
    let item: Item<DataType> = this.data[itemKey];

    // If the data already exists and config is to patch, patch data
    if (item && config.patch)
      item.patch(_data, { background: config.background });
    // If the data already exists and no config, overwrite data
    else if (item) item.set(_data, { background: config.background });
    // If data does not exist.. create new Item set and increase the size
    else {
      item = new Item<DataType>(this, _data);
      this.size++;
    }

    // Set item at data itemKey
    this.data[itemKey] = item;

    // Storage
    setItem(itemKey, this);

    return true;
  }

  //=========================================================================================================
  // Rebuild Groups That Includes Primary Key
  //=========================================================================================================
  /**
   * @internal
   * Rebuild the Groups which contains the primaryKey
   */
  public rebuildGroupsThatIncludePrimaryKey(
    primaryKey: ItemKey,
    options?: { background?: boolean; forceRerender?: boolean }
  ): void {
    // Assign defaults to config
    options = defineConfig(options, {
      background: false,
      forceRerender: !options?.background, // forceRerender false.. because forceRerender has more weight than background in runtime
    });

    // Rebuild groups that includes primaryKey
    for (let groupKey in this.groups) {
      // Get Group
      const group = this.getGroup(groupKey);

      // Check if group contains primaryKey if so rebuild it
      if (group.has(primaryKey))
        group.ingest({
          background: options?.background,
          forceRerender: options?.forceRerender,
        });
    }
  }
}

export type DefaultItem = { [key: string]: any };
export type CollectionKey = string | number;
export type ItemKey = string | number; // Key Interface of Item in Collection

/**
 * @param primaryKey - Key/Name of Collection
 * @param groups - Groups of Collection
 * @param selectors - Selectors of Collection
 * @param primaryKey - Name of Property that holds the PrimaryKey (default = id)
 * @param defaultGroupKey - Key/Name of Default Group that holds all collected Items
 */
export interface CollectionConfigInterface {
  groups?: { [key: string]: Group<any> } | string[];
  selectors?: { [key: string]: Selector<any> } | string[];
  key?: CollectionKey;
  primaryKey?: string;
  defaultGroupKey?: ItemKey;
}

/**
 * @param patch - If Item gets patched into existing Item
 * @param method - Way of adding Item to Collection (push, unshift)
 * @param forEachItem - Loops through collected Items
 * @param background - If collecting Item happens in the background (-> not causing any rerender)
 */
export interface CollectConfigInterface<DataType = any> {
  patch?: boolean;
  method?: "push" | "unshift";
  forEachItem?: (item: DataType, key: ItemKey, index: number) => void;
  background?: boolean;
}

export type CollectionConfig<DataType = DefaultItem> =
  | CollectionConfigInterface
  | ((collection: Collection<DataType>) => CollectionConfigInterface);
