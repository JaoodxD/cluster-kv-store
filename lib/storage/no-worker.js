'use strict'

const HashStorage = require('./hashStorage.js')

module.exports = function NoWorker (opts = {}) {
  const storage = HashStorage(opts)

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
