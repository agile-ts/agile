import {
  Observer,
  Group,
  CreateObserverConfigInterface,
  copy,
  defineConfig,
  equal,
  generateId,
  StateIngestConfigInterface,
  RuntimeJob,
  Item,
} from '../../internal';

export class GroupObserver<DataType = any> extends Observer {
  // State the Observer belongs to
  public group: () => Group<DataType>;

  // Next value applied to the Group
  public nextGroupItems: (() => Item<DataType>)[];
  nextGroupOutput: DataType[];

  /**
   * A Group Observer manages the subscriptions to Subscription Containers (UI-Components)
   * and dependencies to other Observers (Agile Classes)
   * for a Group Class.
   *
   * @internal
   * @param group - Instance of Group the Observer belongs to.
   * @param config - Configuration object
   */
  constructor(
    group: Group<DataType>,
    config: CreateObserverConfigInterface = {}
  ) {
    super(group.agileInstance(), { ...config, ...{ value: group._output } });
    this.group = () => group;
    this.nextGroupOutput = copy(group._output);
    this.nextGroupItems = copy(group._items);
  }

  /**
   * Passes the Group Observer into the runtime wrapped into a Runtime-Job
   * where it is executed accordingly.
   *
   * During the execution the runtime applies the rebuilt `nextGroupItems`
   * and `nextGroupOutput` to the State,
   * updates its dependents and re-renders the UI-Components it is subscribed to.
   *
   * @internal
   * @param config - Configuration object
   */
  public ingest(config: StateIngestConfigInterface = {}): void {
    this.group().rebuild(config);
  }

  /**
   * Passes the Group Observer into the runtime wrapped into a Runtime-Job
   * where it is executed accordingly.
   *
   * During the execution the runtime applies the specified `nextGroupItems`
   * and `nextGroupOutput` to the Group,
   * updates its dependents and re-renders the UI-Components it is subscribed to.
   *
   * @internal
   * @param newGroupItems - New Group Items to be applied to the Group.
   * @param config - Configuration object.
   */
  public ingestValue(
    newGroupItems: Item<DataType>[],
    config: StateIngestConfigInterface = {}
  ): void {
    const group = this.group();
    config = defineConfig(config, {
      perform: true,
      background: false,
      sideEffects: {
        enabled: true,
        exclude: [],
      },
      force: false,
      maxTriesToUpdate: 0,
    });

    // Force overwriting the State value if it is a placeholder.
    // After assigning a value to the State it shouldn't be a placeholder anymore.
    if (group.isPlaceholder) {
      config.force = true;
    }

    this.nextGroupItems = newGroupItems.map((item) => () => item);
    this.nextGroupOutput = copy(
      newGroupItems.map((item) => {
        return item._value;
      })
    );

    // Check if current State value and to assign State value are equal
    if (equal(group._output, this.nextGroupOutput) && !config.force) return;

    // Create Runtime-Job
    const job = new RuntimeJob(this, {
      sideEffects: config.sideEffects,
      force: config.force,
      background: config.background,
      key:
        config.key ??
        `${this._key != null ? this._key + '_' : ''}${generateId()}_output`,
    });

    // Pass created Job into the Runtime
    this.agileInstance().runtime.ingest(job, {
      perform: config.perform,
    });
  }

  /**
   * Method executed by the Runtime to perform the Runtime-Job,
   * previously ingested via the `ingest()` or `ingestValue()` method.
   *
   * Thereby the previously defined `nextGroupItems`
   * and `nextGroupOutput` are assigned to the Group.
   *
   * @internal
   * @param job - Runtime-Job to be performed.
   */
  public perform(job: RuntimeJob) {
    const observer = job.observer as GroupObserver;
    const group = observer.group();

    // Assign new Group output and items
    group._output = copy(observer.nextGroupOutput);
    group._items = copy(observer.nextGroupItems);

    // Assign public output to the Observer
    job.observer.previousValue = copy(job.observer.value);
    job.observer.value = copy(group._output);
  }
}
