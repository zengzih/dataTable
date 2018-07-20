export const appendArrow = (element) => {
  for (let item in element.attributes) {
    if (/^_v-/.test(element.attributes[item].name)) {
      hash = element.attributes[item].name;
      break;
    }
  }
  const arrow = document.createElement('div');
  arrow.setAttribute('x-arrow', '');
  arrow.className = 'popper__arrow';
  element.appendChild(arrow);
};

export const defineReactive = (obj, key, val, vm) => {
  Object.defineProperty(obj, key, {
    enumerable: true,
    configurable: true,
    get: function () {
      return val;
    },
    set: function (newVal) {
      if (newVal !== val) {
        val = newVal;
        vm.watchProperty(key, val);
      }
    }
  })
};

export const observe = (obj, vm) => {
  console.log('----observe-----');
  Object.keys(obj).forEach(function (key) {
    defineReactive(obj, key, obj[key], vm)
  })
};

