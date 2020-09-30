import {Agile} from './internal';

export interface IntegrationConfig<F = any> {
    name?: any; // The name of the framework
    frameworkInstance?: F // The actual framework for instance React
    bind?: (agileInstance: Agile) => void // Will be called if the framework got successful instantiated
    updateMethod?: (componentInstance: any, updatedData: Object) => void // Will be called if a State changes (Only by Component based Subscription)
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

    public integrations: Set<Integration> = new Set();

    constructor(agileInstance: Agile) {
        this.agileInstance = () => agileInstance;

        // Integrate initial Integrations
        if (Agile.initialIntegrations)
            Agile.initialIntegrations.forEach(integration => this.integrate(integration));
    }


    //=========================================================================================================
    // Integrate
    //=========================================================================================================
    /**
     * Integrates a framework into Agile
     */
    public integrate(integration: Integration) {
        if (!(integration instanceof Integration) || !integration.config.name) {
            console.error('Agile: Failed to integrate framework!');
            return;
        }

        this.integrations.add(integration);
        if (this.agileInstance().config.logJobs)
            console.log(`Agile: Successfully integrated '${integration.config.name}'`);
    }


    //=========================================================================================================
    // Bind
    //=========================================================================================================
    /**
     * Binds the Framework to Agile
     */
    public bind() {
        this.integrations.forEach(integration => {
            integration.config.bind && integration.config.bind(this.agileInstance());
            integration.ready = true;
        });
    }


    //=========================================================================================================
    // Update
    //=========================================================================================================
    /**
     * Updates Framework States
     */
    public update(componentInstance: any, updatedData: Object) {
        this.integrations.forEach(integration => integration.config.updateMethod && integration.config.updateMethod(componentInstance, updatedData));
    }


    //=========================================================================================================
    // Has Integration
    //=========================================================================================================
    /**
     * Checks weather integrations are registered
     */
    public hasIntegration() {
        return this.integrations.size > 0;
    }
}