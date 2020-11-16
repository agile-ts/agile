import { Agile, copy } from "@agile-ts/core";
import { Item, StatusJobConfig, StatusObserver } from "../internal";

export class Status<DataType = any> {
  public agileInstance: () => Agile;

  public item: Item<DataType>;
  public observer: StatusObserver; // Handles deps and subs of Status and is like an interface to the Runtime

  public display: boolean = false;
  public _value: StatusInterface | null; // The last assigned Value
  public nextValue: StatusInterface | null; // The last set Value
  public activeValues: Set<StatusInterface> = new Set(); // All Values that got set during the validation Time of the Validator

  // Tracking
  public track: boolean = false;
  public foundValues: Set<StatusInterface> = new Set();

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
    if (this.track && value) this.foundValues.add(value);

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
  public assign(config: StatusJobConfig = {}) {
    this.observer.assign(config);
  }

  //=========================================================================================================
  // Get Tracked Statuses
  //=========================================================================================================
  /**
   * @internal
   * Returns tracked Values and stops Status from tracking anymore Values
   */
  public getTrackedValues(): Set<StatusInterface> {
    const finalFoundStatuses = this.foundValues;

    // Reset tracking
    this.track = false;
    this.foundValues = new Set();

    return finalFoundStatuses;
  }
}

export type StatusType = "error" | "success";

/**
 * @param type - Type of Status
 * @param message - Message of Status
 */
export interface StatusInterface {
  type: StatusType;
  message: string;
}
