'use strict'

const hashStorage = require('./hashStorage.js')

module.exports = function noWorker (opts = {}) {
  const storage = hashStorage(opts)

  const commands = {
    ...storage,
    info () {
      return { hello: 'world' }
    }
  }

  return { task, shutdown }

  function task ({ taskId, action, payload }) {
    const handler = commands[action]
    const result = handler(payload)
    return result
  }

  function shutdown () { }
}
