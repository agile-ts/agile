export class EventJob<PayloadType = any> {
  public payload: PayloadType;
  public creationTimestamp: number;

  /**
   * @public
   * Event Job - Holds Payload and gets executed/performed by the Event
   * @param payload - Payload that is represented by this Job
   */
  constructor(payload: PayloadType) {
    this.payload = payload;
    this.creationTimestamp = new Date().getTime();
  }
}
