import {
  Agile,
  StateRuntimeJob,
  Observer,
  RuntimeJob,
  StatePersistent,
  SubscriptionContainer,
  Group,
  Collection,
  GroupObserver,
} from '../../../../src';
import * as Utils from '@agile-ts/utils';
import { LogMock } from '../../../helper/logMock';
import waitForExpect from 'wait-for-expect';

describe('StateObserver Tests', () => {
  let dummyAgile: Agile;
  let dummyCollection: Collection;
  let dummyGroup: Group;

  beforeEach(() => {
    jest.clearAllMocks();
    LogMock.mockLogs();

    dummyAgile = new Agile({ localStorage: false });
    dummyCollection = new Collection(dummyAgile);
    dummyGroup = new Group(dummyCollection, [], { key: 'dummyState' });
  });

  it('should create Group Observer (default config)', () => {
    const groupObserver = new GroupObserver(dummyGroup);

    expect(groupObserver).toBeInstanceOf(GroupObserver);
    expect(groupObserver.nextGroupOutput).toStrictEqual([]);
    expect(groupObserver.group()).toBe(dummyGroup);
    expect(groupObserver.value).toStrictEqual([]);
    expect(groupObserver.previousValue).toStrictEqual([]);
    expect(groupObserver._key).toBeUndefined();
    expect(Array.from(groupObserver.dependents)).toStrictEqual([]);
    expect(Array.from(groupObserver.subscribedTo)).toStrictEqual([]);
  });

  it('should create State Observer (specific config)', () => {
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
        dummyGroup.rebuild = jest.fn();
      });

      it('should rebuild the Group and ingests it into the runtime (default config)', () => {
        groupObserver.ingest();

        expect(dummyGroup.rebuild).toHaveBeenCalledWith({});
      });

      it('should rebuild the Group and ingests it into the runtime (specific config)', () => {
        groupObserver.ingest({
          background: true,
          overwrite: true,
        });

        expect(dummyGroup.rebuild).toHaveBeenCalledWith({
          background: true,
          overwrite: true,
        });
      });
    });

    describe('ingestValue function tests', () => {
      beforeEach(() => {
        dummyAgile.runtime.ingest = jest.fn();
      });

      it(
        'should ingest the Group into the Runtime ' +
          "if the new value isn't equal to the current value (default config)",
        () => {
          // TODO
        }
      );

      it(
        'should ingest the Group into the Runtime ' +
          "if the new value isn't equal to the current value (specific config)",
        () => {
          // TODO
        }
      );

      it(
        "shouldn't ingest the Group into the Runtime " +
          'if the new value is equal to the current value (default config)',
        () => {
          // TODO
        }
      );

      it(
        'should ingest the Group into the Runtime ' +
          'if the new value is equal to the current value (config.force = true)',
        () => {
          // TODO
        }
      );
    });

    describe('perform function tests', () => {
      let dummyJob: RuntimeJob;

      beforeEach(() => {
        dummyJob = new RuntimeJob(groupObserver, {
          key: 'dummyJob',
        });
      });

      it('should perform the specified Job', () => {
        // TODO
      });
    });
  });
});
