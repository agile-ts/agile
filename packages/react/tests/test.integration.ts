import {Agile, Integration} from '@agile/core'

const testIntegration = new Integration({
    name: 'test',
    frameworkInstance: null,
    bind(agileInstance: Agile) {
        // Nothing to bind ;D
    },
    updateMethod(componentInstance: any, updatedData: Object) {
        // Nothing
    }
});
Agile.initialIntegrations.push(testIntegration);

export default testIntegration;