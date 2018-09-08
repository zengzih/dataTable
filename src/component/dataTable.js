import {hasClass, addClass, removeClass} from "./dom";
import Popper from './popper/TablePopper';
import Tooltip from './popper/TableTooltip'
import debounce from './mode/debounce';

export const observe = (obj, vm) => {
  Object.keys(obj).forEach((key) => {
    defineReactive(vm, key, obj[key]);
  });
};

const getStyle = (el) => {
  return el.currentStyle ? el.currentStyle : getComputedStyle(el, false);
}

export const defineReactive = (obj, key, val) => {
  Object.defineProperty(obj, key, {
    get () {
      return val;
    },
    set (newVal, oldVal) {
      if (newVal === val) return;
      val = newVal;
      obj.watchProperty(key);
    }
  });
};

export const columnBorder = (column) => {
  column.forEach((item, index) => {
    item.leftBorder = false;
    item.rightBorder = true;
    if (item.fixed === true) {
      item.rightBorder = true;
      if (index < column.length - 1) {
        column[index + 1].leftBorder = false;
      }
    }
    if (item.fixed === 'right') {
      item.leftBorder = true;
      if (index > 0) {
        column[index - 1].rightBorder = false;
      }
    }
    if (item.fixed === false || item.fixed === '') {
      item.rightBorder = true;
    }
    if (item.children) {
      columnBorder(item.children);
    }
  });
};
export let _DefaultFn = [
  'rowClick',
  'cellClick',
  'select',
  'selectionChange',
  'selectAll',
  'sortChange',
  'cellMouseEnter',
  'cellMouseLeave',
  'openTableConfig'
];
export let _defaultData = {
  data: [],
  column: [],
  nodeKey: '',
  popper: null,
  height: '',
  tableConfig: false,
  highlightCurrentRow: 'current-row'
};

var tooltip = null;
export default function Table(options) {
  this.methods = {};
  this.el = options.el || '';
  this._data = Object.assign({}, _defaultData, options.data);
  this.scrollX = false;
  this.scrollY = false;
  this.fitColumn = true;
  this.theadHeight = '';
  this.rowClassName = '';
  this.gutterWidth = 17;
  this.dragging = false;
  this.draggingColumn = [];
  this.popper = '';
  this.tooltip = '';
  this.tBodyHeight = '';
  this.tableKey = {};
  observe(this._data, this);
  if (!this.height) {
    // this.height = parseFloat(getStyle(this.getTableEl()).height);
    this.height = this.getTableEl().offsetHeight;
  }
  _DefaultFn.forEach((fn) => {
    this.methods[fn] = new Function();
  });
  this.methods = Object.assign({}, this.methods, options.methods);
  this.getTableKey();
  this.createTable();
  // this.tablePopper = debounce(50, (event, params) => event.renderPopover(params));
  this.tablePopper = debounce(100, (e, col, tr, index) => col.show(e, col, tr, index));
  this.popperHide = debounce(100, (col, e) => col.hide(e));
  if (!tooltip) {
    tooltip = new Tooltip();
  }
};
Table.prototype.defaltColumn = function() {
  this.column.forEach(col=> {
    if (col.width !== undefined) {
      col.width = parseInt(col.width, 10);
      if (isNaN(col.width)) {
        col.width = null;
      }
    }
    if (col.minWidth !== undefined) {
      col.minWidth = parseInt(col.minWidth, 10);
      if (isNaN(col.minWidth)) {
        col.minWidth = 80;
      }
    }
    col.realWidth = col.width || col.minWidth;
  });
};
Table.prototype.getTableEl = function () {
  if (typeof this.el === 'string') {
    return document.querySelector(this.el);
  } else if (this.el.nodeType === 1) {
    return this.el;
  } else {
    console.error('目标元素错误！');
    return false;
  }
};

Table.prototype.getTableKey = function () {
  if (!this.nodeKey) return;
  this.data.forEach((item) => {
    this.tableKey[item[this.nodeKey]] = false;
  });
};

Table.prototype.createTable = function () {
  var frag = document.createDocumentFragment();
  if (!this.createEl) {
    this.createEl = document.createElement('div');
    this.createEl.className = 'el-table el-table--fit el-table--border el-table--enable-row-hover el-table--enable-row-transition';
    this.createEl.style.height = this.height + 'px';
    if (this.tableConfig) {
      this.tableConfig = document.createElement('div');
      this.tableConfig.className = 'table_config';
      this.tableConfig.innerHTML = '<i class="el-icon-setting"></i>';
      this.createEl.appendChild(this.tableConfig);
      this.tableConfig.addEventListener('click', () => {
        this.methods.openTableConfig();
      });
    }
  }
  if (!this.tableHeaderWrapper) {
    this.tableHeaderWrapper = document.createElement('div');
    this.tableHeaderWrapper.className = 'el-table__header-wrapper';
    this.createEl.appendChild(this.tableHeaderWrapper);
  }

  if (!this.resizeProxy) {
    this.resizeProxy = document.createElement('div');
    this.resizeProxy.className = 'el-table__column-resize-proxy';
    this.resizeProxy.style.display = 'none';
    this.createEl.appendChild(this.resizeProxy);
  }

  if (!this.tableBodyWrapper) {
    this.tableBodyWrapper = document.createElement('div');
    this.tableBodyWrapper.className = 'el-table__body-wrapper';
    this.tableEmpty = document.createElement('div');
    this.tableEmpty.className = 'el-table__empty-block';
    this.tableEmpty.innerHTML = '<span class="el-table__empty-text">暂无数据</span>'
    this.tableBodyWrapper.appendChild(this.tableEmpty);
    this.createEl.appendChild(this.tableBodyWrapper);
  }

  if (!this.tableFixed) {
    this.tableFixed = document.createElement('div');
    this.tableFixed.className = 'el-table__fixed';
    this.createEl.appendChild(this.tableFixed);
  }

  if (!this.tableFixedRight) {
    this.tableFixedRight = document.createElement('div');
    this.tableFixedRight.className = 'el-table__fixed-right';
    this.createEl.appendChild(this.tableFixedRight);
  }
  // this.createEl.innerHTML = table;
  frag.appendChild(this.createEl);
  this.getTableEl().appendChild(frag);
  this.createTableContent();
  this.doLayout();
};

Table.prototype.doLayout = function (callback) {
  /*
  * 1、给未设置宽度的列设置默认宽度
  * 2、当所有列的宽度之和小于el的宽度时，自动适应
  * 3、当列宽之和大于el的宽度时，宽度取列设置的宽度
  */
  this.defaltColumn();
  var bodyMinWidth = 0;
  var bodyHeight = this.tableBodyWrapper.querySelector('.el-table__body').offsetHeight;
  var elWidth = this.getTableEl().offsetWidth;
  var gutterWidth = bodyHeight > this.height ? this.gutterWidth : 0;
  var fitColumnWidth = 0;
  this.createEl.style.height = this.height + 'px';
  this.scrollX = false;
  this.tableBodyWrapper.scrollTop = 0;
  this.tableBodyWrapper.scrollLeft = 0;
  this.column.forEach(function (col, index) {
    col.property = col.prop;
    if (!col.prop && col.property) {
      col.prop = col.property;
    }
    col.className = 'el-table_column_' + index;
    bodyMinWidth += parseInt(col.width || col.minWidth, 10);
    // if (col.width) {
    //   col.realWidth = col.width;
    //   fitColumnWidth += parseInt(col.width, 10);
    // }
    if (callback instanceof Function) {
      callback();
    }
  });
  let originColumn = this.column.filter((column) => typeof column.width !== 'number');
  if (originColumn.length) {
    if (bodyMinWidth < elWidth - gutterWidth) {
      var allColumnsWidth = originColumn.reduce(function (prev, column) {
        return prev + column.minWidth;
      }, 0);
      var totalFlexWidth = elWidth - bodyMinWidth - gutterWidth;
      var flexWidthPerPixel = totalFlexWidth / allColumnsWidth;
      var noneFirstWidth = 0;
      originColumn.forEach(function (col) {
        const flexWidth = Math.floor(col.minWidth * flexWidthPerPixel);
        noneFirstWidth += flexWidth;
        col.realWidth = col.minWidth + flexWidth;
      });
      originColumn.length && (originColumn[0].realWidth = originColumn[0].realWidth + (totalFlexWidth - noneFirstWidth) - 1);
    } else {
      originColumn.forEach(function (column) {
        column.realWidth = column.minWidth;
      });
    }
  } else {
    this.column.forEach(col=> {
      if (!col.width && !col.minWidth) {
        col.realWidth = 80;
      } else {
        col.realWidth = col.width || col.minWidth;
      }
    });
  }
  this.createTableContent();
};

Table.prototype.createTableContent = function () {
  this.getTableHeader(this.tableHeaderWrapper, this.column);
  this.getTableBody(this.tableBodyWrapper, this.column);
  var fixedColumn = this.column.filter(function (col) {
    return col.fixed === true || col.fixed === 'left';
  });
  var fixedRightColumn = this.column.filter(function (col) {
    return col.fixed === 'right';
  });
  if (fixedColumn.length) {
    this.getFixedTableHeader(this.tableFixed, fixedColumn); // 左固定
    this.getFixedTableBody(this.tableFixed, fixedColumn); // 左固定
  } else {
    this.tableFixed.style.width = '0';
    this.tableFixed.style.height = '0';
  }
  if (fixedRightColumn.length) {
    this.getFixedTableHeader(this.tableFixedRight, fixedRightColumn); // 右固定
    this.getFixedTableBody(this.tableFixedRight, fixedRightColumn); // 右固定
  } else {
    this.tableFixedRight.style.width = '0';
    this.tableFixedRight.style.height = '0';
  }
  const fixedLeftBodyWrapper = this.tableFixed && this.tableFixed.querySelector('.el-table__fixed-body-wrapper');
  const fixedRightBodyWrapper = this.tableFixedRight && this.tableFixedRight.querySelector('.el-table__fixed-body-wrapper');
  this.tableBodyWrapper.addEventListener('scroll', function (e) {
    let target = e.target;
    if (this.methods.handleScroll instanceof Function) {
      this.methods.handleScroll(e);
    }
    this.tableHeaderWrapper.scrollLeft = target.scrollLeft;
    if (fixedLeftBodyWrapper) fixedLeftBodyWrapper.scrollTop = target.scrollTop;
    if (fixedRightBodyWrapper) fixedRightBodyWrapper.scrollTop = target.scrollTop;
  }.bind(this));

  var mousewheelevt=(/Firefox/i.test(navigator.userAgent))?"DOMMouseScroll": "mousewheel";//FF doesn't recognize mousewheel as of FF3.x

  this.createEl.addEventListener('click', function(e) {
    e.stopPropagation();
  });
  if(document.attachEvent) {
    //if IE (and Opera depending on user setting)
    this.tableBodyWrapper.attachEvent("on"+mousewheelevt, function(e){
      if (this.scroll !== false) {
        e.stopPropagation();
      }
    }.bind(this));
  } else if(document.addEventListener) { //WC3 browsers
    this.tableBodyWrapper.addEventListener(mousewheelevt, function(e){
      if (this.scroll !== false) {
        e.stopPropagation();
      }
    }.bind(this), false);
  }
};

Table.prototype.getFixedTableHeader = function (el, column) {
  var fixedFrag = document.createDocumentFragment();
  var elTableFixedHeader = el.querySelector('.el-table__fixed-header-wrapper');
  if (elTableFixedHeader) {
    el.removeChild(elTableFixedHeader);
  }
  var fixedHeaderWrapper = document.createElement('div');
  fixedHeaderWrapper.className = 'el-table__fixed-header-wrapper';
  var allWidth = column.reduce(function (prev, column) {
    return prev + (column.realWidth || 80)
  }, 0);
  el.style.width = allWidth + 'px';
  el.style.height = (this.scrollX ? (this.height - this.gutterWidth) : this.height) + 'px';
  fixedFrag.appendChild(fixedHeaderWrapper);
  el.appendChild(fixedFrag);
  this.getTableHeader(fixedHeaderWrapper, column, true);
};

Table.prototype.getFixedTableBody = function (el, column) { // el-table__fixed-body-wrapper
  var fixedFrag = document.createDocumentFragment();
  var elTableFixedBody = el.querySelector('.el-table__fixed-body-wrapper');
  if (elTableFixedBody) {
    el.removeChild(elTableFixedBody);
  }
  this.fixedTbodyWrapper = document.createElement('div');
  this.fixedTbodyWrapper.className = 'el-table__fixed-body-wrapper';
  // let vStyle = {
  //   height: (this.scrollX ? (this.tBodyHeight - this.gutterWidth) : this.tBodyHeight) + 'px',
  //   top: Math.ceil(parseFloat(getStyle(this.tableHeader).height)) + 'px'
  // };
  let tableHeaderRect = this.tableHeader.getBoundingClientRect();
  let vStyle = {
    height: (this.scrollX ? (this.tBodyHeight - this.gutterWidth) : this.tBodyHeight) + 'px',
    top: (tableHeaderRect.height || 25) + 'px'
  };
  for (let i in vStyle) {
    this.fixedTbodyWrapper.style[i] = vStyle[i];
  }
  fixedFrag.appendChild(this.fixedTbodyWrapper);
  el.appendChild(fixedFrag);
  this.getTableBody(this.fixedTbodyWrapper, column, true);
};

Table.prototype.getTableHeader = function (el, column, isFixed) {
  (function () {
    let headFrag = document.createDocumentFragment();
    if (el.querySelector('table')) {
      el.removeChild(el.querySelector('table'));
    }
    this.tableHeader = document.createElement('table');
    this.tableHeader.className = "el-table__header";
    let tableWidth = column.reduce(function (prev, column) {
      return prev + (column.realWidth || 80)
    }, 0);
    this.tableHeader.style.width = tableWidth + 'px';
    this.getHeaderCell(column, this.tableHeader, isFixed);
    let param = {cellspacing: 0, cellpadding: 0, border: 0};
    for (let i in param) {
      this.tableHeader.setAttribute(i, param[i])
    }
    headFrag.appendChild(this.tableHeader);
    el.appendChild(headFrag);
    this.theadHeight = this.tableHeader.offsetHeight;
    this.tBodyHeight = this.height - $(this.tableHeader).height(); // Math.ceil(parseFloat(getStyle(this.tableHeader).height));
  }.bind(this))();
};

Table.prototype.getTableBody = function (el, column, isFixed) {
  (function () {
    var headFrag = document.createDocumentFragment();
    if (el.querySelector('table')) {
      el.removeChild(el.querySelector('table'));
    }
    var table = document.createElement('table');
    var tableWidth = column.reduce(function (prev, column) {
      return prev + column.realWidth;
    }, 0);
    table.className = "el-table__body";
    if (!isFixed) {
      el.style.height = this.tBodyHeight + 'px';
    }
    table.style.width = tableWidth + 'px';
    if (!isFixed) {
      if (!this.data.length) {
        this.tableEmpty.style.width = tableWidth + 'px';
        this.tableEmpty.style.display = 'block';
      } else {
        this.tableEmpty.style.display = 'none';
      }
    }
    this.getBodyCell(column, this.data, table, isFixed)
    var param = {cellspacing: 0, cellpadding: 0, border: 0};
    for (var i in param) {
      table.setAttribute(i, param[i])
    }
    headFrag.appendChild(table);
    el.appendChild(headFrag);
    let elWidth = this.getTableEl();
    if (!isFixed && tableWidth > elWidth.offsetWidth) { // scrollX
      this.scrollX = true;
    }
    if (table.offsetHeight > this.height) {
      this.gutterCol.setAttribute('width', this.gutterWidth);
      this.gutterTh.style.width = '17px';
      this.scrollY = true;
      this.tableFixedRight.style.right = this.gutterWidth + 'px';
    }
  }.bind(this))();
};

Table.prototype.getBodyCell = function (column, data, el, isFixed) {
  el.appendChild(this.getColGroup(column, el, isFixed)); // 表体的colgroup
  var trFarg = document.createDocumentFragment();
  var _this = this;
  var tBody = document.createElement('tbody');
  el.appendChild(tBody);
  data.forEach(function (tr, index) {
    var vTr = document.createElement('tr');
    if (this.rowClassName instanceof Function) {
      vTr.className = this.rowClassName(tr, index);
    }
    getTd(tr, vTr, isFixed, index);
    trFarg.appendChild(vTr);
    vTr.onclick = (function (e) { // 行点击事件
      this.handlerRowClick(e, tr, index, column);
    }.bind(this))
  }.bind(this));
  tBody.appendChild(trFarg);
  function getTd(tr, el, isFixed, index) {
    var tdFrag = document.createDocumentFragment();
    column.forEach(function (col) {
      var vCol = document.createElement('td');
      vCol.className = col.className;
      vCol.dataset.enter = true;
      vCol.dataset.index = index;
      vCol.addEventListener('mouseenter', function (e) {
       _this.handleMouseenter(e, col, tr, index)
      });
      vCol.addEventListener('mouseleave', function (e) {
        _this.handleMouseleave(e, col);
      });
      var _colHtml = '';
      if (isFixed && col.type === 'selection') {
        vCol.className = col.className + ' column_selection';
      }
      if (col.type === 'selection' && !col.fixed) {
        vCol.className = col.className + ' column_selection';
      }
      for (var i in col.style) {
        vCol.style[i] = col.style[i];
      }
      if (col.renderPopover) {
        _colHtml += '<div data-container="body" data-toggle="popover" data-placement="right" class="' + (col.type === 'selection' && (isFixed || !col.fixed) ? 'cell selection' : 'cell') + '">';
      } else {
        _colHtml += '<div class="' + (col.type === 'selection' && (isFixed || !col.fixed) ? 'cell selection' : 'cell') + '">';
      }
      if (isFixed) {
        if (col.type === 'selection') {
          if (_this.tableKey[tr[_this.nodeKey]]) {
            _colHtml += '<label id="code_'+( tr[_this.nodeKey] )+'"><input type="checkbox" class="check" checked/><span class="inner"></span></label>';
          } else {
            _colHtml += '<label id="code_'+( tr[_this.nodeKey] )+'"><input type="checkbox"/><span class="inner"></span></label>';
          }
        } else if (col.render) {
          _colHtml += col.render({row: tr, column: col}) || '';
        } else {
          _colHtml += col.formatter ? col.formatter(tr, col) : (tr[col.prop] === undefined ? '' : tr[col.prop]);
        }
      } else {
        // if (col.fixed !== true && col.fixed !== 'right') {
        if (col.type === 'selection' && (col.fixed !== true && col.fixed !== 'left' && col.fixedRight !== 'right')){
            if (_this.tableKey[tr[_this.nodeKey]]) {
              _colHtml += '<label id="code_'+( tr[_this.nodeKey] )+'"><input type="checkbox" class="check" checked/><span class="inner"></span></label>';
            } else {
              _colHtml += '<label id="code_'+( tr[_this.nodeKey] )+'"><input type="checkbox"/><span class="inner"></span></label>';
            }
          } else if (col.render) {
            _colHtml += col.render({row: tr, column: col}) || '';
          } else {
            _colHtml += col.formatter ? col.formatter(tr, col) : (tr[col.prop] === undefined ? '' : tr[col.prop]);
          }
        // }
      }
      _colHtml += '</div>';
      vCol.innerHTML = _colHtml;
      tdFrag.appendChild(vCol);
    });
    el.appendChild(tdFrag);
  }
};

Table.prototype.getHeaderCell = function (column, el, isFixed) { // thead
  var getThead = (function () {
    let frag = document.createDocumentFragment();
    let _thFrag = document.createDocumentFragment();
    let _thead = document.createElement('thead');
    let _tr = document.createElement('tr');
    let _th = '', _cell = '', _label = '', _input = '', _sortSpan = '', _iAscending = '', _iDescending, _inner = '';
    column.forEach((col) => {
      _th = document.createElement('th');
      _th.addEventListener('mousemove', function(e) {
        this.handleMousemove(e, col);
      }.bind(this));
      _th.addEventListener('mouseout', function (e) {
        this.handleMouseout(e);
      }.bind(this));
      _th.addEventListener('mousedown', function (e) {
        this.handleMousedown(e, col);
      }.bind(this));
      _th.setAttribute('colspan', 1);
      _th.setAttribute('rowspan', 1);
      _th.className = (col.sortable ? 'is-sortable' : '') + ' is-leaf ' + col.className;
      _cell = document.createElement('div');
      _th.addEventListener('click', (e) => {
        this.handleSortChange(e, col)
      });
      let _defaultColStyle = {
        textAlign: 'center'
      };
      col.headerStyle = Object.assign({}, _defaultColStyle, col.headerStyle);
      _cell.className = ( col.type === 'selection' ? 'cell selection' : 'cell' );
      for (let i in col.headerStyle) {
        _cell.style[i] = col.headerStyle[i];
      }
      if (col.type === 'selection') {
        _label = document.createElement('label');
        _inner = document.createElement('span');
        _inner.className = 'inner';
        _input = document.createElement('input');
        _input.type = 'checkbox';
        var isCheck = true;
        if (JSON.stringify(this.tableKey) == '{}') {
          isCheck = false;
        } else {
          for (let i in this.tableKey) {
            if (!this.tableKey[i]) {
              isCheck = false;
              break;
            }
          }
        }
        _input.checked = isCheck;
        _input.addEventListener('click', (e) => { // 全选
          this.handlerSelectionAll(e.target.checked);
        });
        _label.appendChild(_input);
        _label.appendChild(_inner);
        _cell.appendChild(_label);
      } else {
        _cell.innerText = col.label || '';
        if (col.sortable) {
          _sortSpan = document.createElement('span');
          _sortSpan.className = 'caret-wrapper';
          _iAscending = document.createElement('i');
          _iAscending.className = 'sort-caret ascending';
          _iDescending = document.createElement('i');
          _iDescending.className = 'sort-caret descending';
          _sortSpan.appendChild(_iAscending);
          _sortSpan.appendChild(_iDescending);
          _iAscending.addEventListener('click', (e) => { // 升序
            this.handleSortChange(e, col, 'ascending');
          }, false);
          _iDescending.addEventListener('click', (e) => { // 降序
            this.handleSortChange(e, col, 'descending');
          }, false);
          _cell.appendChild(_sortSpan);
        }
      }
      _th.appendChild(_cell);
      _tr.appendChild(_th);
      _thFrag.appendChild(_tr);
    });
    if (!isFixed) {
      this.gutterTh = document.createElement('th');
      this.gutterTh.className = 'gutter';
      this.gutterTh.style.width = '0px';
      _tr.appendChild(this.gutterTh);
    }
    _thead.appendChild(_thFrag);
    frag.appendChild(_thead);
    return frag;
  }.bind(this))();
  el.appendChild(this.getColGroup(column, el, isFixed))
  el.appendChild(getThead)
};

Table.prototype.handleSortChange = function (event, col, givenOrder) {
  const toggleOrder = (order) => {
    return !order ? 'ascending' : order === 'ascending' ? 'descending' : null;
  };
  let sortProp = '', sortCol = null;
  event.stopPropagation();
  let order = givenOrder || toggleOrder(col.order);
  let target = event.target;
  while (target && target.tagName !== 'TH') {
    target = target.parentNode;
  }

  if (target && target.tagName === 'TH') {
    if (hasClass(target, 'noclick')) {
      removeClass(target, 'noclick');
      return;
    }
  }

  if (!col.sortable) return;
  if (order) {
    col.order = order;
    sortCol = col;
    sortProp = col.prop;
  } else {
    sortProp = null;
    sortCol = null;
    col.order = null;
  }
  target.className = 'is-sortable ' + col.order;
  this.methods.sortChange({column: sortCol, prop: sortProp, order: col.order});
};

Table.prototype.getColGroup = function (columns, el, isFixed) { // 获取colGroup
  let frag = document.createDocumentFragment();
  let colFrag = document.createDocumentFragment();
  let _colGroup = document.createElement('colgroup');
  columns.forEach(function (item) {
    let col = document.createElement('col');
    col.width = item.realWidth || 80;
    colFrag.appendChild(col);
  });
  _colGroup.appendChild(colFrag);
  if (!isFixed && el.className === 'el-table__header') {
    this.gutterCol = document.createElement('col');
    // this.gutterCol.width = '0';
    this.gutterCol.setAttribute('width', '0')
    this.gutterCol.setAttribute('name', 'gutter')
    // this.gutterCol.name = 'gutter';
    _colGroup.appendChild(this.gutterCol);
  }
  frag.appendChild(_colGroup);
  return frag;
};

Table.prototype.handlerSelectionAll = function (isCheck) {
  //  全选事件
  let selectionEl = this.createEl.querySelectorAll('.column_selection'); // >td>div.cell input
  // 先找固定列中的多选
  for (let i = 0, len = selectionEl.length; i < len; i++) {
    let oInput = selectionEl[i].querySelector('input');
    oInput.checked = isCheck;
  }
  for (let n in this.tableKey) {
    this.tableKey[n] = isCheck;
  }
  this.methods.selectionChange(isCheck ? this.data : []);
};

Table.prototype.handlerRowClick = function (e, tr, index, column) {
  const obj = {
    vElTr: '',
    vElTd: ''
  };
  const getParent = (el, targetEl, property) => {
    if (el.parentNode && el.parentNode.nodeName == targetEl) {
      obj[property] = el.parentNode;
    } else {
      getParent(el.parentNode, targetEl, property);
    }
  };
  getParent(e.target, 'TR', 'vElTr');
  /*let vInput = obj.vElTr.querySelector('.column_selection input');
  if (!vInput) {
    let allTr = this.tableFixed && this.tableFixed.querySelectorAll('.el-table__body tr');
    vInput = allTr && allTr[index].querySelector('.column_selection input');
  }*/
  let vInput = this.createEl.querySelector("#code_" + tr[this.nodeKey] + " input");
  if (vInput) { // 选中事件
    let vInputTr = vInput;
    vInput.checked = !vInput.checked;
    /*
     选中当前行高亮
    if (vInput.checked) {
      addClass(obj.vElTr, this.highlightCurrentRow);
    } else {
      removeClass(obj.vElTr, this.highlightCurrentRow);
    }
    while (vInputTr && vInputTr.tagName !== 'TR') {
      vInputTr = vInputTr.parentNode;
    }
    if (vInputTr && vInputTr.tagName === 'TR') {
      if (vInput.checked) {
        addClass(vInputTr, this.highlightCurrentRow);
      } else {
        removeClass(vInputTr, this.highlightCurrentRow);
      }
    }*/
    // 获取选中的行数据
    this.tableKey[tr[this.nodeKey]] = vInput.checked;
    let selectData = this.data.filter((ta) => {
      return this.tableKey[ta[this.nodeKey]];
    });
    // tableHeader 表头
    let headerInput = this.tableHeader.querySelector('.cell.selection input');
    if (!headerInput) {
      headerInput = this.tableFixed.querySelector('.cell.selection input');
    }
    let isCheck = true;
    for (let i in this.tableKey) {
      if (!this.tableKey[i]) {
        isCheck = false;
        break;
      }
    }
    headerInput.checked = isCheck;
    this.methods.selectionChange(selectData);
  }
  if (this.methods.rowClick instanceof Function) {
    if (e.target.nodeName !== 'TD') {
      getParent(e.target, 'TD', 'vElTd');
    } else {
      obj.vElTd = e.target;
    }
    // 查找当前点击单元格对应的列
    let cellClass = obj.vElTd && obj.vElTd.className;
    let cellColumn = {};
    this.column.forEach((col) => {
      if (col.className === cellClass) {
        cellColumn = col;
      }
    });
    this.methods.rowClick(tr, e, cellColumn);
    this.methods.cellClick(tr, cellColumn, obj.vElTd, e);
  }
};

Table.prototype.watchProperty = function (key) {
  switch (key) {
    case 'height':
      this.doLayout();
      break;
    default:
      break;
  }
};

Table.prototype.handleMouseleave = function (e, col) {
  tooltip.closeTooltip();
  e.target.removeEventListener('mouseenter' ,this.handleMouseenter);
  e.target.dataset.enter = true;
  if ($) {
    $(e.target).stop();
    if ($(e.target).is(":animated")) {
      return false;
    }
  }
  if (col.hide instanceof Function) {
    this.popperHide(col, e);
    // col.hide(e);
  }
  if (this.methods.handleMouseleave instanceof Function) {
    this.methods.handleMouseleave(e, col);
  }
  let bodyTr = this.tableBodyWrapper.querySelectorAll('.el-table__body tbody tr');
  let fixedBodyTr = this.tableFixed && this.tableFixed.querySelectorAll('.el-table__body tbody tr');
  let fixedRightBodyTr = this.tableFixedRight && this.tableFixedRight.querySelectorAll('.el-table__body tbody tr');
  for (let i = 0; i < bodyTr.length; i++) {
    removeClass(bodyTr[i], 'hover-row');
    fixedBodyTr && removeClass(fixedBodyTr[i], 'hover-row');
    fixedRightBodyTr && removeClass(fixedRightBodyTr[i], 'hover-row');
  }
};

Table.prototype.handleMouseenter = function (e, col, tr, index) {
  if ($) {
    $(e.target).stop();        
    if ($(e.target).is(":animated")) {
      return false;
    }
  }
  const cell = e.target.querySelector('.cell');
  const text = cell.innerHTML;
  const dataEnter = e.target.dataset.enter;
  const vIndex = e.target.dataset.index;
  if (hasClass(cell, 'selection')) return;
  if (cell.offsetWidth < cell.scrollWidth) {
    tooltip.showPopper({
      reference: cell,
      content: text,
      type: 'tooltip',
      placement: 'top-start',
    });
  }
  if (col.show instanceof Function) {
    this.tablePopper(e, col, tr, index);
    // col.show(e, col, tr, index);
  }
  // if (dataEnter) {
  if (col.renderPopover) {
    e.target.dataset.enter = false;
    col.renderPopover({column: col, row: tr, el: cell});
  }
  // }
  // 行hover高亮以及选中高亮
  let bodyTr = this.tableBodyWrapper.querySelectorAll('.el-table__body tbody tr');
  let fixedBodyTr = this.tableFixed && this.tableFixed.querySelectorAll('.el-table__body tbody tr');
  let fixedRightBodyTr = this.tableFixedRight && this.tableFixedRight.querySelectorAll('.el-table__body tbody tr');
  addClass(bodyTr[index], 'hover-row');
  fixedBodyTr && addClass(fixedBodyTr[index], 'hover-row');
  fixedRightBodyTr && addClass(fixedRightBodyTr[index], 'hover-row');
};


Table.prototype.handleMousemove = function(event, column) {
  // resizeProxy
  let target = event.target;
  while (target && target.tagName !== 'TH') {
    target = target.parentNode;
  }
  if(!this.dragging) {
    const bodyStyle = document.body.style;
    var rect = target.getBoundingClientRect();
    if (rect.width > 12 && rect.right - event.pageX < 8) {
      bodyStyle.cursor = 'col-resize';
      this.draggingColumn = column;
    } else if (!this.dragging) {
      bodyStyle.cursor = '';
      this.draggingColumn = null;
    }
  }
};
Table.prototype.handleMouseout = function() {
  document.body.style.cursor = '';
};

Table.prototype.handleMousedown = function (event, column) {
  if (this.draggingColumn) {
    let table = this.createEl;
    this.resizeProxy.style.display = 'block';
    const columnEl = this.tableHeaderWrapper.querySelector(`th.${column.className}`);
    // tableHeaderWrapper
    const tableLeft = table.getBoundingClientRect().left;
    const columnRect = columnEl.getBoundingClientRect();
    const minLeft = columnRect.left - tableLeft + 30;
    this.dragState = {
      startMouseLeft: event.clientX,
      startLeft: columnRect.right - tableLeft,
      startColumnLeft: columnRect.left - tableLeft,
      tableLeft
    };
    this.resizeProxy.style.left = this.dragState.startLeft + 'px';
    document.onselectstart = function () { return false; };
    document.ondragstart = function () { return false; };
    const handleMouseMove = (event) => {
      const deltaLeft = event.clientX - this.dragState.startMouseLeft;
      const proxyLeft = this.dragState.startLeft + deltaLeft;
      this.resizeProxy.style.left = Math.max(minLeft, proxyLeft) + 'px';
    };
    const handleMouseUp = () => {
      const {
        startColumnLeft,
      } = this.dragState;
      const finalLeft = parseInt(this.resizeProxy.style.left, 10);
      const columnWidth = finalLeft - startColumnLeft;
      column.width = columnWidth;
      document.body.style.cursor = '';
      this.dragState = {};
      this.resizeProxy.style.display = 'none';
      let scrollLeft = this.tableBodyWrapper.scrollLeft;
      this.doLayout(function() {
        this.tableBodyWrapper.scrollLeft = scrollLeft;
      }.bind(this));
      this.dragging = false;
      this.draggingColumn = null;
      document.onselectstart = null;
      document.ondragstart = null;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }
};

Table.prototype.load = function (options) {
  for (var i in options.data) {
    if (this.hasOwnProperty(i)) {
      this[i] = options.data[i];
    }
  }
  this.getTableKey();
  this.doLayout();
  this.toggleRowSelection([]); // 重新加载数据时清空选中的数据
  // this.createTableContent();
};

Table.prototype.toggleRowSelection = function(checkData) {
  for (let i in this.tableKey) {
    if (checkData.indexOf(i) !== -1) {
      let checkbox = this.createEl.querySelector('#code_' + i + ' input');
      checkbox.checked = true
      this.tableKey[i] = true;
    }
  }
  let selectData = this.data.filter((ta) => {
    return this.tableKey[ta[this.nodeKey]];
  });
  this.methods.selectionChange(selectData);
};
window.Table = Table;
