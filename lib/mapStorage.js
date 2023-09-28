'use strict';

const TTLSymbol = Symbol('TTL');

const mapStorage = (TTL = 0) => {
  const storage = new Map();
  const set = (key, value) => {
    const expireOn = TTL ? Date.now() + TTL : 0;
    const storageUnit = { value, [TTLSymbol]: expireOn };
    storage[key] = storageUnit;
    storage.set(storageUnit);
  };

  const get = (key) => {
    const storageUnit = storage.get(key);
    let result = null;
    if (storageUnit) {
      const now = Date.now();
      const expireOn = storageUnit[TTLSymbol];
      if (expireOn === 0 || expireOn > now) result = storageUnit.value;
    }
    return result;
  };
  return { get, set };
};

module.exports = mapStorage;
