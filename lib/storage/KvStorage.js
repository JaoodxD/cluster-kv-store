'use strict';

const storages = {
  object: require('./objectStorage.js'),
  map: require('./mapStorage.js')
};

const poolify = require('./poolify.js');

const createStorage = (
  {
    type = 'object',
    TTL = 0,
    norm = 1,
    max = Infinity
  } = {}) => {
  const storageFactory = storages[type];
  if (!storageFactory) throw new Error(`Unsupported storage type: ${type}`);

  const TTLSymbol = Symbol.for('TTL');
  const storageUnitFactory = () => ({ value: null, [TTLSymbol]: 0 });
  const pool = poolify(storageUnitFactory, norm, max);
  return storageFactory(pool, TTL);
};

module.exports = createStorage;
