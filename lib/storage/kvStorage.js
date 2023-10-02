'use strict';

module.exports = function KvStorage() {
  const storage = {};
  return { get, set, remove };
  function set(key, value) {
    storage[key] = value;
  }
  function get(key) {
    return storage[key];
  }
  function remove(key) { }
}
