'use strict';

const storageUnit = require('../workerWrapper/distributedStorageUnit.js');


const dispatcher = (storageFactoryPath, storageConfig) => {
  const storages = [];
  const tasks = new Map();
  const CrmStorage = new Map();

  let roundRobinStorageId = 0;
  const nextStorageId = () => {
    const storageId = roundRobinStorageId++;
    if (roundRobinStorageId >= storages.length) roundRobinStorageId = 0;
    return storageId;
  };

  const addStorage = (crm) => {
    const storage = storageUnit({ ...storageConfig, storageFactoryPath });
    storages.push(storage);
  };

  const assignCrmStorage = (crm) => {
    const storage = storages[nextStorageId()];
    CrmStorage.set(crm, storage);
    return storage;
  }

  const task = (crm, command, args) => {
    let storage = CrmStorage.get(crm);
    if (!storage) storage = assignCrmStorage(crm);
    const promise = storage.task(command, args);
    return promise;
  };
};
