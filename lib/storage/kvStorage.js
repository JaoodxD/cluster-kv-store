'use strict'

const storages = {
  object: require('./engine/object.js'),
  map: require('./engine/map.js')
}

const poolify = require('../utils/poolify.js')
const TTLSymbol = Symbol.for('TTL')
const storageUnitFactory = () => ({ value: null, [TTLSymbol]: 0 })

module.exports = function kvStorage (opts = {}) {
  const { type, TTL, norm, max } = opts
  const pool = poolify(storageUnitFactory, norm, max)
  const storage = storages[type](pool, TTL)

  return storage
}
