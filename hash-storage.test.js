'use strict'

const test = require('node:test')
const assert = require('node:assert')
const { setTimeout: wait } = require('node:timers/promises')

const ClusteredStorage = require('.')

test('simple init/shutdown test', async () => {
  assert.doesNotThrow(() => {
    const storage = ClusteredStorage({
      type: 'object',
      TTL: 1000,
      norm: 0,
      concurrency: 4
    })
    storage.shutdown()
  })
})

test('storage not wanishing data too early due to TTL', async () => {
  const storage = ClusteredStorage({
    type: 'object',
    TTL: 1000,
    norm: 0,
    concurrency: 4
  })

  const data = { locker: true, user: '__admin__' }

  await storage.hset('CRM#1', '1001', data)
  const res1 = await storage.hget('CRM#1', '1001')

  assert.deepEqual(res1, data)

  await wait(500)
  const res2 = await storage.hget('CRM#1', '1001')
  storage.shutdown()

  assert.deepEqual(res2, data)
})

test('not crashing on many insert & many retrieve operations', async () => {
  const storage = ClusteredStorage({
    type: 'object',
    TTL: 1000,
    norm: 1,
    concurrency: 1
  })

  await assert.doesNotReject(async () => {
    const promises1 = []
    for (let i = 0; i < 10000; i++) {
      const info = { locked: true, user: '__system__' }
      promises1.push(storage.hset('CRM#1', i, info))
    }
    await Promise.all(promises1)

    const promises2 = []
    for (let i = 0; i < 10000; i++) {
      promises2.push(storage.hget('CRM#1', i))
    }
    await Promise.all(promises2)
  })

  storage.shutdown()
})

test('should return null after deletion', async () => {
  const storage = ClusteredStorage({
    type: 'object',
    TTL: 0,
    norm: 0,
    concurrency: 1
  })

  const data = { locker: true, user: '__admin__' }

  await storage.hset('CRM#1', '1001', data)
  const res1 = await storage.hget('CRM#1', '1001')

  assert.deepEqual(res1, data)

  await storage.hdel('CRM#1', '1001')
  const res2 = await storage.hget('CRM#1', '1001')
  storage.shutdown()

  const missingValue = null

  assert.equal(res2, missingValue)
})

test('separate vs same thread perf', async () => {
  const workerStorage = ClusteredStorage({
    type: 'object',
    TTL: 1000,
    norm: 1,
    concurrency: 1
  })
  const noWorkerStorage = ClusteredStorage({
    type: 'object',
    TTL: 1000,
    norm: 1,
    concurrency: 0
  })

  const workerTime = { insert: Infinity, retrieve: Infinity }
  const sameThreadTime = { insert: Infinity, retrieve: Infinity }

  {
    workerTime.insert = -process.hrtime.bigint()

    const promises1 = []
    for (let i = 0; i < 10000; i++) {
      const info = { locked: true, user: '__system__' }
      promises1.push(workerStorage.hset('CRM#1', i, info))
    }
    await Promise.all(promises1)

    workerTime.insert += process.hrtime.bigint()

    workerTime.retrieve = -process.hrtime.bigint()

    const promises2 = []
    for (let i = 0; i < 10000; i++) {
      promises2.push(workerStorage.hget('CRM#1', i))
    }
    await Promise.all(promises2)

    workerTime.retrieve += process.hrtime.bigint()
  }
  {
    sameThreadTime.insert = -process.hrtime.bigint()

    const promises1 = []
    for (let i = 0; i < 10000; i++) {
      const info = { locked: true, user: '__system__' }
      promises1.push(noWorkerStorage.hset('CRM#1', i, info))
    }
    await Promise.all(promises1)

    sameThreadTime.insert += process.hrtime.bigint()

    sameThreadTime.retrieve = -process.hrtime.bigint()

    const promises2 = []
    for (let i = 0; i < 10000; i++) {
      promises2.push(noWorkerStorage.hget('CRM#1', i))
    }
    await Promise.all(promises2)

    sameThreadTime.retrieve += process.hrtime.bigint()
  }
  workerStorage.shutdown()
  noWorkerStorage.shutdown()

  assert.ok(
    workerTime.insert > sameThreadTime.insert,
    'Somehow separate thread inserts faster'
  )
  assert.ok(
    workerTime.retrieve > sameThreadTime.retrieve,
    'Somehow separate thread retrieves faster'
  )
})

test('retrieving all data correctess', async () => {
  const storage = ClusteredStorage({
    type: 'object',
    TTL: 0,
    norm: 0,
    concurrency: 1
  })

  const data = { locker: true, user: '__admin__' }
  await storage.hset('CRM#1', '1001', data)
  await storage.hset('CRM#1', '1002', data)

  const allData = await storage.hgetall('CRM#1')
  storage.shutdown()

  const expected = { 1001: data, 1002: data }
  assert.deepEqual(allData, expected)
})
