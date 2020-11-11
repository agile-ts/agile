import { Agile, copy } from "@agile-ts/core";
import { Item, MultiEditor, StatusObserver } from "../internal";

export class Status<DataType = any> {
  public agileInstance: () => Agile;

  public item: Item<DataType>;
  public editor: () => MultiEditor<DataType>;
  public observer: StatusObserver; // Handles deps and subs of Status and is like an interface to the Runtime

  public display: boolean = false;
  public _value: StatusInterface | null;
  public nextValue: StatusInterface | null;
  public activeValues: Set<StatusInterface> = new Set();

  // Tracking
  public track: boolean = false;
  public foundValues: Set<StatusInterface> = new Set();

  /**
   * @public
   * Status - Represents the Status of an Item
   * @param item - Item to which the Status belongs
   */
  constructor(item: Item<DataType>) {
    this.item = item;
    this.editor = () => item.editor();
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
   * Set next Status Value that gets applied if the Status gets assigned
   * @param value - next Status Value
   */
  public set(value: StatusInterface | null): this {
    this.nextValue = copy(value);
    if (this.track && value) this.foundValues.add(value);
    return this;
  }

  //=========================================================================================================
  // Assign
  //=========================================================================================================
  /**
   * @public
   * Assign next Status Value
   */
  public assign() {
    this.observer.assign();
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
