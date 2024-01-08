'use strict'

const test = require('node:test')
const assert = require('node:assert')

const ClusteredStorage = require('.')

const { setTimeout: wait } = require('node:timers/promises')

test('#0', async t => {
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

test('#1', async t => {
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

  await wait(983)
  const res2 = await storage.hget('CRM#1', '1001')

  assert.deepEqual(res2, data)

  storage.shutdown()
})

test('#2', async t => {
  const storage = ClusteredStorage({
    type: 'object',
    TTL: 1000,
    norm: 1,
    concurrency: 1
  })

  const promises1 = []
  console.time('insertion')
  for (let i = 0; i < 10000; i++) {
    const info = { locked: true, user: '__system__' }
    promises1.push(storage.hset('CRM#1', i, info))
  }
  await Promise.all(promises1)
  console.timeEnd('insertion')

  const promises2 = []
  console.time('retrieving')
  for (let i = 0; i < 10000; i++) {
    promises2.push(storage.hget('CRM#1', i))
  }
  await Promise.all(promises2)
  console.timeEnd('retrieving')

  storage.shutdown()
})

test('#3', async t => {
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

  const missingValue = null

  assert.equal(res2, missingValue)

  storage.shutdown()
})

test('#4', async t => {
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

  {
    const promises1 = []
    console.time('worker insertion')
    for (let i = 0; i < 10000; i++) {
      const info = { locked: true, user: '__system__' }
      promises1.push(workerStorage.hset('CRM#1', i, info))
    }
    await Promise.all(promises1)
    console.timeEnd('worker insertion')

    const promises2 = []
    console.time('worker retrieving')
    for (let i = 0; i < 10000; i++) {
      promises2.push(workerStorage.hget('CRM#1', i))
    }
    await Promise.all(promises2)
    console.timeEnd('worker retrieving')
  }
  {
    const promises1 = []
    console.time('no worker insertion')
    for (let i = 0; i < 10000; i++) {
      const info = { locked: true, user: '__system__' }
      promises1.push(noWorkerStorage.hset('CRM#1', i, info))
    }
    await Promise.all(promises1)
    console.timeEnd('no worker insertion')

    const promises2 = []
    console.time('no worker retrieving')
    for (let i = 0; i < 10000; i++) {
      promises2.push(noWorkerStorage.hget('CRM#1', i))
    }
    await Promise.all(promises2)
    console.timeEnd('no worker retrieving')
  }
  workerStorage.shutdown()
  noWorkerStorage.shutdown()
})

test('#5', async t => {
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

  const expected = { 1001: data, 1002: data }
  assert.deepEqual(allData, expected)
  storage.shutdown()
})