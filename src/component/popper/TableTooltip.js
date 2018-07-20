import {appendArrow} from '../mode/mode';

export default function TableTooltip() {
  var tooltipFrag = document.createDocumentFragment();
  this.tooltip = document.createElement('div');
  this.tooltip.className = 'el-tooltip__popper is-dark';
  this.tooltip.style.display = 'none';
  var tooltipContent = document.createElement('div');
  tooltipContent.className = 'tooltip__content';
  this.tooltip.appendChild(tooltipContent);
  tooltipFrag.appendChild(this.tooltip);
  document.body.appendChild(tooltipFrag);
  appendArrow(this.tooltip);
}
TableTooltip.prototype.showPopper = function (params) {
  var _params = {
    type: '',
    placement: 'bottom',
    reference: '',
    content: '',
    offset: 0,
    effect: 'dark',
    openDelay: 0,
    gpuAcceleration: false
  };
  this.params = Object.assign({}, _params, params);
  this.timer = setTimeout(() => {
    this.tooltip.style.display = 'block';
  }, this.params.openDelay);
  let content = this.tooltip.querySelector('.tooltip__content');
  content && (content.innerHTML = this.params.content);
  this.popperJs = new Popper(this.params.reference, this.tooltip, {
    placement: this.params.placement,
    offset: this.params.offset,
    gpuAcceleration: this.params.gpuAcceleration
  });
  this.popperJs.onCreate(_ => {
    setTimeout(() => {
      this.popperJs && this.popperJs.update();
    })
  });
  if (this.params.updateCallback) {
    setTimeout(() => {
      this.params.updateCallback({contentEl: '.' + this.params.type + '__content'});
    })
  }
};
TableTooltip.prototype.closeTooltip = function () {
  this.popperJs && this.popperJs.destroy();
  this.popperJs && (this.popperJs = null);
  this.tooltip.style.display = 'none';
};