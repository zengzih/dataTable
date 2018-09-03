import {appendArrow} from '../mode/mode';
export const observe = (obj, vm) => {
  Object.keys(obj).forEach((key) => {
    defineReactive(vm, key, obj[key]);
  });
};

export const defineReactive = (obj, key, val) => {
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
export default function TablePopper(options = {}){
  let _defaultOptions = {
    style: {},
    title: '',
    placement: 'right-start',
    show: false
  };
  this.options = Object.assign({}, _defaultOptions, options);
  observe(this.options, this);
  var popFrag = document.createDocumentFragment();
  this.popper = document.createElement('div');
  this.popper.className = 'el-popover';
  this.popper.style.display = 'none';
  this.popperTitle = document.createElement('div');
  this.popperTitle.className = 'el-popover__title';
  this.popperTitle.innerHTML = this.title;
  this.popperContent = document.createElement('div');
  this.popperContent.style.width = this.style.width || 'auto';
  this.popperContent.className = 'popper__content';
  this.popper.appendChild(this.popperTitle);
  this.popper.appendChild(this.popperContent);
  for (var i in this.style) {
    this.popper.style[i] = this.style[i];
  }
  popFrag.appendChild(this.popper);
  document.body.appendChild(popFrag);
  this.popper.addEventListener('mouseenter', () => {
    clearTimeout(this.timer);
    // this.popper.style.display = 'block';
    this.showPopperJs();
  });
  this.popperContent.addEventListener('mouseleave', () => {
    clearTimeout(this.timer);
    this.popper.style.display = 'none';
    this.popperContent.style.width = 'auto';
    this.popperContent.style.height = 'auto';
  });
  this.popperContent.addEventListener('mouseenter', () => {
    clearTimeout(this.timer);
    // this.popper.style.display = 'block';
    this.showPopperJs();
  });
  appendArrow(this.popper);
};

TablePopper.prototype.showPopper = function (params) {
  let _params = {
    reference: '',
    content: '',
    offset: 0,
    openDelay: 0,
    gpuAcceleration: false
  };
  this.params = Object.assign({}, _params, params);
  // this.closePopper();
  clearTimeout(this.timer);
  this.params.reference.addEventListener('mouseenter', () => {
    this.handleMouseenter();
  });
  this.popper.addEventListener('mouseenter', () => {
    this.handleMouseenter();
  });
  this.params.reference.addEventListener('mouseleave', () => {
    this.handleMouseleave();
  });
  this.popper.addEventListener('mouseleave', () => {
    this.handleMouseleave();
  });
  document.addEventListener('mouseenter', () => {
    this.closePopper();
  });
  var mousewheelevt=(/Firefox/i.test(navigator.userAgent))?"DOMMouseScroll": "mousewheel";//FF doesn't recognize mousewheel as of FF3.x
  if(document.attachEvent) {
    //if IE (and Opera depending on user setting)
    document.attachEvent("on"+mousewheelevt, function(e){
      this.closePopper();
    }.bind(this));
  } else if(document.addEventListener) { //WC3 browsers
    document.addEventListener(mousewheelevt, function(e){
      this.closePopper();
    }.bind(this), false);
  }
  this.popperJs && this.popperJs.destroy();
  this.popperJs = null;
  this.popperJs = new Popper(this.params.reference, this.popper, {
    placement: this.params.placement,
    offset: this.params.offset,
    gpuAcceleration: this.params.gpuAcceleration
  });
  this.popperJs.onCreate(_ => {
    setTimeout(() => {
      this.popperJs && this.popperJs.update();
      this.UpdateCallback();
    })
  });
};

TablePopper.prototype.handleMouseleave = function() {
  clearTimeout(this.timer);
  this.timer = setTimeout(() => {
    // this.show = false;
    this.closePopper();
  }, 200);
};

TablePopper.prototype.closePopper = function() {
  this.popper.style.display = 'none';
  this.popperJs && this.popperJs.destroy();
  this.popperJs && (this.popperJs = null);
  // this.popperContent.innerHTML = '';
};

TablePopper.prototype.handleMouseenter = function() {
  clearTimeout(this.timer);
  if (this.params.openDelay) {
    this.timer = setTimeout(() => {
      //this.show= true;
      this.showPopperJs();
    }, this.params.openDelay);
  } else {
    // this.show = true;
    this.showPopperJs();
  }
};

TablePopper.prototype.Update = function() {
  for (var i in this.style) {
    this.popper.style[i] = this.style[i];
  }
  this.popperJs && this.popperJs.update();
};

TablePopper.prototype.watchProperty = function(key, val) {
  switch (key) {
    case 'show':
      // this.UpdatePopperStatus(key, val);
      break;
    case 'style':
      this.Update();
      break;  
    case 'title':
      this.popperTitle.innerHTML = val;  
      break;
    default:
      break;
  }
};

TablePopper.prototype.showPopperJs = function() {
  this.Update();
  this.popper.style.display = 'block';
};

TablePopper.prototype.UpdatePopperStatus = function(key, val) {
  !val && this.closePopper();
  this.popper.style.display = val ? 'block' : 'none';
};

TablePopper.prototype.UpdateCallback = function() {
  // this.show = true;
  this.showPopperJs();
  if (this.params.updateCallback) {
    this.popperContent.innerHTML = '';
    this.popperContent.style.width = '';
    this.popperContent.style.height = '';
    this.params.updateCallback({contentEl: this.popperContent});
  }
};
window.TablePopper = TablePopper;
