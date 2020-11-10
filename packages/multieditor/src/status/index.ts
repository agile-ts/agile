import { Item } from "../item";
import MultiEditor from "../index";
import { StatusObserver } from "./status.observer";
import { Agile } from "@agile-ts/core";

export class Status<DataType = any> {
  public agileInstance: () => Agile;

  public item: Item<DataType>;
  public editor: () => MultiEditor<DataType>;
  public observer: StatusObserver; // Handles deps and subs of Status and is like an interface to the Runtime

  public showStatus: boolean = false;
  public status: StatusInterface | null;
  public nextStatus: StatusInterface | null;

  public trackStatus: boolean = false;
  public foundStatuses: Set<StatusInterface> = new Set();

  /**
   * @public
   * Status of Item
   * @param item - Item to which this Status belongs
   */
  constructor(item: Item<DataType>) {
    this.item = item;
    this.editor = () => item.editor();
    this.agileInstance = () => item.agileInstance();
    this.status = null;
    this.nextStatus = null;
    this.observer = new StatusObserver(this.agileInstance(), this);
  }

  //=========================================================================================================
  // Set Status
  //=========================================================================================================
  /**
   * @public
   * Set Status to Item
   * @param status - new Status
   */
  public setStatus(status: StatusInterface | null): this {
    this.nextStatus = status;
    if (this.trackStatus && status) {
      this.foundStatuses.add(status);
    }
    return this;
  }

  //=========================================================================================================
  // Assign Status
  //=========================================================================================================
  /**
   * @public
   * Assign Status to Item that got set at last
   */
  public assignStatus() {
    this.observer.ingest();
  }

  //=========================================================================================================
  // Get Tracked Statuses
  //=========================================================================================================
  /**
   * @internal
   * Returns tracked Statuses and stops Status from tracking anymore Statuses
   */
  public getTrackedStatuses(): Set<StatusInterface> {
    const finalFoundStatuses = this.foundStatuses;

    // Reset tracking
    this.trackStatus = false;
    this.foundStatuses = new Set();

    return finalFoundStatuses;
  }
}

export type StatusType = "error" | "success";

/**
 * @param type - Type of the Status
 * @param message - Message of the Status
 */
export interface StatusInterface {
  type: StatusType;
  message: string;
}
