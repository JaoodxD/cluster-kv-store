'use strict';

const CrmStorage = require('./crmStorage.js');
const { parentPort, workerData } = require('worker_threads');

const storage = CrmStorage();

const commands = {
  ...storage,
  info() {
    return { hello: 'world' }
  }
};

parentPort.on('message', ({ taskId, action, payload }) => {
  const handler = commands[action];
  const result = handler(payload);
  const message = { taskId, result };
  parentPort.postMessage(message);
});
