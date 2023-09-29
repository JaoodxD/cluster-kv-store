const { parentPort, workerData } = require('worker_threads');

const { storageFactoryPath, storageArgs } = workerData;

parentPort.on('message', () => {
  parentPort.postMessage({ storageArgs, storageFactoryPath });
});
