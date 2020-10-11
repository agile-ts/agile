import { Agile } from "./internal";

/**
 * @param {string} name - Name of the Integration
 * @param {any} frameworkInstance - The framework instance (for instance in case of react you pass React)
 * @param {(agileInstance: Agile) => void} bind - Will be called if the framework got successful integrated
 * @param {(componentInstance: any, updatedData: Object) => void} updateMethod - Will be called if a Observer updates his subs (Only by Component based Subscription)
 */
export interface IntegrationConfig<F = any> {
  name?: string;
  frameworkInstance?: F;
  bind?: (agileInstance: Agile) => void;
  updateMethod?: (componentInstance: any, updatedData: Object) => void;
}

export class Integration<F = any> {
  public ready: boolean = false;
  public config: IntegrationConfig<F>;

  constructor(config: IntegrationConfig) {
    this.config = config;
  }
}

export class Integrations {
  public agileInstance: () => Agile;

  public integrations: Set<Integration> = new Set(); // All Integrations that got registered

  /**
   * @internal
   * Integration
   * @param {Agile} agileInstance - An Instance of Agile
   */
  constructor(agileInstance: Agile) {
    this.agileInstance = () => agileInstance;

    // Integrate initial Integrations which will be set in integrated packages like the react extension
    Agile.initialIntegrations.forEach((integration) =>
      this.integrate(integration)
    );
  }

  //=========================================================================================================
  // Integrate
  //=========================================================================================================
  /**
   * @internal
   * Integrates a framework into Agile
   * @param {Integration} integration - Integration which you want to integrate/register
   */
  public integrate(integration: Integration) {
    // Check if integration is valid
    if (!integration.config.name) {
      console.error("Agile: Failed to integrate framework!");
      return;
    }

    this.integrations.add(integration);

    if (this.agileInstance().config.logJobs)
      console.log(
        `Agile: Successfully integrated '${integration.config.name}'`
      );
  }

  //=========================================================================================================
  // Bind
  //=========================================================================================================
  /**
   * @internal
   * Binds registered frameworks to Agile
   */
  public bind(): void {
    this.integrations.forEach((integration) => {
      integration.config.bind && integration.config.bind(this.agileInstance());
      integration.ready = true;
    });
  }

  //=========================================================================================================
  // Update
  //=========================================================================================================
  /**
   * @internal
   * Will call the updateMethod in integrations
   * @param {any} componentInstance - Component which should get updated
   * @param {Object} updatedData - Updated Properties with the new Values (Note: properties with no value won't get passed)
   */
  public update(componentInstance: any, updatedData: Object): void {
    this.integrations.forEach(
      (integration) =>
        integration.config.updateMethod &&
        integration.config.updateMethod(componentInstance, updatedData)
    );
  }

  //=========================================================================================================
  // Has Integration
  //=========================================================================================================
  /**
   * @internal
   * Checks if Agile has registered any Integration
   */
  public hasIntegration(): boolean {
    return this.integrations.size > 0;
  }
}
