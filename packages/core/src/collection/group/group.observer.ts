import {
  Observer,
  Group,
  CreateObserverConfigInterface,
  copy,
} from '../../internal';

export class GroupObserver<DataType = any> extends Observer {
  // State the Observer belongs to
  public group: () => Group<DataType>;

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
  }
}
