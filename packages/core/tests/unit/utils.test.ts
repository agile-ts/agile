import {
  clone,
  copy,
  defineConfig,
  equal,
  flatMerge,
  generateId,
  includesArray,
  isAsyncFunction,
  isFunction,
  isJsonString,
  isValidObject,
  isValidUrl,
  normalizeArray,
  notEqual,
  globalBind,
  getAgileInstance,
  Agile,
  State,
  Event,
  Observer,
  Collection,
} from '../../src';

describe('Utils Tests', () => {
  let dummyAgile: Agile;

  beforeEach(() => {
    dummyAgile = new Agile({ localStorage: false });

    // @ts-ignore | Reset globalThis
    globalThis = {};

    console.error = jest.fn();
  });

  describe('copy function tests', () => {
    it('should copy Array without any reference', () => {
      const myArray = [1, 2, 3, 4, 5];
      const myCopiedArray = copy(myArray);

      expect(myCopiedArray).toStrictEqual([1, 2, 3, 4, 5]);
      expect(myArray).toStrictEqual([1, 2, 3, 4, 5]);

      myCopiedArray.push(6);

      expect(myCopiedArray).toStrictEqual([1, 2, 3, 4, 5, 6]);
      expect(myArray).toStrictEqual([1, 2, 3, 4, 5]);
    });

    it('should copy Object without any reference', () => {
      const myObject = { id: 1, name: 'jeff' };
      const myCopiedObject = copy(myObject);

      expect(myCopiedObject).toStrictEqual({ id: 1, name: 'jeff' });
      expect(myObject).toStrictEqual({ id: 1, name: 'jeff' });

      myObject.name = 'hans';

      expect(myObject).toStrictEqual({ id: 1, name: 'hans' });
      expect(myCopiedObject).toStrictEqual({ id: 1, name: 'jeff' });
    });

    it('should copy deep Object without any reference', () => {
      const myObject = {
        id: 1,
        name: 'jeff',
        location: { country: 'Germany', state: 'Bayern' },
      };
      const myCopiedObject = copy(myObject);

      expect(myCopiedObject).toStrictEqual({
        id: 1,
        name: 'jeff',
        location: { country: 'Germany', state: 'Bayern' },
      });
      expect(myObject).toStrictEqual({
        id: 1,
        name: 'jeff',
        location: { country: 'Germany', state: 'Bayern' },
      });

      myObject.name = 'hans';
      myObject.location.state = 'Sachsen';

      expect(myObject).toStrictEqual({
        id: 1,
        name: 'hans',
        location: { country: 'Germany', state: 'Sachsen' },
      });
      expect(myCopiedObject).toStrictEqual({
        id: 1,
        name: 'jeff',
        location: { country: 'Germany', state: 'Bayern' },
      });
    });

    it('should copy default Types', () => {
      const myNumber = 5;
      const myCopiedNumber = copy(myNumber);
      const myString = 'frank';
      const myCopiedString = copy(myString);

      expect(myCopiedNumber).toBe(5);
      expect(myNumber).toBe(5);
      expect(myCopiedString).toBe('frank');
      expect(myString).toBe('frank');
    });
  });

  describe('isValidObject function tests', () => {
    // Can't be Tested in not Web-Environment
    // it("should return false if passing HTML Element", () => {
    //   expect(isValidObject(HTMLElement)).toBe(false);
    // });

    it('should return false if passed instance is  invalid Object', () => {
      expect(isValidObject(null)).toBe(false);
      expect(isValidObject('Hello')).toBe(false);
      expect(isValidObject([1, 2])).toBe(false);
      expect(isValidObject(123)).toBe(false);
    });

    it('should return true if passed instance is valid Object', () => {
      expect(isValidObject({ hello: 'jeff' })).toBe(true);
      expect(isValidObject({ hello: 'jeff', deep: { hello: 'franz' } })).toBe(
        true
      );
    });
  });

  describe('includesArray function tests', () => {
    it("should return false if Array1 doesn't include Array2", () => {
      expect(includesArray([1, 2], [5, 6])).toBe(false);
    });

    it('should return false if Array1 does only include parts of Array2', () => {
      expect(includesArray([1, 2], [2, 6])).toBe(false);
    });

    it('should return true if Array1 includes Array2', () => {
      expect(includesArray([1, 4, 2, 3], [1, 2])).toBe(true);
    });

    it('should return true if Array1 is equal to Array2', () => {
      expect(includesArray([1, 2], [1, 2])).toBe(true);
    });
  });

  describe('normalizeArray function tests', () => {
    it('should normalize Array (default config)', () => {
      expect(normalizeArray([1, 2, undefined, 3, 'hi'])).toStrictEqual([
        1,
        2,
        undefined,
        3,
        'hi',
      ]);
    });

    it('should normalize single Item (default config)', () => {
      expect(normalizeArray(1)).toStrictEqual([1]);
    });

    it("shouldn't normalize undefined (default config)", () => {
      expect(normalizeArray(undefined)).toStrictEqual([]);
    });

    it('should normalize undefined (config.createUndefinedArray = true)', () => {
      expect(
        normalizeArray(undefined, { createUndefinedArray: true })
      ).toStrictEqual([undefined]);
    });
  });

  describe('getAgileInstance function tests', () => {
    beforeEach(() => {
      globalThis['__agile__'] = dummyAgile;
    });

    it('should get agileInstance from State', () => {
      const dummyState = new State(dummyAgile, 'dummyValue');

      expect(getAgileInstance(dummyState)).toBe(dummyAgile);
    });

    it('should get agileInstance from Event', () => {
      const dummyEvent = new Event(dummyAgile);

      expect(getAgileInstance(dummyEvent)).toBe(dummyAgile);
    });

    it('should get agileInstance from Collection', () => {
      const dummyCollection = new Collection(dummyAgile);

      expect(getAgileInstance(dummyCollection)).toBe(dummyAgile);
    });

    it('should get agileInstance from Observer', () => {
      const dummyObserver = new Observer(dummyAgile);

      expect(getAgileInstance(dummyObserver)).toBe(dummyAgile);
    });

    it('should get agileInstance from globalThis if passed instance holds no agileInstance', () => {
      expect(getAgileInstance('weiredInstance')).toBe(dummyAgile);
    });

    it('should print error if something went wrong', () => {
      // @ts-ignore | Destroy globalThis
      globalThis = undefined;

      const response = getAgileInstance('weiredInstance');

      expect(response).toBeUndefined();
      expect(console.error).toHaveBeenCalledWith(
        'Agile Error: Failed to get Agile Instance from ',
        'weiredInstance'
      );
    });
  });

  describe('isFunction function tests', () => {
    it('should return true if passed instance is valid Function', () => {
      expect(
        isFunction(() => {
          /* empty function */
        })
      ).toBe(true);
    });

    it('should return false if passed instance is invalid Function', () => {
      expect(isFunction('hello')).toBe(false);
      expect(isFunction(1)).toBe(false);
      expect(isFunction([1, 2, 3])).toBe(false);
      expect(isFunction({ hello: 'jeff' })).toBe(false);
    });
  });

  describe('isAsyncFunction function tests', () => {
    it('should return true if passed instance is valid async Function', () => {
      expect(
        isAsyncFunction(async () => {
          /* empty function */
        })
      ).toBe(true);
      expect(
        isAsyncFunction(async function () {
          /* empty function */
        })
      ).toBe(true);
    });

    it('should return false if passed instance is invalid async Function', () => {
      expect(isAsyncFunction('hello')).toBe(false);
      expect(isAsyncFunction(1)).toBe(false);
      expect(isAsyncFunction([1, 2, 3])).toBe(false);
      expect(isAsyncFunction({ hello: 'jeff' })).toBe(false);
      expect(
        isAsyncFunction(() => {
          /* empty function */
        })
      ).toBe(false);
      expect(
        isAsyncFunction(function () {
          /* empty function */
        })
      ).toBe(false);
    });
  });

  // Note: isValidUrl Function doesn't work to 100% yet!!
  describe('isValidUrl function tests', () => {
    it('should return true if passed instance is valid url', () => {
      expect(isValidUrl('https://www.google.com/')).toBe(true);
      expect(isValidUrl('www.google.com')).toBe(true);
      expect(isValidUrl('google.com')).toBe(true);
      // expect(isValidUrl("https://en.wikipedia.org/wiki/Procter_&_Gamble")).toBe(
      // true
      // );
    });

    it('should return false if passed instance is invalid url', () => {
      expect(isValidUrl('hello')).toBe(false);
      expect(isValidUrl('https://sdfasd')).toBe(false);
      expect(isValidUrl('https://')).toBe(false);
      expect(isValidUrl('')).toBe(false);
      // expect(isValidUrl("www.google")).toBe(false);
    });
  });

  describe('isJsonString function tests', () => {
    it('should return true if passed instance is valid Json String', () => {
      expect(isJsonString('{"name":"John", "age":31, "city":"New York"}')).toBe(
        true
      );
    });

    it('should return false if passed instance is invalid Json String', () => {
      expect(isJsonString('frank')).toBe(false);
      expect(isJsonString('{name":"John", "age":31, "city":"New York"}')).toBe(
        false
      );
      expect(isJsonString(10)).toBe(false);
      expect(isJsonString({ name: 'John', age: 31 })).toBe(false);
    });
  });

  describe('defineConfig function tests', () => {
    it('should merge defaults into config and overwrite undefined properties (default config)', () => {
      const config = {
        allowLogging: true,
        loops: 10,
        isHuman: undefined,
      };
      expect(
        defineConfig(config, {
          allowLogging: false,
          loops: 15,
          isHuman: true,
          isRobot: false,
          name: 'jeff',
        })
      ).toStrictEqual({
        allowLogging: true,
        loops: 10,
        isHuman: true,
        isRobot: false,
        name: 'jeff',
      });
    });

    it("should merge defaults into config and shouldn't overwrite undefined properties (overwriteUndefinedProperties = false)", () => {
      const config = {
        allowLogging: true,
        loops: 10,
        isHuman: undefined,
      };
      expect(
        defineConfig(
          config,
          {
            allowLogging: false,
            loops: 15,
            isHuman: true,
            isRobot: false,
            name: 'jeff',
          },
          false
        )
      ).toStrictEqual({
        allowLogging: true,
        loops: 10,
        isHuman: undefined,
        isRobot: false,
        name: 'jeff',
      });
    });
  });

  describe('flatMerge function tests', () => {
    it('should merge Changes Object into Source Object', () => {
      const source = {
        id: 123,
        name: 'jeff',
        size: 189,
      };
      expect(
        flatMerge(source, {
          name: 'hans',
          size: 177,
        })
      ).toStrictEqual({
        id: 123,
        name: 'hans',
        size: 177,
      });
    });

    it("shouldn't add new properties to Source Object", () => {
      const source = {
        id: 123,
        name: 'jeff',
        size: 189,
      };
      expect(
        flatMerge(source, {
          name: 'hans',
          size: 177,
          location: 'behind you',
        })
      ).toStrictEqual({
        id: 123,
        name: 'hans',
        size: 177,
      });
    });

    it('should add new properties to source Object (config.addNewProperties = true)', () => {
      const source = {
        id: 123,
        name: 'jeff',
        size: 189,
      };
      expect(
        flatMerge(
          source,
          {
            name: 'hans',
            size: 177,
            location: 'behind you',
          },
          { addNewProperties: true }
        )
      ).toStrictEqual({
        id: 123,
        name: 'hans',
        size: 177,
        location: 'behind you',
      });
    });

    it("shouldn't deep merge Changes Object into Source Object", () => {
      const source = {
        id: 123,
        name: 'jeff',
        address: {
          place: 'JeffsHome',
          country: 'Germany',
        },
      };

      expect(
        flatMerge(source, {
          place: 'JeffsNewHome',
        })
      ).toStrictEqual({
        id: 123,
        name: 'jeff',
        address: {
          place: 'JeffsHome',
          country: 'Germany',
        },
      });
    });
  });

  describe('equal function tests', () => {
    it('should return true if value1 and value2 are equal', () => {
      expect(equal({ id: 123, name: 'jeff' }, { id: 123, name: 'jeff' })).toBe(
        true
      );
      expect(equal([1, 2, 3], [1, 2, 3])).toBe(true);
      expect(equal(12, 12)).toBe(true);
      expect(equal('hi', 'hi')).toBe(true);
    });

    it("should return false if value1 and value2 aren't equal", () => {
      expect(equal({ id: 123, name: 'jeff' }, { id: 123, name: 'hans' })).toBe(
        false
      );
      expect(equal([1, 2], [3, 5])).toBe(false);
      expect(equal(12, 13)).toBe(false);
      expect(equal('hi', 'bye')).toBe(false);
    });
  });

  describe('notEqual function tests', () => {
    it('should return false if value1 and value2 are equal', () => {
      expect(
        notEqual({ id: 123, name: 'jeff' }, { id: 123, name: 'jeff' })
      ).toBe(false);
      expect(notEqual([1, 2, 3], [1, 2, 3])).toBe(false);
      expect(notEqual(12, 12)).toBe(false);
      expect(equal('hi', 'bye')).toBe(false);
    });

    it("should return true if value1 and value2 aren't equal", () => {
      expect(
        notEqual({ id: 123, name: 'jeff' }, { id: 123, name: 'hans' })
      ).toBe(true);
      expect(notEqual([1, 2], [3, 5])).toBe(true);
      expect(notEqual(12, 13)).toBe(true);
      expect(notEqual('hi', 'bye')).toBe(true);
    });
  });

  describe('generateId function tests', () => {
    it('should returned generated Id that matches regex', () => {
      expect(generateId()).toMatch(/^[a-zA-Z0-9]*$/);
    });

    it('should returned generated Id with correct length (length = x)', () => {
      expect(generateId(10)).toMatch(/^[a-zA-Z0-9]*$/);
      expect(generateId(10).length).toEqual(10);
      expect(generateId(5).length).toEqual(5);
      expect(generateId(-10).length).toEqual(0);
    });
  });

  describe('clone function tests', () => {
    it('should clone Object/Class without any reference', () => {
      class DummyClass {
        constructor(
          public id: number,
          public name: string,
          public location: { country: string; state: string }
        ) {}
      }
      const dummyClass = new DummyClass(10, 'jeff', {
        country: 'USA',
        state: 'California',
      });
      const clonedDummyClass = clone(dummyClass);

      expect(dummyClass).toBeInstanceOf(DummyClass);
      expect(clonedDummyClass).toBeInstanceOf(DummyClass);
      expect(dummyClass.name).toBe('jeff');
      expect(dummyClass.id).toBe(10);
      expect(dummyClass.location).toStrictEqual({
        country: 'USA',
        state: 'California',
      });
      expect(clonedDummyClass.name).toBe('jeff');
      expect(clonedDummyClass.id).toBe(10);
      expect(clonedDummyClass.location).toStrictEqual({
        country: 'USA',
        state: 'California',
      });

      dummyClass.name = 'frank';
      dummyClass.location.state = 'Florida';

      expect(dummyClass.name).toBe('frank');
      expect(dummyClass.id).toBe(10);
      expect(dummyClass.location).toStrictEqual({
        country: 'USA',
        state: 'Florida',
      });
      expect(clonedDummyClass.name).toBe('jeff');
      expect(clonedDummyClass.id).toBe(10);
      expect(clonedDummyClass.location).toStrictEqual({
        country: 'USA',
        state: 'California',
      });
    });
  });

  describe('globalBind function tests', () => {
    const dummyKey = 'myDummyKey';

    beforeEach(() => {
      globalThis[dummyKey] = undefined;
    });

    it('should bind instance at key globally (default config)', () => {
      globalBind(dummyKey, 'dummyInstance');

      expect(globalThis[dummyKey]).toBe('dummyInstance');
    });

    it("shouldn't overwrite already existing instance at key (default config)", () => {
      globalBind(dummyKey, 'I am first!');

      globalBind(dummyKey, 'dummyInstance');

      expect(globalThis[dummyKey]).toBe('I am first!');
    });

    it('should overwrite already existing instance at key (overwrite = true)', () => {
      globalBind(dummyKey, 'I am first!');

      globalBind(dummyKey, 'dummyInstance', true);

      expect(globalThis[dummyKey]).toBe('dummyInstance');
    });

    it('should print error if something went wrong during the bind process', () => {
      // @ts-ignore | Destroy globalThis
      globalThis = undefined;

      globalBind(dummyKey, 'dummyInstance');

      expect(console.error).toHaveBeenCalledWith(
        `Agile Error: Failed to create global Instance called '${dummyKey}'`
      );
    });
  });
});
