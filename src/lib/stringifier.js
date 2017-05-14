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

        if (!isRoot && !this.enterStringExpression) {
            // add [][0] for return /* comment */
            // str = 'function() {try {return [' + str + '][0]} catch(e) {_e(e)}}.call(this)';
            str = 'function() {try {return (' + str + ')} catch(e) {_e(e)}}.call(this)';
        }

        return str;
    },

    _visit: function(element, isRoot) {
        element = element || {};
        switch (element.type) {
            case Type.JS:
                return this._visitJS(element, isRoot);
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
        return this.enterStringExpression ? 
            '(' + element.value + ')' : 
            element.value; 
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

        return this._visitJSXDirective(element, this._visitJSXElement(element));
    },

    _visitJSXElement: function(element) {
        var attributes = this._visitJSXAttribute(element.attributes, true, true);
        return "h('" + element.value + "'," + 
            attributes.props + ", " + 
            this._visitJSXChildren(element.children) + ", " + 
            attributes.className + ', ' +
            attributes.key + ', ' + 
            attributes.ref + ')';
    },

    _visitJSXChildren: function(children) {
        var ret = [];
        Utils.each(children, function(child) {
            // if this.element has be handled return directly
            if (child._skip) return;
            ret.push(this._visit(child));
        }, this);

        return ret.length > 1 ? '[' + ret.join(', ') + ']' : ret[0];
    },

    _visitJSXDirective: function(element, ret) {
        var directiveFor = {
            data: null,
            value: 'value',
            key: 'key'
        };
        Utils.each(element.directives, function(directive) {
            switch (directive.name) {
                case 'v-if':
                    ret = this._visitJSXDirectiveIf(directive, ret, element);
                    break;
                case 'v-else-if':
                case 'v-else':
                    if (element._skip) break;
                    throw new Error(directive.name + ' must be led with v-if. At: {line: ' +
                        element.line + ', column: ' + 
                        element.column + '}'
                    );
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
            ret = this._visitJSXDirectiveFor(directiveFor, ret);
        }

        return ret;
    },

    _visitJSXDirectiveIf: function(directive, ret, element) {
        var result = this._visitJSXAttributeValue(directive.value) + ' ? ' + ret + ' : ',
            hasElse = false,
            next = element,
            emptyTextNodes = [], // persist empty text node, skip them if find v-else-if or v-else
            skipNodes = function() {
                Utils.each(emptyTextNodes, function(item) {
                    item._skip = true;
                });
                emptyTextNodes = [];
            };
        while (next = next.next) {
            if (next.type === Utils.Type.JSXText) {
                if (!/^\s*$/.test(next.value)) break;
                // is not the last text node, mark as handled
                else emptyTextNodes.push(next);
            } else if (next.type === Utils.Type.JSXElement || next.type === Utils.Type.JSXWidget) {
                if (!next.directives || !next.directives.length) break;
                var isContinue = false;
                for (var i = 0, l = next.directives.length; i < l; i++) {
                    var dire = next.directives[i],
                        name = dire.name;
                    if (name === 'v-else-if') {
                        // mark this element as handled
                        next._skip = true;
                        result += this._visitJSXAttributeValue(dire.value) + ' ? ' + this._visit(next) + ' : ';
                        isContinue = true;
                        // mark text node before as handled
                        skipNodes();
                        break;
                    } else if (name === 'v-else') {
                        // mark this element as handled
                        next._skip = true;
                        result += this._visit(next);
                        hasElse = true;
                        // mark text node before as handled
                        skipNodes();
                        break;
                    }
                }
                if (!isContinue) break;
            }
        }
        if (!hasElse) result += 'undefined';
        return result;
    },

    _visitJSXDirectiveFor: function(directive, ret) {
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

    _visitJSXAttribute: function(attributes, individualClassName, individualKeyAndRef) {
        var ret = [],
            className,
            key,
            ref;
        Utils.each(attributes, function(attr) {
            var name = attrMap(attr.name),
                value = this._visitJSXAttributeValue(attr.value);
            if (name === 'widget' && attr.value.type === Type.JSXText) {
                // for compatility v1.0
                // convert widget="a" to ref=(i) => widgets.a = i
                ref = 'function(i) {widgets.' + value + ' = i}';
                return;
            } else if (name === 'className') {
                // process className individually
                if (attr.value.type === Type.JSXExpressionContainer) {
                    // for class={ {active: true} }
                    value = '_Vdt.utils.className(' + value + ')';
                }
                if (individualClassName) {
                    className = value;
                    return;
                }
            } else if (name === 'key' && individualKeyAndRef) {
                key = value;
                return;
            } else if (name === 'ref' && individualKeyAndRef) {
                ref = value;
                return;
            }
            ret.push("'" + name + "': " + value);
        }, this);

        return {
            props: ret.length ? '{' + ret.join(', ') + '}' : 'null',
            className: className || 'null',
            ref: ref || 'null',
            key: key || 'null'
        };
    },

    _visitJSXAttributeValue: function(value) {
        return Utils.isArray(value) ? this._visitJSXChildren(value) : this._visit(value);
    },

    _visitJSXText: function(element, noQuotes) {
        var ret = element.value.replace(/([\'\"\\])/g, '\\$1').replace(/[\r\n]/g, '\\n');
        if (!noQuotes) {
            ret = "'" + ret + "'";
        }
        return ret;
    },

    _visitJSXWidget: function(element) {
        element.attributes.push({name: 'children', value: element.children});
        var attributes = this._visitJSXAttribute(element.attributes, false, true);
        return this._visitJSXDirective(element, 'h(' + element.value + ', ' + 
             attributes.props + ', ' + attributes.key + ', ' + attributes.ref + ')');
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
                'var _blocks = {}, __blocks = extend({}, blocks), _obj = ' + 
                this._visitJSXAttribute(element.attributes, false, false).props + ' || {};',
                'if (_obj.hasOwnProperty("arguments")) { extend(_obj, _obj.arguments === null ? obj : _obj.arguments); delete _obj.arguments; }',
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
        return 'hc(' + this._visitJSXText(element) + ')';
    }
};

module.exports = Stringifier;
