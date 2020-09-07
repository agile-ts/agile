import 'mocha';
import {expect} from 'chai';
import Agile from "../../../src";
import {Group} from "../../../src/collection/group";

describe('createGroup Function Tests', () => {
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
        expect(MY_COLLECTION.groups['default'] instanceof Group).to.eq(true, 'MY_COLLECTION default Group has been created');
    });

    it('Can create Group', () => {
        // Create Group
        MY_COLLECTION.createGroup('group1');

        expect(MY_COLLECTION.groups['group1'] instanceof Group).to.eq(true, 'MY_COLLECTION group1 has been created');
        expect(JSON.stringify(MY_COLLECTION.groups['group1'].value)).to.eq(JSON.stringify([]), 'group1 has no initialItems');
        expect(MY_COLLECTION.groups['group1'].key).to.eq('group1', 'group1 has correct key');
    });

    it('Can create Group with initial Items', () => {
        // Create Group
        MY_COLLECTION.createGroup('group2', ['1', '2']);

        expect(MY_COLLECTION.groups['group2'] instanceof Group).to.eq(true, 'MY_COLLECTION group2 has been created');
        expect(JSON.stringify(MY_COLLECTION.groups['group2'].value)).to.eq(JSON.stringify(['1', '2']), 'group2 has initialItems');
        expect(MY_COLLECTION.groups['group2'].key).to.eq('group2', 'group2 has correct key');
    });

    it('Can\'t overwrite Group which already exists', () => {
        // Create Group
        MY_COLLECTION.createGroup('group2');

        expect(MY_COLLECTION.groups['group2'] instanceof Group).to.eq(true, 'MY_COLLECTION group2 is still a group');
        expect(JSON.stringify(MY_COLLECTION.groups['group2'].value)).to.eq(JSON.stringify(['1', '2']), 'group2 items stayed the same');
    });
});
