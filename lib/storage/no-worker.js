'use strict'

const hashStorage = require('./hashStorage.js')

module.exports = function noWorker (opts = {}, onEvict) {
  // On the main thread the user callback is invoked directly at each
  // eviction site, so it is threaded straight into the storage engine.
  const storage = hashStorage({ ...opts, onEvict })

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

  function shutdown () {
    storage.close()
    console.log('shutdown worker', 0)
  }
}
