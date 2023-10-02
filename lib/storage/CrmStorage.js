'use strict';

const KvStorage = require('./KvStorage.js');

const CrmStorage = (storageConfig) => {
  const crmStorages = new Map();

  const createCrmStorage = (crm) => {
    const storage = KvStorage(storageConfig);
    crmStorages.set(crm, storage);
    return storage;
  };

  const getCrmStorage = (crm) => {
    let storage = crmStorages.get(crm);
    if (!storage) storage = createCrmStorage(crm);
    return storage;
  }

  const task = ({ crm, command, args }) => {
    const crmStorage = getCrmStorage(crm);
    const handler = crmStorage[command];
    let result = null;
    if (handler) result = handler(...args);
    return result;
  };

  return { task };
};

module.exports = CrmStorage;
