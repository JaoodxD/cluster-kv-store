'use strict';

module.exports = function duplicate(factory, n) {
  return new Array(n).fill().map(() => factory());
}
