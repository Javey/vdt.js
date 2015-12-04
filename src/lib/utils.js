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
        JSXBlock: i++
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
    };

var hasOwn = Object.prototype.hasOwnProperty;

(function() {
    for (var type in Type) {
        if (hasOwn.call(Type, type)) {
            TypeName[Type[type]] = type;
        }
    }
})();

var Utils = {
    each: function(collection, iterate, thisArgs) {
        for (var i = 0, l = collection.length; i < l; i++) {
            var item = collection[i];
            iterate.call(thisArgs, item, i);
        }
    },

    isWhiteSpace: function(charCode) {
        return ((charCode <= 160 && (charCode >= 9 && charCode <= 13) || charCode == 32 || charCode == 160) || charCode == 5760 || charCode == 6158 ||
        (charCode >= 8192 && (charCode <= 8202 || charCode == 8232 || charCode == 8233 || charCode == 8239 || charCode == 8287 || charCode == 12288 || charCode == 65279)));
    },

    trimRight: function(str) {
        var index = str.length;

        while (index-- && Utils.isWhiteSpace(str.charCodeAt(index))) {}

        return str.slice(0, index + 1);
    },

    Type: Type,
    TypeName: TypeName,

    isSelfClosingTag: function(tag) {
        return SelfClosingTags[tag];
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
    }
};

module.exports = Utils;
