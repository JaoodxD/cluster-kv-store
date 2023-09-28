'use strict';

const poolify = (factory, norm = 1, max = Infinity) => {
  const duplicate = (n) => new Array(n).fill().map(() => factory());
  const items = duplicate(norm);

  const get = () => {
    if (items.length <= 0) {
      return factory();
    };
    const item = items.pop();
    return item;
  };

  const put = (item) => {
    if (items.length < max) items.push(item);
  };

  return { get, put };
};

