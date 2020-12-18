import { Agile } from "../internal";

export class Integration<F = any, C = any> {
  public _key: IntegrationKey;
  public frameworkInstance?: F;
  public ready = false;
  public integrated = false;
  public methods: IntegrationMethods<C>;

  /**
   * @public
   * Integration - Represents a Framework/Integration of Agile
   * @param config - Config
   */
  constructor(config: CreateIntegrationConfig<F, C>) {
    this._key = config.key;
    this.frameworkInstance = config.frameworkInstance;
    this.methods = {
      bind: config.bind,
      updateMethod: config.updateMethod,
    };
  }

  /**
   * @public
   * Set Value of Integration
   */
  public set key(key: IntegrationKey) {
    this._key = key;
  }

  /**
   * @public
   * Get Value of Integration
   */
  public get key(): IntegrationKey {
    return this._key;
  }
}

/**
 * @param key - Key/Name of Integration
 * @param frameworkInstance - An Instance of the Framework that this Integration represents (for instance React)
 */
export interface CreateIntegrationConfig<F = any, C = any>
  extends IntegrationMethods<C> {
  key: string;
  frameworkInstance?: F;
}

/**
 * @param bind - Binds the Framework/Integration to Agile | Will be called after a successful integration
 * @param updateMethod - Will be called if a Observer updates his subs (Only in Component based Subscriptions!)
 */
export interface IntegrationMethods<C = any> {
  bind?: (agileInstance: Agile) => Promise<boolean>;
  updateMethod?: (componentInstance: C, updatedData: Object) => void;
}

export type IntegrationKey = string | number;
