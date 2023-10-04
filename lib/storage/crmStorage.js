'use strict'

const KvStorage = require('./kvStorage.js')

module.exports = function CrmStorage (opts = {}) {
  const crmStorages = new Map()

  return { get, set, remove }

  function set ({ crm, key, value }) {
    let storage = crmStorages.get(crm)
    if (!storage) {
      storage = KvStorage(opts)
      crmStorages.set(crm, storage)
    }
    return void storage.set(key, value)
  }

  function get ({ crm, key }) {
    const storage = crmStorages.get(crm)
    if (!storage) return null
    return storage.get(key)
  }

  function remove ({ crm, key }) {
    const storage = crmStorages.get(crm)
    if (!storage) return null
    return storage.remove(key)
  }
}
