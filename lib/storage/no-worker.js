'use strict'

const hashStorage = require('./hashStorage.js')
const intervalVacuum = require('./services/vacuum.js')

module.exports = function noWorker (opts = {}) {
  const storage = hashStorage(opts)
  const vacuum = intervalVacuum(opts.vacuum, storage)

  const commands = {
    ...storage,
    info () {
      return { hello: 'world' }
    }
  }
  console.log({ opts })
  vacuum.start()

  return { task, shutdown }

  function task ({ taskId, action, payload }) {
    const handler = commands[action]
    const result = handler(payload)
    return result
  }

  function shutdown () {
    vacuum.stop()
  }
}
