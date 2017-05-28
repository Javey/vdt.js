/** 
 * @fileoverview utility methods
 * @author javey
 * @date 15-4-22
 */

import {isNullOrUndefined, isArray} from 'miss/src/utils';

export {isNullOrUndefined, isArray};

let i = 0;
export const Type = {
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
export const TypeName = [];
for (let type in Type) {
    TypeName[Type[type]] = type;
}


export const SelfClosingTags = {
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
export const TextTags = {
    style: true,
    script: true,
    textarea: true
};

export const Directives = {
    'v-if': true,
    'v-else-if': true,
    'v-else': true,
    'v-for': true,
    'v-for-value': true,
    'v-for-key': true
};

export const Options = {
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

export const hasOwn = Object.prototype.hasOwnProperty;
export const noop = function() {};

function isArrayLike(value) {
    if (isNullOrUndefined(value)) return false;
    var length = value.length;
    return typeof length === 'number' && length > -1 && length % 1 === 0 && length <= 9007199254740991 && typeof value !== 'function';
}

export function each(obj, iter, thisArg) {
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

export function isObject(obj) {
    var type = typeof obj;
    return type === 'function' || type === 'object' && !!obj; 
}

export function map(obj, iter, thisArgs) {
    var ret = [];
    each(obj, function(value, key, obj) {
        ret.push(iter.call(thisArgs, value, key, obj));
    });
    return ret;
}


export function className(obj) {
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

export function isWhiteSpace(charCode) {
    return ((charCode <= 160 && (charCode >= 9 && charCode <= 13) || charCode == 32 || charCode == 160) || charCode == 5760 || charCode == 6158 ||
    (charCode >= 8192 && (charCode <= 8202 || charCode == 8232 || charCode == 8233 || charCode == 8239 || charCode == 8287 || charCode == 12288 || charCode == 65279)));
}

export function trimRight(str) {
    var index = str.length;

    while (index-- && isWhiteSpace(str.charCodeAt(index))) {}

    return str.slice(0, index + 1);
}

export function trimLeft(str) {
    var length = str.length, index = -1;

    while (index++ < length && isWhiteSpace(str.charCodeAt(index))) {}

    return str.slice(index);
}

export function setDelimiters(delimiters) {
    if (isArray(delimiters)) {
        throw new Error('The parameter must be an array like ["{{", "}}"]');
    }
    Options.delimiters = delimiters;
}

export function getDelimiters() {
    return Options.delimiters;
}

export function configure(options) {
    if (options !== undefined) {
        extend(Options, options);
    } 
    return Options;
}

export function isSelfClosingTag(tag) {
    return SelfClosingTags[tag];
}

export function isTextTag(tag) {
    return TextTags[tag];
}

export function isDirective(name) {
    return hasOwn.call(Directives, name);
}

export function extend(...args) {
    var dest = args[0];
    var length = args.length;
    if (length > 1) {
        for (var i = 1; i < length; i++) {
            let source = args[i];
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

export const error = (function() {
    var hasConsole = typeof console !== 'undefined';
    return hasConsole ? function(e) {console.error(e);} : noop;
})();
