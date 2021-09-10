import {
  Agile,
  Observer,
  RuntimeJob,
  Item,
  SubscriptionContainer,
  Group,
  Collection,
  GroupObserver,
} from '../../../../src';
import * as Utils from '@agile-ts/utils';
import { LogMock } from '../../../helper/logMock';

describe('GroupObserver Tests', () => {
  interface ItemInterface {
    id: string;
    name: string;
  }

  let dummyAgile: Agile;
  let dummyCollection: Collection<ItemInterface>;
  let dummyGroup: Group<ItemInterface>;
  let dummyItem1: Item<ItemInterface>;
  let dummyItem2: Item<ItemInterface>;

  beforeEach(() => {
    LogMock.mockLogs();

    dummyAgile = new Agile();
    dummyCollection = new Collection<ItemInterface>(dummyAgile);
    dummyGroup = new Group<ItemInterface>(dummyCollection, [], {
      key: 'dummyGroup',
    });
    dummyItem1 = new Item(dummyCollection, {
      id: 'dummyItem1Key',
      name: 'frank',
    });
    dummyItem2 = new Item(dummyCollection, {
      id: 'dummyItem2Key',
      name: 'jeff',
    });

    jest.clearAllMocks();
  });

  it('should create Group Observer (default config)', () => {
    dummyGroup._output = [dummyItem1._value, dummyItem2._value];

    const groupObserver = new GroupObserver(dummyGroup);

    expect(groupObserver).toBeInstanceOf(GroupObserver);
    expect(groupObserver.nextGroupOutput).toStrictEqual([
      dummyItem1._value,
      dummyItem2._value,
    ]);
    expect(groupObserver.group()).toBe(dummyGroup);

    // Check if Observer was called with correct parameters
    expect(groupObserver.value).toStrictEqual([
      dummyItem1._value,
      dummyItem2._value,
    ]);
    expect(groupObserver.previousValue).toStrictEqual([
      dummyItem1._value,
      dummyItem2._value,
    ]);
    expect(groupObserver._key).toBeUndefined();
    expect(Array.from(groupObserver.dependents)).toStrictEqual([]);
    expect(Array.from(groupObserver.subscribedTo)).toStrictEqual([]);
  });

  it('should create Group Observer (specific config)', () => {
    const dummyObserver1 = new Observer(dummyAgile, { key: 'dummyObserver1' });
    const dummyObserver2 = new Observer(dummyAgile, { key: 'dummyObserver2' });
    const dummySubscription1 = new SubscriptionContainer([]);
    const dummySubscription2 = new SubscriptionContainer([]);

    const groupObserver = new GroupObserver(dummyGroup, {
      key: 'testKey',
      dependents: [dummyObserver1, dummyObserver2],
      subs: [dummySubscription1, dummySubscription2],
    });

    expect(groupObserver).toBeInstanceOf(GroupObserver);
    expect(groupObserver.nextGroupOutput).toStrictEqual([]);
    expect(groupObserver.group()).toBe(dummyGroup);

    // Check if Observer was called with correct parameters
    expect(groupObserver.value).toStrictEqual([]);
    expect(groupObserver.previousValue).toStrictEqual([]);
    expect(groupObserver._key).toBe('testKey');
    expect(Array.from(groupObserver.dependents)).toStrictEqual([
      dummyObserver1,
      dummyObserver2,
    ]);
    expect(Array.from(groupObserver.subscribedTo)).toStrictEqual([
      dummySubscription1,
      dummySubscription2,
    ]);
  });

  describe('Group Observer Function Tests', () => {
    let groupObserver: GroupObserver;

    beforeEach(() => {
      groupObserver = new GroupObserver(dummyGroup, {
        key: 'groupObserverKey',
      });
    });

    describe('ingest function tests', () => {
      beforeEach(() => {
        groupObserver.ingestOutput = jest.fn();
      });

      it('should call ingestOutput with nextGroupOutput (default config)', () => {
        groupObserver.group().nextGroupOutput = 'jeff' as any;

        groupObserver.ingest();

        expect(groupObserver.ingestOutput).toHaveBeenCalledWith(
          groupObserver.group().nextGroupOutput,
          {}
        );
      });

      it('should call ingestOutput with nextGroupOutput (specific config)', () => {
        groupObserver.group().nextGroupOutput = 'jeff' as any;

        groupObserver.ingest({
          background: true,
          force: true,
          maxTriesToUpdate: 5,
        });

        expect(groupObserver.ingestOutput).toHaveBeenCalledWith(
          groupObserver.group().nextGroupOutput,
          {
            background: true,
            force: true,
            maxTriesToUpdate: 5,
          }
        );
      });
    });

    describe('ingestOutput function tests', () => {
      beforeEach(() => {
        dummyAgile.runtime.ingest = jest.fn();
      });

      it(
        'should ingest the Group into the Runtime ' +
          "if the new value isn't equal to the current value (default config)",
        () => {
          jest.spyOn(Utils, 'generateId').mockReturnValue('randomKey');
          dummyAgile.runtime.ingest = jest.fn((job: RuntimeJob) => {
            expect(job._key).toBe(`${groupObserver._key}_randomKey_output`);
            expect(job.observer).toBe(groupObserver);
            expect(job.config).toStrictEqual({
              background: false,
              sideEffects: {
                enabled: true,
                exclude: [],
              },
              force: false,
              maxTriesToUpdate: 3,
            });
          });

          groupObserver.ingestOutput([dummyItem1._value, dummyItem2._value]);

          expect(groupObserver.nextGroupOutput).toStrictEqual([
            dummyItem1._value,
            dummyItem2._value,
          ]);
          expect(dummyAgile.runtime.ingest).toHaveBeenCalledWith(
            expect.any(RuntimeJob),
            {
              perform: true,
            }
          );
        }
      );

      it(
        'should ingest the Group into the Runtime ' +
          "if the new value isn't equal to the current value (specific config)",
        () => {
          dummyAgile.runtime.ingest = jest.fn((job: RuntimeJob) => {
            expect(job._key).toBe('dummyJob');
            expect(job.observer).toBe(groupObserver);
            expect(job.config).toStrictEqual({
              background: false,
              sideEffects: {
                enabled: false,
              },
              force: true,
              maxTriesToUpdate: 5,
            });
          });

          groupObserver.ingestOutput([dummyItem1._value, dummyItem2._value], {
            perform: false,
            force: true,
            sideEffects: {
              enabled: false,
            },
            key: 'dummyJob',
            maxTriesToUpdate: 5,
          });

          expect(groupObserver.nextGroupOutput).toStrictEqual([
            dummyItem1._value,
            dummyItem2._value,
          ]);
          expect(dummyAgile.runtime.ingest).toHaveBeenCalledWith(
            expect.any(RuntimeJob),
            {
              perform: false,
            }
          );
        }
      );

      it(
        "shouldn't ingest the Group into the Runtime " +
          'if the new value is equal to the current value (default config)',
        () => {
          dummyGroup._output = [dummyItem1._value, dummyItem2._value];

          groupObserver.ingestOutput([dummyItem1._value, dummyItem2._value]);

          expect(groupObserver.nextGroupOutput).toStrictEqual([
            dummyItem1._value,
            dummyItem2._value,
          ]);
          expect(dummyAgile.runtime.ingest).not.toHaveBeenCalled();
        }
      );

      it(
        'should ingest the Group into the Runtime ' +
          'if the new value is equal to the current value (config.force = true)',
        () => {
          jest.spyOn(Utils, 'generateId').mockReturnValue('randomKey');
          dummyGroup._output = [dummyItem1._value, dummyItem2._value];
          dummyAgile.runtime.ingest = jest.fn((job: RuntimeJob) => {
            expect(job._key).toBe(`${groupObserver._key}_randomKey_output`);
            expect(job.observer).toBe(groupObserver);
            expect(job.config).toStrictEqual({
              background: false,
              sideEffects: {
                enabled: true,
                exclude: [],
              },
              force: true,
              maxTriesToUpdate: 3,
            });
          });

          groupObserver.ingestOutput([dummyItem1._value, dummyItem2._value], {
            force: true,
          });

          expect(groupObserver.nextGroupOutput).toStrictEqual([
            dummyItem1._value,
            dummyItem2._value,
          ]);
          expect(dummyAgile.runtime.ingest).toHaveBeenCalledWith(
            expect.any(RuntimeJob),
            {
              perform: true,
            }
          );
        }
      );

      it('should ingest placeholder Group into the Runtime (default config)', () => {
        jest.spyOn(Utils, 'generateId').mockReturnValue('randomKey');
        dummyAgile.runtime.ingest = jest.fn((job: RuntimeJob) => {
          expect(job._key).toBe(`${groupObserver._key}_randomKey_output`);
          expect(job.observer).toBe(groupObserver);
          expect(job.config).toStrictEqual({
            background: false,
            sideEffects: {
              enabled: true,
              exclude: [],
            },
            force: true,
            maxTriesToUpdate: 3,
          });
        });
        dummyGroup.isPlaceholder = true;

        groupObserver.ingestOutput([dummyItem1._value, dummyItem2._value]);

        expect(groupObserver.nextGroupOutput).toStrictEqual([
          dummyItem1._value,
          dummyItem2._value,
        ]);
        expect(dummyAgile.runtime.ingest).toHaveBeenCalledWith(
          expect.any(RuntimeJob),
          {
            perform: true,
          }
        );
      });
    });

    describe('perform function tests', () => {
      let dummyJob: RuntimeJob;

      beforeEach(() => {
        dummyJob = new RuntimeJob(groupObserver, {
          key: 'dummyJob',
        });
      });

      it('should perform the specified Job', () => {
        (dummyJob.observer as GroupObserver).nextGroupOutput = [
          dummyItem1._value,
          dummyItem2._value,
        ];
        dummyJob.observer.value = [dummyItem1._value];
        dummyGroup._output = [dummyItem1._value];
        dummyGroup.nextGroupOutput = [dummyItem1._value];

        groupObserver.perform(dummyJob);

        expect(dummyGroup._output).toStrictEqual([
          dummyItem1._value,
          dummyItem2._value,
        ]);
        expect(dummyGroup.nextGroupOutput).toStrictEqual([
          dummyItem1._value,
          dummyItem2._value,
        ]);

        expect(groupObserver.value).toStrictEqual([
          dummyItem1._value,
          dummyItem2._value,
        ]);
        expect(groupObserver.previousValue).toStrictEqual([dummyItem1._value]);
      });
    });
  });
});
