import 'mocha';
import {expect} from 'chai';
import {Agile, Integration} from "../src";

describe('Custom Framework Tests', () => {
    let boundFramework = false;

    const customIntegration = new Integration({
        name: 'test2',
        updateMethod: () => {
        },
        bind: () => {
        }
    })

    // Define Agile with framework
    const App = new Agile();

    /*
    it('Has bound custom Framework', () => {
        expect(boundFramework).to.eq(true, 'boundFramework has correct value');
        expect(App.integrations.integrations.size).to.eq(2, 'Integrations has correct size');
        expect(typeof App.integration?.bind === 'function').to.eq(true, 'Integration bind method get set');
        expect(typeof App.integration?.updateMethod === 'function').to.eq(true, 'Integration updateMethod method get set');
        expect(App.integration?.ready).to.eq(true, 'Integration is Ready');
    });
     */
});
