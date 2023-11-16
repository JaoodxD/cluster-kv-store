'use strict'

const { randomInt } = require('crypto')

const hrtime = process.hrtime.bigint
const timeMS = (ts) => (Number(hrtime() - ts) / 1e6) | 0
const getRandomInt = (max) => randomInt(max)
const calcPercDiff = (v1, v2) =>
  (((v2 - v1) / Math.abs(v1)) * 100).toFixed(2) + '%'

const generateContent = (limit, hashes = 1) =>
  new Array(1 << limit).fill().map((_, i) => [
    getRandomInt(hashes).toString().padStart(4, 'x'),
    i.toString(16).padStart(8, '0'), // key
    i // val
  ])

const safeGC = () => {
  if (globalThis.gc) globalThis.gc()
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const randomOperation = (hashes, maxKey) => {
  const method = ['hget', 'hset', 'hdel'][getRandomInt(3)]
  const hash = getRandomInt(hashes).toString(16).padStart(8, 'x')
  const key = getRandomInt(maxKey).toString(16).padStart(8, 'x')

  const operation = [method, hash, key]
  if (method === 'hset') operation.push(getRandomInt(maxKey).toString(8))
  return operation
}

module.exports = {
  hrtime,
  timeMS,
  getRandomInt,
  calcPercDiff,
  generateContent,
  safeGC,
  wait,
  randomOperation
}
