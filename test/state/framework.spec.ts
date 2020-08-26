import 'mocha';
import {expect} from 'chai';
import Agile, {State} from "../../src";

describe('Custom Framework Tests', () => {
    let updateCount = 0;
    let boundFramework = false;
    const App = new Agile({
        framework: {
            name: 'test', // The name of the framework
            bind: (agileInstance: Agile) => {
                boundFramework = true;
            },
            updateMethod: (componentInstance: any, updatedData: Object) => {
                updateCount++;
            }
        }
    });

    it('Framework has successfully get bound', () => {
        expect(boundFramework).to.eq(true, 'Check if framework got bound');
        expect(App.integration?.name).to.eq('test', 'Check if the framework name is correct');
        expect(typeof App.integration?.bind === 'function').to.eq(true, 'Check bin function has been set');
        expect(typeof App.integration?.updateMethod === 'function').to.eq(true, 'Check if updateMethod function has been set');
        expect(App.integration?.ready).to.eq(true, 'Check if integration is ready');
    });
});
