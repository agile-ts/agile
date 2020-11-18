import { Agile } from "../internal";

export class Integration<F = any> {
  public ready: boolean = false;
  public config: IntegrationConfig<F>;

  /**
   * @public
   * Integration - Represents an Integration of Agile
   * @param config - Config
   */
  constructor(config: IntegrationConfig) {
    this.config = config;
  }
}

/**
 * @param name - Name of Integration
 * @param frameworkInstance - An Instance of the Framework which gets integrated (for instance in case of react you pass React)
 * @param bind - Will be called if the framework got successful integrated
 * @param updateMethod - Will be called if a Observer updates his subs (Only by Component based Subscription)
 */
export interface IntegrationConfig<F = any> {
  name: string;
  frameworkInstance?: F;
  bind?: (agileInstance: Agile) => boolean;
  updateMethod?: (componentInstance: any, updatedData: Object) => void;
}
