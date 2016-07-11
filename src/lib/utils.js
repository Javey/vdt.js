/**
 * @fileoverview utility methods
 * @author javey
 * @date 15-4-22
 */

var i = 0,
    Type = {
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
    },
    TypeName = [],

    SelfClosingTags = {
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
    },

    Directives = {
        'v-if': true,
        'v-for': true,
        'v-for-value': true,
        'v-for-key': true
    },

    Delimiters = ['{', '}'];

var hasOwn = Object.prototype.hasOwnProperty;

(function() {
    for (var type in Type) {
        if (hasOwn.call(Type, type)) {
            TypeName[Type[type]] = type;
        }
    }
})();

function isArrayLike(value) {
    if (value == null) return false;
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
    var type = typeof obj;
    return type === 'function' || type === 'object' && !!obj; 
}


var Utils = {
    each: each,

    map: function(obj, iter, thisArgs) {
        var ret = [];
        each(obj, function(value, key, obj) {
            ret.push(iter.call(thisArgs, value, key, obj));
        });
        return ret;
    },

    className: function(obj) {
        if (obj == null) return;
        if (typeof obj === 'string') return obj;
        var ret = [];
        for (var key in obj) {
            if (hasOwn.call(obj, key) && obj[key]) {
                ret.push(key);
            }
        }
        return ret.join(' ');
    },

    isObject: isObject,

    isWhiteSpace: function(charCode) {
        return ((charCode <= 160 && (charCode >= 9 && charCode <= 13) || charCode == 32 || charCode == 160) || charCode == 5760 || charCode == 6158 ||
        (charCode >= 8192 && (charCode <= 8202 || charCode == 8232 || charCode == 8233 || charCode == 8239 || charCode == 8287 || charCode == 12288 || charCode == 65279)));
    },

    trimRight: function(str) {
        var index = str.length;

        while (index-- && Utils.isWhiteSpace(str.charCodeAt(index))) {}

        return str.slice(0, index + 1);
    },

    trimLeft: function(str) {
        var length = str.length, index = -1;

        while (index++ < length && Utils.isWhiteSpace(str.charCodeAt(index))) {}

        return str.slice(index);
    },

    Type: Type,
    TypeName: TypeName,

    setDelimiters: function(delimiters) {
        if (!Utils.isArray(delimiters)) {
            throw new Error('The parameter must be an array like ["{{", "}}"]');
        }
        Delimiters = delimiters;
    },

    getDelimiters: function() {
        return Delimiters;
    },

    isSelfClosingTag: function(tag) {
        return hasOwn.call(SelfClosingTags, tag);
    },

    isDirective: function(name) {
        return hasOwn.call(Directives, name);
    },

    extend: function(dest, source) {
        var length = arguments.length;
        if (length > 1) {
            for (var i = 1; i < length; i++) {
                source = arguments[i];
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
    },

    isArray: Array.isArray || function(arr) {
        return Object.prototype.toString.call(arr) === '[object Array]';
    },

    noop: function() {},

    require: (function() {
        var isNode = new Function("try { return this === global; } catch (e) { return false; }"); 
        if (isNode()) {
            return require('./compile');
        } else {
            // use amd require
            return typeof require !== 'undefined' ? require : Utils.noRequire;
        }
    })(),

    noRequire: function() {
        throw new Error('Vdt depends RequireJs to require file over http.');
    }
};

module.exports = Utils;
