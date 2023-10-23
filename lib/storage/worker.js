'use strict'

const hashStorage = require('./hashStorage.js')
const { parentPort, workerData } = require('worker_threads')
const storage = hashStorage(workerData)

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
