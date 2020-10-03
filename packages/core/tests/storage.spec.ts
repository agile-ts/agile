import 'mocha';
import {expect} from 'chai';
import {Agile} from "../src";

describe('Custom Storage Tests', () => {
    const myStorage: any = {}

    // Define Agile
    const App = new Agile();

    // Create Storage
    const storage = App.Storage({
        prefix: 'test',
        methods: {
            get: ((key) => {
                return myStorage[key];
            }),
            set: (key, value) => {
                myStorage[key] = value;
            },
            remove: (key) => {
                delete myStorage[key];
            }
        }
    });

    describe('Can work with numbers', () => {
        it('Can set an item into the Storage', async () => {
            // Set Item into Storage
            storage.set('myKey', 1);

            expect(myStorage['_test_myKey']).to.eq(JSON.stringify(1));
        });

        it('Can get an item from the Storage', () => {
            // Get Item from Storage
            const item = storage.get('myKey');

            expect(item).to.eq(1);
        });

        it('Can remove an item from the Storage', () => {
            // Remove Item from Storage
            storage.remove('myKey');

            expect(myStorage['_test_myKey']).to.eq(undefined);
            expect(storage.get('myKey')).to.eq(undefined);
        });
    });

    describe('Can work with object', () => {
        it('Can set an item into the Storage', () => {
            // Set Item into Storage
            storage.set('mySecondKey', {id: 1, name: 'jeff'});

            expect(myStorage['_test_mySecondKey']).to.eq(JSON.stringify({id: 1, name: 'jeff'}));
        });

        it('Can get an item from the Storage', () => {
            // Get Item from Storage
            const item = storage.get('mySecondKey');

            expect(JSON.stringify(item)).to.eq(JSON.stringify({id: 1, name: 'jeff'}));
        });

        it('Can remove an item from the Storage', () => {
            // Remove Item from Storage
            storage.remove('mySecondKey');

            expect(myStorage['_test_mySecondKey']).to.eq(undefined);
            expect(storage.get('mySecondKey')).to.eq(undefined);
        });
    });

    describe('Can work with array', () => {
        it('Can set an item into the Storage', () => {
            // Set Item into Storage
            storage.set('myThirdKey', [1, 2, 3]);

            expect(myStorage['_test_myThirdKey']).to.eq(JSON.stringify([1, 2, 3]));
        });

        it('Can get an item from the Storage', () => {
            // Get Item from Storage
            const item = storage.get('myThirdKey');

            expect(JSON.stringify(item)).to.eq(JSON.stringify([1, 2, 3]));
        });

        it('Can remove an item from the Storage', () => {
            // Remove Item from Storage
            storage.remove('myThirdKey');

            expect(myStorage['myThirdKey']).to.eq(undefined);
            expect(storage.get('myThirdKey')).to.eq(undefined);
        });
    });
});
