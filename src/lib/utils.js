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
        JSXEmptyExpression: i++
    },
    TypeName = [];

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
    TypeName: TypeName
};

module.exports = Utils;