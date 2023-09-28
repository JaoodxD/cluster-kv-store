'use strict';

const tests = [];
const chainExec = async (arr) => {
  for (const f of arr) {
    await f();
    console.log();
  }
}
const wait = (ms) => new Promise((res) => setTimeout(res, ms));

const KvStorage = require('./lib/KvStorage.js');

const test1 = () => {
  console.log('primitive test');

  const storage = KvStorage('object', 0);
  const number = 1;
  storage.set('CRM', number);
  const newnumber = storage.get('CRM');

  console.log(number, newnumber);
  console.log(number === newnumber);
};
tests.push(test1);

const test2 = () => {
  console.log('object test');

  const storage = KvStorage('object', 0);
  const object = { hello: 'world' };
  storage.set('CRM', object);
  const newobject = storage.get('CRM');

  console.log(object, newobject);
  console.log(object === newobject);
};
tests.push(test2);

const test3 = async () => {
  console.log('test object with TTL');

  const storage = KvStorage('object', 1000);
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

  const storage = KvStorage('object', 1000);
  const object = { hello: 'world' };
  storage.set('CRM', object);
  await wait(1000);
  const newobject = storage.get('CRM');

  console.log(object, newobject);
  console.log(object === newobject);
};
tests.push(test4);

const test5 = async () => {
  console.log('test with invalid storage type');

  try {
    const storage = KvStorage('invalid storage', 1000);
    console.error('test failed');
  } catch (err) {
    console.log(err.message);
    console.log('test passed');
  }
};
tests.push(test5);

chainExec(tests);
