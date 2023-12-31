'use strict'

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const tests = []
const chainExec = async (arr) => {
  for (const f of arr) {
    await f()
    console.log()
  }
}

const ClusteredStorage = require('.')

const test1 = async () => {
  const storage = ClusteredStorage({
    type: 'object',
    TTL: 1000,
    norm: 0,
    concurrency: 4
  })

  await storage.hset('CRM#1', '1001', { locker: true, user: '__admin__' })
  const res1 = await storage.hget('CRM#1', '1001')
  console.log(res1)
  await wait(983)
  const res2 = await storage.hget('CRM#1', '1001')
  console.log(res2)

  storage.shutdown()
}
tests.push(test1)

const test2 = async () => {
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
}
tests.push(test2)

const test3 = async () => {
  const storage = ClusteredStorage({
    type: 'object',
    TTL: 0,
    norm: 0,
    concurrency: 1
  })

  await storage.hset('CRM#1', '1001', { locker: true, user: '__admin__' })
  const res1 = await storage.hget('CRM#1', '1001')
  console.log(res1)
  await storage.hdel('CRM#1', '1001')
  const res2 = await storage.hget('CRM#1', '1001')
  console.log('key removed:', res2 === null)

  storage.shutdown()
}
tests.push(test3)

const test4 = async () => {
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
}
tests.push(test4)

const test5 = async () => {
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
  console.dir({ allData }, { depth: null })
  storage.shutdown()
}
tests.push(test5)

chainExec(tests)
