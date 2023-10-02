'use strict';

const KvStorage = require('./kvStorage.js');

module.exports = function CrmStorage() {
  const crmStorages = new Map();
  return { get, set, remove };
  function set({ crm, key, value }) {
    let storage = crmStorages.get(crm);
    if (!storage) {
      storage = KvStorage();
      crmStorages.set(crm, storage);
    }
    // console.log({ crm, key, crmStorages });
    return void storage.set(key, value);
  }
  function get({ crm, key }) {
    const storage = crmStorages.get(crm);
    if (!storage) return null;
    return storage.get(key);
  }
  function remove({ crm, key }) {
    const storage = crmStorages.get(crm);
    if (!storage) return null;
    return storage.remove(key);
  }
}
