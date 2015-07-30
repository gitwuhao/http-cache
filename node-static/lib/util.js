'use strict';
/*
 *扩展node的util类
 * @authors     wuhao
 * @date        2015-05-27 14:37:16
 * @version     1.0.0
 */
var util = require('util'),
    ArrayPrototype = Array.prototype,
    ObjectPrototype = Object.prototype,
    FunctionPrototype = Function.prototype,
    ObjectHasOwnProperty = ObjectPrototype.hasOwnProperty,
    toString = ObjectPrototype.toString,
    ArraySlice = ArrayPrototype.slice,
    emptyFunction = function() {};


function each(array, handle, scope) {
    if (!array || !handle) {
        return;
    }
    if (array.length >= 0) {
        for (var i = 0, size = array.length; i < size; i++) {
            if (scope == null) {
                scope = array[i];
            }
            if (handle.call(scope, i, array[i], size) === false) {
                return false;
            }
        }
    }
};

function iterator(array, handle, scope) {
    if (!array || !handle) {
        return;
    }
    scope = scope || null;
    for (var key in array) {
        if (scope == null) {
            scope = array[key];
        }
        if (ObjectHasOwnProperty.call(array, key) && handle.call(scope, key, array[key]) === false) {
            return false;
        }
    }
};

function mergerAndApply(isApply, isDeep, target, list) {
    each(list, function(index, copy) {
        iterator(copy, function(key, copyItem) {
            var targetItem = target[key];
            if (isApply && targetItem) {

            } else if (isDeep && copyItem && isObject(copyItem) && targetItem) {
                if (!isObject(targetItem)) {
                    targetItem = {};
                }
                target[key] = mergerAndApply(isApply, isDeep, targetItem, [copyItem]);
            } else {
                target[key] = copyItem;
            }
        });
    });
    return target;
};


function getArgs() {
    var args = arguments,
        target,
        isDeep = false,
        index;
    if (args[0] === true || args[0] === false) {
        isDeep = args[0];
        target = args[1] || {};
        index = 2;
    } else {
        target = args[0] || {};
        index = 1;
    }
    return {
        isDeep: isDeep,
        target: target,
        list: ArraySlice.call(args, index)
    };
};

function merger(isDeep, target, config1, configN) {
    var arg = getArgs.apply({}, arguments);
    return mergerAndApply(false, arg.isDeep, arg.target, arg.list);
};

function apply(isDeep, target, config1, configN) {
    var arg = getArgs.apply({}, arguments);
    return mergerAndApply(true, arg.isDeep, arg.target, arg.list);
};

function isEmpty(value) {
    return (value === null) || (value === undefined) || (value === '') || (isArray(value) && value.length === 0);
};


var isArray = ('isArray' in Array) ? Array.isArray : function(value) {
    return toString.call(value) === '[object Array]';
};

function isDate(value) {
    return toString.call(value) === '[object Date]';
};

function isObject(value) {
    return toString.call(value) === '[object Object]';
};

function isFunction(value) {
    return typeof value === 'function';
};

function isNumber(value) {
    return typeof value === 'number' && isFinite(value);
};

function isString(value) {
    return typeof value === 'string';
};

function isBoolean(value) {
    return typeof value === 'boolean';
};

function isNumeric(value) {
    return !isNaN(parseFloat(value)) && isFinite(value);
};

function isElement(value) {
    return value ? value.nodeType === 1 : false;
};

function isTextNode(value) {
    return value ? value.nodeName === "#text" : false;
};
apply(util, {
    /*  遍历数组
     *  util.each('click blur change'.split(' '),function(index,item){
     *      this.push(item);
     *  },[]);
     */
    each: each,
    /*  迭代对象
     *  util.it({
     *      name : 'wuhao',
     *      age : 100
     *  },function(key,value){
     *      var config={};
     *      config[key]=value;
     *      this.push(config);
     *  },[]);
     */
    it: iterator,
    //迭代对象
    iterator: iterator,
    /*  对象合并
     *  util.merger({
     *      name : 'wuhao',
     *      age : 100
     *  },{
     *      age : 30
     *  },{
     *      sex : '男'
     *  });
     *
     *  @return  {
     *      name : 'wuhao',
     *      age : 30,
     *      sex : '男'
     *  }
     */
    merger: merger,
    /*  对象应用
     *  util.apply({
     *      name : 'wuhao',
     *      age : 100
     *  },{
     *      age : 30
     *  },{
     *      sex : '男'
     *  },{
     *      sex : '女'
     *  });
     *
     *  @return  {
     *      name : 'wuhao',
     *      age : 100,
     *      sex : '男'
     *  }
     */
    apply: apply,
    emptyFn: function() {},
    isArray: isArray,
    isEmpty: isEmpty,
    isDate: isDate,
    isNumeric: isNumeric,
    hashCode: function(value) {
        var hash = 0;
        if (util.isEmpty(value)) {
            return hash;
        }
        value += '';
        if (value.length == 0) {
            return hash;
        }
        for (var i = 0; i < value.length; i++) {
            var c = value.charCodeAt(i);
            hash = ((hash << 5) - hash) + c;
            hash = hash & hash;
        }
        return hash;
    }
});


module.exports = util;
