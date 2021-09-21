import { Agile, copy, RuntimeJobConfigInterface } from '@agile-ts/core';
import { Item } from '../item';
import { StatusObserver } from './status.observer';
import { StatusTracker } from './status.tracker';

export class Status<DataType = any> {
  public agileInstance: () => Agile;

  public item: Item<DataType>;
  public observer: StatusObserver; // Handles deps and subs of Status and is like an interface to the Runtime

  public display = false;
  public _value: StatusInterface | null; // The last assigned Value
  public nextValue: StatusInterface | null; // The last set Value
  public activeValues: Set<StatusInterface> = new Set(); // All Values that got set during the validation Time of the Validator

  public statusTracker: StatusTracker;

  /**
   * @public
   * Status - Represents the Status of an Item
   * @param item - Item to that the Status belongs
   */
  constructor(item: Item<DataType>) {
    this.item = item;
    this.agileInstance = () => item.agileInstance();
    this._value = null;
    this.nextValue = null;
    this.observer = new StatusObserver(this.agileInstance(), this);
    this.statusTracker = new StatusTracker();
  }

  /**
   * @public
   * Get current Value of Status
   * Note: Returns null if Status shouldn't get displayed
   */
  public get value(): StatusInterface | null {
    return this.display ? this._value : null;
  }

  //=========================================================================================================
  // Set
  //=========================================================================================================
  /**
   * @public
   * Set next Status Value that will be assigned to the Status
   * @param value - next Status Value
   */
  public set(value: StatusInterface | null): this {
    this.nextValue = copy(value);

    // Track Status
    if (value != null) this.statusTracker.tracked(value);

    // Assign Status to Item
    if (this.item.editor().canAssignStatusToItemOnChange(this.item))
      this.assign();

    return this;
  }

  //=========================================================================================================
  // Assign
  //=========================================================================================================
  /**
   * @public
   * Assign last set Status Value to the current Status Value
   * @param config - Config
   */
  public assign(config: RuntimeJobConfigInterface = {}) {
    this.observer.assign(config);
  }
}

export type StatusType = 'error' | 'success';

/**
 * @param type - Type of Status
 * @param message - Message of Status
 */
export interface StatusInterface {
  type: StatusType;
  message: string;
}
