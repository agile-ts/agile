import Agile from "../../../../src";
import {expect} from "chai";
import {Group} from "../../../../src/collection/group";

describe('Has function Tests', () => {
    // Define Agile
    const App = new Agile();

    // Object Interface
    interface userInterface {
        id: number
        name: string
    }

    // Create Collection
    const MY_COLLECTION = App.Collection<userInterface>(collection => ({
            groups: {
                group1: collection.Group([1, 2, 3])
            }
        })
    );

    MY_COLLECTION.collect([{id: 1, name: 'jeff'}, {id: 2, name: 'hans'}, {id: 3, name: 'frank'}, {id: 4, name: 'gina'}]);

    it('Has correct initial values', () => {
        expect(MY_COLLECTION.groups['group1'] instanceof Group).to.eq(true, 'MY_COLLECTION group1 Group has been created');
        expect(JSON.stringify(MY_COLLECTION.groups['group1'].value)).to.eq(JSON.stringify([1, 2, 3]), 'group1 has correct initial value');
        expect(JSON.stringify(MY_COLLECTION.groups['group1'].output)).to.eq(JSON.stringify([
            {id: 1, name: 'jeff'},
            {id: 2, name: 'hans'},
            {id: 3, name: 'frank'}
        ]), 'group1 has correct output');
    });

    it('Can use has function', () => {
        const has = MY_COLLECTION.groups['group1'].has(1);

        expect(has).to.eq(true);
        expect(JSON.stringify(MY_COLLECTION.groups['group1'].value)).to.eq(JSON.stringify([1, 2, 3]), 'group1 has correct initial value');

    });

    it('Can use has function with not existing primaryKey in collection and group', () => {
        const has = MY_COLLECTION.groups['group1'].has(100);

        expect(has).to.eq(false);
        expect(JSON.stringify(MY_COLLECTION.groups['group1'].value)).to.eq(JSON.stringify([1, 2, 3]), 'group1 has correct initial value');
    });

    it('Can use has function with not existing primaryKey in group', () => {
        const has = MY_COLLECTION.groups['group1'].has(4);

        expect(has).to.eq(false);
        expect(JSON.stringify(MY_COLLECTION.groups['group1'].value)).to.eq(JSON.stringify([1, 2, 3]), 'group1 has correct initial value');
    });
});
