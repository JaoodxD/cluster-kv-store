const { parentPort, workerData } = require('worker_threads');

const { storageFactoryPath, storageArgs } = workerData;

const KvStorage = require(storageFactoryPath);

const storage = KvStorage(storageArgs);

parentPort.on('message', () => {
  parentPort.postMessage({ storageArgs, storageFactoryPath });
});
