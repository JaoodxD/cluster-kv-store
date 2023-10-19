'use strict'

const dispatcher = require('./lib/storage/dispatcher.js')

const DEFAULT = {
  TYPE: 'object',
  TTL: 0,
  NORM: 0,
  MAX: Infinity,
  FACTOR: 0
}

function hashStorage (opts = {}) {
  const type = opts.type || DEFAULT.TYPE
  const TTL = opts.TTL || DEFAULT.TTL
  const norm = opts.norm || DEFAULT.NORM
  const max = opts.max || DEFAULT.MAX
  const factor = opts.factor || DEFAULT.FACTOR
  const config = { type, TTL, norm, max, factor }

  return dispatcher(config)
}

module.exports = hashStorage
module.exports.default = hashStorage
module.exports.hashStorage = hashStorage
