import {
  Agile,
  State,
  Storage,
  defineConfig,
  removeProperties,
  flatMerge,
  ComputeFunctionType,
  Computed,
  DependableAgileInstancesType,
  CreateComputedConfigInterface,
  StateConfigInterface,
  CollectionConfig,
  DefaultItem,
  Collection,
} from './internal';
import {} from '@agile-ts/utils';
import { CreateStorageConfigInterface } from './internal';

/**
 * Returns a newly created Storage.
 *
 * A Storage Class serves as an interface to external storages,
 * such as the [Async Storage](https://github.com/react-native-async-storage/async-storage) or
 * [Local Storage](https://www.w3schools.com/html/html5_webstorage.asp).
 *
 * It creates the foundation to easily [`persist()`](https://agile-ts.org/docs/core/state/methods#persist) [Agile Sub Instances](https://agile-ts.org/docs/introduction/#agile-sub-instance)
 * (like States or Collections) in nearly any external storage.
 *
 * [Learn more..](https://agile-ts.org/docs/core/agile-instance/methods#createstorage)
 *
 * @public
 * @param config - Configuration object
 */
export function createStorage(config: CreateStorageConfigInterface): Storage {
  return new Storage(config);
}

/**
 * Returns a newly created State.
 *
 * A State manages a piece of Information
 * that we need to remember globally at a later point in time.
 * While providing a toolkit to use and mutate this piece of Information.
 *
 * You can create as many global States as you need.
 *
 * [Learn more..](https://agile-ts.org/docs/core/agile-instance/methods#createstate)
 *
 * @public
 * @param initialValue - Initial value of the State.
 * @param config - Configuration object
 */
export function createState<ValueType = any>(
  initialValue: ValueType,
  config: CreateStateConfigInterfaceWithAgile = {}
): State<ValueType> {
  config = defineConfig(config, {
    agileInstance: Agile.shared,
  });
  return new State<ValueType>(
    config.agileInstance as any,
    initialValue,
    removeProperties(config, ['agileInstance'])
  );
}

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
  agileInstance: Agile = Agile.shared
): Collection<DataType> {
  return new Collection<DataType>(agileInstance, config);
}

/**
 * Returns a newly created Computed.
 *
 * A Computed is an extension of the State Class
 * that computes its value based on a specified compute function.
 *
 * The computed value will be cached to avoid unnecessary recomputes
 * and is only recomputed when one of its direct dependencies changes.
 *
 * Direct dependencies can be States and Collections.
 * So when, for example, a dependent State value changes, the computed value is recomputed.
 *
 * [Learn more..](https://agile-ts.org/docs/core/agile-instance/methods#createstate)
 *
 * @public
 * @param computeFunction - Function to compute the computed value.
 * @param config - Configuration object
 */
export function createComputed<ComputedValueType = any>(
  computeFunction: ComputeFunctionType<ComputedValueType>,
  config?: CreateComputedConfigInterfaceWithAgile
): Computed<ComputedValueType>;
/**
 * Returns a newly created Computed.
 *
 * A Computed is an extension of the State Class
 * that computes its value based on a specified compute function.
 *
 * The computed value will be cached to avoid unnecessary recomputes
 * and is only recomputed when one of its direct dependencies changes.
 *
 * Direct dependencies can be States and Collections.
 * So when, for example, a dependent State value changes, the computed value is recomputed.
 *
 * [Learn more..](https://agile-ts.org/docs/core/agile-instance/methods#createcomputed)
 *
 * @public
 * @param computeFunction - Function to compute the computed value.
 * @param deps - Hard-coded dependencies on which the Computed Class should depend.
 */
export function createComputed<ComputedValueType = any>(
  computeFunction: ComputeFunctionType<ComputedValueType>,
  deps?: Array<DependableAgileInstancesType>
): Computed<ComputedValueType>;
export function createComputed<ComputedValueType = any>(
  computeFunction: ComputeFunctionType<ComputedValueType>,
  configOrDeps?:
    | CreateComputedConfigInterface
    | Array<DependableAgileInstancesType>
): Computed<ComputedValueType> {
  let _config: CreateComputedConfigInterfaceWithAgile = {};

  if (Array.isArray(configOrDeps)) {
    _config = flatMerge(_config, {
      computedDeps: configOrDeps,
    });
  } else {
    if (configOrDeps) _config = configOrDeps;
  }

  _config = defineConfig(_config, {
    agileInstance: Agile.shared,
  });

  return new Computed<ComputedValueType>(
    _config.agileInstance as any,
    computeFunction,
    removeProperties(_config, ['agileInstance'])
  );
}

export interface CreateAgileSubInstanceInterface {
  /**
   * Instance of Agile the Instance belongs to.
   * @default Agile.shared
   */
  agileInstance?: Agile;
}

export * from './internal';
export default Agile;

export interface CreateStateConfigInterfaceWithAgile
  extends CreateAgileSubInstanceInterface,
    StateConfigInterface {}

export interface CreateComputedConfigInterfaceWithAgile
  extends CreateAgileSubInstanceInterface,
    CreateComputedConfigInterface {}
