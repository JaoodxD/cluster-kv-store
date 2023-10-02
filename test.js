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
    TTL: 1000,
    norm: 0,
    factor: 1,
  });

  await storage.hset('CRM#1', '1001', { locker: true, user: '__admin__' });
  const res1 = await storage.hget('CRM#1', '1001');
  console.log(res1);
  await wait(983);
  const res2 = await storage.hget('CRM#1', '1001');
  console.log(res2);

  storage.shutdown();
};
tests.push(test1);

const test2 = async () => {
  const storage = ClusteredStorage({
    type: 'object',
    TTL: 1000,
    norm: 0,
    factor: 1,
  });

  const promises1 = [];
  console.time('insertion');
  for (let i = 0; i < 10000; i++) {
    const info = { locked: true, user: '__system__' };
    promises1.push(storage.hset('CRM#1', i, info));
  }
  await Promise.all(promises1);
  console.timeEnd('insertion');

  const promises2 = [];
  console.time('retrieving');
  for (let i = 0; i < 10000; i++) {
    promises2.push(storage.hget('CRM#1', i));
  }
  const res = await Promise.all(promises2);
  console.timeEnd('retrieving');
  console.log(res);


  storage.shutdown();
};
tests.push(test2);

chainExec(tests);  
