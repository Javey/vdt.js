'use strict';

exports.__esModule = true;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _utils = require('miss/src/utils');

Object.defineProperty(exports, 'isNullOrUndefined', {
    enumerable: true,
    get: function get() {
        return _utils.isNullOrUndefined;
    }
});
Object.defineProperty(exports, 'isArray', {
    enumerable: true,
    get: function get() {
        return _utils.isArray;
    }
});
exports.each = each;
exports.isObject = isObject;
exports.map = map;
exports.className = className;
exports.isWhiteSpace = isWhiteSpace;
exports.trimRight = trimRight;
exports.trimLeft = trimLeft;
exports.setDelimiters = setDelimiters;
exports.getDelimiters = getDelimiters;
exports.configure = configure;
exports.isSelfClosingTag = isSelfClosingTag;
exports.isTextTag = isTextTag;
exports.isDirective = isDirective;
exports.extend = extend;


var i = 0;
var Type = exports.Type = {
    JS: i++,
    JSXText: i++,
    JSXElement: i++,
    JSXExpressionContainer: i++,
    JSXAttribute: i++,
    JSXEmptyExpression: i++,

    JSXWidget: i++,
    JSXVdt: i++,
    JSXBlock: i++,
    JSXComment: i++,

    JSXDirective: i++
};
var TypeName = exports.TypeName = [];
for (var type in Type) {
    TypeName[Type[type]] = type;
}

var SelfClosingTags = exports.SelfClosingTags = {
    'area': true,
    'base': true,
    'br': true,
    'col': true,
    'embed': true,
    'hr': true,
    'img': true,
    'input': true,
    'keygen': true,
    'link': true,
    'menuitem': true,
    'meta': true,
    'param': true,
    'source': true,
    'track': true,
    'wbr': true
};

// which children must be text
var TextTags = exports.TextTags = {
    style: true,
    script: true,
    textarea: true
};

var Directives = exports.Directives = {
    'v-if': true,
    'v-else-if': true,
    'v-else': true,
    'v-for': true,
    'v-for-value': true,
    'v-for-key': true
};

var Options = {
    autoReturn: true,
    onlySource: false,
    delimiters: ['{', '}'],
    // remove `with` statement
    noWith: false,
    // whether rendering on server or not
    server: false,
    // skip all whitespaces in template
    skipWhitespace: false
};

var hasOwn = exports.hasOwn = Object.prototype.hasOwnProperty;
var noop = exports.noop = function noop() {};

function isArrayLike(value) {
    if (isNullOrUndefined(value)) return false;
    var length = value.length;
    return typeof length === 'number' && length > -1 && length % 1 === 0 && length <= 9007199254740991 && typeof value !== 'function';
}

function each(obj, iter, thisArg) {
    if (isArrayLike(obj)) {
        for (var i = 0, l = obj.length; i < l; i++) {
            iter.call(thisArg, obj[i], i, obj);
        }
    } else if (isObject(obj)) {
        for (var key in obj) {
            if (hasOwn.call(obj, key)) {
                iter.call(thisArg, obj[key], key, obj);
            }
        }
    }
}

function isObject(obj) {
    var type = typeof obj === 'undefined' ? 'undefined' : _typeof(obj);
    return type === 'function' || type === 'object' && !!obj;
}

function map(obj, iter, thisArgs) {
    var ret = [];
    each(obj, function (value, key, obj) {
        ret.push(iter.call(thisArgs, value, key, obj));
    });
    return ret;
}

function className(obj) {
    if (isNullOrUndefined(obj)) return;
    if (typeof obj === 'string') return obj;
    var ret = [];
    for (var key in obj) {
        if (hasOwn.call(obj, key) && obj[key]) {
            ret.push(key);
        }
    }
    return ret.join(' ');
}

function isWhiteSpace(charCode) {
    return charCode <= 160 && charCode >= 9 && charCode <= 13 || charCode == 32 || charCode == 160 || charCode == 5760 || charCode == 6158 || charCode >= 8192 && (charCode <= 8202 || charCode == 8232 || charCode == 8233 || charCode == 8239 || charCode == 8287 || charCode == 12288 || charCode == 65279);
}

function trimRight(str) {
    var index = str.length;

    while (index-- && Utils.isWhiteSpace(str.charCodeAt(index))) {}

    return str.slice(0, index + 1);
}

function trimLeft(str) {
    var length = str.length,
        index = -1;

    while (index++ < length && Utils.isWhiteSpace(str.charCodeAt(index))) {}

    return str.slice(index);
}

function setDelimiters(delimiters) {
    if (isArray(delimiters)) {
        throw new Error('The parameter must be an array like ["{{", "}}"]');
    }
    Options.delimiters = delimiters;
}

function getDelimiters() {
    return Options.delimiters;
}

function configure(options) {
    if (options !== undefined) {
        extend(Options, options);
    }
    return Options;
}

function isSelfClosingTag(tag) {
    return SelfClosingTags[tag];
}

function isTextTag(tag) {
    return TextTags[tag];
}

function isDirective(name) {
    return hasOwn.call(Directives, name);
}

function extend() {
    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
    }

    var dest = args[0];
    var length = args.length;
    if (length > 1) {
        for (var i = 1; i < length; i++) {
            var source = args[i];
            if (source) {
                for (var key in source) {
                    if (hasOwn.call(source, key)) {
                        dest[key] = source[key];
                    }
                }
            }
        }
    }
    return dest;
}

var _require = _require('./compile');

exports.require = _require;
var error = exports.error = function () {
    var hasConsole = typeof console !== 'undefined';
    return hasConsole ? function (e) {
        console.error(e);
    } : noop;
}();