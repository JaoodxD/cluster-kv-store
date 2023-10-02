'use strict';

const Worker = require('./cluster.js');

module.exports = function ClusteredStorage(opts = {}) {
  // {
  //   type = 'object',
  //   TTL = 0,
  //   norm = 0,
  //   factor = 1
  // }
  const type = opts.type || 'object';
  const TTL = opts.TTL || 0;
  const norm = opts.norm || 0;
  const workerData = { type, TTL, norm };
  const worker = Worker(workerData);
  return { hset, hget, remove, shutdown };
  async function hset(crm, key, value) {
    const payload = { crm, key, value };
    const command = { action: 'set', payload };
    await worker.task(command);
  }
  async function hget(crm, key) {
    const payload = { crm, key };
    const command = { action: 'get', payload };
    const result = await worker.task(command);
    return result;
  }
  function remove(crm, key) { }
  function shutdown() {
    worker.shutdown();
  }
}

