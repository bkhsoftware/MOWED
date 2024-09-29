import { serialize, deserialize } from '@/utils/serializationUtil';

describe('serializationUtil', () => {
  test('serialize and deserialize basic object', () => {
    const obj = { a: 1, b: 'test', c: true };
    const serialized = serialize(obj);
    const deserialized = deserialize(serialized);
    expect(deserialized).toEqual(obj);
  });

  test('serialize and deserialize object with nested structure', () => {
    const obj = { a: 1, b: { c: 'test', d: [1, 2, 3] } };
    const serialized = serialize(obj);
    const deserialized = deserialize(serialized);
    expect(deserialized).toEqual(obj);
  });

  test('serialize and deserialize object with function', () => {
    const obj = {
      a: 1,
      b: function() { return 'test'; }
    };
    const serialized = serialize(obj);
    const deserialized = deserialize(serialized);
    expect(deserialized.a).toBe(1);
    expect(typeof deserialized.b).toBe('function');
    expect(deserialized.b()).toBe('test');
  });

  test('serialize and deserialize object with Date', () => {
    const date = new Date();
    const obj = { a: 1, b: date };
    const serialized = serialize(obj);
    const deserialized = deserialize(serialized);
    expect(deserialized.a).toBe(1);
    expect(deserialized.b).toEqual(date);
  });

  test('handle circular references', () => {
    const obj = { a: 1 };
    obj.self = obj;
    expect(() => serialize(obj)).toThrow();
  });
});
