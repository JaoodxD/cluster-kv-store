'use strict'

module.exports = function intervalVacuum (opts = {}, storage) {
  const interval = opts.interval
  if (!interval) return

  let timer = null
  return { start, stop }

  function start () {
    if (timer) return
    timer = setInterval(cleanStorage, interval).unref()
  }

  function cleanStorage () {
    storage.getAll()
  }

  function stop () {
    if (timer) clearInterval(timer)
  }
}
