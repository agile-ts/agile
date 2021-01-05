import {EventJob} from '../../../src';

describe('EventJob Tests', () => {
  it('should create EventJob (without keys)', () => {
    const eventJob = new EventJob('myPayload');

    expect(eventJob.payload).toBe('myPayload');
    expect(eventJob.creationTimestamp).toBeCloseTo(new Date().getTime(), -1);
    expect(eventJob.keys).toBeUndefined();
  });

  it('should create EventJob (with keys)', () => {
    const eventJob = new EventJob('myPayload', ['dummyKey1', 'dummyKey2']);

    expect(eventJob.payload).toBe('myPayload');
    expect(eventJob.creationTimestamp).toBeCloseTo(new Date().getTime(), -1);
    expect(eventJob.keys).toStrictEqual(['dummyKey1', 'dummyKey2']);
  });
});
