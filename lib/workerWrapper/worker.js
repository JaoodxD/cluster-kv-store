const { parentPort, workerData } = require('worker_threads');

const { storageFactoryPath, storageArgs } = workerData;

const KvStorage = require(storageFactoryPath);

const storage = KvStorage(storageArgs);

const commands = {
  ...storage,
  info: () => ({ storageFactoryPath, storageArgs })
}

parentPort.on('message', (payload) => {
  const { taskId, command, args = [] } = payload;
  let result = null, errorMessage = null;
  try {
    result = commands[command](...args);
  } catch (error) {
    errorMessage = error.message;
  }
  const taskResult = { taskId, result, errorMessage };
  parentPort.postMessage(taskResult);
});
