import 'mocha';
import {expect} from 'chai';
import Agile from "../../../src";
import Group from "../../../src/collection/group";

describe('getGroup Function Tests', () => {
    // Define Agile
    const App = new Agile();

    // Object Interface
    interface userInterface {
        id: number
        name: string
    }

    // Create Collection
    const MY_COLLECTION = App.Collection<userInterface>({
        groups: ['group1', 'group2']
    });

    it('Has correct initial values', () => {
        expect(MY_COLLECTION.groups['default'] instanceof Group).to.eq(true, 'MY_COLLECTION default Group has been created');
        expect(MY_COLLECTION.groups['group1'] instanceof Group).to.eq(true, 'MY_COLLECTION group1 Group has been created');
        expect(MY_COLLECTION.groups['group2'] instanceof Group).to.eq(true, 'MY_COLLECTION group2 Group has been created');
    });

    it('Can get Group which exists', () => {
        // Get Group
        const myGroup = MY_COLLECTION.getGroup('group1');

        expect(myGroup instanceof Group).to.eq(true, 'myGroup is a group');
        expect(myGroup.key).to.eq('group1', 'myGroup has correct key');
        expect(myGroup.exists).to.eq(true, 'myGroup does exist');
    });

    it('Gets dummy Group, if trying to get a non existing group', () => {
        // Get Group
        const myGroup = MY_COLLECTION.getGroup('group3');

        expect(myGroup instanceof Group).to.eq(true, 'myGroup is a group');
        expect(myGroup.key).to.eq('dummy', 'myGroup has correct key');
        expect(myGroup.exists).to.eq(false, 'group3 doesn\'t exist');
    });
});
