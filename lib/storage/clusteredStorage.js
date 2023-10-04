'use strict'

const duplicate = require('../utils/duplicate.js')

const Worker = require('./cluster.js')
const NoWorker = require('./no-worker.js')

module.exports = function ClusteredStorage (opts = {}) {
  const type = opts.type || 'object'
  const TTL = opts.TTL || 0
  const norm = opts.norm || 0
  const max = opts.max || Infinity
  const factor = opts.factor || 0
  const workerData = { type, TTL, norm, max }

  const factory = factor ? Worker : NoWorker
  const setupedWorker = () => factory(workerData)
  const workers = duplicate(setupedWorker, factor || 1)
  let nextWorkerId = 0
  const crmWorkers = new Map()

  return { hset, hget, remove, shutdown }

  function getCrmWorker (crm) {
    let storage = crmWorkers.get(crm)
    if (!storage) {
      storage = workers[nextWorkerId]
      nextWorkerId++
      if (nextWorkerId >= workers.length) nextWorkerId = 0
      crmWorkers.set(crm, storage)
    }
    return storage
  }
  async function hset (crm, key, value) {
    const worker = getCrmWorker(crm)
    const payload = { crm, key, value }
    const command = { action: 'set', payload }
    await worker.task(command)
  }

  async function hget (crm, key) {
    const worker = getCrmWorker(crm)
    const payload = { crm, key }
    const command = { action: 'get', payload }
    const result = await worker.task(command)
    return result
  }

  async function remove (crm, key) {
    const worker = getCrmWorker(crm)
    const payload = { crm, key }
    const command = { action: 'remove', payload }
    await worker.task(command)
  }

  function shutdown () {
    for (const worker of workers) {
      worker.shutdown()
    }
  }
}
