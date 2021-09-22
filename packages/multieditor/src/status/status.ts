import { State, StateIngestConfigInterface } from '@agile-ts/core';
import { Item } from '../item';
import { StatusTracker } from './status.tracker';
import { copy, defineConfig, isFunction } from '@agile-ts/utils';

export class Status<DataType = any> extends State<StatusValueType> {
  // Item the Status belongs to
  public item: Item<DataType>;

  // Whether the Status can be displayed or should stay hidden
  public display = false;

  // Helper Class for automatic tracking set Statuses in validation methods
  public statusTracker: StatusTracker;

  /**
   * Represents the current status of the specified Item.
   *
   * @public
   * @param item - Item the Status belongs to.
   */
  constructor(item: Item<DataType>) {
    super(item.agileInstance(), null);
    this.item = item;
    this.statusTracker = new StatusTracker();
  }

  /**
   * Returns a reference-free version of the current Status value
   * if the Status should be displayed.
   *
   * @public
   */
  public get value(): StatusValueType {
    return this.display ? copy(this._value) : null;
  }

  /**
   * Assigns a new value to the Status
   * and re-renders all subscribed UI-Components.
   *
   * @public
   * @param value - New Status value
   * @param config - Configuration object
   */
  public set(
    value: StatusValueType | ((value: StatusValueType) => StatusValueType),
    config: StateIngestConfigInterface = {}
  ): this {
    config = defineConfig(config, {
      force: false,
    });
    const _value = isFunction(value)
      ? (value as any)(copy(this._value))
      : value;

    // Track updated Status
    if (value != null) this.statusTracker.tracked(_value);

    // Ingest the Status with the new value into the runtime
    if (
      this.item == null || // Because on the initial set (when calling '.super') the item isn't set
      this.item.editor().canAssignStatusToItemOnChange(this.item)
    ) {
      this.observers['value'].ingestValue(_value, config);
    }

    return this;
  }
}

export type StatusType = 'error' | 'success';
export type StatusValueType = StatusInterface | null;

export interface StatusInterface {
  /**
   * Type of Status ('error', 'success', ..)
   */
  type: StatusType;
  /**
   * Message of Status
   */
  message: string;
}
