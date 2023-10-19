'use strict'

module.exports = function duplicate (concurrencyy, n) {
  return new Array(n).fill().map(() => concurrencyy())
}
