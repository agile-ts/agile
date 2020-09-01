import 'mocha';
import {expect} from 'chai';
import Agile from "../../../src";
import {Selector} from "../../../src/collection/selector";

describe('createSelector Function Tests', () => {
    // Define Agile
    const App = new Agile();

    // Object Interface
    interface userInterface {
        id: number
        name: string
    }

    // Create Collection
    const MY_COLLECTION = App.Collection<userInterface>();

    it('Has correct initial values', () => {
        expect(JSON.stringify(MY_COLLECTION.data)).to.eq(JSON.stringify({}), 'MY_COLLECTION has correct data');
    });

    it('Can create Selector', () => {
        // Create Selector
        MY_COLLECTION.createSelector('selector1', '3');

        expect(MY_COLLECTION.selectors['selector1'] instanceof Selector).to.eq(true, 'MY_COLLECTION selector1 has been created');
        expect(MY_COLLECTION.selectors['selector1'].id).to.eq('3', 'selector1 is watch right id');
        expect(MY_COLLECTION.selectors['selector1'].key).to.eq('selector1', 'selector1 has correct key');
    });

    it('Can\'t overwrite Selector which already exists', () => {
        // Create Selector
        MY_COLLECTION.createSelector('selector1', '2');

        expect(MY_COLLECTION.selectors['selector1'] instanceof Selector).to.eq(true, 'MY_COLLECTION selector1 is still a selector');
        expect(MY_COLLECTION.selectors['selector1'].id).to.eq('3', 'selector1 id stayed the same');
    });
});
