'use strict'

const duplicate = require('../utils/duplicate.js')

const worker = require('./cluster.js')
const noWorker = require('./no-worker.js')

module.exports = function dispatcher (opts = {}) {
  const type = opts.type || 'object'
  const TTL = opts.TTL || 0
  const norm = opts.norm || 0
  const max = opts.max || Infinity
  const concurrency = opts.concurrency || 0
  const vacuum = opts.vacuum || {}
  const workerData = { type, TTL, norm, max, vacuum }

  const concurrencyy = concurrency ? worker : noWorker
  const setupedWorker = () => concurrencyy(workerData)
  const workers = duplicate(setupedWorker, concurrency || 1)
  let nextWorkerId = 0
  const hashWorkers = new Map()

  return { hset, hget, hgetall, hdel, shutdown }

  function getHashWorker (hash) {
    let storage = hashWorkers.get(hash)
    if (!storage) {
      storage = workers[nextWorkerId]
      nextWorkerId++
      if (nextWorkerId >= workers.length) nextWorkerId = 0
      hashWorkers.set(hash, storage)
    }
    return storage
  }
  async function hset (hash, key, value) {
    const worker = getHashWorker(hash)
    const payload = { hash, key, value }
    const command = { action: 'set', payload }
    await worker.task(command)
  }

  async function hget (hash, key) {
    const worker = getHashWorker(hash)
    const payload = { hash, key }
    const command = { action: 'get', payload }
    const result = await worker.task(command)
    return result
  }

  async function hdel (hash, key) {
    const worker = getHashWorker(hash)
    const payload = { hash, key }
    const command = { action: 'remove', payload }
    await worker.task(command)
  }

  async function hgetall (hash) {
    const worker = getHashWorker(hash)
    const payload = { hash }
    const command = { action: 'getAll', payload }
    const result = await worker.task(command)
    return result
  }

  function shutdown () {
    for (const worker of workers) {
      worker.shutdown()
    }
  }
}
