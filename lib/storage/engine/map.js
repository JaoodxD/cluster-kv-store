'use strict'

const TTLSymbol = Symbol.for('TTL')

module.exports = function mapStorage (pool, TTL = 0) {
  const storage = new Map()

  return { get, getAll, set, remove }

  function set (key, value) {
    const expireOn = TTL ? Date.now() + TTL : 0
    const storageUnit = pool.get()
    storageUnit.value = value
    storageUnit[TTLSymbol] = expireOn
    storage.set(key, storageUnit)
  }

  function get (key) {
    const storageUnit = storage.get(key)
    let result = null
    if (storageUnit) {
      const now = Date.now()
      const expireOn = storageUnit[TTLSymbol]
      if (expireOn === 0 || expireOn > now) {
        result = storageUnit.value
      } else {
        storage.delete(key)
        storageUnit.value = null
        storageUnit[TTLSymbol] = 0
        pool.put(storageUnit)
      }
    }
    return result
  }

  function getAll () {
    const result = {}
    for (const key of storage.keys()) {
      result[key] = get(key)
    }
    return result
  }

  function remove (key) {
    const storageUnit = storage.get(key)
    if (!storageUnit) return
    storage.delete(key)
    storageUnit.value = null
    storageUnit[TTLSymbol] = 0
    pool.put(storageUnit)
  }
}
