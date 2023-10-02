'use strict';

const { Worker } = require('worker_threads');
const { join } = require('path');
const defer = require('../utils/defer.js');

const workerPath = join(__dirname, './worker.js');

const storageUnit = ({
  type = 'object',
  TTL = 0,
  norm = 100000,
  storageFactoryPath } = {}) => {

  const storageArgs = { type, TTL, norm };
  const workerData = { storageFactoryPath, storageArgs };
  console.log({ workerData });
  const worker = new Worker(workerPath, { workerData });

  const tasks = new Map();
  let taskCounter = 1;
  const task = (payload) => {
    const taskId = taskCounter++;
    const { promise, resolve } = defer();
    const message = { taskId, command: 'task', payload };
    worker.postMessage(message);
    tasks.set(taskId, resolve);
    return promise;
  };

  const resolveTask = ({ taskId, result, errorMessage }) => {
    const resolver = tasks.get(taskId);
    if (resolver) tasks.delete(taskId);
    resolver({ result, errorMessage });
  };

  const destroy = () => {
    worker.terminate();
  };

  worker.on('message', resolveTask);

  return { task, destroy };
};

module.exports = storageUnit;
