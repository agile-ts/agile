import 'mocha';
import {expect} from 'chai';
import Agile from "../src";

describe('Custom Framework Tests', () => {
    let boundFramework = false;

    // Define Agile with framework
    const App = new Agile();

    it('Has bound custom Framework', () => {
        expect(boundFramework).to.eq(true, 'boundFramework has correct value');
        expect(App.integration?.name).to.eq('test', 'Integration Name has correct value');
        expect(typeof App.integration?.bind === 'function').to.eq(true, 'Integration bind method get set');
        expect(typeof App.integration?.updateMethod === 'function').to.eq(true, 'Integration updateMethod method get set');
        expect(App.integration?.ready).to.eq(true, 'Integration is Ready');
    });
});
