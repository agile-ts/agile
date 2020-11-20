export class EventJob<PayloadType = any> {
  public payload: PayloadType;
  public creationTimestamp: number;

  /**
   * @public
   * Event Job -
   * @param payload - Payload
   */
  constructor(payload: PayloadType) {
    this.payload = payload;
    this.creationTimestamp = new Date().getTime();
  }
}
