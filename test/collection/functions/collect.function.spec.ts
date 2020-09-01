import 'mocha';
import {expect} from 'chai';
import Agile from "../../../src";
import {useTest} from "../../../src/integrations/test.integration";

describe('Set Function Tests', () => {
    // Define Agile
    const App = new Agile({
        framework: {
            name: 'test',
            bind: (agileInstance: Agile) => {
            },
            updateMethod: (componentInstance: any, updatedData: Object) => {
                // Note can't test updateMethod because for that we need a component (Rerenders will be tested with a callbackFunction)
            }
        },
    });

    describe('Collection without primaryKey', () => {
        let rerenderCount = 0;

        // Object Interface
        interface userInterface {
            id: number
            name: string
            age?: number
        }

        // Create Collection
        const MY_COLLECTION = App.Collection<userInterface>();

        // Set 'Hook' for testing the rerenderFunctionality with the callbackFunction (Note: the value of myHookState doesn't get changed because no rerenders happen -> no reassign of the value)
        const [myHookCollection] = useTest([MY_COLLECTION], () => {
            rerenderCount++;
        });

        it('Has correct initial values', () => {
            expect(JSON.stringify(MY_COLLECTION.data)).to.eq(JSON.stringify({}), 'MY_COLLECTION has correct data');
            expect(MY_COLLECTION.groups['default'] !== undefined).to.eq(true, 'MY_COLLECTION default Group has been created')
            expect(MY_COLLECTION.groups['default']?.dep.subs.size === 1).to.eq(true, 'MY_COLLECTION default Group has correct subs size');

            expect(JSON.stringify(myHookCollection)).to.eq(JSON.stringify([]), 'myHookState has correct MY_COLLECTION value');
            expect(rerenderCount).to.eq(0, 'rerenderCount is 0');
        });

        it('Can collect item', async () => {
            // Collect item
            MY_COLLECTION.collect({id: 1, name: 'jeff'});

            // Needs some time to call callbackFunction
            await new Promise(resolve => setTimeout(resolve, 100));

            expect(JSON.stringify(MY_COLLECTION.data[1]?.value)).to.eq(JSON.stringify({
                id: 1,
                name: 'jeff'
            }), 'MY_COLLECTION data has collected value');
            expect(MY_COLLECTION.groups['default']?.value.findIndex(value => value === 1) !== -1).to.eq(true, 'MY_COLLECTION default group contains collected value');
            expect(MY_COLLECTION.size).to.eq(1, 'MY_COLLECTION size has been increased by 1');

            expect(rerenderCount).to.eq(1, 'rerenderCount has been increased by 1');
        });

        it('Can\'t collect item with no primaryKey', async () => {
            // Collect item
            // @ts-ignore
            MY_COLLECTION.collect({name: 'benno'});

            // Needs some time to call callbackFunction
            await new Promise(resolve => setTimeout(resolve, 100));

            expect(MY_COLLECTION.size).to.eq(1, 'MY_COLLECTION size stayed the same');

            expect(rerenderCount).to.eq(1, 'rerenderCount stayed the same');
        });

        it('Can\'t collect no object item', async () => {
            // Collect item
            // @ts-ignore
            MY_COLLECTION.collect('franz');

            // Needs some time to call callbackFunction
            await new Promise(resolve => setTimeout(resolve, 100));

            expect(MY_COLLECTION.size).to.eq(1, 'MY_COLLECTION size stayed the same');

            expect(rerenderCount).to.eq(1, 'rerenderCount stayed the same');
        });

        it('Can\'t collect item with wrong primaryKey', async () => {
            // Collect item
            // @ts-ignore
            MY_COLLECTION.collect({key: 2, name: 'hans'});

            // Needs some time to call callbackFunction
            await new Promise(resolve => setTimeout(resolve, 100));

            expect(JSON.stringify(MY_COLLECTION.data[2]?.value)).to.eq(JSON.stringify(undefined), 'MY_COLLECTION data hasn\'t collected value');
            expect(MY_COLLECTION.groups['default']?.value.findIndex(value => value === 2) !== -1).to.eq(false, 'MY_COLLECTION default group doesn\'t contain collected value');
            expect(MY_COLLECTION.size).to.eq(1, 'MY_COLLECTION size stayed the same');

            expect(rerenderCount).to.eq(1, 'rerenderCount stayed the same');
        });

        it('Can collect multiple items at the same time', async () => {
            // Collect item
            MY_COLLECTION.collect([{id: 2, name: 'hans'}, {id: 3, name: 'frank'}]);

            // Needs some time to call callbackFunction
            await new Promise(resolve => setTimeout(resolve, 100));

            expect(JSON.stringify(MY_COLLECTION.data[2]?.value)).to.eq(JSON.stringify({
                id: 2,
                name: 'hans'
            }), 'MY_COLLECTION data has collected value with id 2');
            expect(JSON.stringify(MY_COLLECTION.data[3]?.value)).to.eq(JSON.stringify({
                id: 3,
                name: 'frank'
            }), 'MY_COLLECTION data has collected value with id 3');
            expect(MY_COLLECTION.groups['default']?.value.findIndex(value => value === 2) !== -1).to.eq(true, 'MY_COLLECTION default group contains collected value with id 2');
            expect(MY_COLLECTION.groups['default']?.value.findIndex(value => value === 3) !== -1).to.eq(true, 'MY_COLLECTION default group contains collected value with id 3');
            expect(MY_COLLECTION.size).to.eq(3, 'MY_COLLECTION size has been increased by 2');

            expect(rerenderCount).to.eq(2, 'rerenderCount has been increased by 1');
        });

        describe('Test background option', () => {
            it('Does call callBackFunction by collecting Item with background = false', async () => {
                // Collect item
                MY_COLLECTION.collect({id: 4, name: 'dustin'}, [], {background: false});

                // Needs some time to call callbackFunction
                await new Promise(resolve => setTimeout(resolve, 100));

                expect(JSON.stringify(MY_COLLECTION.data[4]?.value)).to.eq(JSON.stringify({
                    id: 4,
                    name: 'dustin'
                }), 'MY_COLLECTION data has collected value');
                expect(MY_COLLECTION.groups['default']?.value.findIndex(value => value === 4) !== -1).to.eq(true, 'MY_COLLECTION default group contains collected value');
                expect(MY_COLLECTION.size).to.eq(4, 'MY_COLLECTION size has been increased by 1');

                expect(rerenderCount).to.eq(3, 'rerenderCount has been increased by 1');
            });

            it('Doesn\'t call callBackFunction by collecting Item with background = true', async () => {
                // Collect item
                MY_COLLECTION.collect({id: 5, name: 'snipey'}, [], {background: true});

                // Needs some time to call callbackFunction
                await new Promise(resolve => setTimeout(resolve, 100));

                expect(JSON.stringify(MY_COLLECTION.data[5]?.value)).to.eq(JSON.stringify({
                    id: 5,
                    name: 'snipey'
                }), 'MY_COLLECTION data has collected value');
                expect(MY_COLLECTION.groups['default']?.value.findIndex(value => value === 5) !== -1).to.eq(true, 'MY_COLLECTION default group contains collected value');
                expect(MY_COLLECTION.size).to.eq(5, 'MY_COLLECTION size has been increased by 1');

                expect(rerenderCount).to.eq(3, 'rerenderCount stayed the same');
            });
        });

        describe('Test method option', () => {
            it('Does add the item at the end of the group with method = \'push\'', async () => {
                // Collect item
                MY_COLLECTION.collect({id: 6, name: 'jana'}, [], {method: 'push'});

                // Needs some time to call callbackFunction
                await new Promise(resolve => setTimeout(resolve, 100));

                expect(JSON.stringify(MY_COLLECTION.data[6]?.value)).to.eq(JSON.stringify({
                    id: 6,
                    name: 'jana'
                }), 'MY_COLLECTION data has collected value');
                expect(MY_COLLECTION.groups['default']?.value.findIndex(value => value === 6) !== -1).to.eq(true, 'MY_COLLECTION default group contains collected value');
                expect(MY_COLLECTION.groups['default']?.value[MY_COLLECTION.groups['default']?.value.length - 1]).to.eq(6, 'MY_COLLECTION default group collected value is last item in group');
                expect(MY_COLLECTION.size).to.eq(6, 'MY_COLLECTION size has been increased by 1');

                expect(rerenderCount).to.eq(4, 'rerenderCount has been increased by 1');
            });

            it('Does add the item at the start of the group with method = \'unshift\'', async () => {
                // Collect item
                MY_COLLECTION.collect({id: 7, name: 'gina'}, [], {method: 'unshift'});

                // Needs some time to call callbackFunction
                await new Promise(resolve => setTimeout(resolve, 100));

                expect(JSON.stringify(MY_COLLECTION.data[7]?.value)).to.eq(JSON.stringify({
                    id: 7,
                    name: 'gina'
                }), 'MY_COLLECTION data has collected value');
                expect(MY_COLLECTION.groups['default']?.value.findIndex(value => value === 7) !== -1).to.eq(true, 'MY_COLLECTION default group contains collected value');
                expect(MY_COLLECTION.groups['default']?.value[0]).to.eq(7, 'MY_COLLECTION default group collected value is first item in group');
                expect(MY_COLLECTION.size).to.eq(7, 'MY_COLLECTION size has been increased by 1');

                expect(rerenderCount).to.eq(5, 'rerenderCount has been increased by 1');
            });
        });

        describe('Test patch option', () => {
            it('Does patch value into item without changing the rest of it with patch = true', async () => {
                // Collect item
                // @ts-ignore
                MY_COLLECTION.collect({id: 1, age: 20}, [], {patch: true});

                // Needs some time to call callbackFunction
                await new Promise(resolve => setTimeout(resolve, 100));

                expect(JSON.stringify(MY_COLLECTION.data[1]?.value)).to.eq(JSON.stringify({
                    id: 1,
                    name: 'jeff',
                    age: 20
                }), 'MY_COLLECTION data at id 1 has changed');
                expect(MY_COLLECTION.groups['default']?.value.findIndex(value => value === 1) !== -1).to.eq(true, 'MY_COLLECTION default group still contains collected value');
                expect(MY_COLLECTION.size).to.eq(7, 'MY_COLLECTION size stayed the same');

                expect(rerenderCount).to.eq(6, 'rerenderCount has been increased by 1');
            });

            it('Does set value into item with changing the rest of it with patch = false', async () => {
                // Collect item
                // @ts-ignore
                MY_COLLECTION.collect({id: 2, age: 30}, [], {patch: false});

                // Needs some time to call callbackFunction
                await new Promise(resolve => setTimeout(resolve, 100));

                expect(JSON.stringify(MY_COLLECTION.data[2]?.value)).to.eq(JSON.stringify({
                    id: 2,
                    age: 30
                }), 'MY_COLLECTION data at id 2 has changed');
                expect(MY_COLLECTION.groups['default']?.value.findIndex(value => value === 2) !== -1).to.eq(true, 'MY_COLLECTION default group still contains collected value');
                expect(MY_COLLECTION.size).to.eq(7, 'MY_COLLECTION size stayed the same');

                expect(rerenderCount).to.eq(7, 'rerenderCount has been increased by 1');
            });
        });

        describe('Test forEachItem option', () => {
            it('Does call forEachItem', async () => {
                const myForEachItems: { item: userInterface, key: string | number, index: number }[] = [];

                // Collect item
                MY_COLLECTION.collect([{id: 8, name: 'joshi'}, {id: 9, name: 'paul'}], [], {
                    forEachItem: (item, key, index) => {
                        myForEachItems.push({
                            item: item,
                            key: key,
                            index: index
                        })
                    }
                });

                // Needs some time to call callbackFunction
                await new Promise(resolve => setTimeout(resolve, 100));

                expect(JSON.stringify(MY_COLLECTION.data[8]?.value)).to.eq(JSON.stringify({
                    id: 8,
                    name: 'joshi'
                }), 'MY_COLLECTION data has collected value');
                expect(JSON.stringify(MY_COLLECTION.data[9]?.value)).to.eq(JSON.stringify({
                    id: 9,
                    name: 'paul'
                }), 'MY_COLLECTION data has collected value');
                expect(MY_COLLECTION.groups['default']?.value.findIndex(value => value === 8) !== -1).to.eq(true, 'MY_COLLECTION default group contains collected value');
                expect(MY_COLLECTION.groups['default']?.value.findIndex(value => value === 9) !== -1).to.eq(true, 'MY_COLLECTION default group contains collected value');
                expect(MY_COLLECTION.size).to.eq(9, 'MY_COLLECTION size has been increased by 2');

                expect(JSON.stringify(myForEachItems[0])).to.eq(JSON.stringify({
                    item: {id: 8, name: 'joshi'},
                    key: 8,
                    index: 0
                }), 'myForEachItem has contains first collected item');
                expect(JSON.stringify(myForEachItems[1])).to.eq(JSON.stringify({
                    item: {id: 9, name: 'paul'},
                    key: 9,
                    index: 1
                }), 'myForEachItem has contains second collected item');

                expect(rerenderCount).to.eq(8, 'rerenderCount has been increased by 1');

            });
        });
    });

    describe('Collection with primaryKey and defaultGroupKey', () => {
        let rerenderCount = 0;

        // Object Interface
        interface userInterface {
            key: number
            name: string
        }

        // Create Collection
        const MY_COLLECTION = App.Collection<userInterface>({
            primaryKey: 'key',
        });

        // Set 'Hook' for testing the rerenderFunctionality with the callbackFunction (Note: the value of myHookState doesn't get changed because no rerenders happen -> no reassign of the value)
        const [myHookCollection] = useTest([MY_COLLECTION], () => {
            rerenderCount++;
        });

        it('Has correct initial values', () => {
            expect(JSON.stringify(MY_COLLECTION.data)).to.eq(JSON.stringify({}), 'MY_COLLECTION has correct data');
            expect(MY_COLLECTION.groups['default'] !== undefined).to.eq(true, 'MY_COLLECTION default Group has been created')
            expect(MY_COLLECTION.groups['default']?.dep.subs.size === 1).to.eq(true, 'MY_COLLECTION default Group has correct subs size');

            expect(JSON.stringify(myHookCollection)).to.eq(JSON.stringify([]), 'myHookState has correct MY_COLLECTION value');
        });

        it('Can collect item', async () => {
            // Collect item
            MY_COLLECTION.collect({key: 1, name: 'jeff'});

            // Needs some time to call callbackFunction
            await new Promise(resolve => setTimeout(resolve, 100));

            expect(JSON.stringify(MY_COLLECTION.data[1]?.value)).to.eq(JSON.stringify({
                key: 1,
                name: 'jeff'
            }), 'MY_COLLECTION data has collected value');
            expect(MY_COLLECTION.groups['default']?.value.findIndex(value => value === 1) !== -1).to.eq(true, 'MY_COLLECTION default group contains collected value');
            expect(MY_COLLECTION.size).to.eq(1, 'MY_COLLECTION size has been increased by 1');

            expect(rerenderCount).to.eq(1, 'rerenderCount has been increased by 1');
        });

        it('Can\'t collect item with no primaryKey', async () => {
            // Collect item
            // @ts-ignore
            MY_COLLECTION.collect({name: 'benno'});

            // Needs some time to call callbackFunction
            await new Promise(resolve => setTimeout(resolve, 100));

            expect(MY_COLLECTION.size).to.eq(1, 'MY_COLLECTION size stayed the same');

            expect(rerenderCount).to.eq(1, 'rerenderCount stayed the same');
        });

        it('Can\'t collect item with wrong primaryKey', async () => {
            // Collect item
            // @ts-ignore
            MY_COLLECTION.collect({id: 2, name: 'hans'});

            // Needs some time to call callbackFunction
            await new Promise(resolve => setTimeout(resolve, 100));

            expect(JSON.stringify(MY_COLLECTION.data[2]?.value)).to.eq(JSON.stringify(undefined), 'MY_COLLECTION data hasn\'t collected value');
            expect(MY_COLLECTION.groups['default']?.value.findIndex(value => value === 2) !== -1).to.eq(false, 'MY_COLLECTION default group doesn\'t contain collected value');
            expect(MY_COLLECTION.size).to.eq(1, 'MY_COLLECTION size stayed the same');

            expect(rerenderCount).to.eq(1, 'rerenderCount stayed the same');
        });
    });
});
