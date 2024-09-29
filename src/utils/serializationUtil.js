export function serialize(obj) {
  return JSON.stringify(obj, (key, value) => {
    if (typeof value === 'function') {
      return value.toString();
    }
    return value;
  });
}

export function deserialize(str) {
  return JSON.parse(str, (key, value) => {
    if (typeof value === 'string' && value.startsWith('function')) {
      return new Function('return ' + value)();
    }
    return value;
  });
}
