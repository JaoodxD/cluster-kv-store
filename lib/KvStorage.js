'use strict';

const storages = {
  object: require('./objectStorage.js'),
  map: require('./mapStorage.js')
};

const createStorage = (type, TTL = 0) => {
  const storageFactory = storages[type];
  if (!storageFactory) throw new Error(`Unsupported storage type: ${type}`);

  return storageFactory(TTL);
};

module.exports = createStorage;
