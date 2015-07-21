/**
 * @fileoverview stringify ast of jsx to js
 * @author javey
 * @date 15-4-22
 */

var Utils = require('./utils'),
    Type = Utils.Type,

    attrMap = (function() {
        var map = {
            'class': 'className',
            'for': 'htmlFor'
        };
        return function(name) {
            return map[name] || name;
        }
    })();

var Stringifier = function() {};

Stringifier.prototype = {
    constructor: Stringifier,

    stringify: function(ast, autoReturn) {
        if (arguments.length === 1) {
            autoReturn = true;
        }
        this.autoReturn = !!autoReturn;
        return this._visitJSXExpressionContainer(ast, true);
    },

    _visitJSXExpressionContainer: function(ast, isRoot) {
        var str = '', length = ast.length;
        Utils.each(ast, function(element, i) {
            // if is root, add `return` keyword
            if (this.autoReturn && isRoot && i === length - 1) {
                str += 'return ' + this._visit(element, isRoot);
            } else {
                str += this._visit(element, isRoot);
            }
        }, this);

        return str;
    },

    _visit: function(element, isRoot) {
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
            case Type.JSXWidget:
                return this._visitJSXWidget(element);
            case Type.JSXBlock:
                return this._visitJSXBlock(element);
            case Type.JSXVdt:
                return this._visitJSXVdt(element, isRoot);
            default:
                return 'null';
        }
    },

    _visitJS: function(element) {
        return element.value;
    },

    _visitJSX: function(element) {
        var str = "h('" + element.value + "'," + this._visitJSXAttribute(element.attributes) + ", ";

        return str + this._visitJSXChildren(element.children) + ')';
    },

    _visitJSXChildren: function(children) {
        var ret = [];
        Utils.each(children, function(child) {
            ret.push(this._visit(child));
        }, this);

        return '[' + ret.join(', ') + ']';
    },

    _visitJSXAttribute: function(attributes) {
        var ret = [];
        Utils.each(attributes, function(attr) {
            ret.push("'" + attrMap(attr.name) + "': " + (Utils.isArray(attr.value) ? this._visitJSXChildren(attr.value) : this._visit(attr.value)));
        }, this);

        return ret.length ? '{' + ret.join(', ') + '}' : 'null';
    },

    _visitJSXText: function(element) {
        return "'" + element.value.replace(/[\r\n]/g, ' ') + "'";
    },

    _visitJSXWidget: function(element) {
        element.attributes.push({name: 'children', value: element.children});
        return 'new ' + element.value + '(' + this._visitJSXAttribute(element.attributes) + ', typeof widgets === "undefined" ? {} : widgets)';
    },

    _visitJSXBlock: function(element, isAncestor) {
        arguments.length === 1 && (isAncestor = true);

        return '(_blocks.' + element.value + ' = function(parent) {return ' + this._visitJSXChildren(element.children) + ';}) && (__blocks.' + element.value + ' = function(parent) {\n' +
            'var self = this;\n' +
            'return blocks.' + element.value + ' ? blocks.' + element.value + '.call(this, function() {\n' +
                'return _blocks.' + element.value + '.call(self, parent);\n' +
            '}) : _blocks.' + element.value + '.call(this, parent);\n' +
        '})' + (isAncestor ? ' && __blocks.' + element.value + '.call(this)' : '');
    },

    _visitJSXVdt: function(element, isRoot) {
        var ret = ['(function(blocks) {',
                'var _blocks = {}, __blocks = extend({}, blocks), _obj = extend(' + this._visitJSXAttribute(element.attributes) + ' || {}, obj);',
                'return ' + element.value + '.call(this, _obj, _Vdt, '
            ].join('\n'),
            blocks = [];

        Utils.each(element.children, function(child) {
            if (child.type === Type.JSXBlock) {
                blocks.push(this._visitJSXBlock(child, false))
            }
        }, this);

        ret += (blocks.length ? blocks.join(' && ') + ' && __blocks)' : '__blocks)') + ('}).call(this, ') + (isRoot ? 'blocks)' : '{})');

        return ret;
    }
};

module.exports = Stringifier;