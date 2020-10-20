import { Agile, Integration } from "../internal";

export class Integrations {
  public agileInstance: () => Agile;

  public integrations: Set<Integration> = new Set(); // All registered Integrations

  /**
   * @internal
   * Integrations - Holds and manages all Integrations of Agile
   * @param agileInstance - An Instance of Agile
   */
  constructor(agileInstance: Agile) {
    this.agileInstance = () => agileInstance;

    // Integrate initial Integrations which are static and got set external
    Agile.initialIntegrations.forEach((integration) =>
      this.integrate(integration)
    );
  }

  //=========================================================================================================
  // Integrate
  //=========================================================================================================
  /**
   * @internal
   * Integrates Framework (Integration) into Agile
   * @param integration - Integration which gets registered/integrated
   */
  public async integrate(integration: Integration) {
    // Check if integration is valid
    if (!integration.config.name) {
      console.error("Agile: Failed to integrate framework!");
      return;
    }

    // Integrate Integration/Framework
    this.integrations.add(integration);
    if (integration.config.bind)
      integration.ready = await integration.config.bind(this.agileInstance());
    else integration.ready = true;

    // Logging
    if (this.agileInstance().config.logJobs)
      console.log(
        `Agile: Successfully integrated '${integration.config.name}'`
      );
  }

  //=========================================================================================================
  // Update
  //=========================================================================================================
  /**
   * @internal
   * Updates Integrations
   * -> calls 'updateMethod' in registered Integrations
   * @param componentInstance - Component which gets updated
   * @param updatedData - Updated Properties with new Value (Note: properties with no value won't get passed)
   */
  public update(componentInstance: any, updatedData: Object): void {
    this.integrations.forEach((integration) => {
      // Check if integration is ready
      if (!integration.ready) {
        console.log(
          `Agile: Integration '${integration.config.name}' isn't ready yet!`
        );
        return;
      }

      if (integration.config.updateMethod)
        integration.config.updateMethod(componentInstance, updatedData);
    });
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
