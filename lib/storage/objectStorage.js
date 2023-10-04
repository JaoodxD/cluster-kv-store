'use strict'

const TTLSymbol = Symbol.for('TTL')

module.exports = function plainObjectStorage (pool, TTL = 0) {
  const storage = {}

  return { get, set, remove }

  function set (key, value) {
    const expireOn = TTL ? Date.now() + TTL : 0
    const storageUnit = pool.get()
    storageUnit.value = value
    storageUnit[TTLSymbol] = expireOn
    storage[key] = storageUnit
  }
  function get (key) {
    const storageUnit = storage[key]
    let result = null
    if (storageUnit) {
      const now = Date.now()
      const expireOn = storageUnit[TTLSymbol]
      if (expireOn === 0 || expireOn > now) {
        result = storageUnit.value
      } else {
        delete storage[key]
        storageUnit.value = null
        storageUnit[TTLSymbol] = 0
        pool.put(storageUnit)
      }
    }
    return result
  }

  function remove (key) {
    delete storage[key]
  }
}
