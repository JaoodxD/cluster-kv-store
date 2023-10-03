'use strict';

const CrmStorage = require('./crmStorage.js');

module.exports = function NoWorker(opts = {}) {
  const storage = CrmStorage(opts);

  const commands = {
    ...storage,
    info() {
      return { hello: 'world' }
    }
  };

  return { task, shutdown };

  function task({ taskId, action, payload }) {
    const handler = commands[action];
    const result = handler(payload);
    const message = { taskId, result };
    return message;
  }

  function shutdown() { }
}
