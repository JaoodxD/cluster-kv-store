'use strict'

const KvStorage = require('./kvStorage.js')

module.exports = function HashStorage(opts = {}) {
  const hashStorages = new Map()

  return { get, set, remove }

  function set({ hash, key, value }) {
    let storage = hashStorages.get(hash)
    if (!storage) {
      storage = KvStorage(opts)
      hashStorages.set(hash, storage)
    }
    storage.set(key, value)
  }

  function get({ hash, key }) {
    const storage = hashStorages.get(hash)
    if (!storage) return null
    return storage.get(key)
  }

  function remove({ hash, key }) {
    const storage = hashStorages.get(hash)
    if (!storage) return null
    return storage.remove(key)
  }
}
