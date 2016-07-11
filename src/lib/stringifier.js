/**
 * @fileoverview stringify ast of jsx to js
 * @author javey
 * @date 15-4-22
 */

var Utils = require('./utils'),
    Type = Utils.Type,
    TypeName = Utils.TypeName,

    attrMap = (function() {
        var map = {
            'class': 'className',
            'for': 'htmlFor'
        };
        return function(name) {
            return map[name] || name;
        };
    })();

var Stringifier = function() {};

Stringifier.prototype = {
    constructor: Stringifier,

    stringify: function(ast, autoReturn) {
        if (arguments.length === 1) {
            autoReturn = true;
        }
        this.autoReturn = !!autoReturn;
        this.enterStringExpression = false;
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
            case Type.JSXComment:
                return this._visitJSXComment(element);
            default:
                return 'null';
        }
    },

    _visitJS: function(element) {
        return this.enterStringExpression ? '(' + element.value + ')' : element.value;
    },

    _visitJSX: function(element) {
        if (element.value === 'script' || element.value === 'style') {
            if (element.children.length) {
                element.attributes.push({
                    type: Type.JSXAttribute,
                    typeName: TypeName[Type.JSXAttribute],
                    name: 'innerHTML',
                    value: {
                        type: Type.JS,
                        typeName: TypeName[Type.JS],
                        value: this._visitJSXChildrenAsString(element.children)
                    }
                });
                element.children = [];
            }
        }

        return this._visitJSXDiretive(element.directives, this._visitJSXElement(element));
    },

    _visitJSXElement: function(element) {
        return "h('" + element.value + "'," + this._visitJSXAttribute(element.attributes) + ", " + 
            this._visitJSXChildren(element.children) + ')';
    },

    _visitJSXChildren: function(children) {
        var ret = [];
        Utils.each(children, function(child) {
            ret.push(this._visit(child));
        }, this);

        return '[' + ret.join(', ') + ']';
    },

    _visitJSXDiretive: function(directives, ret) {
        var directiveFor = {
            data: null,
            value: 'value',
            key: 'key'
        };
        Utils.each(directives, function(directive) {
            switch (directive.name) {
                case 'v-if':
                    ret = this._visitJSXDiretiveIf(directive, ret);
                    break;
                case 'v-for':
                    directiveFor.data = this._visitJSXAttributeValue(directive.value);
                    break;
                case 'v-for-value':
                    directiveFor.value = this._visitJSXText(directive.value, true);
                    break;
                case 'v-for-key':
                    directiveFor.key = this._visitJSXText(directive.value, true);
                    break;
                default:
                    break;
            }
        }, this);
        // if exists v-for
        if (directiveFor.data) {
            ret = this._visitJSXDiretiveFor(directiveFor, ret);
        }

        return ret;
    },

    _visitJSXDiretiveIf: function(directive, ret) {
        return this._visitJSXAttributeValue(directive.value) + ' ? ' + ret + ' : undefined';
    },

    _visitJSXDiretiveFor: function(directive, ret) {
        return '_Vdt.utils.map(' + directive.data + ', function(' + directive.value + ', ' + directive.key + ') {\n' +
            'return ' + ret + ';\n' +
        '}, this)';
    },

    _visitJSXChildrenAsString: function(children) {
        var ret = [];
        this.enterStringExpression = true;
        Utils.each(children, function(child) {
            ret.push(this._visit(child));
        }, this);
        this.enterStringExpression = false;
        return ret.join('+');
    },

    _visitJSXAttribute: function(attributes) {
        var ret = [];
        Utils.each(attributes, function(attr) {
            var name = attrMap(attr.name),
                value = this._visitJSXAttributeValue(attr.value);
            if (name === 'className' && attr.value.type === Type.JSXExpressionContainer/*  && Utils.trimLeft(value)[0] === '{' */) {
                // for class={ {active: true} }
                value = '_Vdt.utils.className(' + value + ')';
            }
            ret.push("'" + name + "': " + value);
        }, this);

        return ret.length ? '{' + ret.join(', ') + '}' : 'null';
    },

    _visitJSXAttributeValue: function(value) {
        return Utils.isArray(value) ? this._visitJSXChildren(value) : this._visit(value);
    },

    _visitJSXText: function(element, noQuotes) {
        var ret = element.value.replace(/[\r\n]/g, '\\n').replace(/([\'\"])/g, '\\$1');
        if (!noQuotes) {
            ret = "'" + ret + "'";
        }
        return ret;
    },

    _visitJSXWidget: function(element) {
        element.attributes.push({name: 'children', value: element.children});
        return element.value + '(' + this._visitJSXAttribute(element.attributes) + ', widgets)';
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
                'var _blocks = {}, __blocks = extend({}, blocks), _obj = ' + this._visitJSXAttribute(element.attributes) + ' || {};',
                'if (_obj.hasOwnProperty("arguments")) { _obj = extend({}, _obj.arguments === null ? obj : _obj.arguments, _obj); delete _obj.arguments; }',
                'return ' + element.value + '.call(this, _obj, _Vdt, '
            ].join('\n'),
            blocks = [];

        Utils.each(element.children, function(child) {
            if (child.type === Type.JSXBlock) {
                blocks.push(this._visitJSXBlock(child, false));
            }
        }, this);

        ret += (blocks.length ? blocks.join(' && ') + ' && __blocks)' : '__blocks)') + ('}).call(this, ') + (isRoot ? 'blocks)' : '{})');

        return ret;
    },

    _visitJSXComment: function(element) {
        return 'h.c(' + this._visitJSXText(element) + ')';
    }
};

module.exports = Stringifier;
