'use strict';

const TTLSymbol = Symbol.for('TTL');

const plainObjectStorage = (pool, TTL = 0) => {
  const storage = {};
  const set = (key, value) => {
    const expireOn = TTL ? Date.now() + TTL : 0;
    const storageUnit = pool.get();
    storageUnit.value = value;
    storageUnit[TTLSymbol] = expireOn;
    storage[key] = storageUnit;
  };

  const get = (key) => {
    const storageUnit = storage[key];
    let result = null;
    if (storageUnit) {
      const now = Date.now();
      const expireOn = storageUnit[TTLSymbol];
      if (expireOn === 0 || expireOn > now) result = storageUnit.value;
      else delete storage[key];
      storageUnit.value = null;
      storageUnit[TTLSymbol] = 0;
      pool.put(storageUnit);
    }
    return result;
  };

  const remove = (key) => {
    delete storage[key];
  };

  return { get, set, remove };
};

module.exports = plainObjectStorage;
