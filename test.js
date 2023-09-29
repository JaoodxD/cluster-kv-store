'use strict';

const tests = [];
const chainExec = async (arr) => {
  for (const f of arr) {
    await f();
    console.log();
  }
}
const wait = (ms) => new Promise((res) => setTimeout(res, ms));

const KvStorage = require('./lib/storage/KvStorage.js');

const test1 = () => {
  console.log('primitive test');

  const storage = KvStorage({ type: 'object', TTL: 0 });
  const number = 1;
  storage.set('CRM', number);
  const newnumber = storage.get('CRM');

  console.log(number, newnumber);
  console.log(number === newnumber);
};
tests.push(test1);

const test2 = () => {
  console.log('object test');

  const storage = KvStorage({ type: 'object', TTL: 0 });
  const object = { hello: 'world' };
  storage.set('CRM', object);
  const newobject = storage.get('CRM');

  console.log(object, newobject);
  console.log(object === newobject);
};
tests.push(test2);

const test3 = async () => {
  console.log('test object with TTL');

  const storage = KvStorage({ type: 'object', TTL: 1000 });
  const object = { hello: 'world' };
  storage.set('CRM', object);
  await wait(800);
  const newobject = storage.get('CRM');

  console.log(object, newobject);
  console.log(object === newobject);
};
tests.push(test3);

const test4 = async () => {
  console.log('test object with expired TTL');

  const storage = KvStorage({ type: 'object', TTL: 1000 });
  const object = { hello: 'world' };
  storage.set('CRM', object);
  await wait(1000);
  const newobject = storage.get('CRM');

  console.log(object, newobject);
  console.log(object !== newobject);
};
tests.push(test4);

const test5 = async () => {
  console.log('test with invalid storage type');

  try {
    const storage = KvStorage({ type: 'invalid storage', TTL: 1000 });
    console.error('test failed');
  } catch (err) {
    console.log(err.message);
    console.log(true);
  }
};
tests.push(test5);

const test6 = async () => {
  console.log('test with Map storage type');

  const storage = KvStorage({ type: 'map', TTL: 0 });
  const object = { hello: 'world' };
  storage.set('CRM', object);
  const newobject = storage.get('CRM');

  console.log(object, newobject);
  console.log(object === newobject);
};
tests.push(test6);

const test7 = async () => {
  console.log('perf test x1_000_000 with Map storage type');

  const storage = KvStorage({ type: 'map', TTL: 0 });
  console.time('Map perf')
  console.time('Map insert perf');
  for (let i = 0; i < 1000000; i++) {
    const object = { hello: 'world' };
    storage.set(`CRM#${i}`, object);
  }
  console.timeEnd('Map insert perf');
  console.time('Map retrieve perf');
  for (let i = 0; i < 1000000; i++) {
    const object = storage.get(`CRM#${i}`);
  }
  console.timeEnd('Map retrieve perf');
  console.timeEnd('Map perf');
};
tests.push(test7);

const test8 = async () => {
  console.log('perf test x1_000_000 with object storage type');

  const storage = KvStorage({ type: 'object', TTL: 0 });
  console.time('object perf')
  console.time('object insert perf');
  for (let i = 0; i < 1000000; i++) {
    const object = { hello: 'world' };
    storage.set(`CRM#${i}`, object);
  }
  console.timeEnd('object insert perf');
  console.time('object retrieve perf');
  for (let i = 0; i < 1000000; i++) {
    const object = storage.get(`CRM#${i}`);
  }
  console.timeEnd('object retrieve perf');
  console.timeEnd('object perf');
};
tests.push(test8);

const test9 = async () => {
  console.log('perf test x1_000_000 with Map storage type, big pool');

  const storage = KvStorage({ type: 'map', TTL: 0, norm: 1000000 });
  console.time('Map perf')
  console.time('Map insert perf');
  for (let i = 0; i < 1000000; i++) {
    const object = { hello: 'world' };
    storage.set(`CRM#${i}`, object);
  }
  console.timeEnd('Map insert perf');
  console.time('Map retrieve perf');
  for (let i = 0; i < 1000000; i++) {
    const object = storage.get(`CRM#${i}`);
  }
  console.timeEnd('Map retrieve perf');
  console.timeEnd('Map perf');
};
tests.push(test9);

const test10 = async () => {
  console.log('perf test x1_000_000 with object storage type, big pool');

  const storage = KvStorage({ type: 'object', TTL: 0, norm: 1000000 });
  console.time('object perf')
  console.time('object insert perf');
  for (let i = 0; i < 1000000; i++) {
    const object = { hello: 'world' };
    storage.set(`CRM#${i}`, object);
  }
  console.timeEnd('object insert perf');
  console.time('object retrieve perf');
  for (let i = 0; i < 1000000; i++) {
    const object = storage.get(`CRM#${i}`);
  }
  console.timeEnd('object retrieve perf');
  console.timeEnd('object perf');
};
tests.push(test10);

chainExec(tests);
