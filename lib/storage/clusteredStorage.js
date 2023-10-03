'use strict';

const Worker = require('./cluster.js');
const NoWorker = require('./no-worker.js');

module.exports = function ClusteredStorage(opts = {}) {
  const type = opts.type || 'object';
  const TTL = opts.TTL || 0;
  const norm = opts.norm || 0;
  const max = opts.max || Infinity;
  const factor = opts.factor || 0;
  const workerData = { type, TTL, norm, max };
  const factory = factor ? Worker : NoWorker;
  const worker = factory(workerData);

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

  async function remove(crm, key) {
    const payload = { crm, key };
    const command = { action: 'remove', payload };
    await worker.task(command);
  }

  function shutdown() {
    worker.shutdown();
  }
}

