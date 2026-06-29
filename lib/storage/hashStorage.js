'use strict'

const kvStorage = require('./kvStorage.js')

module.exports = function hashStorage (opts = {}) {
  const hashStorages = new Map()
  const TTL = opts.TTL || 0
  const sweepInterval = opts.sweepInterval || 0
  const userOnEvict = typeof opts.onEvict === 'function' ? opts.onEvict : null

  let timer = null
  if (sweepInterval > 0 && TTL > 0) {
    timer = setInterval(sweep, sweepInterval)
    if (timer.unref) timer.unref()
  }

  return { get, getAll, set, remove, sweep, close }

  function makeStorage (hash) {
    const onEvict = userOnEvict
      ? (key, reason) => userOnEvict(hash, key, reason)
      : undefined
    return kvStorage({ ...opts, onEvict })
  }

  function set ({ hash, key, value }) {
    let storage = hashStorages.get(hash)
    if (!storage) {
      storage = makeStorage(hash)
      hashStorages.set(hash, storage)
    }
    storage.set(key, value)
  }

  function get ({ hash, key }) {
    const storage = hashStorages.get(hash)
    if (!storage) return null
    return storage.get(key)
  }

  function getAll ({ hash }) {
    const storage = hashStorages.get(hash)
    if (!storage) return null
    return storage.getAll()
  }

  function remove ({ hash, key }) {
    const storage = hashStorages.get(hash)
    if (!storage) return null
    return storage.remove(key)
  }

  function sweep () {
    for (const storage of hashStorages.values()) {
      storage.sweep()
    }
  }

  function close () {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
  }
}
