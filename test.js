'use strict';

const { join } = require('path');
const wait = (ms) => new Promise((res) => setTimeout(res, ms));

const tests = [];
const chainExec = async (arr) => {
  for (const f of arr) {
    await f();
    console.log();
  }
};

const ClusteredStorage = require('./lib/storage/clusteredStorage.js');

const test1 = async () => {
  const storage = ClusteredStorage({
    type: 'object',
    TTL: 0,
    norm: 0,
    factor: 1,
  });

  await storage.hset('CRM#1', '1001', { locker: true, user: '__admin__' });
  const res = await storage.hget('CRM#1', '1001');
  console.log(res);
  storage.shutdown();
};
tests.push(test1);

chainExec(tests);  
