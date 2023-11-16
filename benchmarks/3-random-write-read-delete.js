'use strict'
const ClusteredStorage = require('..')

const {
  calcPercDiff,
  safeGC,
  randomOperation,
  hrtime,
  timeMS
} = require('./util.js')

const limit = 23 // 23
const hashes = 1
const concurrency = 1

// const content = generateContent(limit, hashes)

console.log({ totalSize: 1 << limit, hashes, concurrency })
console.log('exp | map proc | obj proc |     diff | operations')
;(async () => {
  const PQueue = (await import('p-queue')).default
  const queue = new PQueue({ concurrency: 1_000_000 })

  for (let pow2 = 1; pow2 <= limit; pow2++) {
    const sz = 1 << pow2
    const operations = Array.from({ length: sz }, () =>
      randomOperation(hashes, sz)
    )

    const map = ClusteredStorage({ concurrency, type: 'map' })
    const startMap = hrtime()
    operations.forEach(([method, hash, key, value]) =>
      queue.add(async () => {
        await map[method](hash, key, value)
      })
    )

    await queue.onEmpty()
    const endMap = timeMS(startMap)

    const obj = ClusteredStorage({ concurrency, type: 'object' })
    const startObj = hrtime()
    operations.forEach(([method, hash, key, value]) =>
      queue.add(async () => {
        await obj[method](hash, key, value)
      })
    )

    await queue.onEmpty()
    const endObj = timeMS(startObj)

    const stat = operations.reduce(
      (acc, op) => {
        const [operation] = op
        acc[operation]++
        acc.total++
        return acc
      },
      { total: 0, hset: 0, hget: 0, hdel: 0 }
    )

    console.log(
      pow2.toString().padStart(3, ' '),
      '|',
      endMap.toString().padStart(8, ' '),
      '|',
      endObj.toString().padStart(8, ' '),
      '|',
      calcPercDiff(endMap, endObj).padStart(8, ' '),
      '|',
      stat
    )

    map.shutdown()
    obj.shutdown()
    safeGC()
  }
})()
