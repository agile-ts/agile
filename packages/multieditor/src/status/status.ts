import { State, StateIngestConfigInterface } from '@agile-ts/core';
import { copy, defineConfig } from '@agile-ts/utils';
import { Item } from '../item';
import { StatusTracker } from './status.tracker';

export class Status<DataType = any> extends State<StatusValueType> {
  // Item the Status belongs to
  public item: Item<DataType>;

  // Whether the Status should be displayed or stay hidden (in the UI)
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
    super(item.agileInstance(), null, { key: `status_${item._key}` });
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
  public set(value: StatusValueType, config: StatusSetInterface = {}): this {
    config = defineConfig(config, {
      waitForTracking: false,
    });
    if (value != null) this.statusTracker.tracked(value);

    // Return when waiting for end of tracking to apply the last tracked change to the Status, if applicable
    if (config.waitForTracking && this.statusTracker.isTracking) return this;

    // Ingest the Status with the new value into the runtime
    if (
      this.item == null || // Because on the initial set (when calling '.super') the Item isn't set
      this.item.editor().canAssignStatusToItemOnChange(this.item)
    )
      this.observers['value'].ingestValue(value, config);

    return this;
  }
}

export type StatusType = 'error' | 'success' | 'warn' | string;
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

export interface StatusSetInterface extends StateIngestConfigInterface {
  /**
   * If tracking of the particular Status is active,
   * the value is only tracked (not applied).
   * If the tracking has been finished the last tracked Status value should be applied to the Status.
   * (See: https://github.com/agile-ts/agile/pull/204#issuecomment-925934647)
   * @default false
   */
  waitForTracking?: boolean;
}
