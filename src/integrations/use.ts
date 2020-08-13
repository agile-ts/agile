import Agile from "../agile";
import reactIntegration from "../integrations/react.integration";

export interface Integration {
    ready?: boolean;
    frameworkConstructor?: any; // The actual framework for instance React
    name?: any; // The name of the framework
    bind?: (agileInstance: Agile) => void; // Will be called if the framework got successful instantiated
    updateMethod?: (componentInstance: any, updatedData: Object) => void; // Will be called if a State changes (Only by Component based Subscription)
}

// Required Properties of a custom Integration
const requiredIntegrationProperties = ['name', 'bind', 'updateMethod'];

// This Integration will injected into Agile.integration
const finalIntegration: Integration = {
    ready: false
};

export default function use(framework: any, agileInstance: Agile) {
    const frameworkName = getFrameworkName(framework);

    // Integrate Framework
    switch (frameworkName) {
        case 'react':
            integrate(reactIntegration, 'react');
            break;

        case 'custom':
            if (validateCustomFramework(framework as Integration))
                integrate(framework, 'custom');
            break;

        default:
        // Should never happen
    }

    // Assign Framework Constructor to framework if its not a custom framework
    // because custom Frameworks has to set the frameworkConstructor (direct dependency to Framework (React)) on their own
    // and have to pass an Integration and not directly a framework
    if (frameworkName !== 'custom')
        finalIntegration.frameworkConstructor = framework;

    // Inject Integration into Agile
    agileInstance.integration = finalIntegration;

    // If the Integration is ready call integration.bind()
    if (agileInstance.integration.ready)
        if (agileInstance.integration.bind)
            agileInstance.integration.bind(agileInstance);
        else
            console.error('Pulse: Failed to integrate with framework! It\'s possible you didn\'t call Pulse.initFrameworkIntegration() before new Pulse.');
}


//=========================================================================================================
// Helper
//=========================================================================================================

function integrate(frameworkIntegration: Integration, frameworkName: string) {
    // Bind all properties from integration to our main Integration Object
    Object.keys(frameworkIntegration).forEach(property => {
        // @ts-ignore
        finalIntegration[property] = frameworkIntegration[property];
    });

    // Assign Name
    finalIntegration.name = frameworkIntegration.name || frameworkName;

    // Set Integration to Ready (can be used)
    finalIntegration.ready = true;
}

function validateCustomFramework(customIntegration: Integration): boolean {
    let valid: boolean = true;

    // Check if custom Integration has all required properties
    requiredIntegrationProperties.forEach(property => {
        if (!customIntegration.hasOwnProperty(property)) valid = false;
    });

    return valid;
}

function getFrameworkName(frameworkConstructor: any): string {
    let name: string = 'custom';

    if (!frameworkConstructor) return name;

    // Check if framework is React
    if (frameworkConstructor.hasOwnProperty('__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED'))
        return 'react';

    return name;
}
