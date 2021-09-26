import { State, StateIngestConfigInterface } from '@agile-ts/core';
import { copy, defineConfig } from '@agile-ts/utils';
import { Item } from '../item';
import { StatusTracker } from './status.tracker';

export class Status<DataType = any> extends State<StatusValueType> {
  config: StatusConfigInterface;

  // Item the Status belongs to
  public item: Item<DataType>;

  // Helper Class for automatic tracking set Statuses in validation methods
  public statusTracker: StatusTracker;

  // Represents all tracked Status values of the last validation
  public lastTrackedValues: StatusValueType[] = [];

  /**
   * Represents the current status of the specified Item.
   *
   * @public
   * @param item - Item the Status belongs to.
   * @param config - Configuration object
   */
  constructor(item: Item<DataType>, config: CreateStatusConfigInterface = {}) {
    config = defineConfig(config, {
      display: false,
    });
    super(item.agileInstance(), null, { key: `status_${item._key}` });
    this.item = item;
    this.statusTracker = new StatusTracker();
    this.config = {
      display: config.display as any,
    };
  }

  /**
   * Returns a reference-free version of the current Status value
   * if the Status should be displayed.
   *
   * @public
   */
  public get value(): StatusValueType {
    return this.config.display ? copy(this._value) : null;
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
      background:
        this.config != null // Because on the initial set (when calling '.super') the Config isn't set
          ? !this.config.display
          : undefined,
    });
    if (value != null) this.statusTracker.tracked(value);

    // Return when waiting for end of tracking to apply the last tracked change to the Status, if applicable
    if (config.waitForTracking && this.statusTracker.isTracking) return this;

    // Ingest the Status with the new value into the runtime
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

export interface StatusConfigInterface {
  /**
   * Whether the Status should be displayed or stay hidden (in the UI).
   * @default false
   */
  display: boolean;
}

export interface CreateStatusConfigInterface {
  /**
   * Whether the Status should be displayed or stay hidden (in the UI).
   * @default false
   */
  display?: boolean;
}
