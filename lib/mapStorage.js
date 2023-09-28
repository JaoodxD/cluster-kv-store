'use strict';

const TTLSymbol = Symbol.for('TTL');

const mapStorage = (pool, TTL = 0) => {
  const storage = new Map();
  const set = (key, value) => {
    const expireOn = TTL ? Date.now() + TTL : 0;
    const storageUnit = pool.get();
    storageUnit.value = value;
    storageUnit[TTLSymbol] = expireOn;
    storage.set(key, storageUnit);
  };

  const get = (key) => {
    const storageUnit = storage.get(key);
    let result = null;
    if (storageUnit) {
      const now = Date.now();
      const expireOn = storageUnit[TTLSymbol];
      if (expireOn === 0 || expireOn > now) result = storageUnit.value;
      else storage.delete(key);
      storageUnit.value = null;
      storageUnit[TTLSymbol] = 0;
      pool.put(storageUnit);
    }
    return result;
  };
  return { get, set };
};

module.exports = mapStorage;
