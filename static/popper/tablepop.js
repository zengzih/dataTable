const observe = (obj, vm) => {
  Object.keys(obj).forEach((key) => {
    defineReactive(vm, key, obj[key]);
  });
};

const defineReactive = (obj, key, val) => {
  Object.defineProperty(obj, key, {
    get () {
      return val;
    },
    set (newVal, oldVal) {
      if (newVal === val) return;
      val = newVal;
      obj.watchProperty(key, val);
    }
  });
};
function TablePopper(options = {}){
  let _defaultOptions = {
    style: {width: '300px', height: '230px'},
    title: '',
    placement: 'right-start',
    show: false
  };
  this.options = Object.assign({}, _defaultOptions, options);
  observe(this.options, this);
  console.log({
    options: this.options,
    this: this
  });
  var popFrag = document.createDocumentFragment();
  this.popper = document.createElement('div');
  this.popper.className = 'el-popover';
  console.log(this);
  for (var i in this.style) {
    this.popper.style[i] = this.style[i]
  }
  console.log('----create-tablepopper-----');
  this.popper.style.display = 'none';
  this.popperTitle = document.createElement('div');
  this.popperTitle.className = 'el-popover__title';
  this.popperTitle.innerHTML = this.options.title;
  this.popperContent = document.createElement('div');
  this.popperContent.style.width = this.style.width;
  this.popperContent.className = 'popper__content';
  this.popper.appendChild(this.popperTitle);
  this.popper.appendChild(this.popperContent);
  popFrag.appendChild(this.popper);
  document.body.appendChild(popFrag);
  console.log(this.popperContent);
  this.popper.addEventListener('mouseenter', () => {
    clearTimeout(this.timer);
    this.popper.style.display = 'block';
  });
  this.popperContent.addEventListener('mouseleave', () => {
    clearTimeout(this.timer);
    this.popper.style.display = 'none';
  });
  this.popperContent.addEventListener('mouseenter', () => {
    clearTimeout(this.timer);
    this.popper.style.display = 'block';
  });
  appendArrow(this.popper);
};
TablePopper.prototype.showPopper = function (params) {
  console.log('----showpopper-----');
  let _params = {
    reference: '',
    content: '',
    offset: 0,
    openDelay: 0,
    gpuAcceleration: false
  };
  this.params = Object.assign({}, _params, params);
  console.log('----popper-content---');
  console.log(this.popperContent.children.length);
  this.popperContent && this.popperContent.children.length && this.popperContent.removeChild(this.popperContent.children[0]);
  this.UpdateCallback();

  this.params.reference.addEventListener('mouseenter', (e) => {
    console.log('--reference-enter--');
    this.handleMouseenter();
  });

  this.popper.addEventListener('mouseenter', (e) => {
    console.log('--popper-enter--');
    this.handleMouseenter();
  });
  this.params.reference.addEventListener('mouseleave', ()=> {
    this.handleMouseleave();
  });
  this.popperJs = new Popper(this.params.reference, this.popper, {
    placement: this.params.placement,
    offset: this.params.offset,
    gpuAcceleration: this.params.gpuAcceleration
  });
  this.popperJs.onCreate(_ => {
    setTimeout(() => {
      this.popperJs.update();
    })
  });
};
TablePopper.prototype.handleMouseleave = function() {
  clearTimeout(this.timer);
  this.timer = setTimeout(() => {
    // this.popper.style.display = 'none';
    this.show = false;
    console.log({
      popperContent: this.popperContent,
      children: this.popperContent.children
    })
  }, 200);
};


TablePopper.prototype.handleMouseenter = function() {
  clearTimeout(this.timer);
  if (this.params.openDelay) {
    this.timer = setTimeout(() => {
      // this.popper.style.display = 'block';
      this.show= true;
    }, this.params.openDelay);
  } else {
    // this.popper.style.display = 'block';
    this.show = true;
  }
};

TablePopper.prototype.watchProperty = function(key, val) {
  switch (key) {
    case 'show':
      this.UpdatePopperStatus(key, val);
      break;
    default:
      break;
  }
};

TablePopper.prototype.UpdatePopperStatus = function(key, val) {
  this.popper.style.display = val ? 'block' : 'none';
};

TablePopper.prototype.UpdateCallback = function() {
  if (this.params.updateCallback) {
    setTimeout(() => {
      this.params.updateCallback({contentEl: this.popperContent});
    }, 100)
  }
};
