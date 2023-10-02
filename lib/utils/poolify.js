'use strict';

module.exports = function poolify(factory, norm = 1, max = Infinity) {
  const duplicate = (n) => new Array(n).fill().map(() => factory());
  const items = duplicate(norm);

  return { get, put };

  function get() {
    if (items.length <= 0) {
      return factory();
    };
    const item = items.pop();
    return item;
  }

  function put(item) {
    if (items.length < max) items.push(item);
  }
}
