export class EventJob<PayloadType = any> {
  public payload: PayloadType;
  public creationTimestamp: number;
  public keys?: string[];

  /**
   * @public
   * Event Job - Holds Payload and gets executed/performed by the Event
   * @param payload - Payload that is represented by this Job
   * @param keys - Keys of EventCallbacks that get executed with the passed payload
   */
  constructor(payload: PayloadType, keys?: string[]) {
    this.payload = payload;
    this.keys = keys;
    this.creationTimestamp = new Date().getTime();
  }
}
