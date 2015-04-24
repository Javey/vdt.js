/**
 * @fileoverview stringify ast of jsx to js
 * @author javey
 * @date 15-4-22
 */

var Utils = require('./utils'),
    Type = Utils.Type;

var Stringifier = function() {};

Stringifier.prototype = {
    constructor: Stringifier,

    stringify: function(ast) {
        return this._visitJSXExpressionContainer(ast, true);
    },

    _visitJSXExpressionContainer: function(ast, isRoot) {
        var str = '', length = ast.length;
        Utils.each(ast, function(element, i) {
            // if is root, add `return` keyword
            if (isRoot && i === length - 1) {
                str += 'return ' + this._visit(element);
            } else {
                str += this._visit(element);
            }
        }, this);

        return str;
    },

    _visit: function(element) {
        element = element || {};
        switch (element.type) {
            case Type.JS:
                return this._visitJS(element);
            case Type.JSXElement:
                return this._visitJSX(element);
            case Type.JSXText:
                return this._visitJSXText(element);
            case Type.JSXExpressionContainer:
                return this._visitJSXExpressionContainer(element.value);
            default:
                return 'null';
        }
    },

    _visitJS: function(element) {
        return element.value;
    },

    _visitJSX: function(element) {
        var str = "h('" + element.value + "'," + this._visitJSXAttribute(element.attributes) + ", ",
            children = [];

        Utils.each(element.children, function(child) {
            children.push(this._visit(child));
        }, this);

        return str + '[' + children.join(', ') + '])';
    },

    _visitJSXAttribute: function(attributes) {
        var ret = [];
        Utils.each(attributes, function(attr) {
            ret.push("'" + attr.name + "': " + this._visit(attr.value));
        }, this);

        return ret.length ? '{' + ret.join(', ') + '}' : 'null';
    },

    _visitJSXText: function(element) {
        return "'" + element.value.replace(/[\r\n]/g, ' ') + "'";
    }
};

module.exports = Stringifier;
