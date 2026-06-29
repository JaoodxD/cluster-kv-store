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

// ---- onEvict eviction hook ----
//
// Note on `reason: 'capacity'`: there is no capacity (LRU/FIFO) key eviction
// in the engines today — `max` only caps the storage-unit pool free-list, not
// the number of live keys. The reason is reserved in the type for forward
// compatibility, but nothing emits it yet, so there is no capacity test.

function collector () {
  const events = []
  return {
    events,
    onEvict (hash, key, reason) {
      events.push({ hash, key, reason })
    }
  }
}

async function waitFor (predicate, { timeout = 2000, step = 10 } = {}) {
  const start = Date.now()
  while (Date.now() - start < timeout) {
    if (predicate()) return true
    await wait(step)
  }
  return predicate()
}

test('onEvict: fires with (hash, key, "manual") on hdel (concurrency 0)', async () => {
  const { events, onEvict } = collector()
  const storage = ClusteredStorage({ type: 'object', TTL: 0, concurrency: 0, onEvict })

  await storage.hset('CRM#1', '1001', { a: 1 })
  await storage.hdel('CRM#1', '1001')
  storage.shutdown()

  assert.deepEqual(events, [{ hash: 'CRM#1', key: '1001', reason: 'manual' }])
})

test('onEvict: fires exactly once per evicted key, skips missing keys', async () => {
  const { events, onEvict } = collector()
  const storage = ClusteredStorage({ type: 'object', TTL: 0, concurrency: 0, onEvict })

  await storage.hset('CRM#1', 'a', 1)
  await storage.hset('CRM#1', 'b', 2)
  await storage.hset('CRM#1', 'c', 3)
  await storage.hdel('CRM#1', 'a')
  await storage.hdel('CRM#1', 'b')
  await storage.hdel('CRM#1', 'c')
  await storage.hdel('CRM#1', 'missing') // no-op, must not fire
  storage.shutdown()

  assert.equal(events.length, 3)
  assert.deepEqual(events.map((e) => e.key).sort(), ['a', 'b', 'c'])
  assert.ok(events.every((e) => e.reason === 'manual'))
  assert.ok(events.every((e) => e.hash === 'CRM#1'))
})

test('onEvict: fires "ttl" lazily on read after expiry (concurrency 0)', async () => {
  const { events, onEvict } = collector()
  const storage = ClusteredStorage({ type: 'object', TTL: 50, concurrency: 0, onEvict })

  await storage.hset('CRM#1', '1001', { a: 1 })
  await wait(120)
  const res = await storage.hget('CRM#1', '1001') // triggers lazy eviction
  storage.shutdown()

  assert.equal(res, null)
  assert.deepEqual(events, [{ hash: 'CRM#1', key: '1001', reason: 'ttl' }])
})

test('onEvict: proactive sweep fires "ttl" without any read (concurrency 0)', async () => {
  const { events, onEvict } = collector()
  const storage = ClusteredStorage({
    type: 'object',
    TTL: 50,
    sweepInterval: 30,
    concurrency: 0,
    onEvict
  })

  await storage.hset('CRM#1', '1001', { a: 1 })
  const fired = await waitFor(() => events.length === 1)
  storage.shutdown()

  assert.ok(fired, 'sweep did not fire onEvict in time')
  assert.deepEqual(events, [{ hash: 'CRM#1', key: '1001', reason: 'ttl' }])
})

test('onEvict: not called on normal hot-path read/write or overwrite', async () => {
  const { events, onEvict } = collector()
  const storage = ClusteredStorage({ type: 'object', TTL: 1000, concurrency: 0, onEvict })

  await storage.hset('CRM#1', '1001', { a: 1 })
  const res = await storage.hget('CRM#1', '1001')
  await storage.hset('CRM#1', '1001', { a: 2 }) // overwrite is not an eviction
  storage.shutdown()

  assert.deepEqual(res, { a: 1 })
  assert.equal(events.length, 0)
})

test('onEvict: supported by the map engine', async () => {
  const { events, onEvict } = collector()
  const storage = ClusteredStorage({ type: 'map', TTL: 50, sweepInterval: 30, concurrency: 0, onEvict })

  await storage.hset('CRM#1', '1001', { a: 1 })
  await storage.hset('CRM#2', '2002', { b: 2 })
  await storage.hdel('CRM#2', '2002')
  const swept = await waitFor(() => events.some((e) => e.reason === 'ttl'))
  storage.shutdown()

  assert.ok(swept, 'map sweep did not fire onEvict in time')
  assert.ok(events.some((e) => e.key === '2002' && e.reason === 'manual'))
  assert.ok(events.some((e) => e.hash === 'CRM#1' && e.key === '1001' && e.reason === 'ttl'))
})

test('onEvict: a throwing callback does not break storage (concurrency 0)', async () => {
  const storage = ClusteredStorage({
    type: 'object',
    TTL: 0,
    concurrency: 0,
    onEvict () { throw new Error('boom') }
  })

  await storage.hset('CRM#1', '1001', { a: 1 })
  await assert.doesNotReject(storage.hdel('CRM#1', '1001'))

  // storage remains usable after the callback threw
  await storage.hset('CRM#1', '1002', { b: 2 })
  const res = await storage.hget('CRM#1', '1002')
  storage.shutdown()

  assert.deepEqual(res, { b: 2 })
})

test('onEvict: undefined callback is a no-op (no regression)', async () => {
  const storage = ClusteredStorage({ type: 'object', TTL: 50, sweepInterval: 30, concurrency: 0 })

  await storage.hset('CRM#1', '1001', { a: 1 })
  await wait(120)
  await assert.doesNotReject(storage.hdel('CRM#1', 'missing'))
  const res = await storage.hget('CRM#1', '1001')
  storage.shutdown()

  assert.equal(res, null)
})

test('onEvict: delivered across the worker boundary (concurrency 1, manual)', async () => {
  const { events, onEvict } = collector()
  const storage = ClusteredStorage({ type: 'object', TTL: 0, concurrency: 1, onEvict })

  await storage.hset('CRM#1', '1001', { a: 1 })
  await storage.hdel('CRM#1', '1001')
  const fired = await waitFor(() => events.length === 1)
  storage.shutdown()

  assert.ok(fired, 'worker did not deliver the eviction message')
  assert.deepEqual(events, [{ hash: 'CRM#1', key: '1001', reason: 'manual' }])
})

test('onEvict: delivered across the worker boundary (concurrency 1, ttl via sweep)', async () => {
  const { events, onEvict } = collector()
  const storage = ClusteredStorage({
    type: 'object',
    TTL: 50,
    sweepInterval: 30,
    concurrency: 1,
    onEvict
  })

  await storage.hset('CRM#1', '1001', { a: 1 })
  const fired = await waitFor(() => events.length >= 1)
  storage.shutdown()

  assert.ok(fired, 'worker sweep did not deliver the eviction message')
  assert.equal(events[0].hash, 'CRM#1')
  assert.equal(events[0].key, '1001')
  assert.equal(events[0].reason, 'ttl')
})
