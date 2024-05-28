'use strict'

const { Worker } = require('worker_threads')
const defer = require('../utils/defer')
const { join } = require('path')
const workerPath = join(__dirname, './worker.js')

module.exports = function cluster (workerData) {
  const worker = new Worker(workerPath, { workerData })
  const tasks = new Map()
  let nextTaskId = 1
  worker.on('message', process)

  return { task, shutdown }

  function task ({ action, payload }) {
    const taskId = nextTaskId++
    const { promise, resolve } = defer()
    tasks.set(taskId, resolve)
    const message = { taskId, action, payload }
    worker.postMessage(message)
    return promise
  }

  function process ({ taskId, result }) {
    const handler = tasks.get(taskId)
    if (!handler) return
    tasks.delete(taskId)
    handler(result)
  }

  function shutdown () {
    console.log('shutdown worker', worker.threadId)
    worker.terminate()
  }
}
