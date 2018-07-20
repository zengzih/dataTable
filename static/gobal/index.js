var utils = {
  /** 数组的深拷贝，仅限 简单元素
   方式1,  arr = vArr.concat(),
   方式2,  arr = vArr.slice(0)
   * 方式3,如下
   */
  arrClone: function (vArr) {
    var arr = [];
    this.myForEach(vArr, function (index, element) {
      arr.push(element);
    })
    return arr;
  },
  //复制为新对象
  objClone: function (srcObj, openDeepClone) {
    return openDeepClone ? this.objDeepClone(srcObj) : this.objExtendClone(srcObj);
  },
  //复制属性 给新对象
  objPropertyClone: function (srcObj, cloneObj, openDeepClone) {
    return openDeepClone ? this.objDeepClone(srcObj, cloneObj) : this.objExtendClone(srcObj, cloneObj);
  },
  /** 对象的浅拷贝， 用于简单的对象继承，非构造函数的继承
   拷贝有一个问题。那就是，如果父对象的属性等于数组或另一个对象，那么实际上，子对象获得的只是一个内存地址，而不是真正拷贝，因此存在父对象被篡改的可能。
   */
  objExtendClone: function (srcObj, cloneObj, isOnlyExistProperty, isNumToString) {
    if (typeof srcObj != "object") return srcObj;//仅针对 object 和array
    var cloneObj = cloneObj !== undefined ? cloneObj : this.isArray(srcObj) ? [] : {};
    for (var i in srcObj) {
      cloneObj[i] = srcObj[i];
    }

    return cloneObj;
  },
  /** 深度拷贝
   *  方式1转换成json再转换成对象实现对象的深拷贝  var obj2 = JSON.parse(JSON.stringify(obj))
   *  方式2 仅复制显示的属性
   */
  objDeepClone: function (srcObj, cloneObj) {
    if (typeof srcObj != "object") return srcObj;//仅针对 object 和array
    var isNoCloneObj = cloneObj === undefined;
    var cloneObj = cloneObj !== undefined ? cloneObj : this.isArray(srcObj) ? [] : {};
    //	 if(isNoCloneObj){
    //	 	cloneObj = JSON.parse(JSON.stringify(srcObj)); //不适用于 正则或非json、的对象
    //	 }else {
    for (var i in srcObj) {
      if (utils.isObject(srcObj[i])) { // type=== 'object' 这样判断 仍然发现null 错误
        cloneObj[i] = (srcObj[i].constructor === Array) ? [] : {};
        this.objDeepClone(srcObj[i], cloneObj[i]);
      } else {
        cloneObj[i] = srcObj[i];
      }
    }
    return cloneObj;
  },
  //对 已有的form对象 进行属性赋值(只赋值已存在的属性)并将数字转换为字符串类型方便 选择框的选中
  formDataCopy: function (cloneObj, srcObj, isOnlyExistProperty, isNumToString) {
    isOnlyExistProperty = isOnlyExistProperty === undefined ? true : isOnlyExistProperty;
    isNumToString = isNumToString === undefined ? true : isNumToString;
    request.objExtendClone(srcObj, cloneObj, isOnlyExistProperty, isNumToString);
  },
  myForEach: function (arr, callback) {
    if (utils.isNotEmpty(arr)) { // && arr.length > 0
      for (var i = 0,
             len = arr.length; i < len; i++) {
        callback && callback(i, arr[i]);
      }
    }
//        else {
//            console.debug('myForEach中该对象arr不能为空！');
//        }
  },
  //treeNode：节点的 【listNodeName】属性数组，  深度优先搜索(DFS)是图论中的经典算法//非递归深度优先实现  效率更高更安全
  depthFirstSearchList: function (treeNode, listNodeName, callback) {
    var treeNodes = [];
    treeNodes = utils.isArray(treeNode) ? treeNode : utils.isObject(treeNode) ? treeNode[listNodeName] : treeNodes;
    if (utils.isEmpty(treeNodes)) {
      return;
    }
    var _this = this;
    var idArr = [],
      stack = [];
    //先将第一层节点放入栈
    utils.myForEach(treeNodes, function (index, sonObj) {
      stack.push(sonObj);
    })
    var treeNode;
    while (stack.length) {
      treeNode = stack.shift();
      callback & callback(treeNode, idArr);
      //如果该节点有子节点，继续添加进入栈顶
      if (treeNode[listNodeName] && treeNode[listNodeName].length) {
        stack = treeNode[listNodeName].concat(stack);
      }
    }
    return idArr;
  },
  //treeNode：单个对象的【listNodeName】属性
  depthFirstSearchObj: function (treeNode, PropertityName, callback) {
    var treeNodePropertity = treeNode[PropertityName];
    if (utils.isEmpty(treeNodePropertity)) {
      return;
    }
    var _this = this;
    var propertitiesArr = [],
      stack = [];
    //先将第一层节点放入栈
    stack.push(treeNodePropertity);
    var treeNodePropertity2, treeNode;
    while (stack.length) {
      treeNodePropertity2 = stack.shift();
      treeNode = callback(treeNodePropertity2, propertitiesArr);
      //如果该节点有子节点，继续添加进入栈顶
      if (utils.isNotEmpty(treeNode[PropertityName])) {
        stack.push(treeNode[PropertityName]);
      }
    }
    return propertitiesArr;
  },

  treeToArray: function (data, parent, level, expandedAll) {
    var tmp = []
    var newData = data;
    newData.forEach(function (record) {
      if (record._expanded === undefined) {
        Vue.set(record, '_expanded', expandedAll)
      }
      if (parent) {
        Vue.set(record, '_parent', parent)
      }
      var _level = 0
      if (level !== undefined && level !== null) {
        _level = level + 1
      }
      Vue.set(record, '_level', _level);
      if (record.firstLoad === undefined && record.children) {
        Vue.set(record, 'firstLoad', false);
      }
      tmp.push(record)
      if (record.children && record.children.length > 0) {
        var children = utils.treeToArray(record.children, record, _level, expandedAll);
        tmp = tmp.concat(children);
      }
    });
    /*Array.from(data).forEach(function (record) { //此方法IE不支持
        if (record._expanded === undefined) {
          Vue.set(record, '_expanded', expandedAll)
        }
        if (parent) {
          Vue.set(record, '_parent', parent)
        }
        var _level = 0
        if (level !== undefined && level !== null) {
          _level = level + 1
        }
        Vue.set(record, '_level', _level)
        tmp.push(record)
        if (record.children && record.children.length > 0) {
          var children = utils.treeToArray(record.children, record, _level, expandedAll);
          tmp = tmp.concat(children);
        }
      })*/
    return tmp
  },

  /** Js判断参数(String,Array,Object)是否为undefined或者值为空*/
  isEmpty: function (str) {
    //           if(typeof str== 'undefined' || str == null) { // 等同于 value === undefined || value === null
    //               return true;
    //           }
    var type = utils.getDataType(str);
    switch (type) {
      case 'Undefined':
      case 'Null':
        return true;
      case 'String':
        return (str = str.replace(/^\s|\s$/g, '')).length == 0 || str == 'null';
      case 'Array':
        return str.length == 0;
      case 'Object':
        return utils.isEmptyObject(str); // 普通对象使用 for...in 判断，有 key 即为 false
      default:
        return false; // 其他对象均视作非空
    }
  },
  isNotEmpty: function (v) {
    return !utils.isEmpty(v);
  },
  isEmptyObject: function (obj) {
    var name;
    for (name in obj) {
      return false;
    }
    return true;
  },
  isString: function (str) {
    return 'String' == utils.getDataType(str);
  },
  isArray: function (str) {
    return 'Array' == utils.getDataType(str);
  },
  isObject: function (str) {
    return 'Object' == utils.getDataType(str);
  },
  isFunction: function (str) {
    return 'Function' == utils.getDataType(str);
  },
  isNumber: function (str) {
    return 'null' !== str + '' && str !== '' && !isNaN(str);  //'Number' == utils.getDataType(str);
  },
  isDate: function (str) {
    return 'Date' == utils.getDataType(str);
  },
  isDateStr: function (str) {
    return utils.dateStrCheck(str);
    //return  'Object' == utils.isObject(str) && str instanceof Date;
  },
  getDataType: function (str) {
    type = Object.prototype.toString.call(str).slice(8, -1);
    return type;
  },
  trim: function (str) { //删除左右两端的空格
    return str.replace(/(^\s*)|(\s*$)/g, "");
  },
  clearAllEmpty: function (str){ //删除字符串的所有空格
    return str.replace(/\s*/g, "");
  },
  strToArray: function (str){ //字符串转数组
    return str.match(/./g);
  },
  dateDayGap: function (dateStrBegin, dateStrEnd) { //查询 两个 日期间隔天数
    if (!dateStrBegin || !dateStrEnd) return 0;
    var date1 = utils.tranferCompatibleDate(dateStrBegin);
    var date2 = utils.tranferCompatibleDate(dateStrEnd);
    var s1 = date1.getTime(),
      s2 = date2.getTime();
    var total = (s2 - s1) / 1000;
    var day = parseInt(total / (24 * 60 * 60)); //计算整数天数
    //console.log("dayD : " + day);
    return day;
  },
  //	 1 短时间，形如 (23:30:06)
  isDateTimeHMS: function (str) {
    if (utils.checkObjTypeIsInvalid(str, 'String')) return false;
    var a = str.match(/^(\d{1,2})(:)?(\d{1,2})\2(\d{1,2})$/);
    if (a == null) {
      console.error('传入的str=' + str + '不是时间格式！');
      return false;
    }
    if (a[1] > 24 || a[3] > 60 || a[4] > 60) {
      console.error('传入的str=' + str + '时间格式不对！');
      return false;
    }
    return true;
  },
  //2. 短日期，形如 (2008-09-13)
  isDateTimeYMD: function (str) {
    if (utils.checkObjTypeIsInvalid(str, 'String')) return false;
    var r = str.match(/^(\d{1,4})(-|\/)(\d{1,2})\2(\d{1,2})$/);
    if (r == null) return false;
    var d = new Date(r[1], r[3] - 1, r[4]);
    return (d.getFullYear() == r[1] && (d.getMonth() + 1) == r[3] && d.getDate() == r[4]);
  },
  //3 长时间，形如 (2008-09-13 23:30:06)
  isDateTimeYMDHMS: function (str) {
    if (utils.checkObjTypeIsInvalid(str, 'String')) return false;
    var reg = /^(\d{1,4})(-|\/)(\d{1,2})\2(\d{1,2}) (\d{1,2}):(\d{1,2}):(\d{1,2})$/;
    var r = str.match(reg);
    if (r == null) return false;
    var d = new Date(r[1], r[3] - 1, r[4], r[5], r[6], r[7]);
    return (d.getFullYear() == r[1] && (d.getMonth() + 1) == r[3] && d.getDate() == r[4] && d.getHours() == r[5] && d.getMinutes() == r[6] && d.getSeconds() == r[7]);
  },
  dateStrCheck: function (dateStr) {
    return utils.isDateTimeYMDHMS(dateStr) || utils.isDateTimeYMD(dateStr); // || utils.isDateTimeHMS(dateStr) ;
  },
  //转换成 浏览器兼容的时间格式对象
  tranferCompatibleDate: function (vDate) {
    var vDate = (typeof vDate == 'string' ?  vDate.split('.')[0] : vDate);
    if (utils.isString(vDate) && utils.isDateStr(vDate)) {
      vDate = vDate.replace(new RegExp(/-/gm), '/'); //将所有的'-'转为'/'即可 解决IE、firefox浏览器下JS的new Date()的值为Invalid Date、NaN-NaN的问题
      return new Date(vDate);
    } else if (utils.isString(vDate)) { //针对这种数据先如此处理 "2017-04-15T10:56:31.958Z"
      return new Date(vDate);
    } else if (utils.isDate(vDate)) { //标准日期格式  Sat Apr 15 2017 13:54:50 GMT+0800 (中国标准时间)
      return new Date(vDate);
    } else if (utils.isNumber(vDate) || utils.isObject(vDate)) {
      try {
        return new Date(vDate);
      } catch (e) {
        console.error('传入的对象=' + vDate + '转换成日期对象异常！');
        return vDate;
      }
    } else {
      console.error('传入的date=' + vDate + '不是正确的日期格式！');
      return;
    }

  },
  getArrayMax: function (arr) {
    if (utils.checkObjTypeIsInvalid(arr, 'Array')) return arr;
    var max = arr[0];
    var len = arr.length;
    for (var i = 1; i < len; i++) {
      if (arr[i] > max) {
        max = arr[i];
      }
    }
    return max;
  },
  getStringNoRepeat: function (str, separator) {
    if (utils.isEmpty(str)) {
      return str;
    }
    separator = utils.isEmpty(separator) ? ' ' : separator;
    //var sepratorV = separator == ' ' ? (/[ ]+/) : separator == ';' ? (/[;]/) : '其他分隔符';
    var sepratorV = separator == ' ' ? (/[ ]+/) : separator == ';' ? (/[;]/) : separator;
    if (sepratorV == '其他分隔符') {
      return str;
    }
    var words = str.split(sepratorV);
    var uniqueArr = utils.getArrayNoRepeated(words);
    str = uniqueArr.join(separator);
    return str;
  },
  getStringNoRepeatAndReplace: function (str, prefix, replaceElement, separator, noFindToAdd) {
    if (utils.isEmpty(str)) {
      return replaceElement;
    }
    separator = utils.isEmpty(separator) ? ' ' : separator;
    var sepratorV = separator == ' ' ? (/[ ]+/) : separator == ';' ? (/[;]/) : '其他分隔符';
    if (sepratorV == '其他分隔符') {
      return str;
    }
    var words = str.split(sepratorV);
    var uniqueArr = utils.getArrayNoRepeated(words);
    var uniqueReplaceArr = utils.replaceArrayElementByPrefix(uniqueArr, prefix, replaceElement, noFindToAdd === undefined ? true : noFindToAdd);
    str = uniqueReplaceArr.join(separator);
    return str;
  },
  /**数组去重*/
  getArrayNoRepeated: function (arr) {
    if (utils.checkObjTypeIsInvalid(arr, 'Array')) return arr;
    var res = [];
    var json = {};
    for (var i = 0; i < arr.length; i++) {
      if (!json[arr[i]]) {
        res.push(arr[i]);
        json[arr[i]] = 1;
      }
    }
    return res;
  },
  replaceArrayElementByPrefix: function (arr, prefix, replaceElement, noFindToAdd) {
    if (utils.checkObjTypeIsInvalid(arr, 'Array')) return arr;
    var isFind = false;
    for (var i = 0; i < arr.length; i++) {
      if (arr[i].indexOf(prefix) == 0) { // =0以此开头 =-1不包含，大于0 包含该字符串
        arr[i] = replaceElement;
        isFind = true;
      }
    }
    if (!isFind && noFindToAdd) {
      arr.push(replaceElement);
    }
    return arr;
  },
  isArrContainsValue: function (arr, obj) {
    if (utils.checkObjTypeIsInvalid(arr, 'Array')) return false;
    var i = arr.length;
    while (i--) {
      if (arr[i] === obj) {
        return true;
      }
    }
    return false;
  },
  checkObjTypeIsInvalid: function (obj, type) {
    var valid = true;
    switch (type) {
      case 'String':
        valid = utils.isString(obj);
        break;
      case 'Array':
        valid = utils.isArray(obj);
        break;
      case 'Object':
        valid = utils.isObject(obj);
        break;
      default:
        valid = true;
        break;
    }
    if (!valid) {
      console.debug('传入的对象不是' + type + '类型！');
    }
    return !valid;
  },
  myIndexOf: function (str, matchStr, isIgnoreCase) {
    if (utils.checkObjTypeIsInvalid(str, 'String') || utils.checkObjTypeIsInvalid(matchStr, 'String')) return -1;
    var mm = isIgnoreCase ? 'i' : '';
    var re = eval('/' + matchStr + '/' + mm);
    var rt = str.match(re);
    return (rt == null) ? -1 : rt.index;
  },
  myIndexOf2: function (srcStr, matchStr) { //都转成大写比较
    if (utils.checkObjTypeIsInvalid(srcStr, 'String') || utils.checkObjTypeIsInvalid(matchStr, 'String')) return -1;
    //        arg1是子串，arg2是原来的串,存在就返回其下标，不存在返回undefined
    var arr1 = [],
      arr2 = [];
    arr1 = matchStr.split('');
    arr2 = srcStr.split('');
    for (var i = 0; i < arr2.length; i++) {
      if (arr1[0] == arr2[i]) {
        for (var g = 0; g < arr1.length; g++) {
          if (arr1[g] !== arr2[g + i]) {
            break;
          }
          if (g == arr1.length - 1) {
            return i;
          }
        }
      } else {
        continue;
      }
    }
  },
  myAssign: function () { //解决IE浏览器下 对象不支持“assign”属性或方法
    var vm = this;
    if (Object.prototype.constructor.hasOwnProperty("assign")) {
      return Object.assign.apply(vm, arguments);
    } else {
      return utils.myObjectAssign.apply(vm, arguments);
    }
  },
  myObjectAssign: function () {
    'use strict';
    var target = arguments[0];
    // 第一个参数为空，则抛错
    if (target === undefined || target === null) {
      throw new TypeError('Cannot convert first argument to object');
    }

    var to = Object(target);
    // 遍历剩余所有参数
    for (var i = 1; i < arguments.length; i++) {
      var nextSource = arguments[i];
      // 参数为空，则跳过，继续下一个
      if (nextSource === undefined || nextSource === null) {
        continue;
      }
      nextSource = Object(nextSource);

      // 获取改参数的所有key值，并遍历
      var keysArray = Object.keys(nextSource);
      for (var nextIndex = 0,
             len = keysArray.length; nextIndex < len; nextIndex++) {
        var nextKey = keysArray[nextIndex];
        var desc = Object.getOwnPropertyDescriptor(nextSource, nextKey);
        // 如果不为空且可枚举，则直接浅拷贝赋值
        if (desc !== undefined && desc.enumerable) {
          to[nextKey] = nextSource[nextKey];
        }
      }
    }
    return to;
  },
  getWordByteLength: function (str) {
    if (utils.checkObjTypeIsInvalid(str, 'String')) return str;
    str = str.replace(/[^\\x00-\\xff]/g, '**');
    return str.length;
  },
  /**千分位 处理工具类*/
  isCommafy: function (num) {
    var isCommafy = false;
    if (utils.isString(num) && num.indexOf(",") > -1) {
      isCommafy = utils.isNumber(num.split(',').join(""));
    }
    return isCommafy;
  },
  commafyBack: function (num) {
    //var x = (num+ '').split(',');
    //return parseFloat(x.join(""));
    if (utils.trim((num + "")) == "") {
      return "";
    }
    num = num.replace(/,/gi, '');
    return num;
  },
  commafy: function (num) {
    if (typeof num == 'object' || typeof num == 'boolean') {
      return '';
    }

    if (utils.trim((num + "")) == "") {
      return "";
    }
    if (isNaN(num)) {
      return "";
    }
    num = num + "";

    if (/^.*\..*$/.test(num)) {
      var pointIndex = num.lastIndexOf(".");
      var intPart = num.substring(0, pointIndex);
      var pointPart = num.substring(pointIndex + 1, num.length);
      intPart = intPart + "";
      var re = /(-?\d+)(\d{3})/
      while (re.test(intPart)) {
        intPart = intPart.replace(re, "$1,$2")
      }
      num = intPart + "." + pointPart;
    } else {
      num = num + "";
      var re = /(-?\d+)(\d{3})/
      while (re.test(num)) {
        num = num.replace(re, "$1,$2")
      }
    }
    return num;

  },

  isIEbrowser: function () { //ie? IE11的userAgent里是没有MSIE标志
    return (!!window.ActiveXObject || "ActiveXObject" in window);
  },
  consoleObj: function (_obj) {
    console.debug('打印对象属性= ' + this.obj2String(_obj));
  },
  consoleObj: function (tip, _obj) {
    console.debug(tip + '= ' + this.obj2String(_obj));
  },
  /**
   * 将JS的任意对象输出为json格式字符串
   * @param {Object} _obj: 需要输出为string的对象
   */
  obj2String: function (_obj) { // 调试打印 对象值
    var t = typeof(_obj);
    if (t != 'object' || _obj === null) {
      // simple data type
      if (t == 'string') {
        // _obj = '"' + _obj + '"';//
        _obj = '"' + _obj.replace(/([\'\"\\])/g, '\\$1').replace(/(\n)/g, '\\n').replace(/(\r)/g, '\\r').replace(/(\t)/g, '\\t') + '"';
      }
      return String(_obj);
    } else {
      if (_obj instanceof Date) {
        return _obj.toLocaleString();
      } // recurse array or object
      var n, v, json = [],
        arr = (_obj && _obj.constructor == Array);
      for (n in _obj) {
        v = _obj[n];
        t = typeof(v);
        if (t == 'string') {
          v = '"' + v + '"';
        } else if (t == 'object' && v !== null) {
          v = this.obj2String(v);
        }
        json.push((arr ? '' : '"' + n + '":') + String(v));
      }
      return (arr ? '[' : '{') + String(json) + (arr ? ']' : '}');
    }
  },

  //hash值比较 目前用于多选框
  hash: function (input) {
    var hash = 5381;
    var I64BIT_TABLE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-'.split('');
    var i = input.length - 1;
    if (typeof input == 'string') {
      for (; i > -1; i--)
        hash += (hash << 5) + input.charCodeAt(i);
    }
    else {
      for (; i > -1; i--)
        hash += (hash << 5) + input[i];
    }
    var value = hash & 0x7FFFFFFF;

    var retValue = '';
    do {
      retValue += I64BIT_TABLE[value & 0x3F];
    }
    while (value >>= 6);
    return retValue;
  },
  //全角转换为半角函数
  toCdb: function (str) {
    var tmp = "";
    for (var i = 0; i < str.length; i++) {
      if (str.charCodeAt(i) > 65248 && str.charCodeAt(i) < 65375) {
        tmp += String.fromCharCode(str.charCodeAt(i) - 65248);
      } else {
        tmp += String.fromCharCode(str.charCodeAt(i));
      }
    }
    return tmp
  },
  // 两个浮点数求和
  accAdd: function (num1, num2) {
    var r1, r2, m;
    try {
      r1 = num1.toString().split('.')[1].length;
    } catch (e) {
      r1 = 0;
    }
    try {
      r2 = num2.toString().split(".")[1].length;
    } catch (e) {
      r2 = 0;
    }
    m = Math.pow(10, Math.max(r1, r2));
    // return (num1*m+num2*m)/m;
    return Math.round(num1 * m + num2 * m) / m;
  },
  // 两个浮点数相减
  accSub: function (num1, num2) {
    var r1, r2, m;
    try {
      r1 = num1.toString().split('.')[1].length;
    } catch (e) {
      r1 = 0;
    }
    try {
      r2 = num2.toString().split(".")[1].length;
    } catch (e) {
      r2 = 0;
    }
    m = Math.pow(10, Math.max(r1, r2));
    n = (r1 >= r2) ? r1 : r2;
    return (Math.round(num1 * m - num2 * m) / m).toFixed(n);
  },
  /*金额数字 转换成 大写*/
  convertCurrency: function (money) {
    //汉字的数字
    var cnNums = new Array('零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖');
    //基本单位
    var cnIntRadice = new Array('', '拾', '佰', '仟');
    //对应整数部分扩展单位
    var cnIntUnits = new Array('', '万', '亿', '兆');
    //对应小数部分单位
    var cnDecUnits = new Array('角', '分', '毫', '厘');
    //整数金额时后面跟的字符
    var cnInteger = '整';
    //整型完以后的单位
    var cnIntLast = '元';
    //最大处理的数字
    var maxNum = 999999999999999.9999;
    //金额整数部分
    var integerNum;
    //金额小数部分
    var decimalNum;
    //输出的中文金额字符串
    var chineseStr = '';
    //分离金额后用的数组，预定义
    var parts;
    if (money == '') {
      return '';
    }
    money = parseFloat(money);
    if (money >= maxNum) {
      //超出最大处理数字
      return '';
    }
    if (money == 0) {
      chineseStr = cnNums[0] + cnIntLast + cnInteger;
      return chineseStr;
    }
    //转换为字符串
    money = money.toString();
    if (money.indexOf('.') == -1) {
      integerNum = money;
      decimalNum = '';
    } else {
      parts = money.split('.');
      integerNum = parts[0];
      decimalNum = parts[1].substr(0, 4);
    }
    //获取整型部分转换
    if (parseInt(integerNum, 10) > 0) {
      var zeroCount = 0;
      var IntLen = integerNum.length;
      for (var i = 0; i < IntLen; i++) {
        var n = integerNum.substr(i, 1);
        var p = IntLen - i - 1;
        var q = p / 4;
        var m = p % 4;
        if (n == '0') {
          zeroCount++;
        } else {
          if (zeroCount > 0) {
            chineseStr += cnNums[0];
          }
          //归零
          zeroCount = 0;
          chineseStr += cnNums[parseInt(n)] + cnIntRadice[m];
        }
        if (m == 0 && zeroCount < 4) {
          chineseStr += cnIntUnits[q];
        }
      }
      chineseStr += cnIntLast;
    }
    //小数部分
    if (decimalNum != '') {
      var decLen = decimalNum.length;
      for (var i = 0; i < decLen; i++) {
        var n = decimalNum.substr(i, 1);
        if (n != '0') {
          chineseStr += cnNums[Number(n)] + cnDecUnits[i];
        }
      }
    }
    if (chineseStr == '') {
      chineseStr += cnNums[0] + cnIntLast + cnInteger;
    } else if (decimalNum == '') {
      chineseStr += cnInteger;
    }
    return chineseStr;

  },
  openMenu: function(params) {
    try {
      if (window.top.vm) {
        window.top.vm.$refs.admin.tabsAppend(params);
      }
    } catch (e) {
      window.open(params.url, params.label);
    }
  }
};
var gobal = {
  formatter: function (row, columnProperty, formats) {
    var columnOptions = formats[columnProperty];
    var fieldValue = row[columnProperty];
    if (columnOptions) {
      return this.dataFormat(fieldValue, columnOptions);
    } else {
      return fieldValue;
    }
  },

  dataFormat: function (fieldValue, columnOptions) {
    if (utils.isNotEmpty(columnOptions) && utils.isNotEmpty(fieldValue)) {
      if (columnOptions.format == "yyyy-MM-dd" || columnOptions.format == "yyyy-MM" || columnOptions.format == "yyyy" ||
        columnOptions.format == "HH:mm:ss" || columnOptions.format == "yyyy-MM-dd HH:mm:ss"
      ) {//后期改用正则 匹配
        return this.dateFormat(fieldValue, columnOptions.format);
      } else if (utils.isNumber(fieldValue)) {
        this.analyseNumberFormat(columnOptions, columnOptions.format);
        return this.getFormdata(fieldValue, columnOptions);
      } else {
        //其他格式暂不处理，后期扩充
        return fieldValue;
      }
    }
  },
  dateFormat: function (dateStr, dateFormat) {
    if (!isNull(dateStr)) {
      return utils.tranferCompatibleDate(dateStr).Format(dateFormat || "yyyy-MM-dd");
    }
  },
  getFormdata: function (fieldValue, columnOptions) {
    var transitionValue = "";
    /*
         dataType：要将数据转换的类型
         isToFixed：要保留的小数位（int）,若为空则不处理
         isMillionYuan: 要转换的单位（如10000 就是转换为万元）
         isSeparator:是否需要千位分隔符(boolean)
         isCurrency:是否需要币种(boolean)
         currencyCode:币种(0:rmb,1:美金)
         isZeroFixed:(0后面是否要添加小数位)
         * //p1-金额;p2-是否转化成万;p3-是否产生千位分隔符;p4-是否返回币种;p5-币种 p6-小数位 p7-整数是否需要加上小数位 ;
         * */
    //alert(tranToMillionYuan(20000.1562,false,true,false,false,2));
    var isToFixed = false;
    var isMillionYuan = false;
    var isSeparator = false;
    var isCurrency = false;
    var currencyCode = false;
    var isIntFixed = false;
    var isZeroFixed = false;

    try {
      isToFixed = columnOptions.isToFixed;
      isMillionYuan = columnOptions.isMillionYuan;
      isSeparator = columnOptions.isSeparator;
      isCurrency = columnOptions.isCurrency;
      currencyCode = columnOptions.currencyCode;
      isIntFixed = columnOptions.isIntFixed;
      isZeroFixed = columnOptions.isZeroFixed;
      var multiplier = columnOptions.multiplier;
    } catch (e) {
      console.log(e);
    }
    transitionValue = tranToMi(fieldValue, isMillionYuan, isSeparator, isCurrency, currencyCode, isToFixed, isIntFixed, isZeroFixed, multiplier);
    return transitionValue;
  },
  analyseNumberFormat: function (columnOptions, numberFormat) {
    //console.log("numberFormat=" + numberFormat);
    var columnOptions = columnOptions || {};

    var integerPart = null;//剩余部分
    var decimalsPart = null;
    if (numberFormat.indexOf(".") > -1) {
      numberPart = numberFormat.split(".");
      integerPart = numberPart[0];//剩余部分
      decimalsPart = numberPart[1];

      if (decimalsPart.indexOf("#") == -1) {
        var isToFixedPart = decimalsPart.split("").length;
        columnOptions.isToFixed = isToFixedPart;
      }
    } else {
      integerPart = numberFormat;
      columnOptions.isToFixed = 0;
    }

    var currencyCode = numberFormat.indexOf("￥") > -1 ? 0 : numberFormat.indexOf("$") > -1 ? 1 : false;
    columnOptions.isCurrency = utils.isNumber(currencyCode);
    columnOptions.currencyCode = currencyCode;
    if (columnOptions.isCurrency) {
      integerPart = integerPart.substr(1);
    }

    var separatorPart = integerPart.split(",");
    var integerPart = separatorPart[0];//剩余部分
    var separatorStr = separatorPart[1];
    columnOptions.isSeparator = separatorStr.split("").length === 3 ? true : false;
  }
};


//判定对象是否为空
function isNull(data) {
  return ((data == '' || data == undefined || data == null || data == 'undefined') ? true : false);
};

function isNumber(val) {
  if (val === undefined) {
    return false;
  } else if (!isNaN(val)) {
    return true;
  } else {
    return false;
  }
} //获得币种名称
function getCurrencyName(currency) {
  return (currency == '0' ? '元' : '美金');
} //将金额转化成万元
//p1-金额;p2-转换单位;p3-是否产生千位分隔符;p4-是否返回币种;
// p5-币种;p6-要保留的小数位数 p7-对于整数是否需要加上小数位(.00)
// p8 0是后面是否要保留小数位;p9-乘数因子
function tranToMillionYuan(p1, p2, p3, p4, p5, p6, p7, p8, p9) {
  var currency = '';
  var amount;
  var numberArc;
  if (p1 == 0 && !p8) {
    return p1;
  }
  var decimal = 0;
  p1 = p1.toString();
  if (p1.indexOf('.') > 0) {
    decimal = p1.substr(p1.indexOf('.') + 1, p1.length - 1).length;
  }
  p6 = utils.isNotEmpty(p6) ? p6 : decimal;
  if (p1.toString().indexOf('.') == -1 && !p7 && !p2) {
    p6 = 0;
  } //如果需要返回币种，先获得币种名称
  if (p4 == true) {
    // currency = "(" + (p2 == true ? '万' : '') + getCurrencyName(p5) + ")";
  } //加入传入的金额格式不正确;
  if (isNaN(p1) || p1 == 0) {
    var retP1 = Number(p1).toFixed(p6);
    return retP1.toString() + (p4 == true ? currency : '');
  } //判定是否能被1W整除，转化成万元,
  /*if (p2 == true) {
	     amount = (!(p1 % 10000) ? p1 * 10000 / (10000 * 10000) : p1 * 10000 / (10000.0 * 10000));
	     }*/

  if (p2) { //p2:要转换的单位（万元，亿元等等）
    var vp2 = p2 + '.0';
    amount = (!(p1 % p2) ? p1 * p2 / (p2 * p2) : p1 * p2 / (vp2 * p2));
  } else {
    amount = p1;
  }
  if (p9) {
    amount = amount * p9;
  } //是否产生千位分隔符
  if (p3 == true) {
    amount = addThousSeparator(amount, p6);
  } else {
    amount = Number(amount).toFixed(p6);
  }
  return amount;
} //实现千位分隔符
function addThousSeparator(nbr, p6) {
  var negative = true;
  if (nbr < 0) {
    negative = false;
  }
  if (nbr && Math.abs(nbr).toString() >= 1000) {
    //1. 从后往前插进数组，然后 join(",");
    var newNbr = Number(nbr).toFixed(p6).toString();
    var arr = [];
    while (Math.abs(newNbr) >= 1000) {
      var idx = newNbr.indexOf('.');
      if (idx > -1) { //包含小数
        arr.push(newNbr.substr(idx - 3, newNbr.length - (idx - 3)));
        newNbr = newNbr.substr(0, idx - 3);
      } else {
        arr.push(newNbr.substr(newNbr.length - 3, 3));
        newNbr = newNbr.substr(0, newNbr.length - 3);
      }
    }
    arr.push(newNbr);
    arr.reverse();
    // return !negative ? "-" + arr.join(',') : arr.join(',');
    return arr.join(',');
  } else {
    return Number(nbr).toFixed(p6);
  }
}
Date.prototype.Format = function (fmt) { //author: meizz

  var o = {
    'M+': this.getMonth() + 1,
    //月份
    'd+': this.getDate(),
    //日
    'H+': this.getHours(),//h --> H
    //小时
    'm+': this.getMinutes(),
    //分
    's+': this.getSeconds(),
    //秒     /*q->季度*/
    'q+': Math.floor((this.getMonth() + 3) / 3),
    'S': this.getMilliseconds() //毫秒
  };
  if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + '').substr(4 - RegExp.$1.length));
  for (var k in o) if (new RegExp('(' + k + ')').test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (('00' + o[k]).substr(('' + o[k]).length)));
  return fmt;
}