const { parentPort, workerData } = require('worker_threads');

const { storageFactoryPath, storageArgs } = workerData;

const Storage = require(storageFactoryPath);

const storage = Storage(storageArgs);

const commands = {
  ...storage,
  info: () => ({ storageFactoryPath, storageArgs })
};
console.log({ commands })

parentPort.on('message', ({ taskId, command, payload }) => {
  let result = null, errorMessage = null;
  console.log(taskId, command, payload);
  try {
    result = commands[command](payload);
  } catch (error) {
    errorMessage = error.message;
  }
  const taskResult = { taskId, result, errorMessage };
  parentPort.postMessage(taskResult);
});
