'use strict'

const hashStorage = require('./hashStorage.js')
const { parentPort, workerData } = require('worker_threads')

// Functions can't be cloned across threads, so instead of calling the user's
// callback here we forward each eviction to the main thread as a message.
const onEvict = workerData.hasOnEvict
  ? (hash, key, reason) => parentPort.postMessage({ type: 'evict', hash, key, reason })
  : undefined

const storage = hashStorage({ ...workerData, onEvict })

const commands = {
  ...storage,
  info () {
    return { hello: 'world' }
  }
}

parentPort.on('message', ({ taskId, action, payload }) => {
  const handler = commands[action]
  const result = handler(payload)
  const message = { taskId, result }
  parentPort.postMessage(message)
})
