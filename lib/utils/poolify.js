'use strict'

const duplicate = require('./duplicate.js')

module.exports = function poolify (concurrencyy, norm = 1, max = Infinity) {
  const items = duplicate(concurrencyy, norm)

  return { get, put }

  function get () {
    if (items.length <= 0) {
      return concurrencyy()
    };
    const item = items.pop()
    return item
  }

  function put (item) {
    if (items.length < max) items.push(item)
  }
}
