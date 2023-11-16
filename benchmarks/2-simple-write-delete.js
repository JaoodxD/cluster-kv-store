'use strict'
const ClusteredStorage = require('..')

const {
  hrtime,
  timeMS,
  getRandomInt,
  calcPercDiff,
  generateContent,
  safeGC
} = require('./util.js')

const limit = 20 // 23
const hashes = 1
const concurrency = 1

const content = generateContent(limit, hashes)

console.log({ totalSize: 1 << limit, hashes, concurrency })
console.log('exp | map gen | obj gen |     diff | map del | obj del |     diff')
;(async () => {
  for (let pow2 = 1; pow2 <= limit; pow2++) {
    const sz = 1 << pow2

    const slice = content.slice(0, sz)

    // generate Map based hashstorage
    const tsGM = hrtime()
    const map = ClusteredStorage({ concurrency, type: 'map' })
    await Promise.all(slice.map(([hash, key, val]) => map.hset(hash, key, val)))
    const tmGM = timeMS(tsGM)

    // generate Object based hashstorage
    const tsGO = hrtime()
    const obj = ClusteredStorage({ concurrency, type: 'object' })
    await Promise.all(slice.map(([hash, key, val]) => obj.hset(hash, key, val)))
    const tmGO = timeMS(tsGO)

    const keys = new Array(1e5)
      .fill()
      .map((_) => [
        getRandomInt(hashes).toString().padStart(4, 'x'),
        ((Math.random() * sz) | 0).toString(16).padStart(8, '0')
      ])

    // parallel search Map
    const tsSM = hrtime()
    await Promise.all(keys.map(([hash, key]) => map.hdel(hash, key)))
    const tmSM = timeMS(tsSM)

    // parallel search Object
    const tsSO = hrtime()
    await Promise.all(keys.map(([hash, key]) => obj.hdel(hash, key)))
    const tmSO = timeMS(tsSO)

    map.shutdown()
    obj.shutdown()
    safeGC()

    console.log(
      pow2.toString().padStart(3, ' '),
      '|',
      tmGM.toString().padStart(7, ' '),
      '|',
      tmGO.toString().padStart(7, ' '),
      '|',
      calcPercDiff(tmGM, tmGO).padStart(8, ' '),
      '|',
      tmSM.toString().padStart(7, ' '),
      '|',
      tmSO.toString().padStart(7, ' '),
      '|',
      calcPercDiff(tmSM, tmSO).padStart(8, ' ')
    )
  }
})()
