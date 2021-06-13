import { Agile } from '../internal';

export class Integration<F = any, C = any> {
  // Key/Name identifier of the Integration
  public _key: IntegrationKey;
  // Instance of the Framework the Integration represents
  public frameworkInstance?: F;
  // Whether the Integration is ready
  public ready = false;
  // Whether the Integration was integrated into AgileTs
  public integrated = false;
  // Methods to interact with the Framework represented by the Integration
  public methods: IntegrationMethods<C>;

  /**
   * An Integrations is an direct interface to an UI-Framework,
   * and allows easy interaction with that Framework.
   *
   * @public
   * @param config - Configuration object
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
   * Updates the key/name identifier of the Integration.
   *
   * @public
   * @param value - New key/name identifier.
   */
  public set key(value: IntegrationKey) {
    this._key = value;
  }

  /**
   * Returns the key/name identifier of the State.
   *
   * @public
   */
  public get key(): IntegrationKey {
    return this._key;
  }
}

export interface CreateIntegrationConfig<F = any, C = any>
  extends IntegrationMethods<C> {
  /**
   * Key/Name identifier of the Integratioon.
   * @default undefined
   */
  key: string;
  /**
   * An Instance of the Framework to be represented by the Integration.
   * For example, in the case of React, the React Instance.
   * @default undefined
   */
  frameworkInstance?: F;
}

export interface IntegrationMethods<C = any> {
  /**
   * Binds the Framework/Integration to an Agile Instance.
   *
   * This method is called shortly after the Integration was registered with a Agile Instance.
   * It is intended to set up things on the Framework side
   * that are important for a integration into AgileTs.
   *
   * @param agileInstance - Agile Instance into which the Integration is to be integrated.
   * @return Indicating whether the to integrate Integration is ready on the Framework side.
   */
  bind?: (agileInstance: Agile) => Promise<boolean>;
  /**
   * Method to apply the specified updated data to the specified UI-Component
   * in order to trigger a re-render on it.
   *
   * This method is called when the value of an Agile Sub Instance
   * bound to the UI-Component changes
   * in a Component based Subscription.
   * The updated Agile Sub Instance values are represented in the `updatedData` object.
   *
   * @param componentInstance - Component Instance of the to update UI-Component.
   * @param updatedData - Data object containing the updated data.
   */
  updateMethod?: (componentInstance: C, updatedData: Object) => void;
}

export type IntegrationKey = string | number;
